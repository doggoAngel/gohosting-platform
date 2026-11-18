import { useEffect,useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Server, Plus, Eye, Settings, LogOut, BarChart3, CreditCard, Trash2, Power, PowerOff } from "lucide-react";
import { Toaster } from "@/components/ui/toaster";
import { GetServersList, serverAction,deleteServer, addServer } from "@/api/dashboard";
import getTypes from "@/api/common"
import Sidebar from "@/components/sidebar";
import { toast } from "@/hooks/use-toast";


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



const Servers = () => {
  const [servers, setServers] = useState<ServerData[]>([]);
  const [serverPlans, setServerPlans] = useState([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newServerName, setNewServerName] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<keyof typeof serverPlans>("pietra");
  const [showTrash, setShowTrash] = useState(false);
    useEffect(() => {
    const fetchPlans = async () => {
      const plans = await getTypes();
      setServerPlans(plans); // <--- aggiorna lo state
      const firstPlanId = Object.keys(plans)[0] || "";
      setSelectedPlan(firstPlanId);
    };
    fetchPlans();
  }, []);

    useEffect(() => {
    const fetchData = async () => {
      try {
        const serverList = await GetServersList();
        serverList.filter(server => server.data_eliminazione === 'null').map(server => (console.log(server))); // DEBUG: Log dei server filtrati

        // Filtra i server che non sono nel cestino
        setServers(serverList);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
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

  const activeServers = servers.filter(server => server.data_eliminazione == 'null');
  const deletedServers = servers.filter(server => server.data_eliminazione != 'null');

  return (
    <div className="min-h-screen bg-background">
      <Toaster />
     <Sidebar />

      {/* Main Content */}
      <div className="ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Server Management</h1>
          <p className="text-muted-foreground">Gestisci tutti i tuoi server Minecraft</p>
        </div>

        <div className="flex gap-4 mb-6">
          <Button 
            variant={!showTrash ? "cyber" : "outline"} 
            onClick={() => setShowTrash(false)}
          >
            Server Attivi ({activeServers.length})
          </Button>
          <Button 
            variant={showTrash ? "cyber" : "outline"}
            onClick={() => setShowTrash(true)}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Cestino ({deletedServers.length})
          </Button>
        </div>

        <Card className="border-primary/30">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-accent">
                {showTrash ? "Server Eliminati" : "I Tuoi Server"}
              </h2>
              {!showTrash && (
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
                          {Object.entries(serverPlans).map(([plan, specs]) => (
                            <button
                              key={plan}
                              onClick={() => setSelectedPlan(plan as keyof typeof serverPlans)}
                              className={`p-4 border-2 rounded-lg transition-all ${
                                selectedPlan === plan
                                  ? "border-primary bg-primary/10 shadow-cyber"
                                  : "border-primary/30 hover:border-primary/50"
                              }`}
                            >
                              <div className="text-primary font-bold capitalize mb-2">{plan}</div>
                              <div className="text-sm text-muted-foreground">
                                <div>{specs.ram} • {specs.cores}</div>
                                <div>{specs.storage} • {specs.price}/mese</div>
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
              )}
            </div>

            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Status Java</TableHead>
                  <TableHead>Macchina</TableHead>
                  <TableHead>Specifiche</TableHead>
                  {showTrash && <TableHead>Data Eliminazione</TableHead>}
                  <TableHead>Pagato</TableHead>
                  <TableHead>Azioni</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(showTrash ? deletedServers : activeServers).map((server) => (
                  <TableRow key={server.id}>
                    <TableCell className="font-medium text-primary">{server.name}</TableCell>
                    <TableCell className="capitalize text-accent">{server.type}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          server.status === "Running" ? "bg-green-500" : "bg-red-500"
                        }`} />
                        <span className={server.status === "Running" ? "text-green-500" : "text-red-500"}>
                          {server.status}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {server.macchina_status === "acceso" ? (
                          <Power className="w-4 h-4 text-green-500" />
                        ) : (
                          <PowerOff className="w-4 h-4 text-red-500" />
                        )}
                        <span className={server.macchina_status === "acceso" ? "text-green-500" : "text-red-500"}>
                          {server.macchina_status}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {server.ram}GB RAM • {server.cores} Cores • {server.storage}GB
                    </TableCell>
                    {showTrash && (
                      <TableCell className="text-muted-foreground">
                        {server.data_eliminazione}
                      </TableCell>
                    )}
                    <TableCell className="text-muted-foreground">
                        <div className={` font-bold ${
                          server.pagato != "" ? "text-green-500" : "text-red-500"
                        }`}>
                        {server.pagato ? server.pagato:"Da pagare"}
                    </div>
                    </TableCell>
                    
                    <TableCell>
                      <div className="flex gap-2">
                        {!showTrash ? (
                          <Button size="sm" variant={server.status === "Running" ? "destructive" : "default"} onClick={async () => {
                          if(server.macchina_status === "acceso"){
                            toast({
                              title: "Server Action",
                              description: `Il server sta per ${server.status === "Running" ? "fermarsi" : "avviarsi"}: ${server.name}... Aspetta qualche secondo finché non apparirà un alert`,
                              duration: 5000,
                            })
                            
                            const data = await serverAction({
                              id: server.id,
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
                            }
                          }
                          else{
                            toast({
                              title: "Server Action",
                              description: "Accendi il server!",
                              duration: 1000,
                            });
                          }
                        }}>
                            {server.status === "Running" ? (<PowerOff className="w-4 h-4" />) : (<Power className="w-4 h-4" />)}
                        </Button>
                        ): (<></>)}
                        

                        {!showTrash ? (
                          <Button size="sm" variant={server.macchina_status === "acceso" ? "destructive" : "default" } onClick= {
                          async () => {
              
                            toast({
                              title: "Server Action",
                              description: `Il server sta per ${server.status === "Running" ? "fermarsi" : "avviarsi"}: ${server.name}... Aspetta qualche secondo finché non apparirà un alert`,
                              duration: 5000,
                            })
                            
                            const data = await serverAction({
                              id: server.id,
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
                            }
                          
                          
                        }}>
                          {server.macchina_status === "acceso" ? (<PowerOff className="w-4 h-4" />) : (<Power className="w-4 h-4" />)}
                        </Button>

                        ): (<></>)}
                        

                        {showTrash ? (
                          <Button variant="cyber" size="sm" onClick={async () =>{
                            toast({
                                  title: "Delete Server",
                                  description: "Ripristino del server in corso...",
                                  duration: 1000,
                                });
                            const r = await deleteServer(server.id);
                            
                            if(r.status){
                              toast({
                                  title: "Delete Server",
                                  description: r.message,
                                  duration: 3000,
                                });
                              const updatedServers = await GetServersList();
                              setServers(updatedServers);
                              
                              
                            }else{
                              toast({
                                title: "Delete Server",
                                description: r.message,
                                duration: 3000,
                              });
                            }
                          }}>Ripristina</Button>
                        ) : (
                        
                          <Button variant="destructive" size="sm" onClick={async () => {
                              toast({
                                title: "Delete Server",
                                description: "Eliminazione del server in corso...",
                                duration: 1000,
                              });
                              const r = await deleteServer(server.id);
                              if(r.status){
                                toast({
                                    title: "Delete Server",
                                    description: r.message,
                                    duration: 3000,
                                  });
                                const updatedServers = await GetServersList();
                                setServers(updatedServers);
                                // Aggiorna anche il server selezionato
                                
                              }else{
                                toast({
                                  title: "Delete Server",
                                  description: r.message,
                                  duration: 3000,
                                });
                              }
                        }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          
                        )}

                        
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Servers;