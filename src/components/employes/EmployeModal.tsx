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
import { servicesApi, sousDirectionsApi } from '@/api/services';

const schema = z.object({
  matricule: z.string().min(1, 'Matricule requis').max(20),
  nom: z.string().min(1, 'Nom requis').max(50),
  prenom: z.string().min(1, 'Prénom requis').max(50),
  dateNaissance: z.string().min(1, 'Date de naissance requise'),
  dateRecrutement: z.string().min(1, 'Date de recrutement requise'),
  fonction: z.string().min(1, 'Fonction requise').max(100),
  adresse: z.string().max(255).optional(),
  statut: z.enum(['ACTIF', 'SUSPENDU', 'MALADIE', 'SUSPENDU_TEMPORAIREMENT']),
  serviceId: z.number().optional(),
  sousDirectionId: z.number().optional(),
});

type FormData = z.infer<typeof schema>;

interface EmployeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormData) => void;
  initialData?: any;
  isLoading?: boolean;
}

export default function EmployeModal({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading,
}: EmployeModalProps) {
  const { data: servicesData } = useQuery({
    queryKey: ['services'],
    queryFn: () => servicesApi.getAll(),
  });

  const { data: sousDirectionsData } = useQuery({
    queryKey: ['sous-directions'],
    queryFn: () => sousDirectionsApi.getAll(),
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
    defaultValues: initialData || { statut: 'ACTIF' },
  });

  const statut = watch('statut');
  const serviceId = watch('serviceId');
  const sousDirectionId = watch('sousDirectionId');

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    } else {
      reset({
        matricule: '',
        nom: '',
        prenom: '',
        dateNaissance: '',
        dateRecrutement: '',
        fonction: '',
        adresse: '',
        statut: 'ACTIF',
        serviceId: undefined,
        sousDirectionId: undefined,
      });
    }
  }, [initialData, reset, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Modifier l\'employé' : 'Nouvel employé'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="matricule">Matricule *</Label>
              <Input id="matricule" {...register('matricule')} />
              {errors.matricule && (
                <p className="text-sm text-destructive mt-1">{errors.matricule.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="statut">Statut *</Label>
              <Select value={statut} onValueChange={(value) => setValue('statut', value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ACTIF">Actif</SelectItem>
                  <SelectItem value="SUSPENDU">Suspendu</SelectItem>
                  <SelectItem value="MALADIE">Maladie</SelectItem>
                  <SelectItem value="SUSPENDU_TEMPORAIREMENT">Suspendu Temporairement</SelectItem>
                </SelectContent>
              </Select>
              {errors.statut && (
                <p className="text-sm text-destructive mt-1">{errors.statut.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="nom">Nom *</Label>
              <Input id="nom" {...register('nom')} />
              {errors.nom && (
                <p className="text-sm text-destructive mt-1">{errors.nom.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="prenom">Prénom *</Label>
              <Input id="prenom" {...register('prenom')} />
              {errors.prenom && (
                <p className="text-sm text-destructive mt-1">{errors.prenom.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="dateNaissance">Date de naissance *</Label>
              <Input id="dateNaissance" type="date" {...register('dateNaissance')} />
              {errors.dateNaissance && (
                <p className="text-sm text-destructive mt-1">{errors.dateNaissance.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="dateRecrutement">Date de recrutement *</Label>
              <Input id="dateRecrutement" type="date" {...register('dateRecrutement')} />
              {errors.dateRecrutement && (
                <p className="text-sm text-destructive mt-1">{errors.dateRecrutement.message}</p>
              )}
            </div>

            <div className="col-span-2">
              <Label htmlFor="fonction">Fonction *</Label>
              <Input id="fonction" {...register('fonction')} />
              {errors.fonction && (
                <p className="text-sm text-destructive mt-1">{errors.fonction.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="serviceId">Service</Label>
              <Select
                value={serviceId?.toString() || ''}
                onValueChange={(value) => setValue('serviceId', value ? parseInt(value) : undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un service" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucun</SelectItem>
                  {servicesData?.data?.data?.map((service: any) => (
                    <SelectItem key={service.id} value={service.id.toString()}>
                      {service.code} - {service.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="sousDirectionId">Sous-Direction</Label>
              <Select
                value={sousDirectionId?.toString() || ''}
                onValueChange={(value) => setValue('sousDirectionId', value ? parseInt(value) : undefined)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une sous-direction" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Aucune</SelectItem>
                  {sousDirectionsData?.data?.data?.map((sd: any) => (
                    <SelectItem key={sd.id} value={sd.id.toString()}>
                      {sd.code} - {sd.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="col-span-2">
              <Label htmlFor="adresse">Adresse</Label>
              <Textarea id="adresse" {...register('adresse')} />
              {errors.adresse && (
                <p className="text-sm text-destructive mt-1">{errors.adresse.message}</p>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
