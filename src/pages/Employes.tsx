import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  Filter,
  Download,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Users,
  UserCheck,
  Activity,
  TrendingUp,
  MoreVertical,
  Eye,
  UserX,
  Calendar,
  Building,
  Briefcase,
  Clock,
  List,
  Grid3X3,
  ArrowUpDown,
  Sparkles,
} from 'lucide-react';
import { toast } from 'sonner';
import { employesApi, servicesApi, sousDirectionsApi } from '@/api/services';
import EmployeModal from '@/components/employes/EmployeModal';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { cn } from '@/lib/utils';

interface Employe {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  nomComplet: string;
  dateNaissance: string;
  dateRecrutement: string;
  fonction: string;
  adresse?: string;
  statut: 'ACTIF' | 'SUSPENDU' | 'MALADIE' | 'SUSPENDU_TEMPORAIREMENT';
  serviceId?: number;
  serviceNom?: string;
  sousDirectionId?: number;
  sousDirectionNom?: string;
  photo?: string;
}

const statutConfig = {
  ACTIF: {
    label: 'Actif',
    icon: UserCheck,
    gradient: 'from-emerald-500 to-teal-600',
    bg: 'bg-gradient-to-r from-emerald-50 to-teal-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    shadow: 'shadow-emerald-500/30',
  },
  SUSPENDU: {
    label: 'Suspendu',
    icon: UserX,
    gradient: 'from-rose-500 to-pink-600',
    bg: 'bg-gradient-to-r from-rose-50 to-pink-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    shadow: 'shadow-rose-500/30',
  },
  MALADIE: {
    label: 'En maladie',
    icon: Activity,
    gradient: 'from-amber-500 to-orange-600',
    bg: 'bg-gradient-to-r from-amber-50 to-orange-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    shadow: 'shadow-amber-500/30',
  },
  SUSPENDU_TEMPORAIREMENT: {
    label: 'Susp. temp.',
    icon: Clock,
    gradient: 'from-slate-500 to-slate-600',
    bg: 'bg-gradient-to-r from-slate-50 to-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-200',
    shadow: 'shadow-slate-500/30',
  },
};

// Pagination compacte - 5 lignes par page
const ITEMS_PER_PAGE = 6;

