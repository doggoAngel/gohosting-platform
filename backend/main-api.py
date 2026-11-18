from fastapi import FastAPI, Request, HTTPException, Header
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from proxmoxer import ProxmoxAPI
from pydantic import BaseModel
from bson import ObjectId
from functools import wraps
from argon2 import * 
import uvicorn
import pymongo
import paramiko
import sys
import asyncio
import datetime
import tunnel
import jwt
import stripe
import os 
from dotenv import load_dotenv

load_dotenv()

serverDB = str(os.getenv("serverDB"))

# KEYS
JWT_key = str(os.getenv('JWT_key'))
ssh_key = str(os.getenv('ssh_key'))
stripe_Key = str(os.getenv('stripe_Key_test'))
stripe.api_key = stripe_Key
url = str(os.getenv('url'))

########## proxmox ########
userProxmox = str(os.getenv('userProxmox'))
proxmoxHOST = str(os.getenv('proxmoxHOST'))
templateID = int(str(os.getenv('templateID')))
startID = int(str(os.getenv('startID')))#partenza ID conteiner minecraft
tokenID = str(os.getenv('tokenID'))
tokenKey = str(os.getenv('token_key'))
nameNode = str(os.getenv('nameNode'))


proxmox = ProxmoxAPI(proxmoxHOST, user=userProxmox, token_name=tokenID, token_value=tokenKey, verify_ssl=False)
#nodo server minecraft
nodo = proxmox.nodes(nameNode)



#hashing delle password
ph = PasswordHasher(
    time_cost=5, #iterazioni
    memory_cost=262144,#memoria in kb 64 mb
    parallelism=3, #threads
    hash_len=64, 
    salt_len=32 
)


server = FastAPI(
    title="GoHosting API",
    description="API for managing Minecraft servers",
    version="1.0.0",
    docs_url=None,
    redoc_url=None
)

#modelli Richiesta
class ServerCreateRequest(BaseModel): #modello per la creazione di server
    vmid: str
    name_server: str

class ServerActionRequest(BaseModel): #modello per le azioni del server
    id: str
    command: bool
    machine_command: bool


#modelli Risposta
class ServerCreateRespose(BaseModel):
    status: str






#funzione per inviare comandi via ssh
async def ssh_command(ip: str, command: str):
    client = paramiko.SSHClient()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    try:
        client.connect(ip, username='root', password=ssh_key, timeout=30)
        # Per comandi lunghi come l'avvio di Minecraft
        transport = client.get_transport()
        session = transport.open_session()
        session.exec_command(command)
        
        # Attendiamo un po' per vedere se ci sono errori immediati
        await asyncio.sleep(2)
        if session.exit_status_ready():
            exit_status = session.recv_exit_status()
            if exit_status != 0:
                error_output = session.recv_stderr(1024).decode()
                print(f"SSH command failed with status {exit_status}: {error_output}")
                return False
        
        return True
    except Exception as e:
        print(f"SSH Error: {str(e)}")
        return False
    finally:
        client.close()


# protezione endpoint USER
def user_required(funzione):
    @wraps(funzione)
    async def wrapper(request: Request, *args, **kwargs):
        authorization = request.headers.get('Authorization')
        
        if not authorization:
            raise HTTPException(status_code=401, detail="Authorization header missing")
        
        try:
            # Split più sicuro
            parts = authorization.split(" ")
            if len(parts) != 2 or parts[0].lower() != "bearer":
                raise HTTPException(status_code=401, detail="Invalid authorization header format")
            
            token = parts[1]
            payload = jwt.decode(token, JWT_key, algorithms=['HS256'])
            user_id = payload.get('user_id')
            if not user_id:
                raise HTTPException(status_code=401, detail="Invalid token")
            
            # controllo se l'utente esiste nel database
            user = db['Utenti'].find_one({'_id': ObjectId(user_id), 'deleted': False, 'blocked': False}, {'role': 1})
            if not user:
                raise HTTPException(status_code=401, detail="Unauthorized user")
                
        except jwt.ExpiredSignatureError:
            raise HTTPException(status_code=401, detail="Token expired")
        except jwt.InvalidTokenError:
            raise HTTPException(status_code=401, detail="Invalid token")
        except Exception as e:
            # Gestione di altri errori potenziali (es. formato ObjectId non valido)
            raise HTTPException(status_code=401, detail="Invalid token or user")
            
        return await funzione(request, *args, **kwargs)
    return wrapper


