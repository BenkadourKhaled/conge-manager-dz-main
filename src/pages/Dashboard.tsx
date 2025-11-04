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
  UserPlus,
  CheckCircle2,
  FileText,
  ArrowUpRight,
  Activity,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import { dashboardApi, employesApi } from '@/api/services';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';

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

const statutConfig = {
  ACTIF: {
    label: 'Actifs',
    color: 'bg-emerald-500',
    lightBg: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    icon: CheckCircle2,
  },
  MALADIE: {
    label: 'En Maladie',
    color: 'bg-amber-500',
    lightBg: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    icon: AlertCircle,
  },
  SUSPENDU: {
    label: 'Suspendus',
    color: 'bg-rose-500',
    lightBg: 'bg-rose-50',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-200',
    icon: AlertCircle,
  },
  SUSPENDU_TEMPORAIREMENT: {
    label: 'Suspension Temporaire',
    color: 'bg-slate-500',
    lightBg: 'bg-slate-50',
    textColor: 'text-slate-700',
    borderColor: 'border-slate-200',
    icon: Clock,
  },
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

  const stats = statsData?.data as DashboardStats;
  const employes = (employesData?.data?.data || []) as Employe[];
  const recentEmployes = employes.slice(0, 5);

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
        <div className="flex items-center justify-center h-screen bg-gradient-to-br from-background to-muted/20">
          <div className="text-center space-y-4">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <Activity className="h-6 w-6 text-primary animate-pulse" />
              </div>
            </div>
            <div>
              <p className="text-lg font-semibold text-foreground">
                Chargement du tableau de bord
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Préparation de vos données...
              </p>
            </div>
          </div>
        </div>
    );
  }

  const mainStats = [
    {
      title: 'Total Employés',
      value: stats?.totalEmployes || 0,
      subtitle: `${stats?.employesActifs || 0} actifs`,
      icon: Users,
      gradient: 'from-blue-500 via-blue-600 to-indigo-600',
      trend: '+12%',
      onClick: () => navigate('/employes'),
    },
    {
      title: 'En Congé',
      value: stats?.employesEnConge || 0,
      subtitle: 'actuellement',
      icon: Calendar,
      gradient: 'from-amber-500 via-orange-500 to-red-500',
      trend: '+5%',
      onClick: () => navigate('/demandes-conges'),
    },
    {
      title: 'Demandes en Attente',
      value: stats?.demandesEnAttente || 0,
      subtitle: 'à traiter',
      icon: AlertCircle,
      gradient: 'from-purple-500 via-pink-500 to-rose-500',
      trend: '-3%',
      onClick: () => navigate('/demandes-conges'),
    },
    {
      title: 'Bénéficiaires ICA',
      value: stats?.beneficiairesICA || 0,
      subtitle: 'éligibles',
      icon: Award,
      gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
      trend: '+8%',
      onClick: () => navigate('/ica'),
    },
  ];

  const organizationStats = [
    {
      label: 'Sous-Directions',
      value: stats?.totalSousDirections || 0,
      icon: Building2,
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
      border: 'border-indigo-200',
    },
    {
      label: 'Services',
      value: stats?.totalServices || 0,
      icon: Briefcase,
      color: 'text-rose-600',
      bg: 'bg-rose-50',
      border: 'border-rose-200',
    },
    {
      label: "Taux d'Activité",
      value: `${tauxActivite}%`,
      icon: TrendingUp,
      color: 'text-cyan-600',
      bg: 'bg-cyan-50',
      border: 'border-cyan-200',
    },
  ];

  // Activités récentes fictives (à remplacer par de vraies données)
  const recentActivities = [
    {
      type: 'success',
      title: 'Demande de congé approuvée',
      description: 'Ahmed Benali - 15 jours',
      time: 'Il y a 2h',
      icon: CheckCircle2,
    },
    {
      type: 'warning',
      title: 'Nouvelle demande reçue',
      description: 'Fatima Zohra - En attente',
      time: 'Il y a 5h',
      icon: FileText,
    },
    {
      type: 'info',
      title: 'Employé ajouté',
      description: 'Mohamed Larbi - Service RH',
      time: 'Il y a 1j',
      icon: UserPlus,
    },
  ];

  return (
      <div className="h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-br from-background via-background to-muted/20 flex flex-col">
        <div className="flex-1 min-h-0 p-4 lg:p-6 flex flex-col">
          <div className="flex-1 min-h-0 flex flex-col gap-4">
            {/* Header - Compact */}
            <div className="flex-shrink-0 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/10 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Tableau de Bord
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    CNAS Constantine - Gestion RH
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>
                {new Date().toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
              </div>
            </div>

            {/* Main Stats - 4 cards avec animations */}
            <div className="flex-shrink-0 grid grid-cols-4 gap-3">
              {mainStats.map((stat, index) => (
                  <Card
                      key={index}
                      className="relative overflow-hidden cursor-pointer group hover:shadow-2xl transition-all duration-500 border-2 hover:border-primary/50"
                      onClick={stat.onClick}
                      style={{
                        animation: `fadeInUp 0.5s ease-out ${index * 0.1}s both`,
                      }}
                  >
                    {/* Gradient Background */}
                    <div
                        className={cn(
                            'absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500',
                            stat.gradient
                        )}
                    ></div>

                    {/* Decorative circles */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>
                    <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-white/5 rounded-full group-hover:scale-150 transition-transform duration-700"></div>

                    <div className="p-4 relative z-10">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <p className="text-xs font-semibold text-muted-foreground group-hover:text-white/80 uppercase tracking-wider mb-1">
                            {stat.title}
                          </p>
                          <div className="flex items-end gap-2">
                            <p className="text-3xl font-bold text-foreground group-hover:text-white transition-colors">
                              {stat.value}
                            </p>
                            <Badge
                                variant="secondary"
                                className="mb-1 text-xs group-hover:bg-white/20 group-hover:text-white"
                            >
                              {stat.trend}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground group-hover:text-white/70 mt-0.5">
                            {stat.subtitle}
                          </p>
                        </div>
                        <div
                            className={cn(
                                'p-2.5 rounded-xl bg-gradient-to-br shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all duration-500',
                                stat.gradient
                            )}
                        >
                          <stat.icon className="h-5 w-5 text-white" />
                        </div>
                      </div>

                      {/* Action indicator */}
                      <div className="flex items-center gap-2 text-xs text-muted-foreground group-hover:text-white/80">
                        <span>Voir détails</span>
                        <ArrowUpRight className="h-3 w-3 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                      </div>
                    </div>
                  </Card>
              ))}
            </div>

            {/* Content Grid */}
            <div className="flex-1 min-h-0 grid grid-cols-12 gap-3">
              {/* Left Column - Recent Employees */}
              <div className="col-span-4 flex flex-col gap-3 min-h-0">
                {/* Recent Employees Card */}
                <Card className="border-2 hover:border-primary/20 transition-colors flex-1 min-h-0 flex flex-col">
                  <div className="p-4 flex-1 min-h-0 flex flex-col">
                    <div className="flex items-center justify-between mb-3 flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <UserCheck className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-semibold text-foreground">
                          Employés Récents
                        </h3>
                      </div>
                      <Badge variant="secondary" className="font-semibold text-xs">
                        {employes.length}
                      </Badge>
                    </div>

                    <div className="flex-1 min-h-0 overflow-auto space-y-2 pr-1">
                      {recentEmployes.length > 0 ? (
                          recentEmployes.map((emp, index) => {
                            const StatutIcon = statutConfig[emp.statut]?.icon || CheckCircle2;
                            return (
                                <div
                                    key={emp.id}
                                    className="flex items-center gap-2 p-2 rounded-lg hover:bg-muted/50 transition-all duration-300 cursor-pointer group border border-transparent hover:border-primary/20"
                                    onClick={() => navigate('/employes')}
                                    style={{
                                      animation: `fadeInLeft 0.5s ease-out ${index * 0.1}s both`,
                                    }}
                                >
                                  <div className="relative flex-shrink-0">
                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                                <span className="text-xs font-bold text-white">
                                  {emp.nom[0]}
                                  {emp.prenom[0]}
                                </span>
                                    </div>
                                    <div
                                        className={cn(
                                            'absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white shadow-sm',
                                            statutConfig[emp.statut]?.color
                                        )}
                                    >
                                      <StatutIcon className="h-2 w-2 text-white m-auto mt-0.5" />
                                    </div>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                      {emp.nomComplet}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {emp.matricule} • {emp.fonction}
                                    </p>
                                  </div>
                                  <ArrowUpRight className="h-3 w-3 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 group-hover:-translate-y-1 transition-all" />
                                </div>
                            );
                          })
                      ) : (
                          <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                            <Users className="h-10 w-10 mb-2 opacity-20" />
                            <p className="text-xs">Aucun employé</p>
                          </div>
                      )}
                    </div>
                  </div>
                </Card>

                {/* Organization Stats */}
                <div className="grid grid-cols-3 gap-2 flex-shrink-0">
                  {organizationStats.map((stat, i) => (
                      <Card
                          key={i}
                          className={cn(
                              'p-3 hover:shadow-lg transition-all duration-300 border-2',
                              stat.border
                          )}
                          style={{
                            animation: `fadeInUp 0.5s ease-out ${i * 0.1 + 0.4}s both`,
                          }}
                      >
                        <div className="text-center space-y-1">
                          <div className={cn('p-1.5 rounded-lg mx-auto w-fit', stat.bg)}>
                            <stat.icon className={cn('h-4 w-4', stat.color)} />
                          </div>
                          <div>
                            <p className="text-xl font-bold text-foreground">
                              {stat.value}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              {stat.label}
                            </p>
                          </div>
                        </div>
                      </Card>
                  ))}
                </div>
              </div>

              {/* Middle Column - Status Distribution & Activity */}
              <div className="col-span-5 flex flex-col gap-3 min-h-0">
                {/* Status Distribution */}
                <Card className="border-2 hover:border-primary/20 transition-colors flex-1 min-h-0 flex flex-col">
                  <div className="p-4 flex-1 min-h-0 flex flex-col">
                    <div className="flex items-center gap-2 mb-3 flex-shrink-0">
                      <Activity className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold text-foreground">
                        Répartition par Statut
                      </h3>
                    </div>

                    <div className="flex-1 min-h-0 overflow-auto space-y-3 pr-1">
                      {Object.entries(statutConfig).map(([key, config], index) => {
                        const count = employesParStatut[key] || 0;
                        const percentage = stats?.totalEmployes
                            ? Math.round((count / stats.totalEmployes) * 100)
                            : 0;

                        const StatutIcon = config.icon;

                        return (
                            <div
                                key={key}
                                style={{
                                  animation: `fadeInRight 0.5s ease-out ${index * 0.1}s both`,
                                }}
                            >
                              <div className="flex items-center justify-between mb-1.5">
                                <div className="flex items-center gap-2">
                                  <div className={cn('p-1 rounded', config.lightBg)}>
                                    <StatutIcon className={cn('h-3 w-3', config.textColor)} />
                                  </div>
                                  <span className="text-xs font-medium text-foreground">
                                {config.label}
                              </span>
                                </div>
                                <div className="text-right">
                              <span className="text-base font-bold text-foreground">
                                {count}
                              </span>
                                  <span className="text-xs text-muted-foreground ml-1">
                                ({percentage}%)
                              </span>
                                </div>
                              </div>
                              <Progress value={percentage} className="h-1.5" />
                            </div>
                        );
                      })}
                    </div>
                  </div>
                </Card>

                {/* Recent Activity */}
                <Card className="border-2 hover:border-primary/20 transition-colors flex-1 min-h-0 flex flex-col">
                  <div className="p-4 flex-1 min-h-0 flex flex-col">
                    <div className="flex items-center gap-2 mb-3 flex-shrink-0">
                      <Sparkles className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold text-foreground">
                        Activité Récente
                      </h3>
                    </div>

                    <div className="flex-1 min-h-0 overflow-auto space-y-2.5 pr-1">
                      {recentActivities.map((activity, index) => (
                          <div
                              key={index}
                              className="flex items-start gap-2 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                              style={{
                                animation: `fadeInUp 0.5s ease-out ${index * 0.1 + 0.3}s both`,
                              }}
                          >
                            <div
                                className={cn(
                                    'p-1.5 rounded-full flex-shrink-0',
                                    activity.type === 'success' && 'bg-emerald-100',
                                    activity.type === 'warning' && 'bg-amber-100',
                                    activity.type === 'info' && 'bg-blue-100'
                                )}
                            >
                              <activity.icon
                                  className={cn(
                                      'h-3 w-3',
                                      activity.type === 'success' && 'text-emerald-600',
                                      activity.type === 'warning' && 'text-amber-600',
                                      activity.type === 'info' && 'text-blue-600'
                                  )}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-foreground">
                                {activity.title}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {activity.description}
                              </p>
                              <p className="text-[10px] text-muted-foreground mt-0.5">
                                {activity.time}
                              </p>
                            </div>
                          </div>
                      ))}
                    </div>
                  </div>
                </Card>
              </div>

              {/* Right Column - Performance & Quick Actions */}
              <div className="col-span-3 flex flex-col gap-3 min-h-0">
                {/* ICA Card */}
                <Card className="relative overflow-hidden border-2 border-emerald-200 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500 text-white shadow-xl flex-shrink-0">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-12 -mt-12"></div>
                  <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full -ml-10 -mb-10"></div>

                  <div className="p-4 relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="h-5 w-5" />
                      <h3 className="text-sm font-semibold">Prime ICA</h3>
                    </div>

                    <div className="mb-3">
                      <p className="text-4xl font-bold mb-1">
                        {stats?.beneficiairesICA || 0}
                      </p>
                      <p className="text-xs opacity-90">
                        Employés éligibles
                      </p>
                    </div>

                    <button
                        onClick={() => navigate('/ica')}
                        className="w-full py-2 px-3 bg-white/20 hover:bg-white/30 rounded-lg text-xs font-semibold transition-all backdrop-blur-sm hover:shadow-lg flex items-center justify-center gap-2"
                    >
                      Consulter le suivi
                      <ArrowUpRight className="h-3 w-3" />
                    </button>
                  </div>
                </Card>

                {/* Performance Gauge */}
                <Card className="border-2 hover:border-primary/20 transition-colors flex-1 min-h-0 flex flex-col">
                  <div className="p-4 flex-1 min-h-0 flex flex-col">
                    <div className="flex items-center gap-2 mb-3 flex-shrink-0">
                      <TrendingUp className="h-4 w-4 text-primary" />
                      <h3 className="text-sm font-semibold text-foreground">
                        Performance Globale
                      </h3>
                    </div>

                    <div className="flex-1 min-h-0 flex flex-col items-center justify-center">
                      {/* Circular Progress */}
                      <div className="relative w-32 h-32 mb-3">
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
                              stroke="url(#gradient)"
                              strokeWidth="6"
                              fill="none"
                              strokeDasharray={`${2 * Math.PI * 26.88}`}
                              strokeDashoffset={`${
                                  2 * Math.PI * 26.88 * (1 - tauxActivite / 100)
                              }`}
                              className="transition-all duration-1000"
                              strokeLinecap="round"
                          />
                          <defs>
                            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#10b981" />
                              <stop offset="100%" stopColor="#059669" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="text-center">
                            <p className="text-3xl font-bold text-foreground">
                              {tauxActivite}%
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Activité
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-2 w-full">
                        <div className="p-2 bg-emerald-50 rounded-lg text-center border border-emerald-200">
                          <p className="text-lg font-bold text-emerald-600">
                            {stats?.employesActifs || 0}
                          </p>
                          <p className="text-[10px] text-muted-foreground">Actifs</p>
                        </div>
                        <div className="p-2 bg-slate-50 rounded-lg text-center border border-slate-200">
                          <p className="text-lg font-bold text-slate-600">
                            {(stats?.totalEmployes || 0) - (stats?.employesActifs || 0)}
                          </p>
                          <p className="text-[10px] text-muted-foreground">Inactifs</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Quick Actions */}
                <Card className="border-2 hover:border-primary/20 transition-colors flex-shrink-0">
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-foreground mb-3">
                      Actions Rapides
                    </h3>

                    <div className="space-y-2">
                      <button
                          onClick={() => navigate('/employes')}
                          className="w-full py-2 px-3 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:bg-primary/90 transition-all hover:shadow-lg flex items-center justify-between group"
                      >
                        <span>Gérer employés</span>
                        <Users className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                      </button>
                      <button
                          onClick={() => navigate('/demandes-conges')}
                          className="w-full py-2 px-3 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600 transition-all hover:shadow-lg flex items-center justify-between group"
                      >
                        <span>Traiter demandes</span>
                        <Calendar className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                      </button>
                      <button
                          onClick={() => navigate('/ica')}
                          className="w-full py-2 px-3 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 transition-all hover:shadow-lg flex items-center justify-between group"
                      >
                        <span>Suivre ICA</span>
                        <Award className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                      </button>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </div>

        <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInLeft {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fadeInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
      </div>
  );
}