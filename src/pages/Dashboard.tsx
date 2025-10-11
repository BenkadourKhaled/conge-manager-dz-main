import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import {
  Users,
  UserCheck,
  Calendar,
  Award,
  Building2,
  Briefcase,
  TrendingUp,
  AlertCircle,
  Clock,
} from 'lucide-react';
import { dashboardApi, employesApi } from '@/api/services';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';

interface DashboardStats {
  totalEmployes: number;
  employesActifs: number;
  employesEnConge: number;
  demandesEnAttente: number;
  beneficiairesICA: number;
  totalSousDirections: number;
  totalServices: number;
}

interface Employe {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  nomComplet: string;
  statut: 'ACTIF' | 'SUSPENDU' | 'MALADIE' | 'SUSPENDU_TEMPORAIREMENT';
  fonction: string;
  serviceNom?: string;
}

const statutColors = {
  ACTIF: 'bg-success',
  SUSPENDU: 'bg-destructive',
  MALADIE: 'bg-warning',
  SUSPENDU_TEMPORAIREMENT: 'bg-secondary',
};

export default function Dashboard() {
  const navigate = useNavigate();

  const { data: statsData, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStatistics(),
    refetchInterval: 30000,
  });

  const { data: employesData } = useQuery({
    queryKey: ['employes-dashboard'],
    queryFn: () => employesApi.getAll(),
    refetchInterval: 30000,
  });

  const stats = statsData?.data?.data as DashboardStats;
  const employes = (employesData?.data?.data || []) as Employe[];
  const recentEmployes = employes.slice(0, 3);

  // Statistiques par statut
  const employesParStatut = employes.reduce((acc, emp) => {
    acc[emp.statut] = (acc[emp.statut] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const tauxActivite = stats?.totalEmployes
    ? Math.round((stats.employesActifs / stats.totalEmployes) * 100)
    : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement...</p>
        </div>
      </div>
    );
  }

  const mainStats = [
    {
      title: 'Employés',
      value: stats?.totalEmployes || 0,
      change: `${stats?.employesActifs || 0} actifs`,
      icon: Users,
      gradient: 'from-blue-500 to-blue-600',
      onClick: () => navigate('/employes'),
    },
    {
      title: 'En Congé',
      value: stats?.employesEnConge || 0,
      change: 'actuellement',
      icon: Calendar,
      gradient: 'from-amber-500 to-orange-500',
      onClick: () => navigate('/demandes-conges'),
    },
    {
      title: 'En Attente',
      value: stats?.demandesEnAttente || 0,
      change: 'demandes',
      icon: AlertCircle,
      gradient: 'from-purple-500 to-pink-500',
      onClick: () => navigate('/demandes-conges'),
    },
    {
      title: 'ICA Éligibles',
      value: stats?.beneficiairesICA || 0,
      change: 'bénéficiaires',
      icon: Award,
      gradient: 'from-emerald-500 to-teal-500',
      onClick: () => navigate('/ica'),
    },
  ];

  const secondaryStats = [
    {
      label: 'Sous-Directions',
      value: stats?.totalSousDirections || 0,
      icon: Building2,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      label: 'Services',
      value: stats?.totalServices || 0,
      icon: Briefcase,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
    },
    {
      label: "Taux d'activité",
      value: `${tauxActivite}%`,
      icon: TrendingUp,
      color: 'text-cyan-600',
      bg: 'bg-cyan-50',
    },
  ];

  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden p-2 sm:p-3 lg:p-4 flex flex-col gap-2 sm:gap-3">
      {/* Header */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
            Tableau de Bord
          </h1>
          <p className="text-[10px] sm:text-xs text-muted-foreground">
            CNAS Constantine - Gestion des Congés
          </p>
        </div>
        <div className="flex items-center gap-2 text-[10px] sm:text-xs text-muted-foreground">
          <Clock className="h-3 w-3" />
          <span className="hidden lg:inline">
            {new Date().toLocaleDateString('fr-FR', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
          <span className="lg:hidden">
            {new Date().toLocaleDateString('fr-FR', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </span>
        </div>
      </div>

      {/* Main Stats - 4 cards */}
      <div className="flex-shrink-0 grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        {mainStats.map((stat, index) => (
          <Card
            key={index}
            className="relative overflow-hidden cursor-pointer group hover:shadow-lg transition-all duration-300"
            onClick={stat.onClick}
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}
            ></div>
            <div className="p-2 sm:p-3 relative">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase tracking-wider truncate">
                    {stat.title}
                  </p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground mt-0.5">
                    {stat.value}
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground mt-0.5 truncate">
                    {stat.change}
                  </p>
                </div>
                <div
                  className={`p-1.5 sm:p-2 rounded-lg bg-gradient-to-br ${stat.gradient} group-hover:scale-110 transition-transform duration-300 flex-shrink-0`}
                >
                  <stat.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-white" />
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Content Grid - 3 columns */}
      <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-2 sm:gap-3">
        {/* Left Column - Employés récents */}
        <div className="lg:col-span-4 flex flex-col min-h-0">
          <Card className="p-2 sm:p-3 flex-1 flex flex-col min-h-0">
            <h3 className="text-xs sm:text-sm font-semibold text-foreground mb-2 flex-shrink-0">
              Employés Récents
            </h3>
            <div className="flex-1 min-h-0 overflow-auto space-y-1.5 sm:space-y-2">
              {recentEmployes.map((emp) => (
                <div
                  key={emp.id}
                  className="flex items-center gap-2 p-1.5 sm:p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate('/employes')}
                >
                  <div className="flex-shrink-0">
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                      <span className="text-[10px] sm:text-xs font-semibold text-white">
                        {emp.nom[0]}
                        {emp.prenom[0]}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                      {emp.nomComplet}
                    </p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground truncate">
                      {emp.matricule} • {emp.fonction}
                    </p>
                  </div>
                  <div
                    className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full ${
                      statutColors[emp.statut]
                    } flex-shrink-0`}
                  ></div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Middle Column - Stats & Activity */}
        <div className="lg:col-span-5 flex flex-col gap-2 sm:gap-3 min-h-0">
          {/* Secondary Stats */}
          <div className="flex-shrink-0 grid grid-cols-3 gap-2">
            {secondaryStats.map((stat, i) => (
              <Card key={i} className="p-2 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] sm:text-[10px] text-muted-foreground mb-0.5 truncate">
                      {stat.label}
                    </p>
                    <p className="text-base sm:text-lg lg:text-xl font-bold text-foreground">
                      {stat.value}
                    </p>
                  </div>
                  <div className={`${stat.bg} p-1 sm:p-1.5 rounded-lg self-start sm:self-center flex-shrink-0`}>
                    <stat.icon className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${stat.color}`} />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Répartition par statut */}
          <Card className="p-2 sm:p-3 flex-1 flex flex-col min-h-0">
            <h3 className="text-xs sm:text-sm font-semibold text-foreground mb-2 flex-shrink-0">
              Répartition par Statut
            </h3>
            <div className="flex-1 min-h-0 overflow-auto space-y-2">
              {[
                { key: 'ACTIF', label: 'Actifs', color: 'bg-success' },
                { key: 'MALADIE', label: 'En Maladie', color: 'bg-warning' },
                {
                  key: 'SUSPENDU',
                  label: 'Suspendus',
                  color: 'bg-destructive',
                },
                {
                  key: 'SUSPENDU_TEMPORAIREMENT',
                  label: 'Susp. Temp.',
                  color: 'bg-secondary',
                },
              ].map(({ key, label, color }) => {
                const count = employesParStatut[key] || 0;
                const percentage = stats?.totalEmployes
                  ? Math.round((count / stats.totalEmployes) * 100)
                  : 0;
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between text-[10px] sm:text-xs mb-1">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-semibold text-foreground">
                        {count} ({percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-muted rounded-full h-1 sm:h-1.5">
                      <div
                        className={`h-1 sm:h-1.5 rounded-full ${color} transition-all duration-500`}
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Activité Récente */}
          <Card className="p-2 sm:p-3 flex-shrink-0">
            <h3 className="text-xs sm:text-sm font-semibold text-foreground mb-2">
              Activité Récente
            </h3>
            <div className="space-y-1.5 sm:space-y-2">
              <div className="flex items-start gap-2">
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-success mt-1 flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs font-medium text-foreground truncate">
                    Demande approuvée
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground">Il y a 2h</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-warning mt-1 flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs font-medium text-foreground truncate">
                    Nouvelle demande
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground">Il y a 5h</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full bg-primary mt-1 flex-shrink-0"></div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] sm:text-xs font-medium text-foreground truncate">
                    Employé ajouté
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground">Il y a 1j</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Column - ICA & Performance */}
        <div className="lg:col-span-3 flex flex-col gap-2 sm:gap-3 min-h-0">
          {/* ICA Card */}
          <Card className="p-2 sm:p-3 bg-gradient-to-br from-emerald-500 to-teal-500 text-white flex-shrink-0">
            <div className="flex flex-col justify-between h-full">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <h3 className="text-xs sm:text-sm font-semibold">Prime ICA</h3>
                </div>
                <p className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1">
                  {stats?.beneficiairesICA || 0}
                </p>
                <p className="text-[10px] sm:text-xs opacity-90">
                  Employés éligibles cette année
                </p>
              </div>
              <button
                onClick={() => navigate('/ica')}
                className="mt-2 w-full py-1.5 px-2 bg-white/20 hover:bg-white/30 rounded-lg text-[10px] sm:text-xs font-medium transition-colors backdrop-blur-sm"
              >
                Consulter le suivi complet
              </button>
            </div>
          </Card>

          {/* Performance Card */}
          <Card className="p-2 sm:p-3 flex-1 flex flex-col min-h-0">
            <h3 className="text-xs sm:text-sm font-semibold text-foreground mb-2 flex-shrink-0">
              Performance
            </h3>
            <div className="flex-1 flex flex-col justify-center space-y-2 sm:space-y-3">
              <div className="text-center">
                <div className="relative w-20 h-20 sm:w-24 sm:h-24 mx-auto">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="50%"
                      cy="50%"
                      r="42%"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="none"
                      className="text-muted"
                    />
                    <circle
                      cx="50%"
                      cy="50%"
                      r="42%"
                      stroke="currentColor"
                      strokeWidth="6"
                      fill="none"
                      strokeDasharray={`${2 * Math.PI * 40}`}
                      strokeDashoffset={`${
                        2 * Math.PI * 40 * (1 - tauxActivite / 100)
                      }`}
                      className="text-success transition-all duration-1000"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground">
                        {tauxActivite}%
                      </p>
                      <p className="text-[9px] sm:text-[10px] text-muted-foreground">
                        Activité
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-1.5 sm:gap-2 text-center">
                <div className="p-1.5 sm:p-2 bg-muted rounded-lg">
                  <p className="text-sm sm:text-base lg:text-lg font-bold text-success">
                    {stats?.employesActifs || 0}
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground">Actifs</p>
                </div>
                <div className="p-1.5 sm:p-2 bg-muted rounded-lg">
                  <p className="text-sm sm:text-base lg:text-lg font-bold text-muted-foreground">
                    {(stats?.totalEmployes || 0) - (stats?.employesActifs || 0)}
                  </p>
                  <p className="text-[9px] sm:text-[10px] text-muted-foreground">Inactifs</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Quick Actions */}
          <Card className="p-2 sm:p-3 flex-shrink-0">
            <h3 className="text-xs sm:text-sm font-semibold text-foreground mb-2">
              Actions Rapides
            </h3>
            <div className="space-y-1.5 sm:space-y-2">
              <button
                onClick={() => navigate('/employes')}
                className="w-full py-1.5 px-2 bg-primary/10 hover:bg-primary/20 text-primary rounded-lg text-[10px] sm:text-xs font-medium transition-colors text-left"
              >
                → Voir tous les employés
              </button>
              <button
                onClick={() => navigate('/demandes-conges')}
                className="w-full py-1.5 px-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 rounded-lg text-[10px] sm:text-xs font-medium transition-colors text-left"
              >
                → Gérer les demandes
              </button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
