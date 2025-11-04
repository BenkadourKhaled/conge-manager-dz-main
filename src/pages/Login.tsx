import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Building2, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Lock, User, ArrowRight, Loader2, Shield, CheckCircle2 } from 'lucide-react';
export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedField, setFocusedField] = useState(null);
  const [mounted, setMounted] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    setMounted(true);
  }, []);

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
      <div className="min-h-screen relative bg-gradient-to-br from-blue-50 via-indigo-50 to-cyan-50 flex items-center justify-center p-4 overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div
              className="absolute -top-1/4 -left-1/4 w-96 h-96 bg-gradient-to-br from-blue-400/30 to-indigo-400/30 rounded-full blur-3xl"
              style={{ animation: 'float 20s ease-in-out infinite' }}
          ></div>
          <div
              className="absolute -bottom-1/4 -right-1/4 w-96 h-96 bg-gradient-to-tl from-cyan-400/30 to-blue-400/30 rounded-full blur-3xl"
              style={{ animation: 'float 25s ease-in-out infinite reverse' }}
          ></div>
          <div
              className="absolute top-1/2 left-1/2 w-64 h-64 bg-gradient-to-r from-indigo-400/20 to-blue-400/20 rounded-full blur-3xl transform -translate-x-1/2 -translate-y-1/2"
              style={{ animation: 'pulse 15s ease-in-out infinite' }}
          ></div>
        </div>

        {/* Subtle grid pattern */}
        <div
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: 'radial-gradient(circle, #3b82f6 1px, transparent 1px)',
              backgroundSize: '40px 40px',
            }}
        ></div>

        <style>{`
        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(30px, -30px) rotate(120deg); }
          66% { transform: translate(-20px, 20px) rotate(240deg); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .trust-badge {
          animation: fadeIn 1s ease-out 0.5s both;
        }
      `}</style>

        {/* Main Content Container */}
        <div
            className={`relative z-10 w-full max-w-6xl transition-all duration-1000 ${
                mounted ? 'opacity-100' : 'opacity-0'
            }`}
        >
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
            {/* Left Side - Branding & Info */}
            <div className="hidden lg:block space-y-8">
              {/* Logo & Brand */}
              <div className="space-y-6">
                <div className="inline-flex items-center gap-4 bg-white/60 backdrop-blur-sm rounded-2xl px-6 py-4 shadow-lg border border-blue-100">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl blur-lg opacity-50"></div>
                    <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 p-3 rounded-xl">
                      <Shield className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-800">CNAS</h1>
                    <p className="text-sm text-gray-600">Agence de Constantine</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h2 className="text-5xl font-bold text-gray-800 leading-tight">
                    Système de Gestion
                    <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                    des Congés
                  </span>
                  </h2>
                  <p className="text-lg text-gray-600 leading-relaxed">
                    Plateforme sécurisée et moderne pour la gestion des congés annuels
                  </p>
                </div>
              </div>


            </div>

            {/* Right Side - Login Form */}
            <div className="relative">
              {/* Mobile Logo */}
              <div className="lg:hidden flex justify-center mb-8">
                <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-2xl px-5 py-3 shadow-lg border border-blue-100">
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg blur-md opacity-50"></div>
                    <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 p-2 rounded-lg">
                      <Shield className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-gray-800">CNAS Constantine</h1>
                  </div>
                </div>
              </div>

              {/* Login Card */}
              <div className="relative group">
                {/* Ambient glow */}
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500 rounded-3xl blur-2xl opacity-20 group-hover:opacity-30 transition-all duration-500"></div>

                {/* Card */}
                <div className="relative bg-white/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden">
                  {/* Top accent bar */}
                  <div className="h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500"></div>

                  <div className="p-8 sm:p-10">
                    {/* Header */}
                    <div className="text-center mb-8">
                      <h2 className="text-3xl font-bold text-gray-800 mb-2">
                        Connexion
                      </h2>
                      <p className="text-gray-600">
                        Accédez à votre espace personnel
                      </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                      {/* Username Field */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <User className="w-4 h-4 text-blue-600" />
                          Nom d'utilisateur
                        </label>
                        <div className="relative group/input">
                          <div className={`absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl opacity-0 blur transition-all duration-300 ${
                              focusedField === 'username' ? 'opacity-30' : ''
                          }`}></div>
                          <input
                              type="text"
                              value={username}
                              onChange={(e) => setUsername(e.target.value)}
                              onFocus={() => setFocusedField('username')}
                              onBlur={() => setFocusedField(null)}
                              disabled={isLoading}
                              placeholder="Entrez votre nom d'utilisateur"
                              className="relative w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <User className={`w-5 h-5 transition-colors ${
                                focusedField === 'username' ? 'text-blue-600' : 'text-gray-400'
                            }`} />
                          </div>
                        </div>
                      </div>

                      {/* Password Field */}
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                          <Lock className="w-4 h-4 text-indigo-600" />
                          Mot de passe
                        </label>
                        <div className="relative group/input">
                          <div className={`absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-xl opacity-0 blur transition-all duration-300 ${
                              focusedField === 'password' ? 'opacity-30' : ''
                          }`}></div>
                          <input
                              type="password"
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              onFocus={() => setFocusedField('password')}
                              onBlur={() => setFocusedField(null)}
                              disabled={isLoading}
                              placeholder="Entrez votre mot de passe"
                              className="relative w-full px-4 py-4 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-800 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <Lock className={`w-5 h-5 transition-colors ${
                                focusedField === 'password' ? 'text-indigo-600' : 'text-gray-400'
                            }`} />
                          </div>
                        </div>
                      </div>

                      {/* Submit Button */}
                      <button
                          type="submit"

                          disabled={isLoading}
                          className="relative w-full group/btn overflow-hidden rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98] disabled:hover:scale-100 disabled:opacity-70"
                      >
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600"></div>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-500 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300"></div>
                        <div className="relative px-6 py-4 flex items-center justify-center gap-2 text-white font-semibold text-lg">
                          {isLoading ? (
                              <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Connexion en cours...
                              </>
                          ) : (
                              <>
                                Se connecter
                                <ArrowRight className="w-5 h-5 transition-transform group-hover/btn:translate-x-1" />
                              </>
                          )}
                        </div>
                      </button>
                    </form>

                    {/* Footer */}
                    <div className="mt-8 pt-6 border-t border-gray-200">
                      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
                        <Shield className="w-4 h-4 text-blue-600" />
                        <span>Connexion sécurisée par SSL</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Info */}
              <div className="mt-6 text-center space-y-1">
                <p className="text-sm text-gray-600">
                  Système de gestion des congés annuels
                </p>
                <p className="text-xs text-gray-500">
                  © 2025 CNAS Constantine - Tous droits réservés
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
  );
}