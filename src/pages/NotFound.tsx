import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-6">
        <h1 className="text-6xl font-bold text-foreground">404</h1>
        <p className="text-xl text-muted-foreground">Page non trouvée</p>
        <p className="text-muted-foreground">La page que vous recherchez n'existe pas.</p>
        <Link to="/dashboard">
          <Button className="gap-2">
            <Home className="h-4 w-4" />
            Retour au Tableau de Bord
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