#cors
server.add_middleware(
    CORSMiddleware,
    allow_origins=['https://gohosting.space',"http://192.168.0.169:8080","http://192.168.1.187:8080", "http://127.0.0.1:8080", 'http://192.168.1.176:8080', "http://192.168.0.179:8080", "http://172.20.10.2:8080"],  # Specifica gli origin esatti
    allow_credentials=True,
    allow_methods=['DELETE', 'GET', 'POST', 'PUT'],
    allow_headers=["*"],
    expose_headers=["*"]
)

#database
client_db = pymongo.MongoClient(serverDB)
if not "gohosting" in client_db.list_database_names():
    print("DB NON esiste")
    sys.exit(1)

db = client_db["gohosting"]


# LOGIN 
@server.post('/api/login')
async def login(request: Request):
    data = await request.json()
    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        raise HTTPException(status_code=400, detail="Email and password are required")

    # Controllo credenziali nel database
    account = db['Utenti'].find_one({'email': email, 'deleted': False, 'blocked': False}, {'_id': 1, 'email': 1, 'password': 1, 'role': 1})
    print(account)


    if not account:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    try:
        if(ph.verify(account['password'], password)):

    
            payload = {
                    'user_id': str(account['_id']),
                    'username': account['email'],
                    'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1)
            }
            token = jwt.encode(payload, JWT_key, algorithm='HS256')

            if account.get('role') == 'admin':  
                # Generazione del token JWT
                return {'token': token, 'page':"/admin-dashboard"}

            return {'token': token, 'page':"/dashboard"}
        else:
            raise HTTPException(status_code=401, detail="Invalid credentials")
    except Exception as e:
        print(f"Error during password verification: {str(e)}")
        raise HTTPException(status_code=401, detail="Invalid credentials")


# Endpoint per la registrazione di un nuovo utente
@server.post('/api/register')
async def register(request: Request):
    data = await request.json()
    email = data.get('email')
    password = data.get('password')
    name_complete = data.get('name_complete')

    if not email or not password:
        raise HTTPException(status_code=400)

    if len(password) < 8:
        raise HTTPException(status_code=400)
    password = ph.hash(password)
    # Controllo se l'email esiste già
    existing_user = db['Utenti'].find_one({'email': email, 'deleted': False})
    if existing_user:
        raise HTTPException(status_code=400)

    # Creazione del nuovo utente
    new_user = {
        'email': email,
        'password': password,
        'role': 'user',
        'deleted': False,
        'blocked': False,
        'servers': [],
        'name-complete': name_complete,
        'data-creazione': datetime.datetime.now().isoformat(),
        "role": 'user'
    }
    
    db['Utenti'].insert_one(new_user)
    account = db['Utenti'].find_one({'email': email, 'deleted': False, 'blocked': False}, {'_id': 1, 'email': 1, 'password': 1, 'role': 1})
    print(account)
    if not account or account.get('password') != password:
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    payload = {
            'user_id': str(account['_id']),
            'username': account['email'],
            'exp': datetime.datetime.utcnow() + datetime.timedelta(days=1)
    }
    token = jwt.encode(payload, JWT_key, algorithm='HS256')

    if account.get('role') == 'admin':  
        # Generazione del token JWT
        return {'token': token, 'page':"/admin-dashboard"}

    return {'token': token, 'page':"/dashboard"}


