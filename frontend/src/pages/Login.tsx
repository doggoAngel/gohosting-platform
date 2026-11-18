import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Server, Mail, Lock, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import {Auth, Register} from "../api/auth"; // Adjust the import path as necessary
import { toast } from "@/hooks/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { Toast } from "@radix-ui/react-toast";


const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    Auth({ email, password })
      .then((result) => {
        if (result.success) {
          navigate(result.page);
        } else {
          alert(result.error || "Errore durante l'accesso");
        }
      })
      .catch((error) => {
        console.error("Login error:", error);
        alert("Si è verificato un errore durante l'accesso");
      });
    setEmail("");
    setPassword("");
    setName("");
    setConfirmPassword("");
  



  };

  const handleRegister =  async (e: React.FormEvent) => {
    e.preventDefault();
    // Mock registration - in a real app this would call your auth API

    if (password !== confirmPassword){
      toast({
        title: "Registrazione fallita",
        description: `La conferma della password non corrisponde.`,
        duration: 3000,
      })
      return;
    }

    const registrationData = { name_complete:name, email:email, password:password };
    
    const result = await Register(registrationData);
    if (result.success) {
      toast({
        title: "Registrazione avvenuta con successo",
        description: `Registrazione effettuata.`,
        duration: 3000
      });
      console.log(result)
      navigate(result.page);
    }else{
      toast({
        title: "Registrazione fallita",
        description: `Errore durante la registrazione`,
        duration: 3000,
      })
    }
    
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <Toaster />
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-accent flex items-center justify-center">
              <Server className="w-6 h-6" />
            </div>
            <h1 className="text-3xl font-bold text-primary">GoHosting.space</h1>
          </div>
          <p className="text-muted-foreground">Accedi al tuo pannello di controllo</p>
        </div>

        <Card className="p-6 border-2 border-primary/30">
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="login">Accedi</TabsTrigger>
              <TabsTrigger value="register">Registrati</TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="la-tua-email@esempio.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="La tua password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" variant="cyber" className="w-full">
                  Accedi
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="register">
              <form onSubmit={handleRegister} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome completo</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="name"
                      type="text"
                      placeholder="Il tuo nome"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="reg-email"
                      type="email"
                      placeholder="la-tua-email@esempio.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="reg-password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="reg-password"
                      type="password"
                      placeholder="Crea una password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Conferma Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="Conferma la password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <Button type="submit" variant="accent" className="w-full">
                  Registrati
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center">
            <Link to="/" className="text-sm text-muted-foreground hover:text-primary">
              ← Torna alla homepage
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Login;