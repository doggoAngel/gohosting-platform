import {LogOut} from "lucide-react";


export function Logout() {
    const handleLogout = () => {
        localStorage.removeItem("token");
        window.location.href = "/"; // Redirect to login page
    };

    const base =
    "flex items-center gap-3 p-3 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10";


    return (
        <div className="logout-container">
            <button onClick={handleLogout} className={`${base} w-full text-left`}>
                <LogOut className="w-5 h-5" />
                Logout
            </button>
        </div>
    );
}