# check token
@server.get('/api/check-token')
async def check_token(request: Request, authorization: str = Header(None)):
    if not authorization:
        raise HTTPException(status_code=401, detail="Authorization header missing")
    
    token = authorization.split(" ")[1] 
    try:
        payload = jwt.decode(token, JWT_key, algorithms=['HS256'])
        user_id = payload.get('user_id')
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        
        # Controllo se l'utente esiste nel database
        user = db['Utenti'].find_one({'_id': ObjectId(user_id), 'deleted': False, 'blocked': False}, {'role':1})
        if not user:
            return {'status': False, 'role': 'unauthorized'}
        
        return {'status': True, 'role': user.get('role')}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")



#endpoint per cestinarli 30 gg di tempo
@server.delete('/api/servers/{id}')
@user_required
async def deleteServer(request: Request, id:str):
    authorization = request.headers.get('Authorization')
    try:
        authorization = authorization.split(" ")[1]  # Split più sicuro
        payload = jwt.decode(authorization, JWT_key, algorithms=['HS256'])
        user_id = payload.get('user_id')
        print(user_id)
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        # Gestione di altri errori potenziali (es. formato ObjectId non valido)
        raise HTTPException(status_code=401, detail="Invalid token or user")

    u = db['Utenti'].find_one({'_id': ObjectId(user_id)}).get('role')
    if(u == 'user'):
        try:
            #controllo se l'id è dell'utente
            s = db['Utenti'].find_one({'_id': ObjectId(user_id), 'servers': str(id), 'deleted': False, 'blocked': False}, {'servers': 1, 'role':1}).get('servers')

            print(s)
            if not s:
                raise HTTPException(status_code=401, detail="Server not found or unauthorized")
            #controllo id nel DB

        except:
            raise HTTPException(status_code=500, detail="Invalid ID") # errore di formattazione dell'id
    
    server = db['Servers'].find_one({'_id':ObjectId(id)})
    print(server)
    if not server:
        raise HTTPException(status_code=404, detail="Server not found or unauthorized")
    

    if(server['machine-stato'] == 'acceso'):
        raise HTTPException(status_code=500, detail="Spegni il server!")
    
    #controllo se la data è stata già inserita, se si il server verrà ripristinato altrimenti verrà messo nel cestino
    if(server['data-eliminazione']==''):
        date = datetime.datetime.now().isoformat()
        agent = tunnel.Agent()
        await agent.deleteTunnel(server)
        db['Servers'].update_one({'_id':server['_id']},{'$set':{'host':''}})
    else:
        date = ''
        agent = tunnel.Agent()
        await agent.account()
        await agent.login()
        await agent.addTunnel(server['ip'])


    db['Servers'].update_one({'_id':server['_id']},{'$set':{'data-eliminazione':date}})
    
    
    return {'status':'Il server è stato spostato nel cestino'} if date else {'status':'Il server è stato ripristinato'}

#restituisce i prezzi dei server 
@server.get('/api/types')
async def types():
    # Recupera i documenti escludendo _id e command
    cursor = db['TypesServers'].find({}, {'_id': 0, 'command': 0})
    
    result = {}
    for doc in cursor:
        # Usa una chiave identificativa, ad esempio il nome in minuscolo
        key = doc['nome'].lower()
        doc['price'] = doc['price'] / 100
        result[key] = {
            'name': doc['nome'],
            'ram': f"{doc['ram']} GB",
            'storage': f"{doc['storage']} GB",
            'cores': doc['cores'],
            'price': f"{doc['price']:.2f} €",
            "features": doc["features"],
            'idtype': doc["id-type"]
        }

    return result



