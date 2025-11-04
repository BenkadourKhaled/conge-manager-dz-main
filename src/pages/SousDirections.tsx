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
  TrendingUp,
  ArrowUpDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { sousDirectionsApi } from '@/api/services';
import SousDirectionModal from '@/components/sous-directions/SousDirectionModal';
import ConfirmDialog from '@/components/common/ConfirmDialog';

interface SousDirection {
  id: number;
  code: string;
  nom: string;
  libelle: string;
  nombreEmployes: number;
}

type ViewMode = 'table' | 'grid';
type SortField = 'code' | 'nom' | 'nombreEmployes';
type SortOrder = 'asc' | 'desc';

export default function SousDirections() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState<SortField>('code');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['sous-directions'],
    queryFn: () => sousDirectionsApi.getAll(),
  });

  const sousDirections = data?.data?.data || [];

  // Filtrage et tri
  const filteredAndSortedData = useMemo(() => {
    let filtered = sousDirections.filter((sd: SousDirection) =>
        sd.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sd.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sd.libelle?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return filtered.sort((a: SousDirection, b: SousDirection) => {
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
  }, [sousDirections, searchQuery, sortField, sortOrder]);

  // Statistiques
  const stats = useMemo(() => {
    const totalEmployes = sousDirections.reduce(
        (sum: number, sd: SousDirection) => sum + sd.nombreEmployes,
        0
    );
    const avgEmployes = sousDirections.length > 0
        ? Math.round(totalEmployes / sousDirections.length)
        : 0;

    return {
      total: sousDirections.length,
      totalEmployes,
      avgEmployes,
    };
  }, [sousDirections]);

  const createMutation = useMutation({
    mutationFn: sousDirectionsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sous-directions'] });
      toast.success('Sous-direction créée avec succès');
      setModalOpen(false);
    },
    onError: () => {
      toast.error('Erreur lors de la création');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => sousDirectionsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sous-directions'] });
      toast.success('Sous-direction modifiée avec succès');
      setModalOpen(false);
      setSelectedItem(null);
    },
    onError: () => {
      toast.error('Erreur lors de la modification');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: sousDirectionsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sous-directions'] });
      toast.success('Sous-direction supprimée avec succès');
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
            <p className="mt-6 text-lg text-muted-foreground">Chargement des sous-directions...</p>
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
                Sous-Directions
              </h1>
              <p className="text-muted-foreground">
                Gérez et organisez vos sous-directions
              </p>
            </div>
            <Button
                size="lg"
                className="gap-2 shadow-lg hover:shadow-xl transition-all duration-200"
                onClick={() => { setSelectedItem(null); setModalOpen(true); }}
            >
              <Plus className="h-5 w-5" />
              Nouvelle Sous-Direction
            </Button>
          </div>

          {/* Cartes de statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 border-l-4 border-l-primary hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Sous-Directions</p>
                  <p className="text-3xl font-bold mt-2">{stats.total}</p>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-primary" />
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
                  placeholder="Rechercher par nom, code ou libellé..."
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
                  <Building2 className="h-10 w-10 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">
                    {searchQuery ? 'Aucun résultat trouvé' : 'Aucune sous-direction'}
                  </h3>
                  <p className="text-muted-foreground mt-1">
                    {searchQuery
                        ? 'Essayez avec d\'autres termes de recherche'
                        : 'Commencez par créer votre première sous-direction'
                    }
                  </p>
                </div>
                {!searchQuery && (
                    <Button
                        className="gap-2 mt-4"
                        onClick={() => { setSelectedItem(null); setModalOpen(true); }}
                    >
                      <Plus className="h-4 w-4" />
                      Créer une sous-direction
                    </Button>
                )}
              </div>
            </Card>
        )}

        {/* Vue Tableau */}
        {viewMode === 'table' && filteredAndSortedData.length > 0 && (
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
                        Nom
                        <ArrowUpDown className="h-3 w-3" />
                      </Button>
                    </TableHead>
                    <TableHead className="font-semibold">Libellé</TableHead>
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
                  {filteredAndSortedData.map((sd: SousDirection) => (
                      <TableRow
                          key={sd.id}
                          className="hover:bg-muted/50 transition-colors"
                      >
                        <TableCell>
                          <Badge variant="outline" className="font-mono font-semibold">
                            {sd.code}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{sd.nom}</TableCell>
                        <TableCell className="text-muted-foreground max-w-xs truncate">
                          {sd.libelle || '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary font-semibold">
                            <Users className="h-4 w-4" />
                            {sd.nombreEmployes}
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
                              <DropdownMenuItem onClick={() => handleEdit(sd)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                  onClick={() => handleDelete(sd.id)}
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
        )}

        {/* Vue Grille */}
        {viewMode === 'grid' && filteredAndSortedData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredAndSortedData.map((sd: SousDirection) => (
                  <Card
                      key={sd.id}
                      className="group p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 border-2 hover:border-primary/20"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <Badge variant="secondary" className="font-mono font-bold mb-3">
                          {sd.code}
                        </Badge>
                        <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">
                          {sd.nom}
                        </h3>
                        {sd.libelle && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {sd.libelle}
                            </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t border-border">
                      <div className="flex items-center gap-2">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="text-2xl font-bold text-foreground">{sd.nombreEmployes}</p>
                          <p className="text-xs text-muted-foreground">employés</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleEdit(sd)}
                            className="h-9 w-9 hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDelete(sd.id)}
                            className="h-9 w-9 hover:bg-destructive hover:text-destructive-foreground transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
              ))}
            </div>
        )}

        <SousDirectionModal
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
            title="Supprimer la sous-direction"
            description="Êtes-vous sûr de vouloir supprimer cette sous-direction ? Cette action est irréversible."
            variant="destructive"
        />
      </div>
  );
}