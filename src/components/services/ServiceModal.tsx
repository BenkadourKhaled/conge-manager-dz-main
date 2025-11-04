import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Save, X, AlertCircle, CheckCircle2, Layers, Building2 } from 'lucide-react';
import { sousDirectionsApi } from '@/api/services';

const schema = z.object({
  code: z.string()
      .min(1, 'Code requis')
      .max(20, 'Maximum 20 caractères')
      .regex(/^[A-Z0-9-]+$/, 'Format invalide (A-Z, 0-9, -)'),
  nom: z.string()
      .min(1, 'Nom requis')
      .max(100, 'Maximum 100 caractères'),
  sousDirectionId: z.number({
    required_error: 'Sous-direction requise',
    invalid_type_error: 'Sous-direction requise',
  }).min(1, 'Sous-direction requise'),
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
  const { data: sousDirectionsData, isLoading: loadingSousDirections } = useQuery({
    queryKey: ['sous-directions'],
    queryFn: () => sousDirectionsApi.getAll(),
    enabled: open, // Only fetch when modal is open
  });

  const sousDirections = sousDirectionsData?.data?.data || [];

  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields, isValid },
    reset,
    control,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: initialData || { code: '', nom: '', sousDirectionId: undefined as any },
  });

  const watchedCode = watch('code');
  const watchedNom = watch('nom');
  const watchedSousDirectionId = watch('sousDirectionId');

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset(initialData);
      } else {
        reset({ code: '', nom: '', sousDirectionId: undefined as any });
      }
    }
  }, [initialData, reset, open]);

  const getFieldStatus = (fieldName: keyof FormData) => {
    if (errors[fieldName]) return 'error';
    if (dirtyFields[fieldName]) return 'success';
    return 'default';
  };

  const handleFormSubmit = (data: FormData) => {
    onSubmit(data);
  };

  // Trouver la sous-direction sélectionnée
  const selectedSousDirection = sousDirections.find(
      (sd: any) => sd.id === watchedSousDirectionId
  );

  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden">
          {/* Header avec gradient */}
          <div className="relative bg-gradient-to-r from-purple-600 to-purple-500 p-6 text-white">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-white/20 flex items-center justify-center">
                <Layers className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">
                  {initialData ? 'Modifier le service' : 'Nouveau service'}
                </DialogTitle>
                <DialogDescription className="text-white/80">
                  {initialData
                      ? 'Mettez à jour les informations du service'
                      : 'Ajoutez un nouveau service à votre organisation'
                  }
                </DialogDescription>
              </div>
            </div>

            {/* Badge de statut */}
            {initialData && (
                <Badge
                    variant="secondary"
                    className="absolute top-6 right-6 bg-white/20 text-white border-0 font-mono"
                >
                  {initialData.code}
                </Badge>
            )}
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="p-6 space-y-6">
            {/* Code */}
            <div className="space-y-2">
              <Label htmlFor="code" className="text-base font-semibold flex items-center gap-2">
                Code
                <span className="text-destructive">*</span>
                {getFieldStatus('code') === 'success' && (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
              </Label>
              <div className="relative">
                <Input
                    id="code"
                    {...register('code')}
                    placeholder="Ex: SRV-01, DEV, ADMIN..."
                    className={`h-11 text-base transition-all ${
                        errors.code
                            ? 'border-destructive focus-visible:ring-destructive'
                            : getFieldStatus('code') === 'success'
                                ? 'border-green-500 focus-visible:ring-green-500'
                                : ''
                    }`}
                    disabled={isLoading}
                />
                {watchedCode && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {watchedCode.length}/20
                      </Badge>
                    </div>
                )}
              </div>
              {errors.code && (
                  <div className="flex items-center gap-2 text-sm text-destructive animate-in slide-in-from-top-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.code.message}</span>
                  </div>
              )}
              <p className="text-xs text-muted-foreground">
                Format: Lettres majuscules, chiffres et tirets uniquement
              </p>
            </div>

            {/* Nom */}
            <div className="space-y-2">
              <Label htmlFor="nom" className="text-base font-semibold flex items-center gap-2">
                Nom du Service
                <span className="text-destructive">*</span>
                {getFieldStatus('nom') === 'success' && (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
              </Label>
              <div className="relative">
                <Input
                    id="nom"
                    {...register('nom')}
                    placeholder="Ex: Service Informatique, Service RH..."
                    className={`h-11 text-base transition-all ${
                        errors.nom
                            ? 'border-destructive focus-visible:ring-destructive'
                            : getFieldStatus('nom') === 'success'
                                ? 'border-green-500 focus-visible:ring-green-500'
                                : ''
                    }`}
                    disabled={isLoading}
                />
                {watchedNom && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      <Badge variant="outline" className="font-mono text-xs">
                        {watchedNom.length}/100
                      </Badge>
                    </div>
                )}
              </div>
              {errors.nom && (
                  <div className="flex items-center gap-2 text-sm text-destructive animate-in slide-in-from-top-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.nom.message}</span>
                  </div>
              )}
            </div>

            {/* Sous-Direction */}
            <div className="space-y-2">
              <Label htmlFor="sousDirectionId" className="text-base font-semibold flex items-center gap-2">
                Sous-Direction
                <span className="text-destructive">*</span>
                {getFieldStatus('sousDirectionId') === 'success' && (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
              </Label>
              <Controller
                  name="sousDirectionId"
                  control={control}
                  render={({ field }) => (
                      <Select
                          value={field.value?.toString() || ''}
                          onValueChange={(value) => field.onChange(parseInt(value))}
                          disabled={isLoading || loadingSousDirections}
                      >
                        <SelectTrigger
                            className={`h-11 text-base transition-all ${
                                errors.sousDirectionId
                                    ? 'border-destructive focus:ring-destructive'
                                    : getFieldStatus('sousDirectionId') === 'success'
                                        ? 'border-green-500 focus:ring-green-500'
                                        : ''
                            }`}
                        >
                          <SelectValue placeholder="Sélectionner une sous-direction">
                            {selectedSousDirection && (
                                <div className="flex items-center gap-2">
                                  <Building2 className="h-4 w-4 text-muted-foreground" />
                                  <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                            {selectedSousDirection.code}
                          </span>
                                  <span>{selectedSousDirection.nom}</span>
                                </div>
                            )}
                          </SelectValue>
                        </SelectTrigger>
                        <SelectContent>
                          {loadingSousDirections ? (
                              <div className="p-4 text-center text-sm text-muted-foreground">
                                Chargement...
                              </div>
                          ) : sousDirections.length === 0 ? (
                              <div className="p-4 text-center text-sm text-muted-foreground">
                                Aucune sous-direction disponible
                              </div>
                          ) : (
                              sousDirections.map((sd: any) => (
                                  <SelectItem key={sd.id} value={sd.id.toString()}>
                                    <div className="flex items-center gap-2">
                            <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded">
                              {sd.code}
                            </span>
                                      <span>{sd.nom}</span>
                                    </div>
                                  </SelectItem>
                              ))
                          )}
                        </SelectContent>
                      </Select>
                  )}
              />
              {errors.sousDirectionId && (
                  <div className="flex items-center gap-2 text-sm text-destructive animate-in slide-in-from-top-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.sousDirectionId.message}</span>
                  </div>
              )}
              <p className="text-xs text-muted-foreground">
                Chaque service doit être rattaché à une sous-direction
              </p>
            </div>

            {/* Informations supplémentaires */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Informations
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
                <li>Les champs marqués d'un <span className="text-destructive">*</span> sont obligatoires</li>
                <li>Le code doit être unique dans le système</li>
                <li>Le service sera associé à la sous-direction sélectionnée</li>
                <li>Vous pourrez gérer les employés après la création</li>
              </ul>
            </div>

            {/* Aperçu de la hiérarchie si service existant */}
            {selectedSousDirection && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-4 w-4 text-primary" />
                    <span className="font-semibold text-primary">Hiérarchie:</span>
                    <span className="text-muted-foreground">
                  {selectedSousDirection.nom}
                </span>
                    <span className="text-muted-foreground">→</span>
                    <span className="font-medium">
                  {watchedNom || 'Nouveau service'}
                </span>
                  </div>
                </div>
            )}

            {/* Boutons d'action */}
            <div className="flex items-center gap-3 pt-4 border-t">
              <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                  className="flex-1 h-11"
              >
                <X className="h-4 w-4 mr-2" />
                Annuler
              </Button>
              <Button
                  type="submit"
                  disabled={isLoading || !isValid}
                  className="flex-1 h-11 gap-2 shadow-lg hover:shadow-xl transition-all"
              >
                {isLoading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Enregistrement...
                    </>
                ) : (
                    <>
                      <Save className="h-4 w-4" />
                      {initialData ? 'Mettre à jour' : 'Créer'}
                    </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
  );
}