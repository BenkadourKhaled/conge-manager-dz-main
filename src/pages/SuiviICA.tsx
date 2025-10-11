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
import { Award, TrendingUp, Search, Download, ChevronLeft, ChevronRight, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { icaApi } from '@/api/services';

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
}

const ITEMS_PER_PAGE = 5;

export default function SuiviICA() {
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');
  const [eligibiliteFilter, setEligibiliteFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  const { data: suiviResponse, isLoading, refetch } = useQuery({
    queryKey: ['ica-suivi', selectedYear],
    queryFn: () => icaApi.getSuiviComplet(selectedYear),
  });

  const { data: statsResponse } = useQuery({
    queryKey: ['ica-stats', selectedYear],
    queryFn: () => icaApi.getStatistiques(selectedYear),
  });

  const suiviData = (suiviResponse?.data?.data || []) as SuiviICA[];
  const statsData = statsResponse?.data?.data;

  // Filtrage par recherche et éligibilité
  const filteredData = useMemo(() => {
    let filtered = suiviData;

    // Filtre par recherche (matricule ou nom)
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter((item) =>
        item.matricule.toLowerCase().includes(searchLower) ||
        item.nomComplet.toLowerCase().includes(searchLower)
      );
    }

    // Filtre par éligibilité
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
    const tauxEligibilite = totalEmployes > 0 ? (eligibles / totalEmployes) * 100 : 0;
    const totalJoursAttribues = suiviData.reduce((sum, item) => sum + item.joursAttribues, 0);
    const totalJoursConsommes = suiviData.reduce((sum, item) => sum + item.joursConsommes, 0);
    const totalJoursRestants = suiviData.reduce((sum, item) => sum + item.joursRestants, 0);

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
    link.download = `suivi_ica_${selectedYear}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();

    toast.success('Export CSV réussi');
  };

  // Générer les années (année actuelle et 2 années précédentes)
  const availableYears = Array.from({ length: 3 }, (_, i) => new Date().getFullYear() - i);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement du suivi ICA...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Suivi ICA - Prime Annuelle</h1>
          <p className="mt-2 text-muted-foreground">
            Indemnité Compensatrice d'Absence • {stats.filtered} employés affichés sur {stats.totalEmployes}
          </p>
        </div>
        <div className="flex gap-2">
          <Select
            value={selectedYear.toString()}
            onValueChange={(value) => setSelectedYear(parseInt(value))}
          >
            <SelectTrigger className="w-[120px]">
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
          <Button variant="outline" className="gap-2" onClick={exportToCSV}>
            <Download className="h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Employés</p>
              <p className="text-2xl font-bold text-foreground">{stats.totalEmployes}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <Award className="h-5 w-5 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Éligibles ICA</p>
              <p className="text-2xl font-bold text-success">{stats.eligibles}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Taux d'Éligibilité</p>
              <p className="text-2xl font-bold text-foreground">{stats.tauxEligibilite.toFixed(1)}%</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <Award className="h-5 w-5 text-purple-600" />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div>
            <p className="text-sm text-muted-foreground">Jours Restants</p>
            <p className="text-2xl font-bold text-primary">{stats.totalJoursRestants}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {stats.totalJoursConsommes}/{stats.totalJoursAttribues} consommés
            </p>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Rechercher par matricule ou nom complet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={eligibiliteFilter} onValueChange={setEligibiliteFilter}>
            <SelectTrigger className="w-full md:w-[200px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filtrer par éligibilité" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tous</SelectItem>
              <SelectItem value="ELIGIBLE">Éligibles uniquement</SelectItem>
              <SelectItem value="NON_ELIGIBLE">Non éligibles</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Table */}
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
                  Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  J. Attribués
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  J. Consommés
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  J. Restants
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Éligibilité ICA
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <tr key={item.employeId} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                      {item.matricule}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      {item.nomComplet}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {item.fonction}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      {item.service || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      <span className="font-semibold">{item.joursAttribues}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      <span className="font-semibold">{item.joursConsommes}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`font-semibold ${item.joursRestants < 5 ? 'text-warning' : 'text-foreground'}`}>
                        {item.joursRestants}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.eligibleICA ? (
                        <Badge className="bg-success text-success-foreground">
                          <Award className="h-3 w-3 mr-1" />
                          Éligible
                        </Badge>
                      ) : (
                        <Badge variant="secondary">Non éligible</Badge>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center">
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
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredData.length)}{' '}
              sur {filteredData.length} employés
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
                      <span key={page} className="px-2">
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
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