#endpoint lista dei server attivi di un utente (JWT), admin tutti
@server.get('/api/servers')
@user_required
async def servers(request:Request):
    authorization = request.headers.get('Authorization')
    try:
        authorization = authorization.split(" ")[1]  # Split più sicuro
        payload = jwt.decode(authorization, JWT_key, algorithms=['HS256'])
        user_id = payload.get('user_id')
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        # Gestione di altri errori potenziali (es. formato ObjectId non valido)
        raise HTTPException(status_code=401, detail="Invalid token or user")
    
    utente = db['Utenti'].find_one({'_id': ObjectId(user_id), 'deleted': False, 'blocked': False}, {'servers': 1, 'role':1})
    
    if(utente.get('role') == 'user'):
        Id_servers = utente.get('servers')
        list_servers = []
        for s in Id_servers:
            server = db['Servers'].find_one({
                '_id': ObjectId(s)})
            if server:
                list_servers.append(server)
    else:
        #restituisce tutti server 
        list_servers = db['Servers'].find({},{'id-playit':0, 'id-account':0, 'ip':0, 'ID-proxmox':0,'data-creazione':0})
    
    result = {}
    for d in list_servers:
        type_id = d.get('type')
        type_data = db['TypesServers'].find_one({'nome': type_id}) if type_id else None
        result[str(d['_id'])] = {
            'name': d.get('nome-server'),
            'status': d.get('stato'),
            'machine-status': d.get('machine-stato'),
            'data-deleted': d.get('data-eliminazione'),
            'host': d.get('host'),
            'pagato': d.get('pagato'),
            'type_info' : {
                'name': type_data.get('nome'),
                'ram': type_data.get('ram'),
                'cores': type_data.get('cores'),
                'storage': type_data.get('storage')
            }
        }
        if utente.get('role') == 'admin':
            proprietario = db['Utenti'].find_one({'servers': str(d['_id'])}, {'email': 1})
            
            if not proprietario:
                proprietario = {'email': 'Unknown'}
            result[str(d['_id'])]['user'] = proprietario.get('email')    
            print(result)
    return result


#endpoint per lo start/stop di java e shutdow,start,reboot della macchina
@server.put('/api/servers')
@user_required
async def serverAction(request:Request):
    payload = await request.json()
    authorization = request.headers.get('Authorization')
    #implementare ACL dei server 
    id = payload.get('id')
    command = payload.get('command')
    machine_command = payload.get('machine_command')
    try:
        authorization = authorization.split(" ")[1]  # Split più sicuro
        payload = jwt.decode(authorization, JWT_key, algorithms=['HS256'])
        user_id = payload.get('user_id')
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        # Gestione di altri errori potenziali (es. formato ObjectId non valido)
        raise HTTPException(status_code=401, detail="Invalid token or user")
    
    utente = db['Utenti'].find_one({'_id': ObjectId(user_id), 'deleted': False, 'blocked': False}, {'role':1})
    
    if(utente.get('role') == 'user'):
        server = db['Utenti'].find_one({'_id': ObjectId(user_id), 'deleted': False, 'blocked': False, 'servers':str(id)}, {'servers': 1})
        if not server:
            raise HTTPException(status_code=401, detail="Unauthorized user or server not found")
        server = db['Servers'].find_one({'_id': ObjectId(id)})
        
        if not server.get('pagato'):
            raise HTTPException(status_code=303, detail="Payment")
            
    else:
        server = db['Servers'].find_one({'_id': ObjectId(id)})
        if not server:
            raise HTTPException(status_code=404, detail="Server not found") 
    

    # comandi per JAVA: ora command è booleano (true/false)
    if isinstance(command, bool) and not machine_command and id and server['machine-stato'] == 'acceso' and server['data-eliminazione'] == "":
        ip = server['ip']
        stato = server['stato'].lower()

        # Se command è True, controlla lo stato dal DB e agisci di conseguenza
        if command is True:
            if stato == 'running':
                # Stop server
                if await ssh_command(ip, 'screen -XS minecraft quit'):
                    db['Servers'].update_one({'_id': server['_id']}, {'$set': {'stato': 'Stopped'}})
                    return {'status': 'stopped'}
            elif stato == 'stopped':
                # Start server
                run = db['TypesServers'].find_one({'nome': server['type']}, {'command': 1, '_id': 0})
                if await ssh_command(ip, f"screen -dmS minecraft {run.get('command')}"):
                    db['Servers'].update_one({'_id': server['_id']}, {'$set': {'stato': 'Running'}})
                    return {'status': 'running'}
                else:
                    return {'status': 'Error'}
        else:
            raise HTTPException(status_code=500, detail="Accendi il server prima di modificare il server di JAVA!")

    # comandi per la MACCHINA: ora machine_command è booleano (true/false)
    elif not command and isinstance(machine_command, bool) and id and server['data-eliminazione'] == "":
        vmID = server['ID-proxmox']
        machine_stato = server['machine-stato'].lower()

        if machine_command is True:
            if machine_stato == 'acceso':
                # Spegni la macchina
                shutdown_task = nodo.lxc(vmID).status.shutdown.post()
                while True:
                    await asyncio.sleep(1)
                    task_status = nodo.tasks(shutdown_task).status.get()
                    if task_status['status'] != 'running':
                        break
                db['Servers'].update_one({'_id': server['_id']}, {'$set': {'machine-stato': 'spento'}})
                return {'status': 'spento'}
            elif machine_stato == 'spento':
                # Avvia la macchina
                start_task = nodo.lxc(vmID).status.start.post()
                while True:
                    await asyncio.sleep(1)
                    task_status = nodo.tasks(start_task).status.get()
                    if task_status['status'] != 'running':
                        break
                db['Servers'].update_one({'_id': server['_id']}, {'$set': {'machine-stato': 'acceso','status':'Running'}})
                return {'status': 'acceso'}
            else:
                return {'status': 'Error'}
        else:
            return {'status': 'Error'}

    raise HTTPException(status_code=500, detail="Empty values or Two command in the same time")






