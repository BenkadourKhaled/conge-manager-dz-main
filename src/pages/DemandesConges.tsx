import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Eye, Trash2, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
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

export default function DemandesConges() {
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [statutModalOpen, setStatutModalOpen] = useState(false);
  const [selectedDemande, setSelectedDemande] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['demandes-conges'],
    queryFn: () => demandesCongesApi.getAll(),
  });

  const demandes = data?.data?.data || [];

  const createMutation = useMutation({
    mutationFn: demandesCongesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['demandes-conges'] });
      toast.success('Demande de congé créée avec succès');
      setCreateModalOpen(false);
    },
    onError: () => {
      toast.error('Erreur lors de la création');
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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement des demandes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Demandes de Congé</h1>
          <p className="mt-2 text-muted-foreground">
            {demandes.length} demandes au total
          </p>
        </div>
        <Button className="gap-2" onClick={() => setCreateModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Nouvelle Demande
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(statutLabels).map(([key, label]) => {
          const count = demandes.filter(d => d.statut === key).length;
          return (
            <Card key={key} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{label}</p>
                  <p className="text-2xl font-bold text-foreground">{count}</p>
                </div>
                <Badge className={statutColors[key as keyof typeof statutColors]}>
                  {label}
                </Badge>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Demandes Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Employé
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Matricule
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Date Début
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Date Fin
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Nb Jours
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Date Création
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {demandes.map((demande) => (
                <tr key={demande.id} className="hover:bg-muted/50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                    {demande.employeNom}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {demande.employeMatricule}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {format(new Date(demande.dateDebut), 'dd MMM yyyy', { locale: fr })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {format(new Date(demande.dateFin), 'dd MMM yyyy', { locale: fr })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    {demande.nombreJours}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge className={statutColors[demande.statut]}>
                      {statutLabels[demande.statut]}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    {format(new Date(demande.dateCreation), 'dd MMM yyyy', { locale: fr })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <Button size="sm" variant="outline">
                      Détails
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

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
        description="Êtes-vous sûr de vouloir supprimer cette demande ? Cette action est irréversible."
        variant="destructive"
      />
    </div>
  );
}
