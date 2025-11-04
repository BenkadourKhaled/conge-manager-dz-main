import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Save, X, AlertCircle, CheckCircle2, Building2 } from 'lucide-react';

const schema = z.object({
  code: z.string()
      .min(1, 'Code requis')
      .max(20, 'Maximum 20 caractères')
      .regex(/^[A-Z0-9-]+$/, 'Format invalide (A-Z, 0-9, -)'),
  nom: z.string()
      .min(1, 'Nom requis')
      .max(100, 'Maximum 100 caractères'),
  libelle: z.string()
      .max(255, 'Maximum 255 caractères')
      .optional()
      .or(z.literal('')),
});

type FormData = z.infer<typeof schema>;

interface SousDirectionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormData) => void;
  initialData?: any;
  isLoading?: boolean;
}

export default function SousDirectionModal({
                                             open,
                                             onOpenChange,
                                             onSubmit,
                                             initialData,
                                             isLoading,
                                           }: SousDirectionModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, dirtyFields, isValid },
    reset,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: initialData || { code: '', nom: '', libelle: '' },
  });

  const watchedCode = watch('code');
  const watchedNom = watch('nom');
  const watchedLibelle = watch('libelle');

  useEffect(() => {
    if (open) {
      if (initialData) {
        reset(initialData);
      } else {
        reset({ code: '', nom: '', libelle: '' });
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

  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-[600px] p-0 gap-0 overflow-hidden">
          {/* Header avec gradient */}
          <div className="relative bg-gradient-to-r from-primary to-primary/80 p-6 text-primary-foreground">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-lg bg-white/20 flex items-center justify-center">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">
                  {initialData ? 'Modifier la sous-direction' : 'Nouvelle sous-direction'}
                </DialogTitle>
                <DialogDescription className="text-primary-foreground/80">
                  {initialData
                      ? 'Mettez à jour les informations de la sous-direction'
                      : 'Ajoutez une nouvelle sous-direction à votre organisation'
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
                    placeholder="Ex: SD-01, DEV, ADM..."
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
                Nom
                <span className="text-destructive">*</span>
                {getFieldStatus('nom') === 'success' && (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
              </Label>
              <div className="relative">
                <Input
                    id="nom"
                    {...register('nom')}
                    placeholder="Ex: Direction des Ressources Humaines"
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

            {/* Libellé */}
            <div className="space-y-2">
              <Label htmlFor="libelle" className="text-base font-semibold flex items-center gap-2">
                Libellé
                <Badge variant="secondary" className="text-xs">Optionnel</Badge>
                {getFieldStatus('libelle') === 'success' && watchedLibelle && (
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                )}
              </Label>
              <div className="relative">
                <Textarea
                    id="libelle"
                    {...register('libelle')}
                    placeholder="Description détaillée de la sous-direction..."
                    className={`min-h-[100px] resize-none text-base transition-all ${
                        errors.libelle
                            ? 'border-destructive focus-visible:ring-destructive'
                            : ''
                    }`}
                    disabled={isLoading}
                />
                {watchedLibelle && (
                    <div className="absolute right-3 bottom-3">
                      <Badge variant="outline" className="font-mono text-xs">
                        {watchedLibelle.length}/255
                      </Badge>
                    </div>
                )}
              </div>
              {errors.libelle && (
                  <div className="flex items-center gap-2 text-sm text-destructive animate-in slide-in-from-top-1">
                    <AlertCircle className="h-4 w-4" />
                    <span>{errors.libelle.message}</span>
                  </div>
              )}
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
                <li>Le libellé permet d'ajouter plus de contexte</li>
              </ul>
            </div>

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