import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  TrendingUp,
  Search,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { historiqueCongesApi, employesApi } from '@/api/services';
import HistoriqueModal from '@/components/historiques/HistoriqueModal';
import AjustementModal from '@/components/historiques/AjustementModal';
import ConfirmDialog from '@/components/common/ConfirmDialog';

const ITEMS_PER_PAGE = 3;

export default function HistoriqueCongesPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [ajustementModalOpen, setAjustementModalOpen] = useState(false);
  const [selectedHistorique, setSelectedHistorique] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [historiqueToDelete, setHistoriqueToDelete] = useState<number | null>(
    null
  );
  const [filterAnnee, setFilterAnnee] = useState<string>(
    new Date().getFullYear().toString()
  );
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Récupérer tous les historiques
  const { data: historiquesData, isLoading } = useQuery({
    queryKey: ['historique-conges', filterAnnee],
    queryFn: () =>
      filterAnnee
        ? historiqueCongesApi.getByAnnee(parseInt(filterAnnee))
        : historiqueCongesApi.getAll(),
  });

  // Récupérer les employés pour le filtre de recherche
  const { data: employesData } = useQuery({
    queryKey: ['employes'],
    queryFn: () => employesApi.getAll(),
  });

  // S'assurer que les données sont des tableaux
  const historiques = Array.isArray(historiquesData)
    ? historiquesData
    : Array.isArray(historiquesData?.data)
    ? historiquesData.data
    : Array.isArray(historiquesData?.content)
    ? historiquesData.content
    : [];

  const employes = Array.isArray(employesData)
    ? employesData
    : Array.isArray(employesData?.data)
    ? employesData.data
    : Array.isArray(employesData?.content)
    ? employesData.content
    : [];

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: (id: number) => historiqueCongesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['historique-conges'] });
      toast.success('Historique supprimé avec succès');
      setDeleteDialogOpen(false);
    },
    onError: () => {
      toast.error("Erreur lors de la suppression de l'historique");
    },
  });

  // FIX: Backend only supports per-record ICA recalculation
  const recalculateICAMutation = useMutation({
    mutationFn: async () => {
      if (!historiques || historiques.length === 0) {
        throw new Error('Aucun historique à recalculer');
      }

      // Recalculate ICA for each record
      const ids = historiques.map((h: any) => h.id);

      // Show progress toast
      toast.loading(`Recalcul en cours... 0/${ids.length}`, {
        id: 'ica-recalc',
      });

      const results = await historiqueCongesApi.recalculateICABulk(ids);

      return results;
    },
    onSuccess: (results) => {
      queryClient.invalidateQueries({ queryKey: ['historique-conges'] });

      const successCount = results.filter((r) => r.success).length;
      const failCount = results.filter((r) => !r.success).length;

      toast.dismiss('ica-recalc');

      if (failCount === 0) {
        toast.success(
          `ICA recalculé avec succès pour ${successCount} employé(s)`
        );
      } else {
        toast.warning(
          `ICA recalculé: ${successCount} succès, ${failCount} échec(s)`
        );
      }
    },
    onError: (error: any) => {
      toast.dismiss('ica-recalc');
      console.error('Erreur recalcul ICA:', error);
      toast.error(error.message || 'Erreur lors du recalcul ICA');
    },
  });

  // Filtrer les historiques par recherche - FIX: Use employeNom instead of nested employe object
  const filteredHistoriques = historiques.filter((hist: any) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      hist.employeNom?.toLowerCase().includes(search) ||
      hist.employeMatricule?.toLowerCase().includes(search)
    );
  });

  // ✅ PAGINATION - Calcul des pages et données paginées
  const totalPages = Math.ceil(filteredHistoriques.length / ITEMS_PER_PAGE);
  const paginatedHistoriques = filteredHistoriques.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset pagination quand les filtres changent
  useState(() => {
    setCurrentPage(1);
  }, [searchTerm, filterAnnee]);

  // Calculer les statistiques - FIX: Use correct field names
  const stats = filteredHistoriques.reduce(
    (acc: any, hist: any) => {
      acc.totalEmployes++;
      acc.totalJoursAcquis += hist.nombreJoursAttribues || 0;
      acc.totalJoursUtilises += hist.nombreJoursConsommes || 0;
      acc.totalJoursRestants += hist.nombreJoursRestants || 0;
      if (hist.eligibleICA) acc.eligiblesICA++;
      return acc;
    },
    {
      totalEmployes: 0,
      totalJoursAcquis: 0,
      totalJoursUtilises: 0,
      totalJoursRestants: 0,
      eligiblesICA: 0,
    }
  );

  const handleEdit = (historique: any) => {
    setSelectedHistorique(historique);
    setModalOpen(true);
  };

  const handleAjustement = (historique: any) => {
    setSelectedHistorique(historique);
    setAjustementModalOpen(true);
  };

  const handleDelete = (id: number) => {
    setHistoriqueToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (historiqueToDelete) {
      deleteMutation.mutate(historiqueToDelete);
    }
  };

  const handleRecalculateICA = () => {
    recalculateICAMutation.mutate();
  };

  // Générer les options d'années (5 ans en arrière et 1 an en avant)
  const currentYear = new Date().getFullYear();
  const annees = Array.from({ length: 7 }, (_, i) =>
    (currentYear - 5 + i).toString()
  );

  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden flex flex-col gap-4 p-4">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Historique des Congés</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestion des historiques de congés par année
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => setModalOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nouvel historique
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRecalculateICA}
            disabled={
              recalculateICAMutation.isPending || historiques.length === 0
            }
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${
                recalculateICAMutation.isPending ? 'animate-spin' : ''
              }`}
            />
            Recalculer ICA
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="flex-shrink-0 grid grid-cols-5 gap-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total Employés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{stats.totalEmployes}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Jours Acquis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-blue-600">
              {stats.totalJoursAcquis.toFixed(1)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Jours Utilisés
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-orange-600">
              {stats.totalJoursUtilises.toFixed(1)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Jours Restants
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-green-600">
              {stats.totalJoursRestants.toFixed(1)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Éligibles ICA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-purple-600">
              {stats.eligiblesICA}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card className="flex-shrink-0">
        <CardContent className="pt-4">
          <div className="flex gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Rechercher par nom, prénom ou matricule..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterAnnee} onValueChange={setFilterAnnee}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Année" />
              </SelectTrigger>
              <SelectContent>
                {annees.map((annee) => (
                  <SelectItem key={annee} value={annee}>
                    Année {annee}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tableau */}
      <Card className="flex-1 min-h-0 flex flex-col">
        <CardContent className="pt-4 flex-1 min-h-0 flex flex-col">
          {isLoading ? (
            <div className="flex items-center justify-center flex-1">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                <p className="mt-4 text-muted-foreground">Chargement...</p>
              </div>
            </div>
          ) : paginatedHistoriques && paginatedHistoriques.length > 0 ? (
            <div className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 min-h-0 overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employé</TableHead>
                      <TableHead>Année</TableHead>
                      <TableHead className="text-right">
                        Jours Attribués
                      </TableHead>
                      <TableHead className="text-right">
                        Jours Consommés
                      </TableHead>
                      <TableHead className="text-right">
                        Jours Restants
                      </TableHead>
                      <TableHead>ICA</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedHistoriques.map((historique: any) => (
                      <TableRow key={historique.id}>
                        <TableCell className="font-medium">
                          {historique.employeNom || '-'}
                        </TableCell>
                        <TableCell>{historique.anneeConge}</TableCell>
                        <TableCell className="text-right">
                          {historique.nombreJoursAttribues?.toFixed(1) || '0.0'}
                        </TableCell>
                        <TableCell className="text-right">
                          {historique.nombreJoursConsommes?.toFixed(1) || '0.0'}
                        </TableCell>
                        <TableCell className="text-right">
                          <span
                            className={
                              historique.nombreJoursRestants < 5
                                ? 'text-red-600 font-semibold'
                                : historique.nombreJoursRestants < 15
                                ? 'text-orange-600'
                                : 'text-green-600'
                            }
                          >
                            {historique.nombreJoursRestants?.toFixed(1) ||
                              '0.0'}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            className={
                              historique.eligibleICA
                                ? 'bg-green-100 text-green-700 hover:bg-green-100'
                                : 'bg-red-100 text-red-700 hover:bg-red-100'
                            }
                          >
                            {historique.eligibleICA
                              ? 'Éligible'
                              : 'Non éligible'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-2 justify-end">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAjustement(historique)}
                              title="Ajuster les jours"
                            >
                              <TrendingUp className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEdit(historique)}
                              title="Modifier"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDelete(historique.id)}
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* ✅ PAGINATION */}
              {totalPages > 1 && (
                <div className="flex-shrink-0 flex items-center justify-between px-2 py-3 border-t border-border">
                  <div className="text-sm text-muted-foreground">
                    Affichage de {(currentPage - 1) * ITEMS_PER_PAGE + 1} à{' '}
                    {Math.min(
                      currentPage * ITEMS_PER_PAGE,
                      filteredHistoriques.length
                    )}{' '}
                    sur {filteredHistoriques.length} historiques
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
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
                                variant={
                                  currentPage === page ? 'default' : 'outline'
                                }
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
            </div>
          ) : (
            <div className="flex items-center justify-center flex-1 text-muted-foreground">
              <div className="text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>Aucun historique trouvé</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modals */}
      <HistoriqueModal
        open={modalOpen}
        onOpenChange={(open) => {
          setModalOpen(open);
          if (!open) setSelectedHistorique(null);
        }}
        onSubmit={() => {
          setModalOpen(false);
          setSelectedHistorique(null);
        }}
        initialData={selectedHistorique}
      />

      <AjustementModal
        open={ajustementModalOpen}
        onOpenChange={(open) => {
          setAjustementModalOpen(open);
          if (!open) setSelectedHistorique(null);
        }}
        historique={selectedHistorique}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Supprimer l'historique"
        description="Êtes-vous sûr de vouloir supprimer cet historique de congé ? Cette action est irréversible."
        variant="destructive"
      />
    </div>
  );
}
