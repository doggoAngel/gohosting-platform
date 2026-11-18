
import { toast } from "sonner";
import { URL } from "./common";

//ricevere la lista dei server
async function GetServersList() {
    try{
        const response = await fetch(URL+"servers",{
            headers:{
                    "Authorization": "Bearer " + localStorage.getItem("token")
                }
            }
        );
        if(response.status == 200){
            const dati = await response.json();
            return Object.entries(dati).map(([id,server]) => ({
                id: id,
                name: server["name"],
                status: server["status"],
                macchina_status: server["machine-status"],
                ram: server['type_info']['ram'],
                cores: server['type_info']['cores'],
                host: server['host'], 
                storage: server['type_info']['storage'],
                type: server['type_info']['name'],
                data_eliminazione: server["data-deleted"] ? server["data-deleted"] : "null",
                user: server["user"] ? server["user"] : "",
                pagato: server["pagato"]
            }));
        }else{
            return null;
        }
    }
    catch(err){
        console.error(err)
    }
}

//ricevere la lista dei server
async function addServer(data: {name_server: string, vmid: string}) {
    try{ 
        
        const response = await fetch(URL+"create-payment",{
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + localStorage.getItem("token")
            },
            body: JSON.stringify(data)
        });
        if(response.status == 200){
            const d = await response.json()
            window.location = d.payment_url;
            
        }else{
            console.error(response.text());
            toast.error("Errore durante la creazione del server");
            
        }
    }
    catch(err){
        console.error(err)
    }
}

//azione per il server
async function serverAction({ id, command, machine_command }) {
    
        
    const response = await fetch(URL +'servers', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            "Authorization": "Bearer " + localStorage.getItem("token")
        },
        body: JSON.stringify({ id, command, machine_command })
    });

    if (!response.ok) {
        if (response.status === 500) {
            const errorData = await response.json();
            return {"status":false, 'message': errorData.detail};
        } 
        if (response.status === 303){
                try{ 
        
                    const response = await fetch(URL+"create-payment",{
                        method: "POST",
                        headers: {
                            "Content-Type": "application/json",
                            "Authorization": "Bearer " + localStorage.getItem("token")
                        },
                        body: JSON.stringify({
                            'id':id,
                            'pay':true
                        })
                    });
                    if(response.status == 200){
                        const d = await response.json()
                        window.location = d.payment_url;
                        
                    }else{
                        console.error(response.text());
                        toast.error("Errore durante la creazione del server");
                        
                    }
                }
                catch(err){
                    console.error(err)
                }
            
        }
        return null;
    }

    const r = await response.json();

    return {"status":true, 'message': r.status}
}


//azione per il server
async function deleteServer(id) {
      
    const response = await fetch(URL +'servers/'+id, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            "Authorization": "Bearer " + localStorage.getItem("token")
        }
    });
    const r = await response.json();
    
    if(response.status === 500) {
        
        console.log(r.detail);
        return {status:false, message: r.detail};; // Server non trovato o errore interno
    }
    return {status:true, message: r.status};
    
}

async function getPayments() {
      
    const response = await fetch(URL +'payments', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            "Authorization": "Bearer " + localStorage.getItem("token")
        }
    });
    const r = await response.json();
    
    if(response.status === 400) {
        
        console.log(r.detail);
        return {status:false, message: r.detail}; // Server non trovato o errore interno
    } if(response.status === 500) {
        
        console.log(r.detail);
        return {status:false, message: r.detail}
    }
    return {status:true, message: r.list};
}

async function getUser() {
      
    const response = await fetch(URL +'users', {
        method: 'GET',
        headers: {
            'Content-Type': 'application/json',
            "Authorization": "Bearer " + localStorage.getItem("token")
        }
    });
    const r = await response.json();
    
    if(response.status === 400) {
        
        console.log(r.detail);
        return {status:false, message: r.detail}; // Server non trovato o errore interno
    } if(response.status === 500) {
        
        console.log(r.detail);
        return {status:false, message: r.detail}
    }
    return {status:true, message: r.list};
}


async function modifyUser(data) {
      
    const response = await fetch(URL +'users', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            "Authorization": "Bearer " + localStorage.getItem("token")
        },
        body: JSON.stringify(data)
    });
    const r = await response.json();
    
    return r
}


export {addServer, GetServersList, serverAction,deleteServer,getPayments, getUser, modifyUser};