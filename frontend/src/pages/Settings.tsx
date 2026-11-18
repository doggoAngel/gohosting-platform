import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Server, Settings as SettingsIcon, LogOut, BarChart3, CreditCard, User, Shield, Bell, Database } from "lucide-react";
import Sidebar from "@/components/sidebar";
import { toast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { useState, useEffect } from "react";
import {modifyUser, getUser} from "@/api/dashboard"

const Settings = () => {
  toast({
      title: "ATTENZIONE",
      description: `QUESTA PAGINA NON E' STATA ANCORA IMPLEMENTATA!`,
      duration: 2000,
    });

  const nonImplementato = (checked) => {
    console.log(checked);
    toast({
      title: "Attendere",
      description: `Questa funzione non è ancora stata implementata.`,
      duration: 2000,
    });
  };

  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const result = await getUser();
      if(result.status){
        
        setNome(result.message.nome || '');
        setEmail(result.message.email || '');
      }
    }
    fetchUser();
  }, []);
  
  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />
      <Toaster />

      {/* Contenuto Principale */}
      <div className="ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Impostazioni</h1>
          <p className="text-muted-foreground">Gestisci il tuo account e le preferenze di hosting</p>
        </div>

        <div className="max-w-4xl space-y-8">
          {/* Impostazioni Account */}
          <Card className="p-6 border-primary/30">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-6 h-6 text-accent" />
              <h2 className="text-xl font-bold text-accent">Impostazioni Account</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="username" className="text-primary">Nome</Label>
                <Input
                  id="username"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  className="bg-secondary border-primary/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-primary">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="bg-secondary border-primary/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-primary">Nuova Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="bg-secondary border-primary/30"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-primary">Conferma Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="bg-secondary border-primary/30"
                />
              </div>
            </div>

            <Separator className="my-6 bg-primary/20" />
            
            <Button variant="cyber" className="w-full md:w-auto" onClick={async () => {
              const result = await modifyUser({
                'email': email,
                'nome': nome,
                'newPassword': newPassword
              })

              if(result.status){
                toast({
                  title: "Edit User",
                  description: `Le modifiche sono state apportate.`,
                  duration: 2000,
                });
              }
            }}>
              Aggiorna Account
            </Button>
          </Card>

          {/* Impostazioni Sicurezza */}
          <Card className="p-6 border-primary/30">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-accent" />
              <h2 className="text-xl font-bold text-accent">Impostazioni Sicurezza</h2>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-primary font-medium">Autenticazione a Due Fattori</h3>
                  <p className="text-muted-foreground text-sm">Aggiungi un ulteriore livello di sicurezza al tuo account</p>
                </div>
                <Switch onCheckedChange={nonImplementato} />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-primary font-medium">Notifiche di Accesso</h3>
                  <p className="text-muted-foreground text-sm">Ricevi una notifica quando qualcuno accede al tuo account</p>
                </div>
                {/*defaultChecked*/}
                <Switch onCheckedChange={nonImplementato} />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-primary font-medium">Timeout Sessione</h3>
                  <p className="text-muted-foreground text-sm">Disconnessione automatica dopo un periodo di inattività</p>
                </div>
                <Switch onCheckedChange={nonImplementato} />
              </div>
            </div>
          </Card>

          {/* Preferenze Notifiche */}
          <Card className="p-6 border-primary/30">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-6 h-6 text-accent" />
              <h2 className="text-xl font-bold text-accent">Preferenze Notifiche</h2>
            </div>
            
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-primary font-medium">Aggiornamenti Stato Server</h3>
                  <p className="text-muted-foreground text-sm">Ricevi notifiche quando i tuoi server vanno online/offline</p>
                </div>
                <Switch onCheckedChange={nonImplementato} />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-primary font-medium">Avvisi di Manutenzione</h3>
                  <p className="text-muted-foreground text-sm">Ricevi notifiche sulla manutenzione programmata</p>
                </div>
                <Switch onCheckedChange={nonImplementato} />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-primary font-medium">Promemoria Fatturazione</h3>
                  <p className="text-muted-foreground text-sm">Ricevi promemoria per i pagamenti imminenti</p>
                </div>
                <Switch onCheckedChange={nonImplementato} />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-primary font-medium">Email Marketing</h3>
                  <p className="text-muted-foreground text-sm">Ricevi aggiornamenti su nuove funzionalità e offerte</p>
                </div>
                <Switch onCheckedChange={nonImplementato} />
              </div>
            </div>
          </Card>

          {/* Zona Pericolo */}
          <Card className="p-6 border-destructive/50 bg-destructive/5">
            <div className="flex items-center gap-3 mb-6">
              <Shield className="w-6 h-6 text-destructive" />
              <h2 className="text-xl font-bold text-destructive">Zona Pericolo</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-primary font-medium mb-2">Elimina Account</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Questa azione non può essere annullata. Eliminerà permanentemente il tuo account e tutti i tuoi server.
                </p>
                <Button variant="destructive">
                  Elimina Account
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Settings;