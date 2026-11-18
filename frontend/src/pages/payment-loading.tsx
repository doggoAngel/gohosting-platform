import { useEffect } from "react";
import { Loader2, CreditCard, Shield } from "lucide-react";
import { useLocation } from "react-router-dom";
import { URL } from "@/api/common";

const PaymentLoading = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const sessionId = queryParams.get("session_id");
  console.log("Session ID:", sessionId);

  useEffect(() => {
    const timer = setTimeout(async () => {
      // Effettua la chiamata POST dopo 2 secondi
      if (sessionId) {
        await fetch(URL+"success", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": "Bearer " + localStorage.getItem("token"),
          },
          body: JSON.stringify({ session_id: sessionId }),
        })
          .then((response) => {
            if (!response.ok) {
              throw new Error("Errore nella richiesta");
            }
            return response.json();
          })
          .then((data) => {
            console.log("Risposta dal server:", data);
            window.location.href = "/dashboard"; // Reindirizza alla dashboard
          })
          .catch((error) => {
            console.error("Errore nella fetch:", error);
          });
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [sessionId]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-cyber opacity-30" />
      <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />

      {/* Main Content */}
      <div className="relative z-10 text-center max-w-md mx-auto p-8">
        {/* Logo/Icon Area */}
        <div className="mb-8 relative">
          <div className="w-24 h-24 mx-auto bg-card border border-primary/30 rounded-xl flex items-center justify-center mb-4 shadow-cyber">
            <CreditCard className="w-12 h-12 text-primary" />
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-accent rounded-full flex items-center justify-center shadow-accent">
            <Shield className="w-4 h-4 text-accent-foreground" />
          </div>
        </div>

        {/* Loading Animation */}
        <div className="mb-8">
          <Loader2 className="w-16 h-16 text-primary mx-auto animate-spin mb-4" />
          <div className="flex justify-center space-x-2 mb-4">
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce" />
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce delay-100" />
            <div className="w-3 h-3 bg-primary rounded-full animate-bounce delay-200" />
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-primary mb-2">
            Elaborazione Pagamento
          </h1>
          <p className="text-muted-foreground text-lg">
            Il tuo pagamento è in corso di elaborazione...
          </p>
          <p className="text-sm text-muted-foreground/80">
            Non chiudere questa finestra. Verrai reindirizzato automaticamente.
          </p>
        </div>

        {/* Security Badge */}
        <div className="mt-8 p-4 bg-card/50 border border-primary/20 rounded-lg backdrop-blur-sm">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <Shield className="w-4 h-4 text-accent" />
            <span>Pagamento sicuro elaborato da Stripe</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentLoading;
