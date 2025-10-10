import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Award, TrendingUp } from 'lucide-react';
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

export default function SuiviICA() {
  const [selectedYear] = useState(new Date().getFullYear());

  const { data: suiviResponse, isLoading } = useQuery({
    queryKey: ['ica-suivi', selectedYear],
    queryFn: () => icaApi.getSuiviComplet(selectedYear),
  });

  const { data: statsResponse } = useQuery({
    queryKey: ['ica-stats', selectedYear],
    queryFn: () => icaApi.getStatistiques(selectedYear),
  });

  const suiviData = suiviResponse?.data?.data || [];
  const statsData = statsResponse?.data?.data;
  const stats = {
    totalEmployes: statsData?.totalEmployes || 0,
    eligibles: statsData?.employesEligiblesICA || 0,
    tauxEligibilite: statsData?.pourcentageEligibilite || 0,
  };

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
      <div>
        <h1 className="text-3xl font-bold text-foreground">Suivi ICA - Prime Annuelle</h1>
        <p className="mt-2 text-muted-foreground">
          Indemnité Compensatrice d'Absence - Année {new Date().getFullYear()}
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Employés</p>
              <p className="text-3xl font-bold text-foreground">{stats.totalEmployes}</p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg">
              <Award className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Éligibles ICA</p>
              <p className="text-3xl font-bold text-success">{stats.eligibles}</p>
            </div>
            <div className="bg-green-50 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Taux d'Éligibilité</p>
              <p className="text-3xl font-bold text-foreground">{stats.tauxEligibilite.toFixed(1)}%</p>
            </div>
            <div className="bg-purple-50 p-3 rounded-lg">
              <Award className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </Card>
      </div>

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
              {suiviData.map((item) => (
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
                    {item.service}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {item.joursAttribues}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {item.joursConsommes}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {item.joursRestants}
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
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