@server.post('/api/create-payment')
@user_required
async def create_payment(request: Request ):
    payload = await request.json()
    vmID = payload.get('vmid')
    nome = payload.get('name_server')
    pay = payload.get('pay')
    id = payload.get('id')

    if pay:
        if not id:
           raise HTTPException(status_code=400, detail="Empty values")  
        
        serverType = db['Servers'].find_one({'_id':ObjectId(id)},{'type':1,"nome-server":1})
        typeVm = db['TypesServers'].find_one({'nome': serverType['type']}, {'price': 1})
        if not typeVm:
            print(f"Tipo macchina non trovato: {vmID}")
            raise HTTPException(status_code=404, detail="Machine ID is incorrect")
        
            
        # Crea sessione di checkout
        try:
            session = stripe.checkout.Session.create(
                payment_method_types=['card'],
                line_items=[{
                    'price_data': {
                        'currency': 'eur',
                        'product_data': {
                            'name': f"Server {serverType['nome-server']} - {serverType['type']}",
                        },
                        'unit_amount': typeVm['price'],
                    },
                    'quantity': 1,
                }],
                mode='payment',
                # URL locali per testing
                success_url=url+'loading?session_id={CHECKOUT_SESSION_ID}',
                cancel_url=url+'dashboard',
                metadata={
                    'rinnovo':True,
                    'id':id  
                }
            )
            print(f"Sessione creata: {session.id}")
            return {"payment_url": session.url}
        
        except stripe.error.StripeError as e:
            print(f"Errore Stripe: {str(e)}")
            raise HTTPException(status_code=400, detail=str(e))

    

    
    # Validazione input
    if not all([vmID, nome]):
        raise HTTPException(status_code=400, detail="Empty values")
    nome = nome.replace(' ', '-')
    # Verifica tipo macchina
    typeVm = db['TypesServers'].find_one({'nome': vmID}, {'price': 1})
    if not typeVm:
        print(f"Tipo macchina non trovato: {vmID}")
        raise HTTPException(status_code=404, detail="Machine ID is incorrect")
    

    # Crea sessione di checkout
    try:
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price_data': {
                    'currency': 'eur',
                    'product_data': {
                        'name': f"Server {nome} - {vmID}",
                    },
                    'unit_amount': typeVm['price'],
                },
                'quantity': 1,
            }],
            mode='payment',
            # URL locali per testing
            success_url=url+'loading?session_id={CHECKOUT_SESSION_ID}',
            cancel_url=url+'dashboard',
            metadata={
                'vmid': vmID,  # Corretto: vmID prima
                'name_server': nome  # nome server dopo    
            }
        )
        print(f"Sessione creata: {session.id}")
        return {"payment_url": session.url}
    
    except stripe.error.StripeError as e:
        print(f"Errore Stripe: {str(e)}")
        raise HTTPException(status_code=400, detail=str(e))

