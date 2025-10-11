import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { employesApi, servicesApi, sousDirectionsApi } from '@/api/services';
import EmployeModal from '@/components/employes/EmployeModal';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

const ITEMS_PER_PAGE = 5;

export default function Employes() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statutFilter, setStatutFilter] = useState<string>('ALL');
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'nom' | 'matricule' | 'dateRecrutement'>(
    'nom'
  );
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  const queryClient = useQueryClient();

  // ✅ CHARGER LES EMPLOYÉS
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

  // ✅ VÉRIFIER SI L'API RETOURNE DÉJÀ LES NOMS
  const needsEnrichment = useMemo(() => {
    if (employes.length === 0) return false;
    // Si au moins un employé avec serviceId/sousDirectionId n'a pas les noms, on doit enrichir
    const hasEmployeWithIds = employes.some(
      (emp) => emp.serviceId || emp.sousDirectionId
    );
    if (!hasEmployeWithIds) return false;

    const firstWithIds = employes.find(
      (emp) => emp.serviceId || emp.sousDirectionId
    );
    return !firstWithIds?.serviceNom && !firstWithIds?.sousDirectionNom;
  }, [employes]);

  // ✅ CHARGER LES SERVICES ET SOUS-DIRECTIONS SEULEMENT SI NÉCESSAIRE
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

  // ✅ CRÉER DES MAPS POUR LOOKUP RAPIDE (seulement si nécessaire)
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

  // ✅ ENRICHIR LES EMPLOYÉS SEULEMENT SI NÉCESSAIRE
  const enrichedEmployes = useMemo(() => {
    if (!needsEnrichment) {
      // L'API retourne déjà les noms, on utilise directement les données
      return employes;
    }

    // Sinon, on enrichit avec lookup
    return employes.map((emp) => {
      const service = emp.serviceId ? serviceMap.get(emp.serviceId) : null;
      const sousDirection = emp.sousDirectionId
        ? sousDirectionMap.get(emp.sousDirectionId)
        : null;

      return {
        ...emp,
        serviceNom: service
          ? `${service.code} - ${service.nom}`
          : emp.serviceNom,
        sousDirectionNom: sousDirection
          ? `${sousDirection.code} - ${sousDirection.nom}`
          : emp.sousDirectionNom,
      };
    });
  }, [employes, serviceMap, sousDirectionMap, needsEnrichment]);

  const createMutation = useMutation({
    mutationFn: employesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Employé créé avec succès');
      setModalOpen(false);
      setSelectedItem(null);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Erreur lors de la création'
      );
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => employesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Employé modifié avec succès');
      setModalOpen(false);
      setSelectedItem(null);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Erreur lors de la modification'
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: employesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employes'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      toast.success('Employé supprimé avec succès');
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    },
    onError: (error: any) => {
      toast.error(
        error.response?.data?.message || 'Erreur lors de la suppression'
      );
    },
  });

  const handleSubmit = (data: any) => {
    const cleanedData = {
      ...data,
      serviceId: data.serviceId || null,
      sousDirectionId: data.sousDirectionId || null,
      adresse: data.adresse || null,
    };

    if (selectedItem) {
      updateMutation.mutate({ id: selectedItem.id, data: cleanedData });
    } else {
      createMutation.mutate(cleanedData);
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

  const handleRefresh = () => {
    refetch();
    toast.success('Données actualisées');
  };

  // Filtrage et tri
  const filteredAndSortedEmployes = useMemo(() => {
    let filtered = enrichedEmployes.filter((emp) => {
      const searchLower = searchTerm.toLowerCase();
      const matchesSearch =
        emp.nomComplet.toLowerCase().includes(searchLower) ||
        emp.matricule.toLowerCase().includes(searchLower) ||
        emp.nom.toLowerCase().includes(searchLower) ||
        emp.prenom.toLowerCase().includes(searchLower) ||
        emp.fonction.toLowerCase().includes(searchLower);

      const matchesStatut =
        statutFilter === 'ALL' || emp.statut === statutFilter;

      return matchesSearch && matchesStatut;
    });

    filtered.sort((a, b) => {
      let compareValue = 0;

      if (sortBy === 'nom') {
        compareValue = a.nomComplet.localeCompare(b.nomComplet);
      } else if (sortBy === 'matricule') {
        compareValue = a.matricule.localeCompare(b.matricule);
      } else if (sortBy === 'dateRecrutement') {
        compareValue =
          new Date(a.dateRecrutement).getTime() -
          new Date(b.dateRecrutement).getTime();
      }

      return sortOrder === 'asc' ? compareValue : -compareValue;
    });

    return filtered;
  }, [enrichedEmployes, searchTerm, statutFilter, sortBy, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(
    filteredAndSortedEmployes.length / ITEMS_PER_PAGE
  );
  const paginatedEmployes = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredAndSortedEmployes.slice(startIndex, endIndex);
  }, [filteredAndSortedEmployes, currentPage]);

  // Reset pagination when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, statutFilter]);

  // Statistiques
  const stats = useMemo(() => {
    return {
      total: employes.length,
      actifs: employes.filter((e) => e.statut === 'ACTIF').length,
      filtered: filteredAndSortedEmployes.length,
    };
  }, [employes, filteredAndSortedEmployes]);

  const exportToCSV = () => {
    const headers = [
      'Matricule',
      'Nom',
      'Prénom',
      'Fonction',
      'Statut',
      'Sous-Direction',
      'Service',
    ];
    const csvData = filteredAndSortedEmployes.map((emp: any) => [
      emp.matricule,
      emp.nom,
      emp.prenom,
      emp.fonction,
      statutLabels[emp.statut],
      emp.sousDirectionNom || '-',
      emp.serviceNom || '-',
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `employes_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast.success('Export CSV réussi');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">
            Chargement des employés...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Gestion des Employés
          </h1>
          <p className="mt-2 text-muted-foreground">
            {stats.filtered} employés affichés sur {stats.total} •{' '}
            {stats.actifs} actifs
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="gap-2"
            onClick={handleRefresh}
            disabled={isFetching}
          >
            <RefreshCw
              className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`}
            />
            Actualiser
          </Button>
          <Button variant="outline" className="gap-2" onClick={exportToCSV}>
            <Download className="h-4 w-4" />
            Exporter
          </Button>
          <Button
            className="gap-2"
            onClick={() => {
              setSelectedItem(null);
              setModalOpen(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Ajouter un Employé
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total</div>
          <div className="text-2xl font-bold text-foreground">
            {stats.total}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Actifs</div>
          <div className="text-2xl font-bold text-success">{stats.actifs}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Filtrés</div>
          <div className="text-2xl font-bold text-primary">
            {stats.filtered}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Taux d'activité</div>
          <div className="text-2xl font-bold text-foreground">
            {stats.total > 0
              ? Math.round((stats.actifs / stats.total) * 100)
              : 0}
            %
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Rechercher par matricule, nom, prénom ou fonction..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statutFilter} onValueChange={setStatutFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous les statuts</SelectItem>
              <SelectItem value="ACTIF">Actif</SelectItem>
              <SelectItem value="SUSPENDU">Suspendu</SelectItem>
              <SelectItem value="MALADIE">En maladie</SelectItem>
              <SelectItem value="SUSPENDU_TEMPORAIREMENT">
                Suspendu temporairement
              </SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={sortBy}
            onValueChange={(value: any) => setSortBy(value)}
          >
            <SelectTrigger className="w-full md:w-[200px]">
              <SelectValue placeholder="Trier par" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="nom">Nom</SelectItem>
              <SelectItem value="matricule">Matricule</SelectItem>
              <SelectItem value="dateRecrutement">
                Date de recrutement
              </SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </Button>
        </div>
      </Card>

      {/* Employees Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Matricule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Nom Complet
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Fonction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Sous-Direction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {paginatedEmployes.length > 0 ? (
                paginatedEmployes.map((employe: any) => (
                  <tr
                    key={employe.id}
                    className="hover:bg-muted/50 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                      {employe.matricule}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {employe.nomComplet}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {employe.fonction}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {employe.sousDirectionNom || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {employe.serviceNom || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge className={statutColors[employe.statut]}>
                        {statutLabels[employe.statut]}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleEdit(employe)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDelete(employe.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="text-muted-foreground">
                      <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Aucun employé trouvé</p>
                      <p className="text-sm mt-1">
                        Essayez de modifier vos critères de recherche
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-border">
            <div className="text-sm text-muted-foreground">
              Affichage de {(currentPage - 1) * ITEMS_PER_PAGE + 1} à{' '}
              {Math.min(
                currentPage * ITEMS_PER_PAGE,
                filteredAndSortedEmployes.length
              )}{' '}
              sur {filteredAndSortedEmployes.length} employés
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                Précédent
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => {
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
                    } else if (
                      page === currentPage - 2 ||
                      page === currentPage + 2
                    ) {
                      return (
                        <span key={page} className="px-2">
                          ...
                        </span>
                      );
                    }
                    return null;
                  }
                )}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                }
                disabled={currentPage === totalPages}
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>

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
        description="Êtes-vous sûr de vouloir supprimer cet employé ? Cette action est irréversible et supprimera également toutes ses données associées (demandes de congé, historiques, etc.)."
        variant="destructive"
      />
    </div>
  );
}
