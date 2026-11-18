import { URL } from "./common";

//ricevere la lista dei server
export async function Auth(data) {
    try{
        const response = await fetch(URL+"login",{
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });
        if(response.status == 200){
            const dati = await response.json();
            console.log(dati);
            if(dati.token){
                localStorage.setItem("token", dati.token);
                localStorage.setItem("page", dati.page);
                return {success: true, page: dati.page};
            }
            return {success: false, error: "Token non ricevuto"};
        }else if(response.status == 401){
            return {success: false, error: "Credenziali non valide"};
        }else if(response.status == 403){
            return {success: false, error: "Account bloccato o eliminato"};
        }else if(response.status == 500){
            return {success: false, error: "Errore interno del server"};
        }else{
            return null;
        }
    }
    catch(err){
        console.error(err)
    }
}

export async function Register(data) {
    try {
        const response = await fetch(URL + "register", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
        });

        if (response.status === 200) {
            const dati = await response.json();
            console.log(dati)
            if(dati.token){
                localStorage.setItem("token", dati.token);
                localStorage.setItem("page", dati.page);
                return {success: true, page: dati.page};
            }
        } 
        return { success: false, error: "Errore durante la registrazione" };
    } catch (error) {
        console.error("Errore durante la registrazione:", error);
        return { success: false, error: "Errore di rete o server" };
    }
}




