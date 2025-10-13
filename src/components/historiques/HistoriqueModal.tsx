import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { historiqueCongesApi, employesApi } from '@/api/services';

const schema = z.object({
  employeId: z.number().min(1, 'Employé requis'),
  anneeConge: z.number().min(2020).max(2030),
  nombreJoursAttribues: z.number().min(0).max(60),
  nombreJoursConsommes: z.number().min(0).max(60),
  remarque: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: () => void;
  initialData?: any;
}

export default function HistoriqueModal({
  open,
  onOpenChange,
  onSubmit,
  initialData,
}: Props) {
  const queryClient = useQueryClient();
  const isEdit = !!initialData;

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      anneeConge: new Date().getFullYear(),
      nombreJoursAttribues: 30,
      nombreJoursConsommes: 0,
      remarque: '',
    },
  });

  // Récupérer les employés
  const { data: employesResponse, isLoading: employesLoading } = useQuery({
    queryKey: ['employes'],
    queryFn: async () => {
      const response = await employesApi.getAll();
      console.log('Réponse employés brute:', response);
      return response;
    },
  });

  // Extraire les données des employés selon la structure de la réponse
  const employes = (() => {
    console.log('Structure de employesResponse:', employesResponse);

    // Cas 1: response.data.data (Axios wrapping + API wrapping)
    if (
      employesResponse?.data?.data &&
      Array.isArray(employesResponse.data.data)
    ) {
      console.log('Cas 1: response.data.data', employesResponse.data.data);
      return employesResponse.data.data;
    }

    // Cas 2: response.data (API wrapping seulement)
    if (employesResponse?.data && Array.isArray(employesResponse.data)) {
      console.log('Cas 2: response.data', employesResponse.data);
      return employesResponse.data;
    }

    // Cas 3: response directement un tableau
    if (Array.isArray(employesResponse)) {
      console.log('Cas 3: response directement', employesResponse);
      return employesResponse;
    }

    // Cas 4: response.content (pagination)
    if (employesResponse?.content && Array.isArray(employesResponse.content)) {
      console.log('Cas 4: response.content', employesResponse.content);
      return employesResponse.content;
    }

    console.log('Aucun cas ne correspond, retour tableau vide');
    return [];
  })();

  console.log('Employés extraits:', employes);

  // Mutation de création
  const createMutation = useMutation({
    mutationFn: (data: FormData) => historiqueCongesApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['historique-conges'] });
      toast.success('Historique créé avec succès');
      onSubmit();
      reset();
    },
    onError: (error: any) => {
      console.error('Erreur création:', error);
      toast.error(
        error.response?.data?.message ||
          "Erreur lors de la création de l'historique"
      );
    },
  });

  // Mutation de mise à jour
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: FormData }) =>
      historiqueCongesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['historique-conges'] });
      toast.success('Historique modifié avec succès');
      onSubmit();
      reset();
    },
    onError: (error: any) => {
      console.error('Erreur mise à jour:', error);
      toast.error(
        error.response?.data?.message ||
          "Erreur lors de la modification de l'historique"
      );
    },
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          employeId: initialData.employeId,
          anneeConge: initialData.anneeConge,
          nombreJoursAttribues: initialData.nombreJoursAttribues,
          nombreJoursConsommes: initialData.nombreJoursConsommes,
          remarque: initialData.remarque || '',
        });
      } else {
        reset({
          anneeConge: new Date().getFullYear(),
          nombreJoursAttribues: 30,
          nombreJoursConsommes: 0,
          remarque: '',
        });
      }
    }
  }, [open, initialData, reset]);

  const onFormSubmit = (data: FormData) => {
    console.log('Données du formulaire:', data);
    if (isEdit && initialData) {
      updateMutation.mutate({ id: initialData.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  // Calculer les jours restants
  const nombreJoursRestants =
    (watch('nombreJoursAttribues') || 0) - (watch('nombreJoursConsommes') || 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier l'historique" : 'Nouvel historique de congé'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Employé */}
            <div className="col-span-2">
              <Label htmlFor="employeId">Employé *</Label>
              {employesLoading ? (
                <div className="h-10 flex items-center justify-center border rounded-md bg-muted">
                  <span className="text-sm text-muted-foreground">
                    Chargement...
                  </span>
                </div>
              ) : employes.length === 0 ? (
                <div className="h-10 flex items-center justify-center border rounded-md bg-muted">
                  <span className="text-sm text-muted-foreground">
                    Aucun employé disponible
                  </span>
                </div>
              ) : (
                <Select
                  value={watch('employeId')?.toString()}
                  onValueChange={(value) => {
                    console.log('Employé sélectionné:', value);
                    setValue('employeId', parseInt(value));
                  }}
                  disabled={isEdit}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un employé" />
                  </SelectTrigger>
                  <SelectContent>
                    {employes.map((employe: any) => (
                      <SelectItem
                        key={employe.id}
                        value={employe.id.toString()}
                      >
                        {employe.matricule} -{' '}
                        {employe.nomComplet ||
                          `${employe.prenom} ${employe.nom}`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {errors.employeId && (
                <p className="text-sm text-destructive mt-1">
                  {errors.employeId.message}
                </p>
              )}
              {employes.length > 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  {employes.length} employé(s) disponible(s)
                </p>
              )}
            </div>

            {/* Année */}
            <div>
              <Label htmlFor="anneeConge">Année *</Label>
              <Input
                id="anneeConge"
                type="number"
                {...register('anneeConge', { valueAsNumber: true })}
                min="2020"
                max="2030"
              />
              {errors.anneeConge && (
                <p className="text-sm text-destructive mt-1">
                  {errors.anneeConge.message}
                </p>
              )}
            </div>

            {/* Nombre de jours attribués */}
            <div>
              <Label htmlFor="nombreJoursAttribues">Jours attribués *</Label>
              <Input
                id="nombreJoursAttribues"
                type="number"
                step="0.5"
                {...register('nombreJoursAttribues', { valueAsNumber: true })}
                min="0"
                max="60"
              />
              {errors.nombreJoursAttribues && (
                <p className="text-sm text-destructive mt-1">
                  {errors.nombreJoursAttribues.message}
                </p>
              )}
            </div>

            {/* Nombre de jours consommés */}
            <div>
              <Label htmlFor="nombreJoursConsommes">Jours consommés *</Label>
              <Input
                id="nombreJoursConsommes"
                type="number"
                step="0.5"
                {...register('nombreJoursConsommes', { valueAsNumber: true })}
                min="0"
                max="60"
              />
              {errors.nombreJoursConsommes && (
                <p className="text-sm text-destructive mt-1">
                  {errors.nombreJoursConsommes.message}
                </p>
              )}
            </div>

            {/* Jours restants (calculé) */}
            <div>
              <Label>Jours restants</Label>
              <div
                className={`h-10 flex items-center px-3 bg-muted rounded-md text-sm font-medium ${
                  nombreJoursRestants < 5
                    ? 'text-red-600'
                    : nombreJoursRestants < 15
                    ? 'text-orange-600'
                    : 'text-green-600'
                }`}
              >
                {nombreJoursRestants.toFixed(1)}
              </div>
            </div>
          </div>

          {/* Remarque */}
          <div className="col-span-2">
            <Label htmlFor="remarque">Remarque (optionnelle)</Label>
            <Input
              id="remarque"
              {...register('remarque')}
              placeholder="Ajouter une remarque..."
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Enregistrement...' : isEdit ? 'Modifier' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
