import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Plus,
  Eye,
  Trash2,
  Search,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { demandesCongesApi } from '@/api/services';
import DemandeCongeModal from '@/components/demandes/DemandeCongeModal';
import StatutModal from '@/components/demandes/StatutModal';
import ConfirmDialog from '@/components/common/ConfirmDialog';
import { useAuth } from '@/context/AuthContext';

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
}

const statutColors = {
  EN_ATTENTE: 'bg-warning text-warning-foreground',
  APPROUVE: 'bg-success text-success-foreground',
  REJETE: 'bg-destructive text-destructive-foreground',
  REPORTE: 'bg-secondary text-secondary-foreground',
};

const statutLabels = {
  EN_ATTENTE: 'En Attente',
  APPROUVE: 'Approuvé',
  REJETE: 'Rejeté',
  REPORTE: 'Reporté',
};

const ITEMS_PER_PAGE = 5;

export default function DemandesConges() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [statutModalOpen, setStatutModalOpen] = useState(false);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [selectedDemande, setSelectedDemande] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['demandes-conges'],
    queryFn: () => demandesCongesApi.getAll(),
  });

  const demandes = (data?.data?.data || []) as DemandeConge[];

  const createMutation = useMutation({
    mutationFn: demandesCongesApi.create,
    onSuccess: (response) => {
      console.log('✅ Demande créée avec succès:', response);
      queryClient.invalidateQueries({ queryKey: ['demandes-conges'] });
      toast.success('Demande de congé créée avec succès');
      setCreateModalOpen(false);
    },
    onError: (error: any) => {
      console.error('❌ Erreur lors de la création:', error);
      console.error("📋 Détails de l'erreur:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        statusText: error.response?.statusText,
      });

      const errorMessage =
        error.response?.data?.message ||
        'Erreur lors de la création de la demande';
      toast.error(errorMessage);
    },
  });

  const updateStatutMutation = useMutation({
    mutationFn: ({ id, data }: any) => demandesCongesApi.updateStatut(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demandes-conges'] });
      toast.success('Statut mis à jour avec succès');
      setStatutModalOpen(false);
      setSelectedDemande(null);
    },
    onError: () => {
      toast.error('Erreur lors de la mise à jour');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: demandesCongesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demandes-conges'] });
      toast.success('Demande supprimée avec succès');
      setDeleteDialogOpen(false);
      setItemToDelete(null);
    },
    onError: () => {
      toast.error('Erreur lors de la suppression');
    },
  });

  const handleCreate = (data: any) => {
    console.log('🚀 Tentative de création avec les données:', data);
    console.log('🔍 Vérification des données:', {
      employeIdEstUnNombre: typeof data.employeId === 'number',
      employeIdValeur: data.employeId,
      dateDebutFormat: data.dateDebut,
      dateFinFormat: data.dateFin,
      typeConge: data.typeConge,
      anneeConge: data.anneeConge,
    });
    createMutation.mutate(data);
  };

  const handleUpdateStatut = (data: any) => {
    if (selectedDemande) {
      updateStatutMutation.mutate({ id: selectedDemande.id, data });
    }
  };

  const handleOpenStatutModal = (demande: any) => {
    setSelectedDemande(demande);
    setStatutModalOpen(true);
  };

  const handleOpenDetailsModal = (demande: any) => {
    setSelectedDemande(demande);
    setDetailsModalOpen(true);
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

  const canModifyStatut = user?.role === 'MANAGER_RH' || user?.role === 'ADMIN';

  // Filtrage par matricule
  const filteredDemandes = useMemo(() => {
    if (!searchTerm) return demandes;

    const searchLower = searchTerm.toLowerCase();
    return demandes.filter((demande) =>
      demande.employeMatricule.toLowerCase().includes(searchLower)
    );
  }, [demandes, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredDemandes.length / ITEMS_PER_PAGE);
  const paginatedDemandes = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredDemandes.slice(startIndex, endIndex);
  }, [filteredDemandes, currentPage]);

  // Reset pagination when search changes
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">
            Chargement des demandes...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden flex flex-col gap-3 p-4">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Demandes de Congé
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {filteredDemandes.length} demandes affichées sur {demandes.length}
          </p>
        </div>
        <Button
          size="sm"
          className="gap-2"
          onClick={() => setCreateModalOpen(true)}
        >
          <Plus className="h-4 w-4" />
          Nouvelle Demande
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="flex-shrink-0 grid grid-cols-4 gap-3">
        {Object.entries(statutLabels).map(([key, label]) => {
          const count = demandes.filter((d) => d.statut === key).length;
          return (
            <Card key={key} className="p-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-xl font-bold text-foreground">{count}</p>
                </div>
                <Badge
                  className={statutColors[key as keyof typeof statutColors]}
                >
                  {label}
                </Badge>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Search Bar */}
      <Card className="flex-shrink-0 p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par matricule..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Demandes Table */}
      <Card className="flex-1 min-h-0 flex flex-col">
        <div className="flex-1 min-h-0 flex flex-col">
          {paginatedDemandes.length > 0 ? (
            <>
              <div className="flex-1 min-h-0 overflow-auto">
                <table className="w-full">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Employé
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Matricule
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Date Début
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Date Fin
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Nb Jours
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Statut
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-card divide-y divide-border">
                    {paginatedDemandes.map((demande) => (
                      <tr
                        key={demande.id}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-foreground">
                          {demande.employeNom}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground">
                          {demande.employeMatricule}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                          {format(new Date(demande.dateDebut), 'dd MMM yyyy', {
                            locale: fr,
                          })}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                          {format(new Date(demande.dateFin), 'dd MMM yyyy', {
                            locale: fr,
                          })}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-foreground">
                          {demande.nombreJours}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <Badge className={statutColors[demande.statut]}>
                            {statutLabels[demande.statut]}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleOpenDetailsModal(demande)}
                              title="Voir les détails"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            {canModifyStatut &&
                              demande.statut === 'EN_ATTENTE' && (
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => handleOpenStatutModal(demande)}
                                >
                                  Traiter
                                </Button>
                              )}
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(demande.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 border-t border-border">
                  <div className="text-sm text-muted-foreground">
                    Affichage de {(currentPage - 1) * ITEMS_PER_PAGE + 1} à{' '}
                    {Math.min(
                      currentPage * ITEMS_PER_PAGE,
                      filteredDemandes.length
                    )}{' '}
                    sur {filteredDemandes.length} demandes
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
            </>
          ) : (
            <div className="flex items-center justify-center flex-1 text-muted-foreground">
              <div className="text-center">
                <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Aucune demande trouvée</p>
                <p className="text-sm mt-1">
                  Essayez de modifier votre recherche
                </p>
              </div>
            </div>
          )}
        </div>
      </Card>

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

      {/* Details Modal */}
      {selectedDemande && (
        <Dialog open={detailsModalOpen} onOpenChange={setDetailsModalOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Détails de la demande de congé</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Employé
                  </p>
                  <p className="text-base font-semibold">
                    {selectedDemande.employeNom}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Matricule
                  </p>
                  <p className="text-base font-semibold">
                    {selectedDemande.employeMatricule}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Date de début
                  </p>
                  <p className="text-base">
                    {format(
                      new Date(selectedDemande.dateDebut),
                      'dd MMMM yyyy',
                      { locale: fr }
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Date de fin
                  </p>
                  <p className="text-base">
                    {format(new Date(selectedDemande.dateFin), 'dd MMMM yyyy', {
                      locale: fr,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Nombre de jours
                  </p>
                  <p className="text-base font-semibold text-primary">
                    {selectedDemande.nombreJours} jours
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Statut
                  </p>
                  <Badge className={statutColors[selectedDemande.statut]}>
                    {statutLabels[selectedDemande.statut]}
                  </Badge>
                </div>
                {selectedDemande.typeConge && (
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      Type de congé
                    </p>
                    <p className="text-base">{selectedDemande.typeConge}</p>
                  </div>
                )}
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Date de création
                  </p>
                  <p className="text-base">
                    {format(
                      new Date(selectedDemande.dateCreation),
                      'dd MMMM yyyy',
                      { locale: fr }
                    )}
                  </p>
                </div>
              </div>

              {selectedDemande.adressePendantConge && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Adresse pendant le congé
                  </p>
                  <p className="text-base p-3 bg-muted rounded-lg">
                    {selectedDemande.adressePendantConge}
                  </p>
                </div>
              )}

              {selectedDemande.remarque && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground mb-1">
                    Remarque
                  </p>
                  <p className="text-base p-3 bg-muted rounded-lg">
                    {selectedDemande.remarque}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button onClick={() => setDetailsModalOpen(false)}>Fermer</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      <ConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Supprimer la demande"
        description="Êtes-vous sûr de vouloir supprimer cette demande ? Cette action est irréversible."
        variant="destructive"
      />
    </div>
  );
}
