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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Plus,
  Eye,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  TrendingUp,
  Users,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { demandesCongesApi } from '@/api/services';
import DemandeCongeModal from '@/components/demandes/DemandeCongeModal';
import StatutModal from '@/components/demandes/StatutModal';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useAuth } from '@/context/AuthContext';
import { cn } from '@/lib/utils';

interface DemandeConge {
  id: number;
  dateDebut: string;
  dateFin: string;
  nombreJours: number;
  statut: 'EN_ATTENTE' | 'APPROUVE' | 'REJETE' | 'REPORTE';
  employeNom: string;
  employeMatricule: string;
  dateCreation: string;
  typeConge?: string;
  adressePendantConge?: string;
  remarque?: string;
  employePhoto?: string;
  employeService?: string;
}

// Palette moderne et professionnelle - Indigo/Slate
const COLORS = {
  primary: 'indigo',
  success: 'emerald',
  warning: 'amber',
  danger: 'rose',
  neutral: 'slate',
};

const statutConfig = {
  EN_ATTENTE: {
    label: 'En attente',
    icon: Clock,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
    badge: 'bg-amber-100 text-amber-700 border-amber-200',
    dot: 'bg-amber-500',
  },
  APPROUVE: {
    label: 'Approuvé',
    icon: CheckCircle2,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
    badge: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    dot: 'bg-emerald-500',
  },
  REJETE: {
    label: 'Refusé',
    icon: XCircle,
    color: 'text-rose-600',
    bg: 'bg-rose-50',
    badge: 'bg-rose-100 text-rose-700 border-rose-200',
    dot: 'bg-rose-500',
  },
  REPORTE: {
    label: 'Reporté',
    icon: Clock,
    color: 'text-indigo-600',
    bg: 'bg-indigo-50',
    badge: 'bg-indigo-100 text-indigo-700 border-indigo-200',
    dot: 'bg-indigo-500',
  },
};

const typeCongeConfig = {
  ANNUEL: { icon: '🏖️', label: 'Annuel', color: 'text-indigo-600' },
  MALADIE: { icon: '🏥', label: 'Maladie', color: 'text-rose-600' },
  EXCEPTIONNEL: { icon: '⭐', label: 'Exceptionnel', color: 'text-purple-600' },
  SANS_SOLDE: { icon: '📋', label: 'Sans solde', color: 'text-slate-600' },
};

const ITEMS_PER_PAGE = 8; // Ultra-compact sans scroll

