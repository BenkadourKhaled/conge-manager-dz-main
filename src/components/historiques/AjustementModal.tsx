import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { historiqueCongesApi } from '@/api/services';

const schema = z.object({
  typeAjustement: z.enum(['AJOUT', 'RETRAIT', 'CORRECTION']),
  nombreJours: z.number().min(0.5).max(30),
  motif: z.string().min(5, 'Motif requis (min 5 caractères)').max(500),
});

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  historique: any;
}

export default function AjustementModal({ open, onOpenChange, historique }: Props) {
  const queryClient = useQueryClient();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      typeAjustement: 'AJOUT',
      nombreJours: 1,
      motif: '',
    },
  });

  const ajustementMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
        historiqueCongesApi.ajusterJours(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['historique-conges'] });
      toast.success('Ajustement effectué avec succès');
      onOpenChange(false);
      reset();
    },
    onError: () => {
      toast.error('Erreur lors de l\'ajustement');
    },
  });

  const onSubmit = (data: FormData) => {
    if (!historique) return;
    ajustementMutation.mutate({ id: historique.id, data });
  };

  if (!historique) return null;

  const typeAjustement = watch('typeAjustement');
  const nombreJours = watch('nombreJours');

  // Calculer le nouveau solde après ajustement
  const nouveauSolde = () => {
    let nouveau = historique.nombreJoursRestants || 0;
    if (typeAjustement === 'AJOUT') {
      nouveau += nombreJours || 0;
    } else if (typeAjustement === 'RETRAIT') {
      nouveau -= nombreJours || 0;
    }
    return Math.max(0, nouveau);
  };

  const nouveauxConsommes = () => {
    const consommes = historique.nombreJoursConsommes || 0;
    if (typeAjustement === 'AJOUT') {
      return consommes - (nombreJours || 0);
    } else if (typeAjustement === 'RETRAIT') {
      return consommes + (nombreJours || 0);
    }
    return consommes;
  };

  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Ajuster les jours de congé</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {/* Informations actuelles */}
            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h3 className="font-semibold">Informations actuelles</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Employé:</span>
                  <p className="font-medium">{historique.employeNom}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Année:</span>
                  <p className="font-medium">{historique.anneeConge}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Jours attribués:</span>
                  <p className="font-medium">{historique.nombreJoursAttribues?.toFixed(1)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Jours consommés:</span>
                  <p className="font-medium">{historique.nombreJoursConsommes?.toFixed(1)}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Jours restants:</span>
                  <p className="font-medium text-green-600">
                    {historique.nombreJoursRestants?.toFixed(1)}
                  </p>
                </div>
                <div>
                  <span className="text-muted-foreground">Éligibilité ICA:</span>
                  <p className="font-medium">
                    <Badge variant={historique.eligibleICA ? 'success' : 'secondary'}>
                      {historique.eligibleICA ? 'Éligible' : 'Non éligible'}
                    </Badge>
                  </p>
                </div>
              </div>
            </div>

            {/* Formulaire d'ajustement */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {/* Type d'ajustement */}
                <div>
                  <Label htmlFor="typeAjustement">Type d'ajustement</Label>
                  <Select
                      value={typeAjustement}
                      onValueChange={(value) =>
                          setValue('typeAjustement', value as 'AJOUT' | 'RETRAIT' | 'CORRECTION')
                      }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="AJOUT">
                      <span className="flex items-center gap-2">
                        <Badge variant="success">Ajout</Badge>
                        <span className="text-sm text-muted-foreground">
                          Ajouter des jours restants
                        </span>
                      </span>
                      </SelectItem>
                      <SelectItem value="RETRAIT">
                      <span className="flex items-center gap-2">
                        <Badge variant="destructive">Retrait</Badge>
                        <span className="text-sm text-muted-foreground">
                          Retirer des jours restants
                        </span>
                      </span>
                      </SelectItem>
                      <SelectItem value="CORRECTION">
                      <span className="flex items-center gap-2">
                        <Badge variant="outline">Correction</Badge>
                        <span className="text-sm text-muted-foreground">
                          Corriger une erreur
                        </span>
                      </span>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.typeAjustement && (
                      <p className="text-sm text-destructive mt-1">
                        {errors.typeAjustement.message}
                      </p>
                  )}
                </div>

                {/* Nombre de jours */}
                <div>
                  <Label htmlFor="nombreJours">Nombre de jours</Label>
                  <Input
                      id="nombreJours"
                      type="number"
                      step="0.5"
                      {...register('nombreJours', { valueAsNumber: true })}
                      min="0.5"
                      max="30"
                  />
                  {errors.nombreJours && (
                      <p className="text-sm text-destructive mt-1">{errors.nombreJours.message}</p>
                  )}
                </div>
              </div>

              {/* Motif */}
              <div>
                <Label htmlFor="motif">Motif de l'ajustement</Label>
                <Textarea
                    id="motif"
                    {...register('motif')}
                    placeholder="Expliquez la raison de cet ajustement..."
                    className="min-h-[100px]"
                />
                {errors.motif && (
                    <p className="text-sm text-destructive mt-1">{errors.motif.message}</p>
                )}
              </div>

              {/* Aperçu du résultat */}
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h4 className="font-semibold mb-2 text-blue-900 dark:text-blue-100">
                  Résultat de l'ajustement
                </h4>
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Consommés actuels:</span>
                    <p className="font-medium">{historique.nombreJoursConsommes?.toFixed(1)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Nouveaux consommés:</span>
                    <p className="font-medium text-orange-600">
                      {nouveauxConsommes().toFixed(1)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Nouveaux restants:</span>
                    <p className="font-bold text-blue-600">{nouveauSolde().toFixed(1)}</p>
                  </div>
                </div>
                <div className="mt-2 pt-2 border-t border-blue-200 dark:border-blue-800">
                <span className="text-muted-foreground text-xs">
                  {typeAjustement === 'AJOUT' && 'Ajout: diminue les consommés, augmente les restants'}
                  {typeAjustement === 'RETRAIT' && 'Retrait: augmente les consommés, diminue les restants'}
                  {typeAjustement === 'CORRECTION' && 'Correction: comme ajout'}
                </span>
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Annuler
                </Button>
                <Button type="submit" disabled={ajustementMutation.isPending}>
                  {ajustementMutation.isPending ? 'Enregistrement...' : 'Appliquer l\'ajustement'}
                </Button>
              </DialogFooter>
            </form>
          </div>
        </DialogContent>
      </Dialog>
  );
}