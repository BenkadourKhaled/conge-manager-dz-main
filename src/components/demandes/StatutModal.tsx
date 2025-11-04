import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  CheckCircle2,
  XCircle,
  Clock,
  User,
  Calendar,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const schema = z.object({
  statut: z.enum(['APPROUVE', 'REJETE', 'REPORTE'], {
    required_error: 'Sélectionnez une décision',
  }),
  remarque: z.string().max(500).optional(),
}).refine(
    (data) => {
      if (data.statut === 'REJETE' && (!data.remarque || data.remarque.trim().length === 0)) {
        return false;
      }
      return true;
    },
    { message: 'Remarque obligatoire pour refus', path: ['remarque'] }
);

type FormData = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormData) => void;
  demande: any;
  isLoading?: boolean;
}

const statutOptions = {
  APPROUVE: {
    label: 'Approuver',
    description: 'Valider la demande',
    icon: '✅',
    IconComponent: CheckCircle2,
    color: 'emerald',
    bg: 'bg-emerald-50',
    border: 'border-emerald-500',
    text: 'text-emerald-700',
    button: 'from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800',
  },
  REJETE: {
    label: 'Refuser',
    description: 'Rejeter la demande',
    icon: '❌',
    IconComponent: XCircle,
    color: 'rose',
    bg: 'bg-rose-50',
    border: 'border-rose-500',
    text: 'text-rose-700',
    button: 'from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800',
  },
  REPORTE: {
    label: 'Reporter',
    description: 'Différer la décision',
    icon: '⏱️',
    IconComponent: Clock,
    color: 'indigo',
    bg: 'bg-indigo-50',
    border: 'border-indigo-500',
    text: 'text-indigo-700',
    button: 'from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800',
  },
};

const typeCongeConfig: Record<string, { icon: string; label: string }> = {
  ANNUEL: { icon: '🏖️', label: 'Annuel' },
  MALADIE: { icon: '🏥', label: 'Maladie' },
  EXCEPTIONNEL: { icon: '⭐', label: 'Exceptionnel' },
  SANS_SOLDE: { icon: '📋', label: 'Sans solde' },
};

