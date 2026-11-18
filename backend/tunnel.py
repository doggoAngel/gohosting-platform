import requests
import pymongo
import asyncio
from bson import ObjectId
import os
from dotenv import load_dotenv
load_dotenv()

class Agent:
    def __init__(self):
        self.serverDB = os.getenv('serverDB')
        self.tunnels = {}
        self.URL = "https://playit.gg"
        self.headers = {
            "Host": "playit.gg",
            "Sec-Ch-Ua-Platform": '"macOS"',
            "Accept-Language": "it-IT,it;q=0.9",
            "Sec-Ch-Ua": '"Not)A;Brand";v="8", "Chromium";v="138"',
            "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
            "Sec-Ch-Ua-Mobile": "?0",
            "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/138.0.0.0 Safari/537.36",
            "Accept": "*/*",
            "Origin": "https://playit.gg",
            "Sec-Fetch-Site": "same-origin",
            "Sec-Fetch-Mode": "cors",
            "Sec-Fetch-Dest": "empty",
            "Referer": "https://playit.gg/login",
            "Priority": "u=1, i"
        }
        self.client_db = pymongo.MongoClient(self.serverDB)
        if not "gohosting" in self.client_db.list_database_names():
            print("DB NON esiste")
            pass

        self.db = self.client_db["gohosting"]
    
    async def account(self):
        
        account = self.db['credential_tunnel'].find_one({'tunnels':{'$lt':4}})
        self.email = account['email']
        self.password = account['password']
        self.id_account = str(account['_id'])
        await self.login()
        

    
    async def login(self):
        data = {
            "_action": "login",
            "email": self.email,
            "password": self.password
        }
        response = requests.post(self.URL+'/login?_data=routes%2Flogin', headers=self.headers, data=data)
        self.headers["Cookie"] = response.headers.get('set-cookie')


    async def getcsrf(self):
        response = requests.get(self.URL+'/account/agents/'+self.agent+'/tunnels', headers=self.headers).text
        return response.split('"csrfToken":')[1].split('"')[1]
    
    async def addTunnel(self, ip):
        if self.checkTunnelsMax():
            response = requests.get(self.URL+'/account/tunnels/?_data=routes%2Faccount', headers=self.headers).json()
            self.agent = response['agents']['agents'][0]['id']
            tunneldata = {
                "_csrf_token": await self.getcsrf(),
                "region":"global",
                "tunnel_type":"minecraft-java",
                "enabled":"on"
            }

            response = requests.post(self.URL+'/account/agents/'+self.agent+'/tunnels/add?index=&_data=routes%2Faccount%2Fagents%2F%24agentId%2Ftunnels%2Fadd%2Findex',headers=self.headers, data=tunneldata)
            id_tunnelNew = response.headers['X-Remix-Redirect'].split('/')[-1]
            self.tunnels[id_tunnelNew] = ""
            print(response.text)
            
            #controllo stato appending e ricevere il dominio
            status = ""
            while status != "allocated":
                print('check status')
                try:
                    response = requests.get(self.URL+'/account/tunnels/?_data=routes%2Faccount', headers=self.headers).json()
                    print(response)
                    for t in response['tunnels']['tunnels']:
                        if t['id'] == id_tunnelNew:
                            status = t['alloc']['status']
                            if(status == 'allocated'):
                                self.tunnels[id_tunnelNew] = t['alloc']['data']["assigned_domain"]
                                print(self.tunnels[id_tunnelNew])
                                self.db['Servers'].update_one({'ip':ip},{'$set':{'host':self.tunnels[id_tunnelNew],'id-playit':id_tunnelNew,'id-account':self.id_account}})
                                break
                    await asyncio.sleep(1)
                except:
                    print("ERRORE durante il controllo del dominio TUNNEL")
                    break
            #impostare l'ip
            settings = {
                "_csrf_token": await self.getcsrf(),
                "_action":"local-address",
                "agent_id":self.agent,
                "local_ip_og":ip,
                "local_port_og":25565,
                "local_ip":ip,
                "local_port":"",
                "use-defaults":""
            }
            requests.post(self.URL+f'/account/tunnels/{id_tunnelNew}/?_data=routes%2Faccount%2Ftunnels%2F%24tunnelId', headers=self.headers,data=settings)
            count = int(self.db['credential_tunnel'].find_one({'_id':ObjectId(self.id_account)})['tunnels'])
            self.db['credential_tunnel'].update_one({'_id':ObjectId(self.id_account)},{'$set':{'tunnels':count+1}})

            

    def checkTunnelsMax(self):
        return len(self.tunnels)<=4


    # DELETE a TUNNEL
    async def deleteTunnel(self,server):
       
        account = self.db['credential_tunnel'].find_one({'_id':ObjectId(server['id-account'])})
        self.email = account['email']
        self.password = account['password']
        await self.login()
        response = requests.get(self.URL+'/account/tunnels/?_data=routes%2Faccount', headers=self.headers).json()
        self.agent = response['agents']['agents'][0]['id']
        response = requests.post(self.URL+f'/account/tunnels/{server["id-playit"]}/delete?_data=routes%2Faccount%2Ftunnels%2F%24tunnelId%2Fdelete', headers=self.headers, data={"_csrf_token": await self.getcsrf()})
        if response.text != 'TunnelNotFound':
            self.db['credential_tunnel'].update_one({'_id':ObjectId(server['id-account'])}, {'$set': {'tunnels': int(account['tunnels']) - 1}})
            print('cancellato')





