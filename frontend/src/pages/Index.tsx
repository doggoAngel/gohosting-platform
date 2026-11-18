import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Server, Cpu, HardDrive, Zap, CheckCircle, Shield, Wifi, Clock } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import getTypes from "@/api/common";
import { URL } from "@/api/common";

interface Plan {
  name: string;
  price: string;
  ram: string;
  cores: string;
  storage: string;
  features: string[];
}

const Index = () => {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [role, setRole] = useState<null | "admin" | "user" | "unauthorized">(null);
  const pricingSectionRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  useEffect(() => {
    const fetchServerTypes = async () => {
      const serverData = await getTypes();
      if (serverData) {
        const formattedPlans = Object.entries(serverData).map(([name, details]) => ({
          name,
          ...details
        }));
        setPlans(formattedPlans);
      }
    };

    const checkToken = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setRole("unauthorized");
        return;
      }

      try {
        const response = await fetch(URL + "check-token", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.status === 200) {
          const data = await response.json();
          setRole(data.role === "admin" ? "admin" : "user");
        } else {
          setRole("unauthorized");
        }
      } catch (error) {
        console.error("Errore durante la verifica del token:", error);
        setRole("unauthorized");
      }
    };

    fetchServerTypes();
    checkToken();
  }, []);

  // Effetto per gestire lo scrolling quando c'è un hash nell'URL
  useEffect(() => {
    if (location.hash === '#pricing' && pricingSectionRef.current) {
      setTimeout(() => {
        pricingSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }
  }, [location]);

  // Funzione per gestire il click sul pulsante "Vedi Prezzi"
  const handleScrollToPricing = () => {
    if (pricingSectionRef.current) {
      pricingSectionRef.current.scrollIntoView({ behavior: 'smooth' });
      // Aggiorna l'URL con l'hash
      window.history.pushState(null, '', '#pricing');
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-primary/5 rounded-full blur-3xl animate-pulse" />
      <div className="absolute top-40 right-20 w-48 h-48 bg-accent/5 rounded-full blur-3xl animate-pulse delay-1000" />
      <div className="absolute bottom-20 left-1/3 w-64 h-64 bg-cyberpunk-pink/5 rounded-full blur-3xl animate-pulse delay-500" />
      
      {/* Header */}
      <header className="border-b border-primary/30 bg-card/50 backdrop-blur-sm sticky top-0 z-50 animate-fade-in">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-full bg-gradient-accent flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
                <Server className="w-5 h-5 transition-colors duration-300" />
              </div>
              <h1 className="text-2xl font-bold text-primary transition-colors duration-300 group-hover:text-accent">GoHosting.space</h1>
            </div>
            
            {role === "admin" && (
              <Link to="/admin-dashboard">
                <Button variant="outline" className="hover-scale">Dashboard Admin</Button>
              </Link>
            )}
            {role === "user" && (
              <Link to="/dashboard">
                <Button variant="outline" className="hover-scale">Dashboard</Button>
              </Link>
            )}
            {role === "unauthorized" && (
              <Link to="/login">
                <Button variant="outline" className="hover-scale">Login</Button>
              </Link>
            )}
            {role === null && (
              <Button variant="outline" disabled>
                Caricamento...
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="py-20 text-center relative overflow-hidden">
        {/* Enhanced Background Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-25 animate-pulse"
          style={{ backgroundImage: `url(/lovable-uploads/5597045b-200d-4975-8597-4c206e5a91fa.png)` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/40 to-background" />
        
        {/* Floating particles effect */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full animate-bounce delay-100" />
        <div className="absolute top-1/3 right-1/3 w-1 h-1 bg-accent rounded-full animate-bounce delay-300" />
        <div className="absolute bottom-1/3 left-1/2 w-1.5 h-1.5 bg-cyberpunk-pink rounded-full animate-bounce delay-700" />
        
        <div className="container mx-auto px-6 relative z-10">
          <div className="mb-6 animate-fade-in">
            <Badge variant="outline" className="bg-gradient-cyber border-primary text-primary px-6 py-3 text-lg hover-scale shadow-cyber">
              <Server className="w-5 h-5 mr-2 animate-pulse" />
              GoHosting.space
            </Badge>
          </div>
          
          <h2 className="text-6xl md:text-7xl font-bold text-primary mb-8 bg-gradient-primary bg-clip-text text-transparent animate-fade-in delay-200 leading-tight">
            Hosting dedicato
            <br />
            <span className="text-accent">per Minecraft</span>
          </h2>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-12 max-w-4xl mx-auto animate-fade-in delay-300 leading-relaxed">
            Hosting infrastrutturale ed <span className="text-accent font-semibold">alte prestazioni</span> con gestione semplice tramite dashboard intuitiva, ideale per server Vanilla (l'installazione di mod e plugin non sono ancora disponibili). 
            <span className="text-primary font-semibold">Supporto tecnico garantito per un'esperienza a zero stress.</span>
             
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in delay-500">
            <Link to="/dashboard">
              <Button size="lg" className="px-8 py-4 text-lg hover-scale shadow-cyber bg-gradient-primary border-0">
                <Zap className="w-5 h-5 mr-2" />
                Inizia Ora
              </Button>
            </Link>
            <Button 
              onClick={handleScrollToPricing}
              variant="outline" 
              size="lg" 
              className="px-8 py-4 text-lg hover-scale"
            >
              Vedi Prezzi
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 animate-fade-in">
            <h3 className="text-4xl md:text-5xl font-bold text-primary mb-6 bg-gradient-primary bg-clip-text text-transparent">
              Perché scegliere GoHosting.space?
            </h3>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto">
              L'infrastruttura più avanzata per il tuo server Minecraft
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {[
              {
                icon: Shield,
                title: "Sicurezza Totale",
                description: "Protezione DDoS avanzata e backup automatici per mantenere i tuoi dati sempre al sicuro.",
                color: "text-primary"
              },
              {
                icon: Zap,
                title: "Performance Estreme",
                description: "CPU di ultima generazione e SSD NVMe per garantire zero lag ai tuoi giocatori.",
                color: "text-accent"
              },
              {
                icon: Clock,
                title: "Supporto 24/7",
                description: "Il nostro team di esperti è sempre disponibile per aiutarti in qualsiasi momento.",
                color: "text-cyberpunk-pink"
              }
            ].map((feature, index) => (
              <Card key={feature.title} className="p-8 border-2 border-primary/20 hover:border-primary/40 transition-all duration-500 hover:shadow-cyber hover-scale group animate-fade-in bg-gradient-to-br from-card/80 to-card/40 backdrop-blur-sm" style={{ animationDelay: `${index * 200}ms` }}>
                <div className="flex flex-col items-center text-center">
                  <div className={`w-16 h-16 rounded-full bg-gradient-accent flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110 ${feature.color}`}>
                    <feature.icon className="w-8 h-8" />
                  </div>
                  <h4 className="text-2xl font-bold text-primary mb-4 group-hover:text-accent transition-colors duration-300">
                    {feature.title}
                  </h4>
                  <p className="text-muted-foreground leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Plans - Aggiunto ref per lo scrolling */}
      <section id="pricing" ref={pricingSectionRef} className="py-20 relative">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16 animate-fade-in">
            <h3 className="text-4xl md:text-5xl font-bold text-primary mb-6 bg-gradient-primary bg-clip-text text-transparent">
              Piani Hosting Minecraft
            </h3>
            <p className="text-xl text-muted-foreground">
              Trova il piano perfetto per il tuo server
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-7xl mx-auto">
            {plans.map((plan, index) => (
              <Card key={plan.name} className={`p-8 border-2 transition-all duration-500 hover:shadow-cyber hover:border-primary hover:-translate-y-2 relative group animate-fade-in bg-gradient-to-br from-card/90 to-card/60 backdrop-blur-sm ${
                index === 2 ? "border-accent shadow-accent scale-105 bg-gradient-to-br from-accent/10 to-accent/5" : "border-primary/30"
              }`} style={{ animationDelay: `${index * 150}ms` }}>
                {index === 2 && (
                  <div className="absolute -top-6 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-accent text-accent-foreground px-6 py-2 text-sm font-bold shadow-accent animate-pulse">
                      🔥 PIÙ POPOLARE
                    </Badge>
                  </div>
                )}
                
                <div className="text-center mb-8">
                  <h4 className="text-3xl font-bold text-primary capitalize mb-4 group-hover:text-accent transition-colors duration-300">
                    {plan.name}
                  </h4>
                  <div className="relative">
                    <div className="text-5xl font-bold text-accent mb-2 group-hover:scale-110 transition-transform duration-300">
                      {plan.price}
                    </div>
                    <div className="text-muted-foreground text-lg">/ mese</div>
                  </div>
                </div>

                <div className="space-y-6 mb-8">
                  <div className="flex items-center gap-4 text-primary p-3 rounded-lg bg-primary/5 group-hover:bg-primary/10 transition-colors duration-300">
                    <Cpu className="w-6 h-6 text-accent flex-shrink-0" />
                    <span className="font-medium">{plan.ram}</span>
                  </div>
                  <div className="flex items-center gap-4 text-primary p-3 rounded-lg bg-accent/5 group-hover:bg-accent/10 transition-colors duration-300">
                    <Zap className="w-6 h-6 text-accent flex-shrink-0" />
                    <span className="font-medium">{plan.cores}</span>
                  </div>
                  <div className="flex items-center gap-4 text-primary p-3 rounded-lg bg-cyberpunk-pink/5 group-hover:bg-cyberpunk-pink/10 transition-colors duration-300">
                    <HardDrive className="w-6 h-6 text-accent flex-shrink-0" />
                    <span className="font-medium">{plan.storage}</span>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={feature} className="flex items-center gap-3 text-sm animate-fade-in" style={{ animationDelay: `${(index * 150) + (featureIndex * 50)}ms` }}>
                      <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                      <span className="text-muted-foreground">{feature}</span>
                    </div>
                  ))}
                </div>

                <Button 
                  variant={index === 2 ? "accent" : "cyber"} 
                  className="w-full py-4 text-lg hover-scale shadow-cyber group-hover:shadow-lg transition-all duration-300"
                  asChild
                >
                  <Link to="/dashboard" className="font-bold">
                    <Wifi className="w-5 h-5 mr-2" />
                    Acquista Ora
                  </Link>
                </Button>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Footer */}
      <footer className="border-t border-primary/30 py-16 mt-20 relative">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/5 to-transparent" />
        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="flex items-center justify-center gap-4 mb-6 group">
            <div className="w-12 h-12 rounded-full bg-gradient-accent flex items-center justify-center transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12">
              <Server className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold text-primary group-hover:text-accent transition-colors duration-300">GoHosting.space</span>
          </div>
          <p className="text-muted-foreground text-lg mb-4">
            © 2024 GoHosting.space. Hosting Minecraft ad alte prestazioni.
          </p>
          <p className="text-sm text-muted-foreground/80">
            Powered by cutting-edge technology and passion for gaming
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;