 import { useState, useEffect } from 'react';
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
  Users,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Filter,
  MoreVertical,
  Download,
  BarChart3,
  Settings,
  Grid3X3,
  List,
  Eye,
  Edit,
  Trash,
  AlertCircle,
  Sparkles,
  TrendingDown,
  Award,
  Target,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { historiqueCongesApi, employesApi } from '@/api/services';
import HistoriqueModal from '@/components/historiques/HistoriqueModal';
import AjustementModal from '@/components/historiques/AjustementModal';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { cn } from '@/lib/utils';

// Pagination de 5 lignes
const ITEMS_PER_PAGE = 5;

export default function HistoriqueCongesPage() {
  const queryClient = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [ajustementModalOpen, setAjustementModalOpen] = useState(false);
  const [selectedHistorique, setSelectedHistorique] = useState(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [historiqueToDelete, setHistoriqueToDelete] = useState(null);
  const [filterAnnee, setFilterAnnee] = useState('all');
  const [filterEligibilite, setFilterEligibilite] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('table');
  const [selectedRows, setSelectedRows] = useState([]);

  // Récupérer tous les historiques
  const { data: historiquesData, isLoading } = useQuery({
    queryKey: ['historique-conges', filterAnnee],
    queryFn: () =>
        filterAnnee && filterAnnee !== 'all'
            ? historiqueCongesApi.getByAnnee(parseInt(filterAnnee))
            : historiqueCongesApi.getAll(),
  });

  // Récupérer les employés pour le filtre de recherche
  const { data: employesData } = useQuery({
    queryKey: ['employes'],
    queryFn: () => employesApi.getAll(),
  });

  // Extraction des données
  const historiques = (() => {
    if (historiquesData?.data?.data && Array.isArray(historiquesData.data.data)) {
      return historiquesData.data.data;
    }
    if (historiquesData?.data && Array.isArray(historiquesData.data)) {
      return historiquesData.data;
    }
    if (Array.isArray(historiquesData)) {
      return historiquesData;
    }
    if (historiquesData?.content && Array.isArray(historiquesData.content)) {
      return historiquesData.content;
    }
    return [];
  })();

  const employes = (() => {
    if (employesData?.data?.data && Array.isArray(employesData.data.data)) {
      return employesData.data.data;
    }
    if (employesData?.data && Array.isArray(employesData.data)) {
      return employesData.data;
    }
    if (Array.isArray(employesData)) {
      return employesData;
    }
    if (employesData?.content && Array.isArray(employesData.content)) {
      return employesData.content;
    }
    return [];
  })();

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: (id) => historiqueCongesApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['historique-conges'] });
      toast.success('Historique supprimé avec succès');
      setDeleteDialogOpen(false);
    },
    onError: () => {
      toast.error("Erreur lors de la suppression de l'historique");
    },
  });

  const recalculateICAMutation = useMutation({
    mutationFn: async () => {
      if (!historiques || historiques.length === 0) {
        throw new Error('Aucun historique à recalculer');
      }

      const ids = historiques.map((h) => h.id);

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
        toast.success(`ICA recalculé avec succès pour ${successCount} employé(s)`);
      } else {
        toast.warning(`ICA recalculé: ${successCount} succès, ${failCount} échec(s)`);
      }
    },
    onError: (error) => {
      toast.dismiss('ica-recalc');
      console.error('Erreur recalcul ICA:', error);
      toast.error(error.message || 'Erreur lors du recalcul ICA');
    },
  });

  // Filtrer les historiques par recherche et éligibilité ICA
  const filteredHistoriques = historiques.filter((hist) => {
    // Filtre par recherche
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesSearch =
          hist.employeNom?.toLowerCase().includes(search) ||
          hist.employeMatricule?.toLowerCase().includes(search);
      if (!matchesSearch) return false;
    }

    // Filtre par éligibilité ICA
    if (filterEligibilite !== 'all') {
      if (filterEligibilite === 'eligible' && !hist.eligibleICA) return false;
      if (filterEligibilite === 'non-eligible' && hist.eligibleICA) return false;
    }

    return true;
  });

  // Pagination
  const totalPages = Math.ceil(filteredHistoriques.length / ITEMS_PER_PAGE);
  const paginatedHistoriques = filteredHistoriques.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
  );

  // Calculer les statistiques
  const stats = {
    total: historiques.length,
    eligible: historiques.filter((h) => h.eligibleICA).length,
    nonEligible: historiques.filter((h) => !h.eligibleICA).length,
    totalJoursAcquis: historiques.reduce((sum, h) => sum + (h.joursAcquis || 0), 0),
    totalJoursPris: historiques.reduce((sum, h) => sum + (h.joursPris || 0), 0),
    totalSolde: historiques.reduce((sum, h) => sum + (h.solde || 0), 0),
  };

  // Obtenir les années uniques
  const annees = [
    ...new Set(historiques.map((h) => h.annee).filter(Boolean)),
  ].sort((a, b) => b - a);

  // Gérer les actions
  const handleAjustement = (historique) => {
    setSelectedHistorique(historique);
    setAjustementModalOpen(true);
  };

  const handleEdit = (historique) => {
    setSelectedHistorique(historique);
    setModalOpen(true);
  };

  const handleDelete = (id) => {
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

  const handleExport = () => {
    toast.info('Fonctionnalité d\'export en cours de développement');
  };

  return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-indigo-50/20">
        <div className="container mx-auto p-4 sm:p-6 space-y-4">
          {/* En-tête avec statistiques */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-700 via-indigo-700 to-purple-700 bg-clip-text text-transparent flex items-center gap-3">
                  <FileText className="h-8 w-8 text-violet-600" />
                  Historique des Congés
                </h1>
                <p className="text-slate-600 mt-1 text-sm">
                  Gérez l'historique des congés et les indemnités compensatoires (ICA)
                </p>
              </div>
              <Button
                  onClick={() => setModalOpen(true)}
                  className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/30"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouvel historique
              </Button>
            </div>

            {/* Stats Cards - Compact */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-3">
              <Card className="border-l-4 border-l-violet-500 shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-600 font-medium mb-0.5">Total</p>
                      <p className="text-xl font-bold text-slate-900">{stats.total}</p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-violet-100 flex items-center justify-center">
                      <Users className="h-5 w-5 text-violet-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-600 font-medium mb-0.5">Éligibles ICA</p>
                      <p className="text-xl font-bold text-emerald-700">{stats.eligible}</p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                      <CheckCircle className="h-5 w-5 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-slate-500 shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-600 font-medium mb-0.5">Non éligibles</p>
                      <p className="text-xl font-bold text-slate-700">{stats.nonEligible}</p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-slate-100 flex items-center justify-center">
                      <XCircle className="h-5 w-5 text-slate-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500 shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-600 font-medium mb-0.5">Jours acquis</p>
                      <p className="text-xl font-bold text-blue-700">{stats.totalJoursAcquis}</p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500 shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-600 font-medium mb-0.5">Jours pris</p>
                      <p className="text-xl font-bold text-orange-700">{stats.totalJoursPris}</p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-orange-100 flex items-center justify-center">
                      <TrendingDown className="h-5 w-5 text-orange-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-indigo-500 shadow-sm hover:shadow-md transition-all duration-200">
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-slate-600 font-medium mb-0.5">Solde total</p>
                      <p className="text-xl font-bold text-indigo-700">{stats.totalSolde}</p>
                    </div>
                    <div className="h-10 w-10 rounded-lg bg-indigo-100 flex items-center justify-center">
                      <Award className="h-5 w-5 text-indigo-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Filtres et actions - Compact */}
          <Card className="border-violet-200 shadow-md">
            <CardContent className="p-3">
              <div className="flex flex-col sm:flex-row gap-3">
                {/* Recherche */}
                <div className="relative flex-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                      placeholder="Rechercher par nom ou matricule..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-9 h-9 border-slate-200 focus:border-violet-400 focus:ring-violet-400"
                  />
                </div>

                {/* Filtre année */}
                <Select value={filterAnnee} onValueChange={(value) => {
                  setFilterAnnee(value);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-[150px] h-9 border-slate-200">
                    <Calendar className="h-4 w-4 mr-2 text-violet-600" />
                    <SelectValue placeholder="Année" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les années</SelectItem>
                    {annees.map((annee) => (
                        <SelectItem key={annee} value={annee.toString()}>
                          {annee}
                        </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Filtre éligibilité ICA */}
                <Select value={filterEligibilite} onValueChange={(value) => {
                  setFilterEligibilite(value);
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-[170px] h-9 border-slate-200">
                    <Filter className="h-4 w-4 mr-2 text-violet-600" />
                    <SelectValue placeholder="Éligibilité" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="eligible">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-600" />
                        <span>Éligible ICA</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="non-eligible">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-3.5 w-3.5 text-slate-600" />
                        <span>Non éligible ICA</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>

                {/* Actions */}
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleRecalculateICA}
                    disabled={recalculateICAMutation.isPending || historiques.length === 0}
                    className="h-9 hover:bg-violet-50 hover:border-violet-300"
                >
                  <RefreshCw className={cn("h-4 w-4 mr-2", recalculateICAMutation.isPending && "animate-spin")} />
                  Recalculer ICA
                </Button>

                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    className="h-9 hover:bg-violet-50 hover:border-violet-300"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exporter
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Table - Compact avec 5 lignes */}
          <Card className="border-0 shadow-xl shadow-slate-200/50 overflow-hidden">
            <CardContent className="p-0">
              {isLoading ? (
                  <div className="flex items-center justify-center py-16">
                    <div className="text-center space-y-4">
                      <div className="relative w-12 h-12 mx-auto">
                        <div className="absolute inset-0 rounded-full border-4 border-violet-200"></div>
                        <div className="absolute inset-0 rounded-full border-4 border-t-violet-600 animate-spin"></div>
                      </div>
                      <p className="text-slate-600 font-medium text-sm">Chargement des données...</p>
                    </div>
                  </div>
              ) : paginatedHistoriques.length > 0 ? (
                  <div className="flex flex-col h-full">
                    <div className="overflow-x-auto flex-1">
                      <Table>
                        <TableHeader>
                          <TableRow className="bg-gradient-to-r from-slate-50 to-slate-100 hover:from-slate-100 hover:to-slate-100 border-b border-slate-200">
                            <TableHead className="font-semibold text-slate-700 text-xs py-2 w-[280px]">Employé</TableHead>
                            <TableHead className="font-semibold text-slate-700 text-xs py-2">Année</TableHead>
                            <TableHead className="font-semibold text-slate-700 text-right text-xs py-2">Attribués</TableHead>
                            <TableHead className="font-semibold text-slate-700 text-right text-xs py-2">Consommés</TableHead>
                            <TableHead className="font-semibold text-slate-700 text-right text-xs py-2">Restants</TableHead>
                            <TableHead className="font-semibold text-slate-700 text-xs py-2">Éligibilité ICA</TableHead>
                            <TableHead className="font-semibold text-slate-700 text-right text-xs py-2">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {paginatedHistoriques.map((historique, index) => (
                              <TableRow
                                  key={historique.id}
                                  className="hover:bg-gradient-to-r hover:from-violet-50/50 hover:to-indigo-50/50 transition-all duration-200 border-b border-slate-100"
                              >
                                <TableCell className="py-2">
                                  <div className="flex items-center gap-2">
                                    <div className="relative">
                                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-semibold shadow-md shadow-violet-500/20 text-sm">
                                        {historique.employeNom?.charAt(0)?.toUpperCase() || 'E'}
                                      </div>
                                      <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 border border-white rounded-full"></div>
                                    </div>
                                    <div>
                                      <p className="font-semibold text-slate-900 text-sm">{historique.employeNom}</p>
                                      <p className="text-xs text-slate-500 font-medium">{historique.employeMatricule}</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="py-2">
                                  <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-200 font-medium px-2 py-0.5 text-xs">
                                    {historique.anneeConge}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right py-2">
                                  <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-blue-50 border border-blue-100">
                                    <Calendar className="h-3 w-3 text-blue-600" />
                                    <span className="font-semibold text-blue-900 text-sm">{historique.nombreJoursAttribues?.toFixed(1) || '0.0'}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right py-2">
                                  <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-amber-50 border border-amber-100">
                                    <Clock className="h-3 w-3 text-amber-600" />
                                    <span className="font-semibold text-amber-900 text-sm">{historique.nombreJoursConsommes?.toFixed(1) || '0.0'}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="text-right py-2">
                                  <div className={cn(
                                      "inline-flex items-center gap-1.5 px-2 py-1 rounded-lg font-semibold text-sm",
                                      historique.nombreJoursRestants < 5
                                          ? "bg-rose-50 border border-rose-100 text-rose-900"
                                          : historique.nombreJoursRestants < 15
                                              ? "bg-orange-50 border border-orange-100 text-orange-900"
                                              : "bg-emerald-50 border border-emerald-100 text-emerald-900"
                                  )}>
                                    <Target className="h-3 w-3" />
                                    <span>{historique.nombreJoursRestants?.toFixed(1) || '0.0'}</span>
                                  </div>
                                </TableCell>
                                <TableCell className="py-2">
                                  <Badge
                                      className={cn(
                                          "font-semibold px-2 py-1 shadow-sm text-xs",
                                          historique.eligibleICA
                                              ? "bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:from-emerald-600 hover:to-teal-700"
                                              : "bg-gradient-to-r from-slate-400 to-slate-500 text-white hover:from-slate-500 hover:to-slate-600"
                                      )}
                                  >
                                    {historique.eligibleICA ? (
                                        <span className="flex items-center gap-1">
                                          <CheckCircle className="h-3 w-3" />
                                          Éligible
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1">
                                          <XCircle className="h-3 w-3" />
                                          Non éligible
                                        </span>
                                    )}
                                  </Badge>
                                </TableCell>
                                <TableCell className="py-2">
                                  <div className="flex items-center justify-end gap-0.5">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleAjustement(historique)}
                                        className="h-7 w-7 p-0 hover:bg-violet-50 hover:text-violet-700 transition-all duration-200 rounded-lg"
                                        title="Ajuster les jours"
                                    >
                                      <TrendingUp className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleEdit(historique)}
                                        className="h-7 w-7 p-0 hover:bg-blue-50 hover:text-blue-700 transition-all duration-200 rounded-lg"
                                        title="Modifier"
                                    >
                                      <Edit className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDelete(historique.id)}
                                        className="h-7 w-7 p-0 hover:bg-rose-50 hover:text-rose-700 transition-all duration-200 rounded-lg"
                                        title="Supprimer"
                                    >
                                      <Trash className="h-3.5 w-3.5" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination compacte */}
                    {totalPages > 1 && (
                        <div className="flex-shrink-0 flex items-center justify-between px-4 py-2.5 border-t border-slate-200 bg-gradient-to-r from-slate-50 to-slate-100">
                          <div className="text-xs text-slate-600 font-medium">
                            Affichage de <span className="text-violet-700 font-semibold">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> à{' '}
                            <span className="text-violet-700 font-semibold">{Math.min(currentPage * ITEMS_PER_PAGE, filteredHistoriques.length)}</span> sur{' '}
                            <span className="text-violet-700 font-semibold">{filteredHistoriques.length}</span> historiques
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                                disabled={currentPage === 1}
                                className="h-7 w-7 p-0 hover:bg-violet-50 hover:border-violet-300 disabled:opacity-40"
                            >
                              <ChevronLeft className="h-3.5 w-3.5" />
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
                                          className={cn(
                                              "h-7 w-7 p-0 text-xs font-semibold transition-all duration-200",
                                              currentPage === page
                                                  ? "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-md shadow-violet-500/30"
                                                  : "hover:bg-violet-50 hover:border-violet-300"
                                          )}
                                      >
                                        {page}
                                      </Button>
                                  );
                                } else if (page === currentPage - 2 || page === currentPage + 2) {
                                  return (
                                      <span key={page} className="px-1 text-slate-400 font-medium text-xs">
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
                                className="h-7 w-7 p-0 hover:bg-violet-50 hover:border-violet-300 disabled:opacity-40"
                            >
                              <ChevronRight className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                    )}
                  </div>
              ) : (
                  <div className="flex items-center justify-center py-16">
                    <div className="text-center space-y-4 max-w-md">
                      <div className="relative w-16 h-16 mx-auto">
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-100 to-indigo-100 rounded-3xl rotate-6"></div>
                        <div className="absolute inset-0 bg-gradient-to-br from-violet-50 to-indigo-50 rounded-3xl flex items-center justify-center">
                          <FileText className="h-8 w-8 text-violet-400" />
                        </div>
                      </div>
                      <div>
                        <h3 className="text-lg font-bold text-slate-900 mb-1.5">Aucun historique trouvé</h3>
                        <p className="text-slate-500 text-sm">
                          {searchTerm || filterAnnee !== 'all' || filterEligibilite !== 'all'
                              ? 'Essayez de modifier vos filtres pour voir plus de résultats.'
                              : 'Commencez par ajouter un nouvel historique de congé.'}
                        </p>
                      </div>
                      <Button
                          onClick={() => setModalOpen(true)}
                          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg shadow-violet-500/30"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Nouvel historique
                      </Button>
                    </div>
                  </div>
              )}
            </CardContent>
          </Card>
        </div>

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