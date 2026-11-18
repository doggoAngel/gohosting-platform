import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Server, BarChart3, CreditCard, Settings } from "lucide-react";
import { Logout } from "./logout"; // Adjust the import path as necessary

const Sidebar: React.FC = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Rimuovi il token JWT (adatta la chiave se diversa)
    localStorage.removeItem("token");
    // Reindirizza alla home (o /login)
    navigate("/", { replace: true });
  };

  const base =
    "flex items-center gap-3 p-3 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10";
  const active = "bg-primary/10 text-primary border border-primary/30";

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `${base} ${isActive ? active : ""}`;

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-card border-r border-primary/30 p-6">
      {/* Header brand */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 rounded-full bg-gradient-accent flex items-center justify-center">
          <Server className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-primary font-bold text-lg">GoHosting.space</h1>
          <p className="text-muted-foreground text-sm">Root Access</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="space-y-2">
        <NavLink to="/dashboard" className={linkClass}>
          <BarChart3 className="w-5 h-5" />
          Dashboard
        </NavLink>

        <NavLink to="/servers" className={linkClass}>
          <Server className="w-5 h-5" />
          Servers
        </NavLink>

        <NavLink to="/payments" className={linkClass}>
          <CreditCard className="w-5 h-5" />
          Pagamenti
        </NavLink>

        <NavLink to="/settings" className={linkClass}>
          <Settings className="w-5 h-5" />
          Settings
        </NavLink>

        <Logout></Logout>
      </nav>
    </div>
  );
};

export default Sidebar;