export default function StatutModal({ open, onOpenChange, onSubmit, demande, isLoading }: Props) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    control,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      statut: 'APPROUVE',
      remarque: '',
    },
  });

  const statut = watch('statut');
  const remarque = watch('remarque');

  useEffect(() => {
    if (!open) {
      reset({ statut: 'APPROUVE', remarque: '' });
    }
  }, [open, reset]);

  const selectedOption = statutOptions[statut];
  const IconComponent = selectedOption?.IconComponent;

  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl h-[85vh] p-0 gap-0 overflow-hidden flex flex-col">
          {/* Header Compact */}
          <div className="flex-none px-6 py-4 border-b bg-gradient-to-r from-indigo-600 to-indigo-700">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Traiter la demande de congé
              </DialogTitle>
            </DialogHeader>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="flex-1 flex flex-col min-h-0">
            <div className="flex-1 overflow-y-auto px-6 py-4">
              <div className="space-y-4">
                {/* Infos Demande - Ultra Compact */}
                {demande && (
                    <Card className="border-2 border-slate-200">
                      <CardContent className="p-4">
                        <div className="grid grid-cols-2 gap-4">
                          {/* Employé */}
                          <div className="col-span-2">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-12 w-12 border-2 border-slate-200">
                                <AvatarImage src={demande.employePhoto} />
                                <AvatarFallback className="bg-indigo-100 text-indigo-700 font-semibold">
                                  {demande.employeNom?.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-900 truncate">{demande.employeNom}</p>
                                <p className="text-sm text-indigo-600 font-medium">{demande.employeMatricule}</p>
                              </div>
                            </div>
                          </div>

                          {/* Type */}
                          <div className="bg-slate-50 p-3 rounded-lg">
                            <p className="text-xs font-semibold text-slate-500 mb-1">Type</p>
                            <div className="flex items-center gap-1.5">
                              <span className="text-xl">{typeCongeConfig[demande.typeConge]?.icon}</span>
                              <span className="text-sm font-medium text-slate-900">
                            {typeCongeConfig[demande.typeConge]?.label}
                          </span>
                            </div>
                          </div>

                          {/* Durée */}
                          <div className="bg-slate-50 p-3 rounded-lg">
                            <p className="text-xs font-semibold text-slate-500 mb-1">Durée</p>
                            <p className="text-2xl font-bold text-indigo-600">
                              {demande.nombreJours}
                              <span className="text-sm font-normal text-slate-600 ml-1">j</span>
                            </p>
                          </div>

                          {/* Période */}
                          <div className="col-span-2 bg-slate-50 p-3 rounded-lg">
                            <p className="text-xs font-semibold text-slate-500 mb-2">Période</p>
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-slate-600" />
                              <span className="font-medium text-slate-900">
                            {format(new Date(demande.dateDebut), 'dd MMM', { locale: fr })}
                          </span>
                              <span className="text-slate-400">→</span>
                              <span className="font-medium text-slate-900">
                            {format(new Date(demande.dateFin), 'dd MMM yyyy', { locale: fr })}
                          </span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                )}

                {/* Décision - Grid Compact */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700">
                    Votre décision <span className="text-rose-500">*</span>
                  </Label>
                  <Controller
                      name="statut"
                      control={control}
                      render={({ field }) => (
                          <div className="grid grid-cols-3 gap-3">
                            {Object.entries(statutOptions).map(([key, option]) => {
                              const isSelected = field.value === key;
                              const OptionIcon = option.IconComponent;
                              return (
                                  <button
                                      key={key}
                                      type="button"
                                      onClick={() => field.onChange(key)}
                                      className={cn(
                                          'relative p-4 rounded-xl border-2 transition-all',
                                          isSelected
                                              ? `${option.border} ${option.bg} shadow-sm`
                                              : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                                      )}
                                  >
                                    <div className="flex flex-col items-center gap-2">
                                      <div className="text-3xl">{option.icon}</div>
                                      <div className="text-center">
                                        <p className={cn(
                                            'font-bold text-sm',
                                            isSelected ? option.text : 'text-slate-900'
                                        )}>
                                          {option.label}
                                        </p>
                                        <p className="text-xs text-slate-600 mt-0.5">{option.description}</p>
                                      </div>
                                      {isSelected && (
                                          <CheckCircle2 className={cn(
                                              'absolute -top-1.5 -right-1.5 h-5 w-5 bg-white rounded-full',
                                              option.text
                                          )} />
                                      )}
                                    </div>
                                  </button>
                              );
                            })}
                          </div>
                      )}
                  />
                </div>

                {/* Alerte selon choix */}
                {selectedOption && (
                    <div className={cn('p-3 rounded-lg border-2', selectedOption.bg, selectedOption.border)}>
                      <div className="flex items-start gap-2">
                        <IconComponent className={cn('h-5 w-5 mt-0.5', selectedOption.text)} />
                        <div>
                          <p className={cn('font-semibold text-sm', selectedOption.text)}>
                            {selectedOption.label} cette demande
                          </p>
                          {statut === 'REJETE' && (
                              <p className="text-xs text-rose-600 mt-1">
                                Une justification est obligatoire en cas de refus
                              </p>
                          )}
                        </div>
                      </div>
                    </div>
                )}

                {/* Remarque */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    Commentaire
                    {statut === 'REJETE' ? (
                        <Badge className="bg-rose-100 text-rose-700 text-xs">Obligatoire</Badge>
                    ) : (
                        <span className="text-xs text-slate-500 font-normal">(optionnel)</span>
                    )}
                  </Label>
                  <Textarea
                      {...register('remarque')}
                      placeholder={
                        statut === 'APPROUVE'
                            ? 'Ajouter un commentaire...'
                            : statut === 'REJETE'
                                ? 'Expliquer les raisons du refus...'
                                : 'Raison du report...'
                      }
                      rows={3}
                      className={cn(
                          'resize-none border-2',
                          errors.remarque && 'border-rose-300'
                      )}
                  />
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-slate-600">
                      {statut === 'REJETE' ? 'Justification requise' : 'Max 500 caractères'}
                    </p>
                    <p className={cn(
                        'text-xs font-medium',
                        (remarque?.length || 0) > 450 ? 'text-orange-600' : 'text-slate-500'
                    )}>
                      {remarque?.length || 0} / 500
                    </p>
                  </div>
                  {errors.remarque && (
                      <p className="text-xs text-rose-600 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.remarque.message}
                      </p>
                  )}
                </div>
              </div>
            </div>

            {/* Footer Compact */}
            <div className="flex-none px-6 py-3 border-t bg-slate-50 flex items-center justify-end gap-3">
              <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                  className="h-9"
              >
                Annuler
              </Button>
              <Button
                  type="submit"
                  disabled={isLoading}
                  className={cn(
                      'h-9 bg-gradient-to-r shadow-md',
                      selectedOption?.button
                  )}
              >
                {isLoading ? (
                    <>
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      Traitement...
                    </>
                ) : (
                    <>
                      {IconComponent && <IconComponent className="h-4 w-4 mr-2" />}
                      Confirmer
                    </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
  );
}