#programma che gestisce i cestini e i pagamenti

# dopo un mese i server messi nel cestino vengono eliminati definitivamente
# i server che hanno una data in (pagato) verranno presi e controllati ogni giorno, se scadono
# dopo un mese verranno spenti e bloccati fino al prossimo pagamento
# (pagato -> "")

import pymongo
import schedule
import datetime
from dateutil.relativedelta import relativedelta
from bson import ObjectId
from time import sleep
import requests
import sys
import os 
from dotenv import load_dotenv
load_dotenv()

serverDB = str(os.getenv('serverDB'))
deadLine = "11:00"

class ProxmoxAPI:
    def __init__(self):
        self.userProxmox = os.getenv('userProxmox').split('@')
        self.pswProxmox = os.getenv('pswProxmox')
        self.host = os.getenv('host')
        self.headers = {
            "User-Agent":"User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
            'Csrfpreventiontoken':"",
            "Cookie":''
        }
    
    def delete(self, id):
        endpoint = self.host + f'/api2/extjs/nodes/vm/lxc/{str(id)}?purge=0&destroy-unreferenced-disks=0'

        response = requests.delete(endpoint, verify=False, headers=self.headers)
        data = response.json()
        if(data.get('success') != 1):
            print("Errore")
            return -1
        print("Eliminato")
        return 0

    def login(self):
        endpoint = self.host + "/api2/extjs/access/ticket"
        data = {
            "username":self.userProxmox[0],
            "password":self.pswProxmox,
            "realm":self.userProxmox[1],
            "new-format":1
        }
        response = requests.post(endpoint,headers=self.headers,data=data,verify=False)
        if(response.status_code != 200):
            return -1
        del data
        data = response.json()
        self.headers['Cookie'] = "PVEAuthCookie="+data.get('data').get('ticket')
        self.headers['Csrfpreventiontoken'] = data.get('data').get('CSRFPreventionToken')
        return 0
        


#database
client_db = pymongo.MongoClient(serverDB)
if not "gohosting" in client_db.list_database_names():
    print("DB NON esiste")
    sys.exit(1)

db = client_db["gohosting"]




#funzione di eliminazione dal cestino
def delete_permanet():
    now = datetime.datetime.now()
    list_servers = db['Servers'].find({'data-eliminazione':{'$ne':""}},{'data-eliminazione':1,'ID-proxmox':1})
    p = ProxmoxAPI()
    p.login()
    for s in list_servers:
        data_riferimento = datetime.datetime.fromisoformat(s.get('data-eliminazione'))
        un_mese_dopo = data_riferimento + relativedelta(months=1)
        if(now>=un_mese_dopo):
            print("eliminato")
            p.delete(s.get('ID-proxmox'))
            db['Servers'].delete_one({'_id':ObjectId(s.get('_id'))})
            db['Utenti'].update_one({'servers':str(s.get('_id'))},{'$pull':{'servers':str(s.get('_id'))}})
        else:
            print("salvo")


#funzione di controllo pagamento
def check_payment():
    now = datetime.datetime.now()
    list_servers = db['Servers'].find({'pagato':{'$ne':""}},{'pagato':1})
    for s in list_servers:
        data_riferimento = datetime.datetime.fromisoformat(s.get('pagato'))
        un_mese_dopo = data_riferimento + relativedelta(months=1)
        if(now>=un_mese_dopo):
            print("da pagare")
            db['Servers'].update_one({'_id':ObjectId(s.get('_id'))},{"$set":{'pagato':""}})
        else:
            print("pagato")

# Pianifica la funzione ogni giorno alle 00:01
schedule.every().day.at(deadLine).do(check_payment)
schedule.every().day.at(deadLine).do(delete_permanet)


while True:
    schedule.run_pending()
    sleep(60)