@server.post("/api/success")
@user_required
async def success(request: Request):
    dati = await request.json()
    session_id = dati.get('session_id')
    authorization = request.headers.get('Authorization').split(" ")[1]  # Split più sicuro
    
    if not session_id:
        raise HTTPException(status_code=400, detail="Session ID is required")
    
    try:
        session = stripe.checkout.Session.retrieve(session_id)
    except stripe.error.InvalidRequestError:
        raise HTTPException(status_code=404, detail="Session not found")

    try:
        payload = jwt.decode(authorization, JWT_key, algorithms=['HS256'])
        user_id = payload.get('user_id')
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        # Gestione di altri errori potenziali (es. formato ObjectId non valido)
        raise HTTPException(status_code=401, detail="Invalid token or user")
    
    id = session.metadata.get('id')
    rinnovo = session.metadata.get('rinnovo')
    vmid = session.metadata.get('vmid')
    name_server = session.metadata.get('name_server')


    dates = {
        'UtenteID':str(user_id),
        'StripeId':str(session.id),
        'Data':datetime.datetime.now().isoformat(),
        'Costo': session.amount_total,
        'Status': session.payment_status,
        "Method": session.payment_method_types[0]
    }
    print(session)

    if session.payment_status != 'paid':

        dates['ServerId'] = 'null'
        db['Payments'].insert_one(dates)
        raise HTTPException(status_code=402, detail="Payment not completed")

    
    if rinnovo:
        db['Servers'].update_one({'_id':ObjectId(id)}, {'$set':{'pagato':True}})
        return {"status": "success"}
            
    serverid = await serverMake(vmid, name_server, user_id)
    dates['ServerId'] = str(serverid)

    db['Payments'].insert_one(dates)

    return {"status": "success"}


# restituisce tutti i pagamenti effettuati dall'utente se admin riceve tutti i pagamenti
@server.get('/api/payments')
@user_required
async def payments(request: Request):
    authorization = request.headers.get('Authorization').split(" ")[1]  # Split più sicuro
    try:
        payload = jwt.decode(authorization, JWT_key, algorithms=['HS256'])
        user_id = payload.get('user_id')
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        # Gestione di altri errori potenziali (es. formato ObjectId non valido)
        raise HTTPException(status_code=401, detail="Invalid token or user")
    
    utente = db['Utenti'].find_one({'_id': ObjectId(user_id), 'deleted': False, 'blocked': False}, {'role':1, 'email':1,'_id':0})

    if(utente.get('role') == 'admin'):
        paymentsList = db['Payments'].find()
        result = []
        for payment in paymentsList:
            serverName = db['Servers'].find_one({'_id': ObjectId(payment.get('ServerId'))}, {'nome-server':1})
            utenteEmail = db['Utenti'].find_one({'_id':ObjectId(payment.get('UtenteID'))}, {'name-complete':1,'email':1})
            
            result.append({
                'id':str(payment.get('_id')),
                'name':utenteEmail.get('name-complete'),
                "email":utenteEmail.get('email'),
                'server':serverName.get('nome-server'),
                'amount':f"{payment.get('Costo') / 100:.2f}€",
                'date':payment.get('Data'),
                'status':payment.get('Status')
            })

        print(result)
        return {'list':result}
        
        
        
    storico = db['Payments'].find({'UtenteID':user_id},{'StripeId':0})
    result = []
    
    try:
        for p in storico:
            id = p.get('ServerId')
            s = db['Servers'].find_one({'_id':ObjectId(id)})
            if(not s):
                print('Server non trovato')
                continue
    
            result.append({
                'id':str(p.get('_id')),
                'date':p.get('Data'),
                'server_name':s.get('nome-server'),
                'status':p.get('Status'),
                'amount':f"{p.get('Costo') / 100:.2f}€",
                'method':p.get('Method')
            })
        return {'list':result}
    except:
        print("Errore durante l'esecuzione")
        return HTTPException(status_code=501, detail="Error on DB")
    

