import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Server, Plus, Settings, LogOut, CreditCard, FileEdit } from "lucide-react";
import { NavLink } from "react-router-dom";
import getTypes from "@/api/common"
import {GetServersList, addServer, serverAction, deleteServer} from "@/api/dashboard";
import { toast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import Sidebar from "@/components/sidebar";
import { FileEditor } from "@/components/FileEditor";

interface ServerData {
  id: string;
  name: string;
  type: "pietra" | "oro" | "diamante" | "netherite";
  status: "Running" | "Stopped";
  host?: string; // Host del server, se disponibile
  ram: number;
  cores: number;
  storage: number;
  pagato: string;
  data_eliminazione?: string; // Se presente, il server è nel cestino
  macchina_status: "acceso" | "spento"; // Status della macchina virtuale
}
 

const Dashboard =  () => {
  const [servers, setServers] = useState<ServerData[]>([]);
  const [serverPlans, setServerPlans] = useState<any>({});

  const [selectedServer, setSelectedServer] = useState<ServerData | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showFileEditor, setShowFileEditor] = useState(false);
  const [newServerName, setNewServerName] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<string>(""); // id del piano
 

  useEffect(() => {
    const fetchData = async () => {
      try {
        const serverList = await GetServersList();
        serverList.filter(server => server.data_eliminazione === 'null').map(server => (console.log(server))); // DEBUG: Log dei server filtrati

        // Filtra i server che non sono nel cestino
        setServers(serverList);
        setSelectedServer(serverList[0] || null);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    const fetchPlans = async () => {
      const plans = await getTypes();
      setServerPlans(plans); // <--- aggiorna lo state
      const firstPlanId = Object.keys(plans)[0] || "";
      setSelectedPlan(firstPlanId);
    };
    fetchPlans();
  }, []);

  const handleAddServer = async () => {
    if (newServerName.trim() && selectedPlan) {
      
      const data = {
        name_server: newServerName,
        vmid: selectedPlan
      };
      toast({
        title: "New Server",
        description: `Procediamo per il pagamento!`,
        duration: 2000,
      })
      await addServer(data);
      
    }
  };
 
  return (
    <div className="min-h-screen bg-background">
      <Toaster />
      
      
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Dashboard</h1>
          <p className="text-muted-foreground">Panoramica dei tuoi server</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Server List */}
          <div className="lg:col-span-1">
            <Card className="p-6 border-primary/30">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-accent">I Tuoi Server</h2>
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button variant="cyber" size="sm">
                      <Plus className="w-4 h-4" />
                      Aggiungi Server
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-card border-primary/30">
                    <DialogHeader>
                      <DialogTitle className="text-accent flex items-center gap-2">
                        <Server className="w-5 h-5" />
                        Aggiungi Nuovo Server
                      </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="serverName" className="text-primary">Nome Server:</Label>
                        <Input
                          id="serverName"
                          value={newServerName}
                          onChange={(e) => setNewServerName(e.target.value)}
                          placeholder="Minecraft Vanilla"
                          className="mt-2"
                        />
                      </div>

                      <div>
                        <Label className="text-primary">Tipo Server:</Label>
                        <div className="grid grid-cols-2 gap-4 mt-2">
                          {Object.entries(serverPlans).map(([planId, specs]) => (
                            <button
                              key={planId}
                              onClick={() => setSelectedPlan(planId)}
                              className={`p-4 border-2 rounded-lg transition-all ${
                                selectedPlan === planId
                                  ? "border-primary bg-primary/10 shadow-cyber"
                                  : "border-primary/30 hover:border-primary/50"
                              }`}
                            >
                              {/* Mostra il nome, ma usa l'id come valore selezionato */}
                              <div className="text-primary font-bold capitalize mb-2">{specs.name}</div>
                              <div className="text-sm text-muted-foreground">
                                <div>{specs.ram}GB RAM • {specs.cores}</div>
                                <div>{specs.storage}  • {specs.price}/mese</div>
                              </div>
                             
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <Button variant="outline" onClick={() => setShowAddDialog(false)} className="flex-1">
                          Annulla
                        </Button>
                        <Button variant="cyber" onClick={handleAddServer} className="flex-1">
                          Crea Server
                        </Button>
                      </div>

                      
                    </div>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-3">
                {servers.filter(server => server.data_eliminazione === 'null').map((server) => (
                  
                  <button
                    key={server.id}
                    onClick={() => setSelectedServer(server)}
                    className={`w-full p-4 rounded-lg border-2 transition-all text-left ${
                      selectedServer?.id === server.id
                        ? "border-accent bg-accent/10 shadow-accent"
                        : "border-primary/30 hover:border-primary/50"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Server className="w-5 h-5 text-primary" />
                        <span className="font-medium text-primary">{server.name}</span>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${
                        (() => {
                          if(server.status === "Running" && server.macchina_status === 'acceso'){
                            return "bg-green-500"
                          }
                          else if(server.status === "Stopped" && server.macchina_status === 'acceso'){
                            return "bg-red-500"
                          }
                          else{
                            return "bg-gray-500"
                          }
                        })()
                        //server.status === "Running" ? "bg-green-500" : "bg-red-500"
                      }`} />
                    </div>
                  </button>
                ))}
              </div>
            </Card>
          </div>

          {/* Server Details */}
          <div className="lg:col-span-2">
            {selectedServer && selectedServer.data_eliminazione === 'null' && (
              <Card className="p-6 border-primary/30">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-accent">{selectedServer.name}</h2>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async ()=> {
                        toast({
                          title: "Server Action",
                          description: `Il server sta per ${selectedServer.status === "Running" ? "fermarsi" : "avviarsi"}: ${selectedServer.name}... Aspetta qualche secondo finché non apparirà un alert`,
                          duration: 5000,
                        })
                        const data = await serverAction({
                          id: selectedServer.id,
                          command: true,
                          machine_command: false
                        })
                        if(data.status === false){
                          toast({
                            title: "Server Action",
                            description: data.message,
                            duration: 1000,
                          })
                        }
                        if(data.status === true){
                          toast({
                            title: "Server Action",
                            description: data.message,
                            duration: 1000,
                          })
                          const updatedServers = await GetServersList();
                          setServers(updatedServers);
                          // Aggiorna anche il server selezionato
                          setSelectedServer(updatedServers.find(s => s.id === selectedServer.id) || null);
                        }
                      }}>
                      {selectedServer.status === "Running" ? "Stop" : "Start"} Server
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={async () =>{
                        toast({
                          title: "Server Action",
                          description: `La macchina sta per ${selectedServer.macchina_status === "acceso" ? "spegnersi" : "avviarsi"} ${selectedServer.name}... Aspetta qualche secondo finchè non apparirà un alert`,
                          duration: 5000,
                        })
                        const data = await serverAction({
                          id: selectedServer.id,
                          command: false,
                          machine_command: true
                        });
                        if(data.status){
                          toast({
                            title: "Server Action",
                            description: `La macchina ha compiuto la task ${selectedServer.name}...`,
                            duration: 2000,
                          })
                          const updatedServers = await GetServersList();
                          setServers(updatedServers);
                          // Aggiorna anche il server selezionato
                          setSelectedServer(updatedServers.find(s => s.id === selectedServer.id) || null);
                        }else{
                          console.error("Error to comunicate with the machine")
                        }
                      }}
                      >{selectedServer.macchina_status === 'acceso'? "Shutdown":"Start"}</Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowFileEditor(true)}
                    >
                      <FileEdit className="w-4 h-4 mr-2" />
                      Edit Config
                    </Button>
                    <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={async () => {
                      toast({
                        title: "Delete Server",
                        description: "Eliminazione del server in corso...",
                        duration: 1000,
                      });
                      const r = await deleteServer(selectedServer.id);
                      if(r.status){
                        toast({
                            title: "Delete Server",
                            description: r.message,
                            duration: 3000,
                          });
                        const updatedServers = await GetServersList();
                        setServers(updatedServers);
                        // Aggiorna anche il server selezionato
                        setSelectedServer(updatedServers.find(s => s.id === selectedServer.id) || null);
                      }else{
                        toast({
                          title: "Delete Server",
                          description: r.message,
                          duration: 3000,
                        });
                      }
                      
                        
                    }}>Delete Server</Button>
                  </div>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Server Host</div>
                    <div className="text-2xl font-bold text-primary">
                     
                      <div className="text-sm font-bold text-primary">{selectedServer.host}</div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">RAM</div>
                    <div className="text-2xl font-bold text-primary">{selectedServer.ram}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Storage</div>
                    <div className="text-2xl font-bold text-primary">{selectedServer.storage}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">CPU Cores</div>
                    <div className="text-2xl font-bold text-primary">{selectedServer.cores}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Type</div>
                    <div className="text-xl font-bold text-primary capitalize">{selectedServer.type}</div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Status</div>
                    <div className={`text-xl font-bold ${
                      (() => {
                          if(selectedServer.status === "Running" && selectedServer.macchina_status === 'acceso'){
                            return "text-green-500"
                          }
                          else if(selectedServer.status === "Stopped" && selectedServer.macchina_status === 'acceso'){
                            return "text-red-500"
                          }
                          else{
                            return "text-gray-500"
                          }
                        })()
                      //selectedServer.status === "Running" ? "text-green-500" : "text-red-500"
                    }`}>
                      {selectedServer.status}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="text-sm text-muted-foreground">Pagato</div>
                    <div className={`font-bold ${
                      selectedServer.pagato != "" ? "text-green-500" : "text-xl text-red-500"
                    }`}>
                      {selectedServer.pagato != "" ? selectedServer.pagato:"Da pagare"}
                    </div>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* File Editor Modal */}
      <FileEditor
        open={showFileEditor}
        onOpenChange={setShowFileEditor}
        serverId={selectedServer?.id || ""}
      />
    </div>
  );
};

export default Dashboard;