export default function Employes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statutFilter, setStatutFilter] = useState<string>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'nom' | 'matricule' | 'dateRecrutement'>('nom');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const queryClient = useQueryClient();

  const {
    data: employesData,
    isLoading,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['employes'],
    queryFn: () => employesApi.getAll(),
    staleTime: 30000,
  });

  const employes = (employesData?.data?.data || []) as Employe[];

  // Détection si enrichissement nécessaire
  const needsEnrichment = useMemo(() => {
    if (employes.length === 0) return false;
    const hasEmployeWithIds = employes.some(
        (emp) => emp.serviceId || emp.sousDirectionId
    );
    if (!hasEmployeWithIds) return false;

    const firstWithIds = employes.find(
        (emp) => emp.serviceId || emp.sousDirectionId
    );
    return !firstWithIds?.serviceNom && !firstWithIds?.sousDirectionNom;
  }, [employes]);

  const { data: servicesData } = useQuery({
    queryKey: ['services'],
    queryFn: () => servicesApi.getAll(),
    staleTime: 30000,
    enabled: needsEnrichment,
  });

  const { data: sousDirectionsData } = useQuery({
    queryKey: ['sous-directions'],
    queryFn: () => sousDirectionsApi.getAll(),
    staleTime: 30000,
    enabled: needsEnrichment,
  });

  const services = servicesData?.data?.data || [];
  const sousDirections = sousDirectionsData?.data?.data || [];

  const serviceMap = useMemo(() => {
    if (!needsEnrichment) return new Map();
    const map = new Map();
    services.forEach((service: any) => {
      map.set(service.id, service);
    });
    return map;
  }, [services, needsEnrichment]);

  const sousDirectionMap = useMemo(() => {
    if (!needsEnrichment) return new Map();
    const map = new Map();
    sousDirections.forEach((sd: any) => {
      map.set(sd.id, sd);
    });
    return map;
  }, [sousDirections, needsEnrichment]);

  // Enrichissement des données
  const enrichedEmployes = useMemo(() => {
    if (!needsEnrichment) return employes;

    return employes.map((emp) => {
      const enriched = { ...emp };

      if (emp.serviceId && !emp.serviceNom) {
        const service = serviceMap.get(emp.serviceId);
        if (service) {
          enriched.serviceNom = service.nom;
          if (!emp.sousDirectionId && service.sousDirectionId) {
            enriched.sousDirectionId = service.sousDirectionId;
          }
        }
      }

      if (enriched.sousDirectionId && !enriched.sousDirectionNom) {
        const sd = sousDirectionMap.get(enriched.sousDirectionId);
        if (sd) {
          enriched.sousDirectionNom = sd.nom;
        }
      }

      return enriched;
    });
  }, [employes, needsEnrichment, serviceMap, sousDirectionMap]);

  const createMutation = useMutation({
    mutationFn: employesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employes'] });
      toast.success('Employé créé avec succès');
      setModalOpen(false);
      setSelectedItem(null);
    },
    onError: () => {
      toast.error('Erreur lors de la création');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => employesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employes'] });
      toast.success('Employé modifié avec succès');
      setModalOpen(false);
      setSelectedItem(null);
    },
    onError: () => {
      toast.error('Erreur lors de la modification');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: employesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employes'] });
      toast.success('Employé supprimé avec succès');
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    },
  });

  const handleSubmit = (data: any) => {
    if (selectedItem) {
      updateMutation.mutate({ id: selectedItem.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (item: any) => {
    setSelectedItem(item);
    setModalOpen(true);
  };

  const handleDelete = (id: number) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete);
    }
  };

  // Filtrage et tri
  const filteredAndSortedEmployes = useMemo(() => {
    let filtered = enrichedEmployes.filter((employe: Employe) => {
      const matchesSearch =
          employe.nomComplet?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employe.matricule?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employe.fonction?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employe.serviceNom?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          employe.sousDirectionNom?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatut = statutFilter === 'ALL' || employe.statut === statutFilter;

      return matchesSearch && matchesStatut;
    });

    return filtered.sort((a: Employe, b: Employe) => {
      let aValue, bValue;

      switch (sortBy) {
        case 'matricule':
          aValue = a.matricule;
          bValue = b.matricule;
          break;
        case 'dateRecrutement':
          aValue = new Date(a.dateRecrutement).getTime();
          bValue = new Date(b.dateRecrutement).getTime();
          break;
        default:
          aValue = a.nomComplet;
          bValue = b.nomComplet;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
      }

      return sortOrder === 'asc'
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
    });
  }, [enrichedEmployes, searchTerm, statutFilter, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedEmployes.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredAndSortedEmployes.slice(startIndex, endIndex);
  }, [filteredAndSortedEmployes, currentPage]);

  // Reset pagination when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, statutFilter, sortBy, sortOrder]);

  // Statistiques
  const stats = useMemo(() => {
    const actifs = employes.filter((e) => e.statut === 'ACTIF').length;
    const suspendus = employes.filter((e) => e.statut === 'SUSPENDU').length;
    const maladie = employes.filter((e) => e.statut === 'MALADIE').length;
    const tauxActifs = employes.length > 0 ? ((actifs / employes.length) * 100).toFixed(1) : 0;

    return {
      total: employes.length,
      actifs,
      suspendus,
      maladie,
      tauxActifs,
    };
  }, [employes]);

  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-full min-h-[600px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto"></div>
            <p className="mt-6 text-lg text-muted-foreground">
              Chargement des employés...
            </p>
          </div>
        </div>
    );
  }

  return (
      <div className="space-y-8 p-8 animate-in fade-in duration-500">
        {/* Header avec statistiques */}
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Employés
              </h1>
              <p className="text-muted-foreground">
                Gérez et suivez tous vos employés
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button
                  variant="outline"
                  size="lg"
                  onClick={() => refetch()}
                  disabled={isFetching}
                  className="gap-2"
              >
                <RefreshCw className={cn('h-5 w-5', isFetching && 'animate-spin')} />
                Actualiser
              </Button>
              <Button
                  size="lg"
                  className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl transition-all duration-200"
                  onClick={() => { setSelectedItem(null); setModalOpen(true); }}
              >
                <Plus className="h-5 w-5" />
                Nouvel Employé
              </Button>
            </div>
          </div>

          {/* Cartes de statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-6 border-l-4 border-l-emerald-500 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Employés</p>
                  <p className="text-3xl font-bold mt-2">{stats.total}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-emerald-500" />
                </div>
              </div>
            </Card>

            <Card className="p-6 border-l-4 border-l-green-500 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Actifs</p>
                  <p className="text-3xl font-bold mt-2">{stats.actifs}</p>
                  <p className="text-xs text-green-600 font-medium mt-1">
                    {stats.tauxActifs}% du total
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <UserCheck className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </Card>

            <Card className="p-6 border-l-4 border-l-amber-500 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">En Maladie</p>
                  <p className="text-3xl font-bold mt-2">{stats.maladie}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-amber-500/10 flex items-center justify-center">
                  <Activity className="h-6 w-6 text-amber-500" />
                </div>
              </div>
            </Card>

            <Card className="p-6 border-l-4 border-l-rose-500 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Suspendus</p>
                  <p className="text-3xl font-bold mt-2">{stats.suspendus}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-rose-500/10 flex items-center justify-center">
                  <UserX className="h-6 w-6 text-rose-500" />
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Barre d'outils */}
        <Card className="p-4">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                  placeholder="Rechercher par nom, matricule, fonction..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Select value={statutFilter} onValueChange={setStatutFilter}>
                <SelectTrigger className="h-11 w-full sm:w-[160px]">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous</SelectItem>
                  <SelectItem value="ACTIF">Actif</SelectItem>
                  <SelectItem value="SUSPENDU">Suspendu</SelectItem>
                  <SelectItem value="MALADIE">En maladie</SelectItem>
                  <SelectItem value="SUSPENDU_TEMPORAIREMENT">Susp. temp.</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                <SelectTrigger className="h-11 w-full sm:w-[160px]">
                  <div className="flex items-center gap-2">
                    <ArrowUpDown className="h-4 w-4" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nom">Nom</SelectItem>
                  <SelectItem value="matricule">Matricule</SelectItem>
                  <SelectItem value="dateRecrutement">Date</SelectItem>
                </SelectContent>
              </Select>

              <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('table')}
                  className="h-11 w-11"
              >
                <List className="h-5 w-5" />
              </Button>
              <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="icon"
                  onClick={() => setViewMode('grid')}
                  className="h-11 w-11"
              >
                <Grid3X3 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </Card>

        {/* État vide */}
        {filteredAndSortedEmployes.length === 0 && (
            <Card className="p-12">
              <div className="text-center space-y-4">
                <div className="h-20 w-20 rounded-full bg-muted mx-auto flex items-center justify-center">
                  <Users className="h-10 w-10 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {searchTerm || statutFilter !== 'ALL' ? 'Aucun résultat trouvé' : 'Aucun employé'}
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    {searchTerm || statutFilter !== 'ALL'
                        ? 'Essayez de modifier vos filtres'
                        : 'Commencez par ajouter votre premier employé'}
                  </p>
                </div>
                {!searchTerm && statutFilter === 'ALL' && (
                    <Button
                        className="gap-2 mt-4"
                        onClick={() => { setSelectedItem(null); setModalOpen(true); }}
                    >
                      <Plus className="h-4 w-4" />
                      Ajouter un employé
                    </Button>
                )}
              </div>
            </Card>
        )}

        {/* Vue Tableau COMPACTE */}
        {viewMode === 'table' && filteredAndSortedEmployes.length > 0 && (
            <div className="space-y-4">
              <Card className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold w-[250px]">Employé</TableHead>
                      <TableHead className="font-semibold w-[120px]">Matricule</TableHead>
                      <TableHead className="font-semibold">Fonction</TableHead>
                      <TableHead className="font-semibold">Service / SD</TableHead>
                      <TableHead className="font-semibold w-[120px]">Statut</TableHead>
                      <TableHead className="font-semibold w-[100px]">Date</TableHead>
                      <TableHead className="text-right font-semibold w-[100px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((employe: Employe) => (
                        <TableRow
                            key={employe.id}
                            className="hover:bg-muted/50 transition-colors h-16"
                        >
                          <TableCell className="py-2">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={employe.photo} />
                                <AvatarFallback className="bg-gradient-to-br from-emerald-600 to-teal-600 text-white text-xs font-bold">
                                  {employe.nom?.[0]}{employe.prenom?.[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="min-w-0">
                                <p className="font-medium text-sm truncate">{employe.nomComplet}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            <Badge variant="outline" className="font-mono text-xs">
                              {employe.matricule}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2">
                            <span className="text-sm truncate block">{employe.fonction}</span>
                          </TableCell>
                          <TableCell className="py-2">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Building className="h-3 w-3" />
                                <span className="truncate">{employe.sousDirectionNom || '-'}</span>
                              </div>
                              {employe.serviceNom && (
                                  <div className="text-xs text-muted-foreground truncate">
                                    {employe.serviceNom}
                                  </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-2">
                            <Badge
                                className={cn(
                                    'text-xs font-semibold shadow-sm',
                                    `bg-gradient-to-r ${statutConfig[employe.statut].gradient} text-white`
                                )}
                            >
                              {(() => {
                                const StatusIcon = statutConfig[employe.statut].icon;
                                return <StatusIcon className="h-3 w-3 mr-1" />;
                              })()}
                              {statutConfig[employe.statut].label}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-2">
                      <span className="text-xs text-muted-foreground">
                        {new Date(employe.dateRecrutement).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                        })}
                      </span>
                          </TableCell>
                          <TableCell className="text-right py-2">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-7 w-7">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(employe)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    onClick={() => handleDelete(employe.id)}
                                    className="text-destructive focus:text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>

              {/* Pagination */}
              {totalPages > 1 && (
                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Affichage de{' '}
                        <span className="font-semibold text-foreground">
                    {(currentPage - 1) * ITEMS_PER_PAGE + 1}
                  </span>{' '}
                        à{' '}
                        <span className="font-semibold text-foreground">
                    {Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedEmployes.length)}
                  </span>{' '}
                        sur{' '}
                        <span className="font-semibold text-foreground">
                    {filteredAndSortedEmployes.length}
                  </span>{' '}
                        employés
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="gap-1"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Précédent
                        </Button>

                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                            if (
                                page === 1 ||
                                page === totalPages ||
                                (page >= currentPage - 1 && page <= currentPage + 1)
                            ) {
                              return (
                                  <Button
                                      key={page}
                                      variant={currentPage === page ? 'default' : 'outline'}
                                      size="sm"
                                      onClick={() => setCurrentPage(page)}
                                      className="w-10"
                                  >
                                    {page}
                                  </Button>
                              );
                            } else if (page === currentPage - 2 || page === currentPage + 2) {
                              return (
                                  <span key={page} className="px-2 text-muted-foreground">
                            ...
                          </span>
                              );
                            }
                            return null;
                          })}
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="gap-1"
                        >
                          Suivant
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
              )}
            </div>
        )}

        {/* Vue Grille */}
        {viewMode === 'grid' && filteredAndSortedEmployes.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedData.map((employe: Employe) => {
                  const config = statutConfig[employe.statut];
                  const StatusIcon = config.icon;

                  return (
                      <Card
                          key={employe.id}
                          className="group hover:shadow-xl hover:scale-[1.02] transition-all duration-300 overflow-hidden"
                      >
                        <CardContent className="p-0">
                          {/* Header avec gradient selon statut */}
                          <div
                              className={cn(
                                  'p-4 bg-gradient-to-r',
                                  config.gradient,
                                  'flex items-center gap-3'
                              )}
                          >
                            <Avatar className="h-14 w-14 ring-4 ring-white shadow-lg">
                              <AvatarImage src={employe.photo} />
                              <AvatarFallback className="bg-white/20 text-white font-bold text-lg backdrop-blur">
                                {employe.nom?.[0]}{employe.prenom?.[0]}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <Badge className="bg-white/20 text-white border-0 mb-1 backdrop-blur">
                                <StatusIcon className="h-3.5 w-3.5 mr-1" />
                                {config.label}
                              </Badge>
                              <h3 className="font-bold text-white text-base truncate">
                                {employe.nomComplet}
                              </h3>
                              <p className="text-white/90 text-xs font-medium">
                                {employe.matricule}
                              </p>
                            </div>
                          </div>

                          {/* Corps */}
                          <div className="p-4 space-y-2.5">
                            <div className="flex items-center gap-2 text-sm">
                              <div className="p-1.5 bg-violet-50 rounded-lg">
                                <Briefcase className="h-3.5 w-3.5 text-violet-600" />
                              </div>
                              <span className="text-slate-700 font-medium flex-1 truncate text-xs">
                          {employe.fonction}
                        </span>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                              <div className="p-1.5 bg-blue-50 rounded-lg">
                                <Building className="h-3.5 w-3.5 text-blue-600" />
                              </div>
                              <span className="text-slate-700 flex-1 truncate text-xs">
                          {employe.sousDirectionNom || '-'}
                        </span>
                            </div>

                            <div className="flex items-center gap-2 text-sm">
                              <div className="p-1.5 bg-emerald-50 rounded-lg">
                                <Calendar className="h-3.5 w-3.5 text-emerald-600" />
                              </div>
                              <span className="text-slate-700 text-xs">
                          {new Date(employe.dateRecrutement).toLocaleDateString('fr-FR')}
                        </span>
                            </div>

                            {/* Boutons */}
                            <div className="flex gap-2 pt-2 border-t border-slate-100">
                              <Button
                                  variant="outline"
                                  size="sm"
                                  className="flex-1 text-xs h-8"
                                  onClick={() => handleEdit(employe)}
                              >
                                <Edit className="h-3.5 w-3.5 mr-1" />
                                Modifier
                              </Button>
                              <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 text-xs border-rose-200 text-rose-600 hover:bg-rose-50"
                                  onClick={() => handleDelete(employe.id)}
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                  );
                })}
              </div>

              {/* Pagination grille */}
              {totalPages > 1 && (
                  <Card className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-muted-foreground">
                        Page {currentPage} sur {totalPages}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className="gap-1"
                        >
                          <ChevronLeft className="h-4 w-4" />
                          Précédent
                        </Button>

                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                            if (
                                page === 1 ||
                                page === totalPages ||
                                (page >= currentPage - 1 && page <= currentPage + 1)
                            ) {
                              return (
                                  <Button
                                      key={page}
                                      variant={currentPage === page ? 'default' : 'outline'}
                                      size="sm"
                                      onClick={() => setCurrentPage(page)}
                                      className="w-10"
                                  >
                                    {page}
                                  </Button>
                              );
                            } else if (page === currentPage - 2 || page === currentPage + 2) {
                              return (
                                  <span key={page} className="px-2 text-muted-foreground">
                            ...
                          </span>
                              );
                            }
                            return null;
                          })}
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className="gap-1"
                        >
                          Suivant
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
              )}
            </div>
        )}

        <EmployeModal
            open={modalOpen}
            onOpenChange={(open) => {
              setModalOpen(open);
              if (!open) {
                setSelectedItem(null);
              }
            }}
            onSubmit={handleSubmit}
            initialData={selectedItem}
            isLoading={createMutation.isPending || updateMutation.isPending}
        />

        <ConfirmDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onConfirm={confirmDelete}
            title="Supprimer l'employé"
            description="Êtes-vous sûr de vouloir supprimer cet employé ? Cette action est irréversible et supprimera également toutes ses données associées."
            variant="destructive"
        />
      </div>
  );
}