#endpoint che restituisce i dati dell'utente
@server.get('/api/users')
@user_required
async def users(request: Request):
    authorization = request.headers.get('Authorization').split(" ")[1]  # Split più sicuro
    try:
        payload = jwt.decode(authorization, JWT_key, algorithms=['HS256'])
        user_id = payload.get('user_id')
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        # Gestione di altri errori potenziali (es. formato ObjectId non valido)
        raise HTTPException(status_code=401, detail="Invalid token or user")
    role = db['Utenti'].find_one({'_id': ObjectId(user_id), 'deleted': False, 'blocked': False}, {'role':1}).get('role')

    if(role == 'admin'):
        utenti = db['Utenti'].find()
        result = []
        for utente in utenti:
            listPayments = db['Payments'].find({'UtenteID':str(utente.get('_id'))},{'Costo':1,'_id':0})
            totalSpent = 0
            for pay in listPayments:
                totalSpent += pay.get('Costo')

            

            result.append(
                {
                    'id':str(utente.get('_id')),
                    'name': utente.get('name-complete'),
                    'email': utente.get('email'),
                    'status': "blocked" if utente.get('blocked') else "active",
                    'role': utente.get('role'),
                    'deleted': utente.get('deleted'),
                    'servers': len(utente.get('servers')),
                    'totalSpent': f"{totalSpent / 100:.2f}€"
                }
            )

        return {'list':result}
    utente = db['Utenti'].find_one({'_id':ObjectId(user_id)})



    return {'list':{
        "nome":utente.get('name-complete'),
        "email":utente.get('email')
    }}

@server.post('/api/users')
@user_required
async def modUser(request: Request):
    authorization = request.headers.get('Authorization').split(" ")[1]  # Split più sicuro
    try:
        payload = jwt.decode(authorization, JWT_key, algorithms=['HS256'])
        user_id = payload.get('user_id')
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token or user")

    role = db['Utenti'].find_one(
        {'_id': ObjectId(user_id), 'deleted': False, 'blocked': False},
        {'role': 1}
    ).get('role')

    data = await request.json()

    # 👑 Se l'utente è admin, può modificare altri utenti
    if role == 'admin':
        target_id = data.get('id')
        block = data.get('block')
        nome = data.get('nome')
        email = data.get('email')
        newPassword = data.get('newPassword')

        if not target_id:
            raise HTTPException(status_code=400, detail="Missing target user ID")

        update_fields = {}
        if isinstance(nome, str):
            update_fields['name-complete'] = nome
        if isinstance(email, str):
            update_fields['email'] = email
        if newPassword and newPassword.strip():
            update_fields['password'] = ph.hash(newPassword)
        if isinstance(block, bool):
            update_fields['blocked'] = block

        db['Utenti'].update_one({'_id': ObjectId(target_id)}, {'$set': update_fields})

        return JSONResponse(status_code=200, content={"status": True, "message": "Utente modificato da admin"})

    # 👤 Se utente normale, modifica solo se stesso
    nome = data.get('nome')
    email = data.get('email')
    newPassword = data.get('newPassword')

    if not isinstance(email, str) or not isinstance(nome, str):
        raise HTTPException(status_code=400, detail="Invalid input")

    db['Utenti'].update_one({'_id': ObjectId(user_id)}, {'$set': {'email': email, 'name-complete': nome}})

    if newPassword and newPassword.strip():
        newPassword = ph.hash(newPassword)
        db['Utenti'].update_one({'_id': ObjectId(user_id)}, {'$set': {'password': newPassword}})

    return JSONResponse(status_code=200, content={"status": True, "message": "Utente aggiornato correttamente"})

# delete utente



#creazione server 
#@server.post('/api/servers', response_model=ServerCreateRespose)

