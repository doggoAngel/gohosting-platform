import { useState, useEffect } from "react";
import { Logout } from "@/components/logout"; 
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {GetServersList, serverAction, getPayments,deleteServer, getUser} from "@/api/dashboard"; // Adjust the import path as necessary
import { 
  Server, 
  Users, 
  CreditCard, 
  Shield, 
  RotateCcw, 
  Trash2, 
  Power, 
  PowerOff,
  Eye,
  Ban,
  UserCheck,
  UserX
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "@/hooks/use-toast";

// Mock data
/*const mockUsers = [
  { id: 1, name: "Mario Rossi", email: "mario@esempio.com", status: "active", servers: 2, totalSpent: "75.00€" },
  { id: 2, name: "Laura Bianchi", email: "laura@esempio.com", status: "active", servers: 1, totalSpent: "42.50€" },
  { id: 3, name: "Giuseppe Verde", email: "giuseppe@esempio.com", status: "blocked", servers: 0, totalSpent: "15.00€" },
];*/
/*
const mockServers = [
  { 
    id: 1, 
    name: "Server-Survival-1", 
    plan: "diamante", 
    user: "Mario Rossi", 
    status: "online", 
    machineStatus: "running",
    deletionDate: null,
    ram: "6.2GB / 8GB",
    cpu: "45%"
  },
]; */
/*
const mockPayments = [
  { id: 1, user: "Mario Rossi", email:"test1@fam.com",server: "Server-Survival-1", amount: "7.50€", date: "2024-01-01", status: "completed" },
  
];*/

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState("overview");
  const [mockServers, setMockServers] = useState([]);
  const [mockPayments, setMockPayments] = useState([]);
  const [mockUsers, setMockUsers] = useState([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchUsers = async () => {
      const response = await getUser();
      if(response.status){
        setMockUsers(response.message)
      }
    }
    fetchUsers();
  }, [])


  useEffect(() => {
  const fetchPayments = async () => {
    const pays = await getPayments();
    if (pays.status) {
      setMockPayments(pays.message);

      // Calcolo totale in modo sincrono
      const totalAmount = pays.message.reduce((acc, p) => {
        return acc + parseFloat(p.amount.split('€')[0]);
      }, 0);

      setTotal(totalAmount);
      console.log("Totale:", totalAmount);
    }
  };
  fetchPayments();
}, []);

  
  useEffect(() => {
    const fetchServers = async () => {
      const servers = await GetServersList();
      if (servers){
        setMockServers(servers);
        console.log(servers)
      }
    }
    fetchServers();
  }, []);


  const getPlanColor = (plan: string) => {
    const colors = {
      pietra: "bg-gray-500",
      oro: "bg-yellow-500", 
      diamante: "bg-blue-500",
      netherite: "bg-purple-500"
    };
    return colors[plan as keyof typeof colors] || "bg-gray-500";
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-primary/30 bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-accent flex items-center justify-center">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-primary">Dashboard Admin</h1>
                <p className="text-sm text-muted-foreground">Pannello di controllo amministratore</p>
              </div>
            </div>
            <div>
              <Link to="/">
                <Button variant="outline">Homepage</Button>
              </Link>
              <Logout />
            </div>
            
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6 border-primary/30">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center">
                <Users className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">3</p>
                <p className="text-sm text-muted-foreground">Utenti Totali</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-primary/30">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-accent flex items-center justify-center">
                <Server className="w-6 h-6 text-accent-foreground" />
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{mockServers.length}</p>
                <p className="text-sm text-muted-foreground">Server Totali</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-primary/30">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-cyber flex items-center justify-center">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{total}</p>
                <p className="text-sm text-muted-foreground">Ricavi Totali</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-primary/30">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <Server className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-primary">{
                  mockServers.filter(server => server.macchina_status === "acceso").length  
                }</p>
                <p className="text-sm text-muted-foreground">Server Attivi</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Management Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Panoramica</TabsTrigger>
            <TabsTrigger value="users">Gestione Utenti</TabsTrigger>
            <TabsTrigger value="servers">Gestione Server</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card className="p-6 border-primary/30">
              <h3 className="text-xl font-bold text-primary mb-4">Storico Pagamenti Completo</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Utente</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Server</TableHead>
                    <TableHead>Importo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Stato</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockPayments.map((payment) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.name}</TableCell>
                      <TableCell className="font-medium">{payment.email}</TableCell>
                      <TableCell>{payment.server}</TableCell>
                      <TableCell className="text-accent font-bold">{payment.amount}</TableCell>
                      <TableCell>{payment.date}</TableCell>
                      <TableCell>
                        <Badge variant={payment.status === "completed" ? "default" : "destructive"}>
                          {payment.status === "completed" ? "Completato" : "Rimborsato"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <Card className="p-6 border-primary/30">
              <h3 className="text-xl font-bold text-primary mb-4">Gestione Utenti</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Ruolo</TableHead>
                    <TableHead>Stato</TableHead>
                    <TableHead>Server</TableHead>
                    <TableHead>Speso Totale</TableHead>
                    <TableHead>Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>
                        <Badge variant={user.status === "active" ? "default" : "destructive"}>
                          {user.status === "active" ? "Attivo" : "Bloccato"}
                        </Badge>
                      </TableCell>
                      <TableCell>{user.servers}</TableCell>
                      <TableCell className="text-accent font-bold">{user.totalSpent}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant={user.status === "active" ? "destructive" : "default"}
                          >
                            {user.status === "active" ? (
                              <Ban className="w-4 h-4" />
                            ) : (
                              <UserCheck className="w-4 h-4" />
                            )}
                          </Button>
                          <Button size="sm" variant="outline">
                            <RotateCcw className="w-4 h-4" />
                          </Button>
                          <Button size="sm" variant="destructive">
                            <UserX className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>

          <TabsContent value="servers" className="space-y-6">
            <Card className="p-6 border-primary/30">
              <h3 className="text-xl font-bold text-primary mb-4">Gestione Server</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome Server</TableHead>
                    <TableHead>Piano</TableHead>
                    <TableHead>Proprietario</TableHead>
                    <TableHead>Stato Server</TableHead>
                    <TableHead>Stato Macchina</TableHead>
                    <TableHead>Risorse</TableHead>
                    <TableHead>Azioni</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockServers.map((server) => (
                    <TableRow key={server.id} className={server.data_eliminazione != 'null' ? "opacity-60" : ""}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          {server.data_eliminazione != 'null' && <Trash2 className="w-4 h-4 text-destructive" />}
                          {server.name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getPlanColor(server.type)} text-white`}>
                          {server.type}
                        </Badge>
                      </TableCell>
                      <TableCell>{server.user}</TableCell>
                      <TableCell>
                        <Badge variant={server.status === "Running" ? "default" : "secondary"}>
                          {server.status === "Running" ? "Online" : "Offline"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {server.macchina_status === "acceso" ? (
                            <Power className="w-4 h-4 text-green-500" />
                          ) : (
                            <PowerOff className="w-4 h-4 text-red-500" />
                          )}
                          <span className="text-sm">
                            {server.macchina_status === "acceso" ? "Accesa" : "Spenta"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>RAM: {server.ram}GB</div>
                          <div>CPU: {server.cores}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant={server.status === "Running" ? "destructive" : "default"}
                            onClick={async ()=> {
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
                              console.error(data.message);
                              toast({
                                title: "Server Action",
                                description: "Prova a accendere il server",
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
                              setMockServers(updatedServers);
                            }
                          }}>
                            {server.status === "Running" ? (
                              <PowerOff className="w-4 h-4" />
                            ) : (
                              <Power className="w-4 h-4" />
                            )}
                          </Button>
                          <Button 
                            size="sm" 
                            variant={server.macchina_status === "acceso" ? "destructive" : "default"}
                            onClick={async () =>{
                        toast({
                          title: "Server Action",
                          description: `La macchina sta per ${server.macchina_status === "acceso" ? "spegnersi" : "avviarsi"} ${server.name}... Aspetta qualche secondo finchè non apparirà un alert`,
                          duration: 5000,
                        })
                        const data = await serverAction({
                          id: server.id,
                          command: false,
                          machine_command: true
                        });
                        if(data.status){
                          toast({
                            title: "Server Action",
                            description: `La macchina ha compiuto la task ${server.name}...`,
                            duration: 2000,
                          })
                          const updatedServers = await GetServersList();
                          setMockServers(updatedServers);
                          
                        }else{
                          console.error("Error to comunicate with the machine")
                        }
                      }}
                          >
                            {server.macchina_status === "acceso" ? (
                              <PowerOff className="w-4 h-4" />
                            ) : (
                              <Power className="w-4 h-4" />
                            )}
                          </Button>
                          {server.data_eliminazione != 'null' ? (
                            <Button size="sm" variant="default" onClick={
                              async () => {
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
                                  setMockServers(updatedServers)
                                }else{
                                  toast({
                                    title: "Delete Server",
                                    description: r.message,
                                    duration: 3000,
                                  });
                                }
                      
                              }
                            }>
                              <RotateCcw className="w-4 h-4" />
                            </Button>
                          ) : (
                            <Button size="sm" variant="destructive" onClick={
                              async () => {
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
                                  setMockServers(updatedServers)
                                }else{
                                  toast({
                                    title: "Delete Server",
                                    description: r.message,
                                    duration: 3000,
                                  });
                                }
                      
                              }
                            }>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;