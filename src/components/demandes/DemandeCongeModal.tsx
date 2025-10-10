import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery } from '@tanstack/react-query';
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
import { employesApi } from '@/api/services';

const schema = z.object({
  employeId: z.number().min(1, 'Employé requis'),
  dateDebut: z.string().min(1, 'Date de début requise'),
  dateFin: z.string().min(1, 'Date de fin requise'),
  adressePendantConge: z.string().max(255).optional(),
  anneeConge: z.number().min(2020),
  typeConge: z.enum(['ANNUEL', 'MALADIE', 'EXCEPTIONNEL', 'SANS_SOLDE']),
});

type FormData = z.infer<typeof schema>;

interface DemandeCongeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormData) => void;
  isLoading?: boolean;
}

export default function DemandeCongeModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: DemandeCongeModalProps) {
  const { data: employesData } = useQuery({
    queryKey: ['employes'],
    queryFn: () => employesApi.getAll(),
  });

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
      typeConge: 'ANNUEL',
      anneeConge: new Date().getFullYear(),
    },
  });

  const employeId = watch('employeId');
  const typeConge = watch('typeConge');
  const dateDebut = watch('dateDebut');
  const dateFin = watch('dateFin');

  useEffect(() => {
    if (!open) {
      reset({
        employeId: undefined as any,
        dateDebut: '',
        dateFin: '',
        adressePendantConge: '',
        typeConge: 'ANNUEL',
        anneeConge: new Date().getFullYear(),
      });
    }
  }, [open, reset]);

  // Calculate number of days
  const calculateDays = () => {
    if (dateDebut && dateFin) {
      const start = new Date(dateDebut);
      const end = new Date(dateFin);
      const diff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      return diff > 0 ? diff : 0;
    }
    return 0;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nouvelle demande de congé</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="employeId">Employé *</Label>
            <Select
              value={employeId?.toString()}
              onValueChange={(value) => setValue('employeId', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un employé" />
              </SelectTrigger>
              <SelectContent>
                {employesData?.data?.data?.map((emp: any) => (
                  <SelectItem key={emp.id} value={emp.id.toString()}>
                    {emp.matricule} - {emp.nomComplet}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.employeId && (
              <p className="text-sm text-destructive mt-1">{errors.employeId.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="typeConge">Type de congé *</Label>
              <Select value={typeConge} onValueChange={(value) => setValue('typeConge', value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ANNUEL">Annuel</SelectItem>
                  <SelectItem value="MALADIE">Maladie</SelectItem>
                  <SelectItem value="EXCEPTIONNEL">Exceptionnel</SelectItem>
                  <SelectItem value="SANS_SOLDE">Sans Solde</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="anneeConge">Année *</Label>
              <Input
                id="anneeConge"
                type="number"
                {...register('anneeConge', { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="dateDebut">Date de début *</Label>
              <Input id="dateDebut" type="date" {...register('dateDebut')} />
              {errors.dateDebut && (
                <p className="text-sm text-destructive mt-1">{errors.dateDebut.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="dateFin">Date de fin *</Label>
              <Input id="dateFin" type="date" {...register('dateFin')} />
              {errors.dateFin && (
                <p className="text-sm text-destructive mt-1">{errors.dateFin.message}</p>
              )}
            </div>
          </div>

          {dateDebut && dateFin && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">
                Nombre de jours : <span className="text-primary">{calculateDays()}</span>
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="adressePendantConge">Adresse pendant le congé</Label>
            <Textarea id="adressePendantConge" {...register('adressePendantConge')} />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Création...' : 'Créer la demande'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
