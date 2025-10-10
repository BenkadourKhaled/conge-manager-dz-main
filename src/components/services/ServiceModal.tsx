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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { sousDirectionsApi } from '@/api/services';

const schema = z.object({
  code: z.string().min(1, 'Code requis').max(20, 'Maximum 20 caractères'),
  nom: z.string().min(1, 'Nom requis').max(100, 'Maximum 100 caractères'),
  sousDirectionId: z.number().min(1, 'Sous-direction requise'),
});

type FormData = z.infer<typeof schema>;

interface ServiceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormData) => void;
  initialData?: any;
  isLoading?: boolean;
}

export default function ServiceModal({
  open,
  onOpenChange,
  onSubmit,
  initialData,
  isLoading,
}: ServiceModalProps) {
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
    defaultValues: initialData,
  });

  const sousDirectionId = watch('sousDirectionId');

  useEffect(() => {
    if (initialData) {
      reset(initialData);
    } else {
      reset({ code: '', nom: '', sousDirectionId: undefined as any });
    }
  }, [initialData, reset, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {initialData ? 'Modifier le service' : 'Nouveau service'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="code">Code *</Label>
            <Input id="code" {...register('code')} />
            {errors.code && (
              <p className="text-sm text-destructive mt-1">{errors.code.message}</p>
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
            <Label htmlFor="sousDirectionId">Sous-Direction *</Label>
            <Select
              value={sousDirectionId?.toString()}
              onValueChange={(value) => setValue('sousDirectionId', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une sous-direction" />
              </SelectTrigger>
              <SelectContent>
                {sousDirectionsData?.data?.data?.map((sd: any) => (
                  <SelectItem key={sd.id} value={sd.id.toString()}>
                    {sd.code} - {sd.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.sousDirectionId && (
              <p className="text-sm text-destructive mt-1">{errors.sousDirectionId.message}</p>
            )}
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
