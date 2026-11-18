import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Server, Settings, LogOut, BarChart3, CreditCard, CheckCircle, XCircle, Clock } from "lucide-react";
import Sidebar from "@/components/sidebar";
import { useEffect, useState } from "react";
import {getPayments} from '@/api/dashboard'

interface Payment {
  id: string;
  date: string;
  server_name: string;
  amount: string;
  status: "paid" | "pending" | "failed";
  method: string;
  invoice_url?: string;
}

const Payments = () => {
  const [payments, setPayments] = useState<Payment[]>([]);

  useEffect(() => {
    const paymentsfetch = async () => {
      const r = await getPayments();
      if(r.status){
        setPayments(r.message);
        console.log(r.message)
      }
    }
    paymentsfetch();

  },[])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return <Badge variant="secondary" className="bg-green-500/10 text-green-500 border-green-500/30">Pagato</Badge>;
      case "pending":
        return <Badge variant="secondary" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/30">In Attesa</Badge>;
      case "failed":
        return <Badge variant="destructive">Fallito</Badge>;
      default:
        return null;
    }
  };

  const totalPaid = payments
    .filter(p => p.status === "paid")
    .reduce((sum, p) => sum + parseFloat(p.amount.replace("€", "")), 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="ml-64 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-primary mb-2">Storico Pagamenti</h1>
          <p className="text-muted-foreground">Tutti i tuoi pagamenti e fatture</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="p-6 border-primary/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Totale Pagato</p>
                <p className="text-2xl font-bold text-primary">{totalPaid.toFixed(2)}€</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </Card>
          
          <Card className="p-6 border-primary/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Pagamenti Completati</p>
                <p className="text-2xl font-bold text-primary">{payments.filter(p => p.status === "paid").length}</p>
              </div>
              <CreditCard className="w-8 h-8 text-accent" />
            </div>
          </Card>
          
          <Card className="p-6 border-primary/30">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-sm">In Attesa</p>
                <p className="text-2xl font-bold text-primary">{payments.filter(p => p.status === "pending").length}</p>
              </div>
              <Clock className="w-8 h-8 text-yellow-500" />
            </div>
          </Card>
        </div>

        {/* Payments Table */}
        <Card className="border-primary/30">
          <div className="p-6">
            <h2 className="text-xl font-bold text-accent mb-6">Cronologia Pagamenti</h2>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID Pagamento</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead>Server</TableHead>
                  <TableHead>Importo</TableHead>
                  <TableHead>Metodo</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payments.map((payment) => (
                  <TableRow key={payment.id}>
                    <TableCell className="font-medium text-primary">{payment.id}</TableCell>
                    <TableCell className="text-muted-foreground">{payment.date}</TableCell>
                    <TableCell className="text-accent">{payment.server_name}</TableCell>
                    <TableCell className="font-medium text-primary">{payment.amount}</TableCell>
                    <TableCell className="text-muted-foreground">{payment.method}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(payment.status)}
                        {getStatusBadge(payment.status)}
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

export default Payments;