import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Users, UserCheck, Calendar, Award, Building2, Briefcase, TrendingUp, AlertCircle } from 'lucide-react';
import { dashboardApi, employesApi } from '@/api/services';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '@/components/ui/skeleton';

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
  sousDirectionNom?: string;
}

const statutColors = {
  ACTIF: 'bg-success text-success-foreground',
  SUSPENDU: 'bg-destructive text-destructive-foreground',
  MALADIE: 'bg-warning text-warning-foreground',
  SUSPENDU_TEMPORAIREMENT: 'bg-secondary text-secondary-foreground',
};

const statutLabels = {
  ACTIF: 'Actif',
  SUSPENDU: 'Suspendu',
  MALADIE: 'En maladie',
  SUSPENDU_TEMPORAIREMENT: 'Suspendu temporairement',
};

export default function Dashboard() {
  const navigate = useNavigate();

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => dashboardApi.getStatistics(),
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: employesData, isLoading: employesLoading } = useQuery({
    queryKey: ['employes-dashboard'],
    queryFn: () => employesApi.getAll(),
    refetchInterval: 30000,
  });

  const stats = statsData?.data?.data as DashboardStats;
  const employes = (employesData?.data?.data || []) as Employe[];

  // Calculer les statistiques des employés
  const employesParStatut = employes.reduce((acc, emp) => {
    acc[emp.statut] = (acc[emp.statut] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const recentEmployes = employes.slice(0, 5);

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement des statistiques...</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Employés',
      value: stats?.totalEmployes || 0,
      icon: Users,
      gradient: 'from-blue-500 to-blue-600',
      textColor: 'text-blue-600',
      bgColor: 'bg-blue-50',
      description: 'Tous statuts confondus',
      onClick: () => navigate('/employes'),
    },
    {
      title: 'Employés Actifs',
      value: stats?.employesActifs || 0,
      icon: UserCheck,
      gradient: 'from-green-500 to-green-600',
      textColor: 'text-green-600',
      bgColor: 'bg-green-50',
      description: 'En service actuellement',
      onClick: () => navigate('/employes'),
    },
    {
      title: 'Employés en Congé',
      value: stats?.employesEnConge || 0,
      icon: Calendar,
      gradient: 'from-amber-500 to-amber-600',
      textColor: 'text-amber-600',
      bgColor: 'bg-amber-50',
      description: 'Congés en cours',
      onClick: () => navigate('/demandes-conges'),
    },
    {
      title: 'Demandes en Attente',
      value: stats?.demandesEnAttente || 0,
      icon: AlertCircle,
      gradient: 'from-purple-500 to-purple-600',
      textColor: 'text-purple-600',
      bgColor: 'bg-purple-50',
      description: 'Nécessitent traitement',
      onClick: () => navigate('/demandes-conges'),
    },
    {
      title: 'Bénéficiaires ICA',
      value: stats?.beneficiairesICA || 0,
      icon: Award,
      gradient: 'from-emerald-500 to-emerald-600',
      textColor: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      description: 'Éligibles à la prime',
      onClick: () => navigate('/ica'),
    },
    {
      title: 'Sous-Directions',
      value: stats?.totalSousDirections || 0,
      icon: Building2,
      gradient: 'from-indigo-500 to-indigo-600',
      textColor: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      description: 'Structures organisées',
      onClick: () => navigate('/sous-directions'),
    },
    {
      title: 'Services',
      value: stats?.totalServices || 0,
      icon: Briefcase,
      gradient: 'from-rose-500 to-rose-600',
      textColor: 'text-rose-600',
      bgColor: 'bg-rose-50',
      description: 'Départements actifs',
      onClick: () => navigate('/services'),
    },
    {
      title: 'Taux d\'Activité',
      value: stats?.totalEmployes 
        ? `${Math.round((stats.employesActifs / stats.totalEmployes) * 100)}%`
        : '0%',
      icon: TrendingUp,
      gradient: 'from-cyan-500 to-cyan-600',
      textColor: 'text-cyan-600',
      bgColor: 'bg-cyan-50',
      description: 'Employés actifs',
      onClick: () => {},
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Tableau de Bord</h1>
        <p className="mt-2 text-muted-foreground">
          Vue d'ensemble de la gestion des congés - CNAS Constantine
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card 
            key={index} 
            className="p-6 hover:shadow-elegant transition-all duration-200 cursor-pointer hover:scale-105"
            onClick={stat.onClick}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                <p className="mt-2 text-3xl font-bold text-foreground">{stat.value}</p>
                <p className="mt-1 text-xs text-muted-foreground">{stat.description}</p>
              </div>
              <div className={`${stat.bgColor} p-3 rounded-lg`}>
                <stat.icon className={`h-6 w-6 ${stat.textColor}`} />
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Detailed Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employés récents */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">Employés Récents</h3>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/employes')}
            >
              Voir tout
            </Button>
          </div>
          
          {employesLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-3 w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : recentEmployes.length > 0 ? (
            <div className="space-y-4">
              {recentEmployes.map((employe) => (
                <div 
                  key={employe.id} 
                  className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                  onClick={() => navigate('/employes')}
                >
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {employe.nom[0]}{employe.prenom[0]}
                      </span>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">
                      {employe.nomComplet}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {employe.matricule} • {employe.fonction}
                    </p>
                    {employe.serviceNom && (
                      <p className="text-xs text-muted-foreground truncate mt-1">
                        {employe.serviceNom}
                      </p>
                    )}
                  </div>
                  <Badge className={`${statutColors[employe.statut]} text-xs`}>
                    {statutLabels[employe.statut]}
                  </Badge>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>Aucun employé trouvé</p>
            </div>
          )}
        </Card>

        {/* Répartition par statut */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-6">
            Répartition des Employés par Statut
          </h3>
          <div className="space-y-4">
            {Object.entries(statutLabels).map(([key, label]) => {
              const count = employesParStatut[key] || 0;
              const percentage = stats?.totalEmployes 
                ? Math.round((count / stats.totalEmployes) * 100)
                : 0;
              
              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Badge className={`${statutColors[key as keyof typeof statutColors]} text-xs`}>
                        {label}
                      </Badge>
                    </div>
                    <span className="font-medium text-foreground">
                      {count} ({percentage}%)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        key === 'ACTIF' ? 'bg-success' :
                        key === 'SUSPENDU' ? 'bg-destructive' :
                        key === 'MALADIE' ? 'bg-warning' :
                        'bg-secondary'
                      }`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Activité Récente */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Activité Récente</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-success mt-2 flex-shrink-0"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Demande de congé approuvée</p>
                <p className="text-xs text-muted-foreground">Il y a 2 heures</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-warning mt-2 flex-shrink-0"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Nouvelle demande en attente</p>
                <p className="text-xs text-muted-foreground">Il y a 5 heures</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0"></div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Nouvel employé ajouté</p>
                <p className="text-xs text-muted-foreground">Il y a 1 jour</p>
              </div>
            </div>
          </div>
        </Card>

        {/* Alertes ICA */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Alertes ICA</h3>
          <div className="space-y-4">
            <div className="p-4 bg-success/10 rounded-lg border border-success/20">
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-5 w-5 text-success" />
                <p className="font-medium text-success">Éligibilité ICA</p>
              </div>
              <p className="text-sm text-muted-foreground">
                {stats?.beneficiairesICA || 0} employés sont éligibles à la prime ICA cette année
              </p>
            </div>
            <Button 
              className="w-full gap-2" 
              variant="outline"
              onClick={() => navigate('/ica')}
            >
              <Award className="h-4 w-4" />
              Consulter le suivi ICA complet
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
