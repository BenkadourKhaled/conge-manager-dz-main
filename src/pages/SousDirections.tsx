import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
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

export default function SousDirections() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['sous-directions'],
    queryFn: () => sousDirectionsApi.getAll(),
  });

  const sousDirections = data?.data?.data || [];

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

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement des sous-directions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Sous-Directions</h1>
          <p className="mt-2 text-muted-foreground">
            {sousDirections.length} sous-directions au total
          </p>
        </div>
        <Button className="gap-2" onClick={() => { setSelectedItem(null); setModalOpen(true); }}>
          <Plus className="h-4 w-4" />
          Nouvelle Sous-Direction
        </Button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sousDirections.map((sd) => (
          <Card key={sd.id} className="p-6 hover:shadow-elegant transition-shadow duration-200">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded mb-2">
                  {sd.code}
                </div>
                <h3 className="text-lg font-semibold text-foreground">{sd.nom}</h3>
                {sd.libelle && (
                  <p className="mt-1 text-sm text-muted-foreground">{sd.libelle}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="text-sm">
                <span className="text-2xl font-bold text-foreground">{sd.nombreEmployes}</span>
                <span className="ml-2 text-muted-foreground">employés</span>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={() => handleEdit(sd)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => handleDelete(sd.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

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
