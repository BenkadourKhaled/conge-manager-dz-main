import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const schema = z.object({
  statut: z.enum(['APPROUVE', 'REJETE', 'REPORTE']),
  remarque: z.string().max(500).optional(),
});

type FormData = z.infer<typeof schema>;

interface StatutModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormData) => void;
  demande: any;
  isLoading?: boolean;
}

export default function StatutModal({
  open,
  onOpenChange,
  onSubmit,
  demande,
  isLoading,
}: StatutModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      statut: 'APPROUVE',
      remarque: '',
    },
  });

  const statut = watch('statut');

  useEffect(() => {
    if (!open) {
      reset({ statut: 'APPROUVE', remarque: '' });
    }
  }, [open, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Traiter la demande de congé</DialogTitle>
        </DialogHeader>
       
        {demande && (
          <div className="space-y-2 p-4 bg-muted rounded-lg mb-4">
            <p className="text-sm">
              <span className="font-medium">Employé:</span> {demande.employeNom}
            </p>
            <p className="text-sm">
              <span className="font-medium">Période:</span> {demande.dateDebut} au {demande.dateFin}
            </p>
            <p className="text-sm">
              <span className="font-medium">Nombre de jours:</span> {demande.nombreJours}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="statut">Décision *</Label>
            <Select value={statut} onValueChange={(value) => setValue('statut', value as any)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="APPROUVE">Approuver</SelectItem>
                <SelectItem value="REJETE">Rejeter</SelectItem>
                <SelectItem value="REPORTE">Reporter</SelectItem>
              </SelectContent>
            </Select>
            {errors.statut && (
              <p className="text-sm text-destructive mt-1">{errors.statut.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="remarque">Remarque</Label>
            <Textarea
              id="remarque"
              {...register('remarque')}
              placeholder="Ajoutez un commentaire (optionnel)"
              rows={4}
            />
            {errors.remarque && (
              <p className="text-sm text-destructive mt-1">{errors.remarque.message}</p>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              variant={statut === 'REJETE' ? 'destructive' : 'default'}
            >
              {isLoading ? 'Traitement...' : 'Confirmer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