export default function DemandesConges() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [statutModalOpen, setStatutModalOpen] = useState(false);
  const [selectedDemande, setSelectedDemande] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statutFilter, setStatutFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading, refetch, isFetching } = useQuery({
    queryKey: ['demandes-conges'],
    queryFn: () => demandesCongesApi.getAll(),
  });

  const demandes = (data?.data?.data || []) as DemandeConge[];

  const createMutation = useMutation({
    mutationFn: demandesCongesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demandes-conges'] });
      toast.success('Demande créée avec succès');
      setCreateModalOpen(false);
    },
    onError: (error: any) => {
      toast.error('Erreur lors de la création', {
        description: error.response?.data?.message,
      });
    },
  });

  const updateStatutMutation = useMutation({
    mutationFn: ({ id, data }: any) => demandesCongesApi.updateStatut(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demandes-conges'] });
      toast.success('Statut mis à jour');
      setStatutModalOpen(false);
    },
    onError: (error: any) => {
      toast.error('Erreur', { description: error.response?.data?.message });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: demandesCongesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demandes-conges'] });
      toast.success('Demande supprimée');
      setDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error('Erreur', { description: error.response?.data?.message });
    },
  });

  const filteredDemandes = useMemo(() => {
    return demandes.filter((demande) => {
      const matchesSearch =
          searchTerm === '' ||
          demande.employeNom.toLowerCase().includes(searchTerm.toLowerCase()) ||
          demande.employeMatricule.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatut = statutFilter === 'ALL' || demande.statut === statutFilter;
      return matchesSearch && matchesStatut;
    });
  }, [demandes, searchTerm, statutFilter]);

  const totalPages = Math.ceil(filteredDemandes.length / ITEMS_PER_PAGE);
  const paginatedDemandes = filteredDemandes.slice(
      (currentPage - 1) * ITEMS_PER_PAGE,
      currentPage * ITEMS_PER_PAGE
  );

  const stats = useMemo(() => {
    return {
      total: demandes.length,
      enAttente: demandes.filter((d) => d.statut === 'EN_ATTENTE').length,
      approuve: demandes.filter((d) => d.statut === 'APPROUVE').length,
      rejete: demandes.filter((d) => d.statut === 'REJETE').length,
    };
  }, [demandes]);

  const handleCreate = (data: any) => createMutation.mutate(data);
  const handleUpdateStatut = (data: any) => {
    if (selectedDemande) {
      updateStatutMutation.mutate({ id: selectedDemande.id, data });
    }
  };
  const handleDelete = (id: number) => {
    setItemToDelete(id);
    setDeleteDialogOpen(true);
  };
  const confirmDelete = () => {
    if (itemToDelete) {
      deleteMutation.mutate(itemToDelete);
      setItemToDelete(null);
    }
  };

  return (
      <div className="h-screen flex flex-col bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 overflow-hidden">
        {/* Header Compact */}
        <div className="flex-none border-b bg-white/80 backdrop-blur-sm shadow-sm">
          <div className="max-w-[1600px] mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg">
                  <Calendar className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Gestion des Congés</h1>
                  <p className="text-xs text-slate-600">Vue d'ensemble et suivi</p>
                </div>
              </div>
              <Button
                  onClick={() => setCreateModalOpen(true)}
                  className="bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-lg shadow-indigo-500/30 gap-2 h-10"
              >
                <Plus className="h-4 w-4" />
                Nouvelle demande
              </Button>
            </div>
          </div>
        </div>

        {/* Content Area - Fixed Height */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full max-w-[1600px] mx-auto px-6 py-4 flex flex-col gap-4">
            {/* Stats Compacts */}
            <div className="flex-none grid grid-cols-4 gap-3">
              <Card className="border-slate-200 hover:shadow-md transition-all duration-300 group">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-slate-600 mb-1">Total</p>
                      <p className="text-2xl font-bold text-slate-900">{stats.total}</p>
                    </div>
                    <div className="p-2.5 bg-slate-100 rounded-lg group-hover:bg-slate-200 transition-colors">
                      <Users className="h-5 w-5 text-slate-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-amber-200 hover:shadow-md transition-all duration-300 group">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-amber-600 mb-1">En attente</p>
                      <p className="text-2xl font-bold text-amber-700">{stats.enAttente}</p>
                    </div>
                    <div className="p-2.5 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition-colors">
                      <Clock className="h-5 w-5 text-amber-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-emerald-200 hover:shadow-md transition-all duration-300 group">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-emerald-600 mb-1">Approuvés</p>
                      <p className="text-2xl font-bold text-emerald-700">{stats.approuve}</p>
                    </div>
                    <div className="p-2.5 bg-emerald-100 rounded-lg group-hover:bg-emerald-200 transition-colors">
                      <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-rose-200 hover:shadow-md transition-all duration-300 group">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-rose-600 mb-1">Refusés</p>
                      <p className="text-2xl font-bold text-rose-700">{stats.rejete}</p>
                    </div>
                    <div className="p-2.5 bg-rose-100 rounded-lg group-hover:bg-rose-200 transition-colors">
                      <XCircle className="h-5 w-5 text-rose-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Filters Compact */}
            <div className="flex-none flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="Rechercher..."
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setCurrentPage(1);
                    }}
                    className="pl-10 h-9 border-slate-200 focus:border-indigo-400 focus:ring-indigo-400/20"
                />
              </div>
              <Select value={statutFilter} onValueChange={(value) => { setStatutFilter(value); setCurrentPage(1); }}>
                <SelectTrigger className="w-[180px] h-9 border-slate-200">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    <SelectValue />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tous</SelectItem>
                  <SelectItem value="EN_ATTENTE">En attente</SelectItem>
                  <SelectItem value="APPROUVE">Approuvé</SelectItem>
                  <SelectItem value="REJETE">Refusé</SelectItem>
                  <SelectItem value="REPORTE">Reporté</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Table - SANS SCROLL - 5 lignes fixes */}
            <div className="flex-1 min-h-0">
              <Card className="h-full border-slate-200 shadow-sm">
                <div className="h-full flex flex-col">
                  <div className="flex-1">
                    <Table>
                      <TableHeader className="sticky top-0 bg-slate-50 border-b z-10">
                        <TableRow className="hover:bg-slate-50">
                          <TableHead className="font-semibold text-slate-700">Employé</TableHead>
                          <TableHead className="font-semibold text-slate-700">Type</TableHead>
                          <TableHead className="font-semibold text-slate-700">Période</TableHead>
                          <TableHead className="font-semibold text-slate-700 text-center">Durée</TableHead>
                          <TableHead className="font-semibold text-slate-700">Statut</TableHead>
                          <TableHead className="font-semibold text-slate-700 text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-12">
                                <div className="flex flex-col items-center gap-2">
                                  <div className="h-8 w-8 border-3 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                                  <p className="text-sm text-slate-600">Chargement...</p>
                                </div>
                              </TableCell>
                            </TableRow>
                        ) : paginatedDemandes.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-12">
                                <Calendar className="h-12 w-12 mx-auto text-slate-300 mb-2" />
                                <p className="text-slate-600">Aucune demande</p>
                              </TableCell>
                            </TableRow>
                        ) : (
                            paginatedDemandes.map((demande) => {
                              const StatutIcon = statutConfig[demande.statut].icon;
                              return (
                                  <TableRow key={demande.id} className="hover:bg-slate-50/50 transition-colors">
                                    <TableCell>
                                      <div className="flex items-center gap-3">
                                        <Avatar className="h-9 w-9 border-2 border-slate-200">
                                          <AvatarImage src={demande.employePhoto} />
                                          <AvatarFallback className="bg-indigo-100 text-indigo-700 text-xs font-semibold">
                                            {demande.employeNom?.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                          <p className="font-medium text-slate-900 text-sm truncate">{demande.employeNom}</p>
                                          <p className="text-xs text-slate-500 truncate">{demande.employeMatricule}</p>
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell>
                                      {demande.typeConge && (
                                          <div className="flex items-center gap-1.5">
                                            <span className="text-base">{typeCongeConfig[demande.typeConge as keyof typeof typeCongeConfig]?.icon}</span>
                                            <span className={cn(
                                                'text-xs font-medium',
                                                typeCongeConfig[demande.typeConge as keyof typeof typeCongeConfig]?.color
                                            )}>
                                      {typeCongeConfig[demande.typeConge as keyof typeof typeCongeConfig]?.label}
                                    </span>
                                          </div>
                                      )}
                                    </TableCell>
                                    <TableCell>
                                      <div className="text-xs space-y-0.5">
                                        <div className="font-medium text-slate-900">
                                          {format(new Date(demande.dateDebut), 'dd MMM', { locale: fr })}
                                        </div>
                                        <div className="text-slate-500">
                                          {format(new Date(demande.dateFin), 'dd MMM yy', { locale: fr })}
                                        </div>
                                      </div>
                                    </TableCell>
                                    <TableCell className="text-center">
                                <span className="inline-flex items-center justify-center min-w-[3rem] px-2 py-1 rounded-md bg-indigo-50 text-indigo-700 font-bold text-sm">
                                  {demande.nombreJours}j
                                </span>
                                    </TableCell>
                                    <TableCell>
                                      <Badge className={cn('font-medium text-xs border', statutConfig[demande.statut].badge)}>
                                        <span className={cn('h-1.5 w-1.5 rounded-full mr-1.5', statutConfig[demande.statut].dot)} />
                                        {statutConfig[demande.statut].label}
                                      </Badge>
                                    </TableCell>
                                    <TableCell>
                                      <div className="flex items-center justify-end gap-1">
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                              setSelectedDemande(demande);
                                              setStatutModalOpen(true);
                                            }}
                                            className="h-8 w-8 p-0 hover:bg-indigo-50 text-indigo-600"
                                        >
                                          <Eye className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDelete(demande.id)}
                                            className="h-8 w-8 p-0 hover:bg-rose-50 text-rose-600"
                                        >
                                          <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                      </div>
                                    </TableCell>
                                  </TableRow>
                              );
                            })
                        )}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Pagination Compact */}
                  {totalPages > 1 && (
                      <div className="flex-none border-t bg-slate-50 px-4 py-2.5">
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-slate-600">
                            Page <span className="font-medium">{currentPage}</span> sur <span className="font-medium">{totalPages}</span>
                          </p>
                          <div className="flex gap-1.5">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="h-8 w-8 p-0"
                            >
                              <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="h-8 w-8 p-0"
                            >
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </div>

        {/* Modals */}
        <DemandeCongeModal
            open={createModalOpen}
            onOpenChange={setCreateModalOpen}
            onSubmit={handleCreate}
            isLoading={createMutation.isPending}
        />

        <StatutModal
            open={statutModalOpen}
            onOpenChange={setStatutModalOpen}
            onSubmit={handleUpdateStatut}
            demande={selectedDemande}
            isLoading={updateStatutMutation.isPending}
        />

        <ConfirmDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onConfirm={confirmDelete}
            title="Supprimer la demande"
            description="Cette action est irréversible."
            variant="destructive"
        />
      </div>
  );
}