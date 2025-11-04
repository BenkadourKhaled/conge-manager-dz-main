import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Award,
  TrendingUp,
  Search,
  Download,
  ChevronLeft,
  ChevronRight,
  Filter,
  Users,
  Calendar,
  Briefcase,
  CheckCircle,
  XCircle,
  BarChart3,
  MoreVertical,
  Eye,
  Grid,
  Table,
} from 'lucide-react';
import { toast } from 'sonner';
import { icaApi } from '@/api/services';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';

interface SuiviICA {
  employeId: number;
  matricule: string;
  nomComplet: string;
  fonction: string;
  annee: number;
  joursAttribues: number;
  joursConsommes: number;
  joursRestants: number;
  eligibleICA: boolean;
  sousDirection: string;
  service: string;
  photo?: string;
}

const ITEMS_PER_PAGE = 8;

export default function SuiviICA() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');
  const [eligibiliteFilter, setEligibiliteFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');

  const {
    data: suiviResponse,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['ica-suivi', selectedYear],
    queryFn: () => icaApi.getSuiviComplet(selectedYear),
  });

  const { data: statsResponse } = useQuery({
    queryKey: ['ica-stats', selectedYear],
    queryFn: () => icaApi.getStatistiques(selectedYear),
  });

  const suiviData = (suiviResponse?.data || []) as SuiviICA[];
  const statsData = statsResponse?.data;

  // Filtrage par recherche et éligibilité
  const filteredData = useMemo(() => {
    let filtered = suiviData;

    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(
          (item) =>
              item.matricule.toLowerCase().includes(searchLower) ||
              item.nomComplet.toLowerCase().includes(searchLower) ||
              item.fonction.toLowerCase().includes(searchLower)
      );
    }

    if (eligibiliteFilter !== 'ALL') {
      const isEligible = eligibiliteFilter === 'ELIGIBLE';
      filtered = filtered.filter((item) => item.eligibleICA === isEligible);
    }

    return filtered;
  }, [suiviData, searchTerm, eligibiliteFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, currentPage]);

  // Reset pagination when filters change
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm, eligibiliteFilter, selectedYear]);

  // Statistiques
  const stats = useMemo(() => {
    const totalEmployes = suiviData.length;
    const eligibles = suiviData.filter((item) => item.eligibleICA).length;
    const tauxEligibilite =
        totalEmployes > 0 ? (eligibles / totalEmployes) * 100 : 0;
    const totalJoursAttribues = suiviData.reduce(
        (sum, item) => sum + item.joursAttribues,
        0
    );
    const totalJoursConsommes = suiviData.reduce(
        (sum, item) => sum + item.joursConsommes,
        0
    );
    const totalJoursRestants = suiviData.reduce(
        (sum, item) => sum + item.joursRestants,
        0
    );

    return {
      totalEmployes,
      eligibles,
      tauxEligibilite,
      totalJoursAttribues,
      totalJoursConsommes,
      totalJoursRestants,
      filtered: filteredData.length,
    };
  }, [suiviData, filteredData]);

  // Export to CSV
  const exportToCSV = () => {
    const headers = [
      'Matricule',
      'Nom Complet',
      'Fonction',
      'Service',
      'Sous-Direction',
      'Jours Attribués',
      'Jours Consommés',
      'Jours Restants',
      'Éligible ICA',
    ];

    const csvData = filteredData.map((item) => [
      item.matricule,
      item.nomComplet,
      item.fonction,
      item.service || '-',
      item.sousDirection || '-',
      item.joursAttribues,
      item.joursConsommes,
      item.joursRestants,
      item.eligibleICA ? 'Oui' : 'Non',
    ]);

    const csvContent = [
      headers.join(','),
      ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `suivi_ica_${selectedYear}_${
        new Date().toISOString().split('T')[0]
    }.csv`;
    link.click();

    toast.success('Export CSV réussi');
  };

  // Générer les années (année actuelle et 2 années précédentes)
  const availableYears = Array.from(
      { length: 3 },
      (_, i) => new Date().getFullYear() - i
  );

  if (isLoading) {
    return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-muted-foreground">
              Chargement du suivi ICA...
            </p>
          </div>
        </div>
    );
  }

  return (
      <div className="h-[calc(100vh-4rem)] overflow-hidden flex flex-col gap-6 p-6 bg-slate-50">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Award className="h-8 w-8 text-blue-600" />
              Suivi ICA - Prime Annuelle
            </h1>
            <p className="text-slate-500 mt-2">
              Indemnité Compensatrice d'Absence • {stats.filtered} employés
              affichés sur {stats.totalEmployes}
            </p>
          </div>
          <div className="flex gap-3">
            <Select
                value={selectedYear.toString()}
                onValueChange={(value) => setSelectedYear(parseInt(value))}
            >
              <SelectTrigger className="w-[120px] border-slate-200 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
                variant="outline"
                size="sm"
                className="gap-2 border-slate-200 hover:bg-slate-100"
                onClick={exportToCSV}
            >
              <Download className="h-4 w-4" />
              Exporter
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="flex-shrink-0 grid grid-cols-4 gap-4">
          <Card className="p-4 bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total Employés</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {stats.totalEmployes}
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Éligibles ICA</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  {stats.eligibles}
                </p>
              </div>
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Taux d'Éligibilité</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {stats.tauxEligibilite.toFixed(1)}%
                </p>
              </div>
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <div className="mt-2">
              <Progress value={stats.tauxEligibilite} className="h-2" />
            </div>
          </Card>

          <Card className="p-4 bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div>
              <p className="text-sm font-medium text-slate-500">Jours Restants</p>
              <p className="text-2xl font-bold text-amber-600 mt-1">
                {stats.totalJoursRestants}
              </p>
              <p className="text-xs text-slate-500 mt-1">
                {stats.totalJoursConsommes}/{stats.totalJoursAttribues} consommés
              </p>
            </div>
            <div className="mt-2">
              <Progress
                  value={(stats.totalJoursConsommes / stats.totalJoursAttribues) * 100}
                  className="h-2"
              />
            </div>
          </Card>
        </div>

        {/* Filters */}
        <Card className="flex-shrink-0 p-4 bg-white border-slate-200 shadow-sm">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                  placeholder="Rechercher par matricule, nom ou fonction..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <Select
                value={eligibiliteFilter}
                onValueChange={setEligibiliteFilter}
            >
              <SelectTrigger className="w-[220px] border-slate-200 focus:border-blue-500 focus:ring-blue-500">
                <Filter className="h-4 w-4 mr-2 text-slate-400" />
                <SelectValue placeholder="Filtrer par éligibilité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les employés</SelectItem>
                <SelectItem value="ELIGIBLE">Éligibles uniquement</SelectItem>
                <SelectItem value="NON_ELIGIBLE">Non éligibles</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 ml-auto">
              <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className={viewMode === 'table' ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-200 hover:bg-slate-100'}
              >
                <Table className="h-4 w-4 mr-1" />
                Tableau
              </Button>
              <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-200 hover:bg-slate-100'}
              >
                <Grid className="h-4 w-4 mr-1" />
                Grille
              </Button>
            </div>
          </div>
        </Card>

        {/* Table/Grid */}
        <Card className="flex-1 min-h-0 flex flex-col bg-white border-slate-200 shadow-sm">
          <div className="flex-1 min-h-0 flex flex-col">
            {paginatedData.length > 0 ? (
                <>
                  {viewMode === 'table' ? (
                      <div className="flex-1 min-h-0 overflow-auto">
                        <table className="w-full">
                          <thead className="bg-slate-50 sticky top-0 border-b border-slate-200">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Employé
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Fonction
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Service
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Jours ICA
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Éligibilité
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-200">
                          {paginatedData.map((item) => (
                              <tr
                                  key={item.employeId}
                                  className="hover:bg-slate-50 transition-colors"
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <Avatar className="h-10 w-10 mr-3">
                                      <AvatarImage src={item.photo} alt={item.nomComplet} />
                                      <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                                        {item.nomComplet.split(' ').map(n => n[0]).join('')}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="text-sm font-medium text-slate-900">
                                        {item.nomComplet}
                                      </div>
                                      <div className="text-sm text-slate-500">
                                        {item.matricule}
                                      </div>
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <Briefcase className="h-4 w-4 text-slate-400 mr-2" />
                                    <div className="text-sm text-slate-900">{item.fonction}</div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-slate-900">
                                    {item.service || '-'}
                                  </div>
                                  <div className="text-sm text-slate-500">
                                    {item.sousDirection || '-'}
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center space-x-2">
                                    <div className="text-sm">
                                <span className="font-medium text-slate-900">
                                  {item.joursRestants}
                                </span>
                                      <span className="text-slate-500"> restants</span>
                                    </div>
                                    <div className="text-xs text-slate-500">
                                      ({item.joursConsommes}/{item.joursAttribues})
                                    </div>
                                  </div>
                                  <div className="mt-1 w-full">
                                    <Progress
                                        value={(item.joursConsommes / item.joursAttribues) * 100}
                                        className="h-1.5"
                                    />
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  {item.eligibleICA ? (
                                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 flex items-center gap-1 w-fit">
                                        <CheckCircle className="h-3 w-3" />
                                        Éligible
                                      </Badge>
                                  ) : (
                                      <Badge className="bg-red-100 text-red-800 hover:bg-red-100 flex items-center gap-1 w-fit">
                                        <XCircle className="h-3 w-3" />
                                        Non éligible
                                      </Badge>
                                  )}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem className="cursor-pointer">
                                        <Eye className="h-4 w-4 mr-2" />
                                        Voir les détails
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem className="cursor-pointer">
                                        <Download className="h-4 w-4 mr-2" />
                                        Exporter fiche
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </td>
                              </tr>
                          ))}
                          </tbody>
                        </table>
                      </div>
                  ) : (
                      <div className="flex-1 min-h-0 overflow-auto p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {paginatedData.map((item) => (
                              <Card key={item.employeId} className="p-4 border-slate-200 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-3">
                                  <Avatar className="h-12 w-12">
                                    <AvatarImage src={item.photo} alt={item.nomComplet} />
                                    <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                                      {item.nomComplet.split(' ').map(n => n[0]).join('')}
                                    </AvatarFallback>
                                  </Avatar>
                                  {item.eligibleICA ? (
                                      <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100 flex items-center gap-1">
                                        <CheckCircle className="h-3 w-3" />
                                        Éligible
                                      </Badge>
                                  ) : (
                                      <Badge className="bg-red-100 text-red-800 hover:bg-red-100 flex items-center gap-1">
                                        <XCircle className="h-3 w-3" />
                                        Non éligible
                                      </Badge>
                                  )}
                                </div>
                                <div className="mb-3">
                                  <h3 className="font-medium text-slate-900">{item.nomComplet}</h3>
                                  <p className="text-sm text-slate-500">{item.matricule}</p>
                                </div>
                                <div className="space-y-2 mb-4">
                                  <div className="flex items-center text-sm">
                                    <Briefcase className="h-4 w-4 text-slate-400 mr-2" />
                                    <span className="text-slate-700 truncate">{item.fonction}</span>
                                  </div>
                                  <div className="flex items-center text-sm">
                                    <Users className="h-4 w-4 text-slate-400 mr-2" />
                                    <span className="text-slate-700 truncate">{item.service || '-'}</span>
                                  </div>
                                  <div className="mt-3">
                                    <div className="flex justify-between text-sm mb-1">
                                      <span className="text-slate-700">Jours ICA</span>
                                      <span className="font-medium">{item.joursRestants} restants</span>
                                    </div>
                                    <div className="text-xs text-slate-500 mb-1">
                                      {item.joursConsommes}/{item.joursAttribues} consommés
                                    </div>
                                    <Progress
                                        value={(item.joursConsommes / item.joursAttribues) * 100}
                                        className="h-2"
                                    />
                                  </div>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                      variant="outline"
                                      size="sm"
                                      className="flex-1 border-slate-200 hover:bg-slate-100"
                                  >
                                    <Eye className="h-4 w-4 mr-1" />
                                    Détails
                                  </Button>
                                  <Button
                                      variant="outline"
                                      size="sm"
                                      className="border-slate-200 hover:bg-slate-100"
                                  >
                                    <Download className="h-4 w-4" />
                                  </Button>
                                </div>
                              </Card>
                          ))}
                        </div>
                      </div>
                  )}

                  {/* Pagination */}
                  {totalPages > 1 && (
                      <div className="flex-shrink-0 flex items-center justify-between px-6 py-4 border-t border-slate-200">
                        <div className="text-sm text-slate-500">
                          Affichage de {(currentPage - 1) * ITEMS_PER_PAGE + 1} à{' '}
                          {Math.min(
                              currentPage * ITEMS_PER_PAGE,
                              filteredData.length
                          )}{' '}
                          sur {filteredData.length} employés
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                  setCurrentPage((prev) => Math.max(1, prev - 1))
                              }
                              disabled={currentPage === 1}
                              className="border-slate-200 hover:bg-slate-100"
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
                                            className={`w-10 ${currentPage === page ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-200 hover:bg-slate-100'}`}
                                        >
                                          {page}
                                        </Button>
                                    );
                                  } else if (
                                      page === currentPage - 2 ||
                                      page === currentPage + 2
                                  ) {
                                    return (
                                        <span key={page} className="px-2 text-slate-500">
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
                              className="border-slate-200 hover:bg-slate-100"
                          >
                            Suivant
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                  )}
                </>
            ) : (
                <div className="flex items-center justify-center flex-1 text-slate-500">
                  <div className="text-center">
                    <Search className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                    <h3 className="text-lg font-medium text-slate-900 mb-1">Aucun employé trouvé</h3>
                    <p className="text-sm">
                      Essayez de modifier vos critères de recherche ou changez l'année sélectionnée.
                    </p>
                  </div>
                </div>
            )}
          </div>
        </Card>
      </div>
  );
}