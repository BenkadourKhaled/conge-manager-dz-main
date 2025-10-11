import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery } from '@tanstack/react-query';
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
import { employesApi } from '@/api/services';

const schema = z.object({
  employeId: z.number().min(1, 'Employé requis'),
  dateDebut: z.string().min(1, 'Date de début requise'),
  dateFin: z.string().min(1, 'Date de fin requise'),
  adressePendantConge: z.string().optional(),
  anneeConge: z.number().min(2020),
  typeConge: z.enum(['ANNUEL', 'MALADIE', 'EXCEPTIONNEL', 'SANS_SOLDE']),
});

type FormData = z.infer<typeof schema>;

interface DemandeCongeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

export default function DemandeCongeModal({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
}: DemandeCongeModalProps) {
  const { data: employesData, isLoading: employesLoading } = useQuery({
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
      dateDebut: '',
      dateFin: '',
      adressePendantConge: '',
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

  const handleFormSubmit = (data: FormData) => {
    // Vérifier que l'employé est sélectionné
    if (!data.employeId || data.employeId === 0) {
      toast.error('Veuillez sélectionner un employé');
      return;
    }

    // Vérifier que la date de fin est après la date de début
    if (new Date(data.dateFin) < new Date(data.dateDebut)) {
      toast.error('La date de fin doit être après la date de début');
      return;
    }

    // Formater les données exactement comme attendu par l'API
    const formattedData = {
      employeId: Number(data.employeId),
      dateDebut: data.dateDebut,
      dateFin: data.dateFin,
      typeConge: data.typeConge,
      anneeConge: Number(data.anneeConge),
      adressePendantConge: data.adressePendantConge || '',
    };

    // Log pour débogage - À SUPPRIMER EN PRODUCTION
    console.log('📤 Données envoyées à l\'API:', formattedData);
    console.log('📊 Type de chaque champ:', {
      employeId: typeof formattedData.employeId,
      dateDebut: typeof formattedData.dateDebut,
      dateFin: typeof formattedData.dateFin,
      typeConge: typeof formattedData.typeConge,
      anneeConge: typeof formattedData.anneeConge,
      adressePendantConge: typeof formattedData.adressePendantConge,
    });

    onSubmit(formattedData);
  };

  // Afficher un message si aucun employé actif
  const employes = employesData?.data?.data || [];
  const employesActifs = employes.filter((emp: any) => emp.statut === 'ACTIF');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nouvelle demande de congé</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="employeId">Employé *</Label>
            <Select
              value={employeId?.toString() || ''}
              onValueChange={(value) => {
                if (value) {
                  const parsedValue = parseInt(value);
                  console.log('👤 Employé sélectionné - ID:', parsedValue);
                  setValue('employeId', parsedValue, { shouldValidate: true });
                }
              }}
              disabled={employesLoading}
            >
              <SelectTrigger>
                <SelectValue placeholder={
                  employesLoading 
                    ? "Chargement des employés..." 
                    : employesActifs.length === 0
                    ? "Aucun employé actif disponible"
                    : "Sélectionner un employé"
                } />
              </SelectTrigger>
              <SelectContent>
                {employesActifs.length > 0 ? (
                  employesActifs.map((emp: any) => (
                    <SelectItem key={emp.id} value={emp.id.toString()}>
                      {emp.matricule} - {emp.nomComplet}
                    </SelectItem>
                  ))
                ) : (
                  <div className="p-2 text-sm text-muted-foreground text-center">
                    Aucun employé actif disponible
                  </div>
                )}
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
              <Input 
                id="dateDebut" 
                type="date" 
                {...register('dateDebut')}
                onChange={(e) => {
                  setValue('dateDebut', e.target.value);
                  console.log('📅 Date de début sélectionnée:', e.target.value);
                }}
              />
              {errors.dateDebut && (
                <p className="text-sm text-destructive mt-1">{errors.dateDebut.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="dateFin">Date de fin *</Label>
              <Input 
                id="dateFin" 
                type="date" 
                {...register('dateFin')}
                onChange={(e) => {
                  setValue('dateFin', e.target.value);
                  console.log('📅 Date de fin sélectionnée:', e.target.value);
                }}
              />
              {errors.dateFin && (
                <p className="text-sm text-destructive mt-1">{errors.dateFin.message}</p>
              )}
            </div>
          </div>

          {dateDebut && dateFin && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">
                Nombre de jours : <span className="text-primary text-lg font-bold">{calculateDays()}</span>
              </p>
            </div>
          )}

          <div>
            <Label htmlFor="adressePendantConge">Adresse pendant le congé</Label>
            <Textarea 
              id="adressePendantConge" 
              {...register('adressePendantConge')}
              placeholder="Adresse où vous serez joignable pendant le congé (optionnel)"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading || employesLoading || employesActifs.length === 0}>
              {isLoading ? 'Création...' : 'Créer la demande'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
