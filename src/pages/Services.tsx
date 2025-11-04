import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Grid3x3,
  List,
  MoreVertical,
  Users,
  Building2,
  Layers,
  TrendingUp,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { toast } from 'sonner';
import { servicesApi } from '@/api/services';
import ServiceModal from '@/components/services/ServiceModal';
import ConfirmDialog from '@/components/common/ConfirmDialog';

interface Service {
  id: number;
  code: string;
  nom: string;
  nombreEmployes: number;
  sousDirectionId: number;
  sousDirectionNom: string;
}

type ViewMode = 'table' | 'grid';
type SortField = 'code' | 'nom' | 'nombreEmployes' | 'sousDirectionNom';
type SortOrder = 'asc' | 'desc';

const ITEMS_PER_PAGE = 12;

export default function Services() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('code');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [currentPage, setCurrentPage] = useState(1);

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => servicesApi.getAll(),
  });

  const services = (data?.data?.data || []) as Service[];

  // Filtrage et tri
  const filteredAndSortedData = useMemo(() => {
    let filtered = services.filter((service: Service) =>
        service.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.sousDirectionNom?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const sorted = filtered.sort((a: Service, b: Service) => {
      const aValue = a[sortField];
      const bValue = b[sortField];

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortOrder === 'asc'
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
      }

      return sortOrder === 'asc'
          ? (aValue as number) - (bValue as number)
          : (bValue as number) - (aValue as number);
    });

    return sorted;
  }, [services, searchQuery, sortField, sortOrder]);

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedData.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredAndSortedData.slice(startIndex, endIndex);
  }, [filteredAndSortedData, currentPage]);

  // Reset pagination when search/filter changes
  useMemo(() => {
    setCurrentPage(1);
  }, [searchQuery, sortField, sortOrder]);

  // Statistiques
  const stats = useMemo(() => {
    const totalEmployes = services.reduce(
        (sum: number, service: Service) => sum + service.nombreEmployes,
        0
    );
    const avgEmployes = services.length > 0
        ? Math.round(totalEmployes / services.length)
        : 0;

    // Compter le nombre de sous-directions uniques
    const uniqueSousDirections = new Set(services.map(s => s.sousDirectionId)).size;

    return {
      total: services.length,
      totalEmployes,
      avgEmployes,
      sousDirections: uniqueSousDirections,
    };
  }, [services]);

  const createMutation = useMutation({
    mutationFn: servicesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Service créé avec succès');
      setModalOpen(false);
    },
    onError: () => {
      toast.error('Erreur lors de la création');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => servicesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Service modifié avec succès');
      setModalOpen(false);
      setSelectedItem(null);
    },
    onError: () => {
      toast.error('Erreur lors de la modification');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: servicesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Service supprimé avec succès');
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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-full min-h-[600px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto"></div>
            <p className="mt-6 text-lg text-muted-foreground">Chargement des services...</p>
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
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Services
              </h1>
              <p className="text-muted-foreground">
                Gérez et organisez vos services par sous-direction
              </p>
            </div>
            <Button
                size="lg"
                className="gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={() => { setSelectedItem(null); setModalOpen(true); }}
            >
              <Plus className="h-5 w-5" />
              Nouveau Service
            </Button>
          </div>

          {/* Cartes de statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="p-6 border-l-4 border-l-primary hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Services</p>
                  <p className="text-3xl font-bold mt-2">{stats.total}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Layers className="h-6 w-6 text-primary" />
                </div>
              </div>
            </Card>

            <Card className="p-6 border-l-4 border-l-purple-500 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Sous-Directions</p>
                  <p className="text-3xl font-bold mt-2">{stats.sousDirections}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </Card>

            <Card className="p-6 border-l-4 border-l-blue-500 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Employés</p>
                  <p className="text-3xl font-bold mt-2">{stats.totalEmployes}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </Card>

            <Card className="p-6 border-l-4 border-l-green-500 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Moyenne Employés</p>
                  <p className="text-3xl font-bold mt-2">{stats.avgEmployes}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-500" />
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
                  placeholder="Rechercher par nom, code ou sous-direction..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 h-11"
              />
            </div>

            <div className="flex items-center gap-2">
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
                <Grid3x3 className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </Card>

        {/* État vide */}
        {filteredAndSortedData.length === 0 && (
            <Card className="p-12">
              <div className="text-center space-y-4">
                <div className="h-20 w-20 rounded-full bg-muted mx-auto flex items-center justify-center">
                  <Layers className="h-10 w-10 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {searchQuery ? 'Aucun résultat trouvé' : 'Aucun service'}
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    {searchQuery
                        ? 'Essayez avec d\'autres termes de recherche'
                        : 'Commencez par créer votre premier service'
                    }
                  </p>
                </div>
                {!searchQuery && (
                    <Button
                        className="gap-2 mt-4"
                        onClick={() => { setSelectedItem(null); setModalOpen(true); }}
                    >
                      <Plus className="h-4 w-4" />
                      Créer un service
                    </Button>
                )}
              </div>
            </Card>
        )}

        {/* Vue Tableau */}
        {viewMode === 'table' && filteredAndSortedData.length > 0 && (
            <div className="space-y-4">
              <Card className="overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50">
                      <TableHead className="font-semibold">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1"
                            onClick={() => handleSort('code')}
                        >
                          Code
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead className="font-semibold">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1"
                            onClick={() => handleSort('nom')}
                        >
                          Nom du Service
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead className="font-semibold">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1"
                            onClick={() => handleSort('sousDirectionNom')}
                        >
                          Sous-Direction
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead className="font-semibold text-right">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 gap-1"
                            onClick={() => handleSort('nombreEmployes')}
                        >
                          Employés
                          <ArrowUpDown className="h-3 w-3" />
                        </Button>
                      </TableHead>
                      <TableHead className="text-right font-semibold">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedData.map((service: Service) => (
                        <TableRow
                            key={service.id}
                            className="hover:bg-muted/50 transition-colors"
                        >
                          <TableCell>
                            <Badge variant="outline" className="font-mono font-semibold">
                              {service.code}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium">{service.nom}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Building2 className="h-4 w-4" />
                              <span>{service.sousDirectionNom}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold">
                              <Users className="h-4 w-4" />
                              {service.nombreEmployes}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => handleEdit(service)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    onClick={() => handleDelete(service.id)}
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
                        Affichage de {(currentPage - 1) * ITEMS_PER_PAGE + 1} à{' '}
                        {Math.min(currentPage * ITEMS_PER_PAGE, filteredAndSortedData.length)}{' '}
                        sur {filteredAndSortedData.length} services
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
        {viewMode === 'grid' && filteredAndSortedData.length > 0 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {paginatedData.map((service: Service) => (
                    <Card
                        key={service.id}
                        className="group p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-2 hover:border-primary/20"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <Badge variant="secondary" className="font-mono font-bold mb-3">
                            {service.code}
                          </Badge>
                          <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                            {service.nom}
                          </h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Building2 className="h-4 w-4" />
                            <span>{service.sousDirectionNom}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <div className="flex items-center gap-2">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Users className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-foreground">{service.nombreEmployes}</p>
                            <p className="text-xs text-muted-foreground">employés</p>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleEdit(service)}
                              className="h-9 w-9 hover:bg-primary hover:text-primary-foreground transition-colors"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDelete(service.id)}
                              className="h-9 w-9 hover:bg-destructive hover:text-destructive-foreground transition-colors"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </Card>
                ))}
              </div>

              {/* Pagination pour grille */}
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

        <ServiceModal
            open={modalOpen}
            onOpenChange={setModalOpen}
            onSubmit={handleSubmit}
            initialData={selectedItem}
            isLoading={createMutation.isPending || updateMutation.isPending}
        />

        <ConfirmDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onConfirm={confirmDelete}
            title="Supprimer le service"
            description="Êtes-vous sûr de vouloir supprimer ce service ? Cette action est irréversible."
            variant="destructive"
        />
      </div>
  );
}