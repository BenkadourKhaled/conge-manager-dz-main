import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Edit, Trash2, Building2, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { servicesApi } from '@/api/services';
import ServiceModal from '@/components/services/ServiceModal';
import ConfirmDialog from '@/components/common/ConfirmDialog';

interface Service {
  id: number;
  code: string;
  nom: string;
  nombreEmployes: number;
  sousDirectionId: number;
  sousDirectionNom: string;
}

const ITEMS_PER_PAGE = 5;

export default function Services() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: () => servicesApi.getAll(),
  });

  const services = (data?.data?.data || []) as Service[];

  const createMutation = useMutation({
    mutationFn: servicesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Service créé avec succès');
      setModalOpen(false);
      setSelectedItem(null);
    },
    onError: () => {
      toast.error('Erreur lors de la création');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => servicesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Service modifié avec succès');
      setModalOpen(false);
      setSelectedItem(null);
    },
    onError: () => {
      toast.error('Erreur lors de la modification');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: servicesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['services'] });
      toast.success('Service supprimé avec succès');
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

  // Filtrage par nom de service
  const filteredServices = useMemo(() => {
    if (!searchTerm) return services;
    
    const searchLower = searchTerm.toLowerCase();
    return services.filter((service) =>
      service.nom.toLowerCase().includes(searchLower) ||
      service.code.toLowerCase().includes(searchLower)
    );
  }, [services, searchTerm]);

  // Pagination
  const totalPages = Math.ceil(filteredServices.length / ITEMS_PER_PAGE);
  const paginatedServices = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    return filteredServices.slice(startIndex, endIndex);
  }, [filteredServices, currentPage]);

  // Reset pagination when search changes
  useMemo(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Statistiques
  const stats = useMemo(() => {
    const totalEmployes = services.reduce((sum, service) => sum + service.nombreEmployes, 0);
    return {
      total: services.length,
      filtered: filteredServices.length,
      totalEmployes,
    };
  }, [services, filteredServices]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Chargement des services...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Services</h1>
          <p className="mt-2 text-muted-foreground">
            {stats.filtered} services affichés sur {stats.total} • {stats.totalEmployes} employés au total
          </p>
        </div>
        <Button className="gap-2" onClick={() => { setSelectedItem(null); setModalOpen(true); }}>
          <Plus className="h-4 w-4" />
          Nouveau Service
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Services</div>
          <div className="text-2xl font-bold text-foreground">{stats.total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Services Filtrés</div>
          <div className="text-2xl font-bold text-primary">{stats.filtered}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-muted-foreground">Total Employés</div>
          <div className="text-2xl font-bold text-success">{stats.totalEmployes}</div>
        </Card>
      </div>

      {/* Search Bar */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom ou code de service..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Code
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Nom du Service
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Sous-Direction
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Nombre d'Employés
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-card divide-y divide-border">
              {paginatedServices.length > 0 ? (
                paginatedServices.map((service) => (
                  <tr key={service.id} className="hover:bg-muted/50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-block px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
                        {service.code}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">
                      {service.nom}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        {service.sousDirectionNom}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                      <span className="font-semibold">{service.nombreEmployes}</span> employés
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" onClick={() => handleEdit(service)}>
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button size="sm" variant="ghost" onClick={() => handleDelete(service.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center">
                    <div className="text-muted-foreground">
                      <Search className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>Aucun service trouvé</p>
                      <p className="text-sm mt-1">
                        Essayez de modifier votre recherche
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
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredServices.length)}{' '}
              sur {filteredServices.length} services
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

      <ServiceModal
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
        title="Supprimer le service"
        description="Êtes-vous sûr de vouloir supprimer ce service ? Cette action est irréversible."
        variant="destructive"
      />
    </div>
  );
}
