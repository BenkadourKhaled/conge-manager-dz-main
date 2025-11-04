/**
 * Page Audit Trail - Consultation des logs d'audit
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Shield,
  Search,
  Calendar,
  User,
  FileText,
  CheckCircle2,
  XCircle,
  Filter,
  Download,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { auditApi } from '@/api/services';
import { QUERY_KEYS } from '@/constants';
import type { AuditTrailResponse, OperationType } from '@/types/api.types';
import { cn } from '@/lib/utils';

const operationTypeConfig: Record<
  OperationType,
  { label: string; color: string; bg: string }
> = {
  CREATE: {
    label: 'Création',
    color: 'text-emerald-700',
    bg: 'bg-emerald-50',
  },
  UPDATE: {
    label: 'Modification',
    color: 'text-blue-700',
    bg: 'bg-blue-50',
  },
  DELETE: {
    label: 'Suppression',
    color: 'text-rose-700',
    bg: 'bg-rose-50',
  },
};

export default function AuditTrail() {
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [operationFilter, setOperationFilter] = useState<string>('all');

  const { data: auditsData, isLoading } = useQuery({
    queryKey: QUERY_KEYS.AUDIT_RECENT,
    queryFn: () => auditApi.getRecent(),
  });

  const audits = (auditsData?.data || []) as AuditTrailResponse[];

  // Filtrage des audits
  const filteredAudits = audits.filter((audit) => {
    const matchesSearch =
      searchTerm === '' ||
      audit.performedBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
      audit.entityName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      audit.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesEntity = entityFilter === 'all' || audit.entityName === entityFilter;

    const matchesOperation =
      operationFilter === 'all' || audit.operationType === operationFilter;

    return matchesSearch && matchesEntity && matchesOperation;
  });

  // Liste unique des entités pour le filtre
  const entityTypes = Array.from(new Set(audits.map((a) => a.entityName)));

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'dd MMM yyyy HH:mm', { locale: fr });
    } catch {
      return dateString;
    }
  };

  const exportToCSV = () => {
    const headers = [
      'Date',
      'Utilisateur',
      'Entité',
      'ID',
      'Opération',
      'Description',
      'Statut',
    ];
    const rows = filteredAudits.map((audit) => [
      formatDate(audit.performedAt),
      audit.performedBy,
      audit.entityName,
      audit.entityId,
      audit.operationType,
      audit.description || '',
      audit.success ? 'Succès' : 'Échec',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `audit-trail-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden bg-gradient-to-br from-background to-muted/20 flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex items-center justify-between p-6">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Journal d'Audit</h1>
                <p className="text-sm text-muted-foreground">
                  Consultation des logs et activités système
                </p>
              </div>
            </div>
            <Button onClick={exportToCSV} variant="outline" className="gap-2">
              <Download className="h-4 w-4" />
              Exporter CSV
            </Button>
          </div>
        </div>

      {/* Filters */}
      <div className="flex-shrink-0 border-b bg-background p-4">
          <div className="flex flex-wrap gap-3">
            <div className="flex-1 min-w-[300px] relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher par utilisateur, entité ou description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={entityFilter} onValueChange={setEntityFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Type d'entité" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les entités</SelectItem>
                {entityTypes.map((entity) => (
                  <SelectItem key={entity} value={entity}>
                    {entity}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={operationFilter} onValueChange={setOperationFilter}>
              <SelectTrigger className="w-[180px]">
                <FileText className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Opération" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les opérations</SelectItem>
                <SelectItem value="CREATE">Création</SelectItem>
                <SelectItem value="UPDATE">Modification</SelectItem>
                <SelectItem value="DELETE">Suppression</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6">
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="text-lg">
                Historique des opérations ({filteredAudits.length})
              </CardTitle>
              <CardDescription>
                Les 100 dernières opérations enregistrées dans le système
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center space-y-3">
                    <div className="animate-spin rounded-full h-12 w-12 border-3 border-primary border-t-transparent mx-auto"></div>
                    <p className="text-sm text-muted-foreground">
                      Chargement des logs d'audit...
                    </p>
                  </div>
                </div>
              ) : filteredAudits.length === 0 ? (
                <div className="text-center py-12">
                  <Shield className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                  <p className="text-lg font-medium text-foreground">Aucune activité trouvée</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Essayez de modifier vos filtres de recherche
                  </p>
                </div>
              ) : (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[180px]">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Date & Heure
                          </div>
                        </TableHead>
                        <TableHead>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            Utilisateur
                          </div>
                        </TableHead>
                        <TableHead>Entité</TableHead>
                        <TableHead className="w-[120px]">Opération</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead className="w-[100px]">Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredAudits.map((audit) => {
                        const opConfig = operationTypeConfig[audit.operationType];
                        return (
                          <TableRow key={audit.id} className="hover:bg-muted/50">
                            <TableCell className="font-mono text-xs">
                              {formatDate(audit.performedAt)}
                            </TableCell>
                            <TableCell className="font-medium">{audit.performedBy}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">{audit.entityName}</span>
                                <span className="text-xs text-muted-foreground">
                                  ID: {audit.entityId}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge className={cn('font-medium', opConfig.color, opConfig.bg)}>
                                {opConfig.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <span className="text-sm text-muted-foreground">
                                {audit.description || '-'}
                              </span>
                            </TableCell>
                            <TableCell>
                              {audit.success ? (
                                <div className="flex items-center gap-1 text-emerald-600">
                                  <CheckCircle2 className="h-4 w-4" />
                                  <span className="text-xs font-medium">Succès</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1 text-rose-600">
                                  <XCircle className="h-4 w-4" />
                                  <span className="text-xs font-medium">Échec</span>
                                </div>
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
      </div>
    </div>
  );
}