async def serverMake(vmid, name_server, user_id):
    global startID
    
    vmID = vmid
    nome = name_server

    #controllo se i dati inviati esistono
    if(not all([vmID,nome])):
        raise HTTPException(status_code=500, detail="Empty values")
    
    
  
    
    #contrtollo il tipo di macchina
    # Recupera tutti i valori di 'id-type'
    id_types = db['TypesServers'].find({}, {'nome': 1})

    # Controlla se vmID è tra i valori
    if not any(doc.get('nome') == vmID for doc in id_types):
        raise HTTPException(status_code=500, detail="Machine ID is incorrect")

    typeVm = db['TypesServers'].find_one({'nome':vmID})

    ram = typeVm.get('ram')
    storage = typeVm.get('storage')
    cores = typeVm.get('cores')

    #generazione del nuovo ID lxc
    listconteiner = db['Servers'].find()
    max_id = templateID
    for c in listconteiner:
        vmid = c['ID-proxmox']
        if vmid > max_id:
            max_id = vmid
    
    new_id = max(max_id + 1, startID)
    print(new_id)
    startID = new_id
    # Calcolo IP statico 
    ip_last_octet = 200 + (startID - 124)  
    static_ip = f"192.168.1.{ip_last_octet}/24"
    mac_address = f"BC:24:11:{ip_last_octet:02X}:{startID:02X}:{(ip_last_octet + startID) % 256:02X}"

    # Clonazione del template 
    conf = {
        'newid': startID,
        'hostname': nome
    }
    try:
        clone_task = nodo.lxc(templateID).clone.post(**conf)
    except Exception as e:
        print(e)
        raise HTTPException(status_code=501, detail="ID alredy exist")
    
    while True:
        await asyncio.sleep(1)
        task_status = nodo.tasks(clone_task).status.get()
        if task_status['status'] != 'running':
            break

    # Configurazione con IP statico
    conf = {
        'memory': ram*1024,
        'cores': cores,
        'rootfs': f"local-lvm:vm-{startID}-disk-0,size={storage}G",
        'net0': f'name=eth0,bridge=vmbr0,hwaddr={mac_address},ip={static_ip},gw=192.168.1.1',
        'nameserver': '1.1.1.1'
    }

    nodo.lxc(startID).config.put(**conf)
    
    # Avvio il server
    start_task = nodo.lxc(startID).status.start.post()

    while True:
        await asyncio.sleep(1)
        task_status = nodo.tasks(start_task).status.get()
        if task_status['status'] != 'running':
            break

    server = {
        "nome-server": nome,
        "type":vmID,
        "ID-proxmox": startID,
        "stato": "Stopped",
        "machine-stato":"acceso",
        "ip": f"192.168.1.{ip_last_octet}",
        "data-creazione": datetime.datetime.now().isoformat(),
        "whiteList": [],
        "host":"",
        "data-eliminazione": "",
        "id-playit": "",
        "id-account": "",
        "pagato":datetime.datetime.now().isoformat()
    }
    


    # Salva nel database
    db['Servers'].insert_one(server)

    #salvo l'id del server nell'array servers dell'utente
    id_server = db['Servers'].find_one({'ID-proxmox':startID}, {'_id':1}).get('_id')

    db['Utenti'].update_one({'_id': ObjectId(user_id)}, {'$push': {'servers': str(id_server)}})
    
    #creazione del tunnel
    t = tunnel.Agent()
    await t.account()
    await t.addTunnel(static_ip.split('/')[0])
    #avvio java in base al tipo di macchina
    if await ssh_command(static_ip.split('/')[0],f"screen -dmS minecraft {typeVm.get('command')}"):
        db['Servers'].update_one({'ID-proxmox':server['ID-proxmox']},{'$set':{'stato':'Running'}})
        if await ssh_command(static_ip.split('/')[0], f"(crontab -l 2>/dev/null; echo '@reboot screen -dmS minecraft {typeVm.get('command')}') | crontab -"):
            return id_server
    

    return HTTPException(status_code=400, detail=ServerCreateRespose(status='JAVA -jar server does not run'))


if(__name__ == '__main__'):
    uvicorn.run(server, host='0.0.0.0', port=9090, server_header=False)