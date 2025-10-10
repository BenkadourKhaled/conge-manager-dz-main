import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Building2 } from 'lucide-react';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      await login(username, password);
      toast({
        title: "Connexion réussie",
        description: "Bienvenue dans le système de gestion des congés",
      });
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        title: "Erreur de connexion",
        description: error.response?.data?.message || "Identifiants invalides",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-primary mb-4">
              <Building2 className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Gestion des Congés</h1>
            <p className="mt-2 text-muted-foreground">CNAS - Agence de Constantine</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-foreground mb-2">
                  Nom d'utilisateur
                </label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Entrez votre nom d'utilisateur"
                  disabled={isLoading}
                  className="w-full"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-foreground mb-2">
                  Mot de passe
                </label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Entrez votre mot de passe"
                  disabled={isLoading}
                  className="w-full"
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Connexion...' : 'Se connecter'}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground">
            <p>Système de gestion des congés annuels</p>
            <p className="mt-1">© 2025 CNAS Constantine</p>
          </div>
        </div>
      </div>

      {/* Right side - Illustration */}
      <div className="hidden lg:flex flex-1 bg-gradient-primary items-center justify-center p-8">
        <div className="max-w-md text-center space-y-6">
          <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-2xl p-8">
            <h2 className="text-3xl font-bold text-primary-foreground mb-4">
              Bienvenue au système de gestion des congés
            </h2>
            <p className="text-primary-foreground/90 text-lg">
              Gérez efficacement les demandes de congés, suivez les historiques et assurez l'éligibilité ICA de vos employés.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-primary-foreground">
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl font-bold mb-1">100+</div>
              <div className="text-sm">Employés</div>
            </div>
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl font-bold mb-1">500+</div>
              <div className="text-sm">Demandes</div>
            </div>
            <div className="bg-primary-foreground/10 backdrop-blur-sm rounded-lg p-4">
              <div className="text-2xl font-bold mb-1">95%</div>
              <div className="text-sm">Satisfaction</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
