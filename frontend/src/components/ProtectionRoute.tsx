import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { URL } from "../api/common";

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const [role, setRole] = useState<null | "admin" | "user" | "unauthorized">(null);
  const token = localStorage.getItem("token");
  const location = useLocation();

  useEffect(() => {
    const checkToken = async () => {
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

    checkToken();
  }, [token]);

  if (role === null) return null;

  if (role === "unauthorized") return <Navigate to="/login" replace />;

  // Se l'utente è admin e sta cercando di accedere a una route da utente
  if (role === "admin" && location.pathname === "/dashboard") {
    return <Navigate to="/admin-dashboard" replace />;
  }

  // Se l'utente è user e sta cercando di accedere a una route da admin
  if (role === "user" && location.pathname === "/admin-dashboard") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};
export default ProtectedRoute;