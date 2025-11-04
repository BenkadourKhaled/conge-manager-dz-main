import { useEffect, useState } from 'react';
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
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Check,
  ChevronsUpDown,
  Search,
  User,
  Calendar,
  Briefcase,
  AlertCircle,
  Info,
  Calculator,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Target,
  Award,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
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

  // États pour le Combobox
  const [openCombobox, setOpenCombobox] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [focusedField, setFocusedField] = useState<string | null>(null);

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
      employeId: undefined,
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
      return response;
    },
  });

  // Extraire les données des employés
  const employes = (() => {
    if (employesResponse?.data?.data && Array.isArray(employesResponse.data.data)) {
      return employesResponse.data.data;
    }
    if (employesResponse?.data && Array.isArray(employesResponse.data)) {
      return employesResponse.data;
    }
    if (Array.isArray(employesResponse)) {
      return employesResponse;
    }
    if (employesResponse?.content && Array.isArray(employesResponse.content)) {
      return employesResponse.content;
    }
    return [];
  })();

  // Filtrer les employés selon la recherche
  const filteredEmployes = employes.filter((employe: any) => {
    if (!searchValue) return true;

    const search = searchValue.toLowerCase();
    const matricule = employe.matricule?.toLowerCase() || '';
    const nom = employe.nom?.toLowerCase() || '';
    const prenom = employe.prenom?.toLowerCase() || '';
    const nomComplet = employe.nomComplet?.toLowerCase() || '';

    return (
        matricule.includes(search) ||
        nom.includes(search) ||
        prenom.includes(search) ||
        nomComplet.includes(search)
    );
  });

  // Mutation de création
  const createMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await historiqueCongesApi.create(data);
      return response;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['historique-conges'] });
      toast.success('Historique créé avec succès');
      onSubmit();
      reset();
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Erreur lors de la création de l'historique";
      toast.error(message);
    },
  });

  // Mutation de mise à jour
  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: FormData }) => {
      const payload = {
        employeId: data.employeId,
        anneeConge: data.anneeConge,
        nombreJoursAttribues: data.nombreJoursAttribues,
        nombreJoursConsommes: data.nombreJoursConsommes,
        remarque: data.remarque || '',
      };

      const response = await historiqueCongesApi.update(id, payload);
      return response;
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['historique-conges'] });
      toast.success('Historique modifié avec succès');
      onSubmit();
      reset();
    },
    onError: (error: any) => {
      const message = error.response?.data?.message || "Erreur lors de la modification de l'historique";
      toast.error(message);
    },
  });

  useEffect(() => {
    if (open) {
      if (initialData) {
        const employeId = typeof initialData.employeId === 'number'
            ? initialData.employeId
            : parseInt(initialData.employeId);

        reset({
          employeId: employeId,
          anneeConge: initialData.anneeConge,
          nombreJoursAttribues: initialData.nombreJoursAttribues,
          nombreJoursConsommes: initialData.nombreJoursConsommes,
          remarque: initialData.remarque || '',
        });
      } else {
        reset({
          employeId: undefined,
          anneeConge: new Date().getFullYear(),
          nombreJoursAttribues: 30,
          nombreJoursConsommes: 0,
          remarque: '',
        });
      }

      // Réinitialiser la recherche
      setSearchValue('');
    }
  }, [open, initialData, reset]);

  const onFormSubmit = (data: FormData) => {
    if (isEdit && initialData) {
      const updateData = {
        ...data,
        employeId: data.employeId || initialData.employeId,
      };
      updateMutation.mutate({ id: initialData.id, data: updateData });
    } else {
      createMutation.mutate(data);
    }
  };

  const isPending = createMutation.isPending || updateMutation.isPending;

  // Calculer les jours restants
  const nombreJoursAttribues = watch('nombreJoursAttribues') || 0;
  const nombreJoursConsommes = watch('nombreJoursConsommes') || 0;
  const nombreJoursRestants = nombreJoursAttribues - nombreJoursConsommes;

  // Déterminer le statut des jours restants
  const restantStatus = (() => {
    if (nombreJoursRestants < 0) {
      return {
        label: 'Dépassement',
        bg: 'bg-gradient-to-br from-rose-50 to-pink-50',
        border: 'border-rose-300',
        color: 'text-rose-700',
        icon: XCircle,
        iconBg: 'bg-gradient-to-br from-rose-500 to-pink-600',
      };
    } else if (nombreJoursRestants < 5) {
      return {
        label: 'Critique',
        bg: 'bg-gradient-to-br from-orange-50 to-amber-50',
        border: 'border-orange-300',
        color: 'text-orange-700',
        icon: AlertCircle,
        iconBg: 'bg-gradient-to-br from-orange-500 to-amber-600',
      };
    } else if (nombreJoursRestants < 15) {
      return {
        label: 'Attention',
        bg: 'bg-gradient-to-br from-yellow-50 to-amber-50',
        border: 'border-yellow-300',
        color: 'text-yellow-700',
        icon: Clock,
        iconBg: 'bg-gradient-to-br from-yellow-500 to-amber-500',
      };
    } else {
      return {
        label: 'Optimal',
        bg: 'bg-gradient-to-br from-emerald-50 to-teal-50',
        border: 'border-emerald-300',
        color: 'text-emerald-700',
        icon: CheckCircle,
        iconBg: 'bg-gradient-to-br from-emerald-500 to-teal-600',
      };
    }
  })();

  const RestantIcon = restantStatus.icon;

  // Trouver l'employé sélectionné
  const selectedEmployeId = watch('employeId');
  const selectedEmploye = employes.find((e: any) => e.id === selectedEmployeId);

  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-violet-50/20 to-indigo-50/20 border-0 shadow-2xl">
          {/* En-tête moderne avec dégradé */}
          <DialogHeader className="space-y-4 pb-6 border-b border-slate-200">
            <div className="flex items-center gap-4">
              <div className={cn(
                  "p-3.5 rounded-2xl shadow-lg",
                  isEdit
                      ? "bg-gradient-to-br from-blue-600 to-cyan-600 shadow-blue-500/30"
                      : "bg-gradient-to-br from-violet-600 to-indigo-600 shadow-violet-500/30"
              )}>
                {isEdit ? (
                    <Briefcase className="h-7 w-7 text-white" />
                ) : (
                    <Sparkles className="h-7 w-7 text-white" />
                )}
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold bg-gradient-to-r from-slate-900 via-violet-900 to-indigo-900 bg-clip-text text-transparent">
                  {isEdit ? 'Modifier l\'historique' : 'Nouvel historique de congés'}
                </DialogTitle>
                <p className="text-sm text-slate-600 mt-1">
                  {isEdit
                      ? 'Modifiez les informations de l\'historique existant'
                      : 'Créez un nouvel historique de congés pour un employé'}
                </p>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6 pt-6">
            {/* Sélection de l'employé avec design moderne */}
            <div className="space-y-3">
              <Label className="text-base font-semibold flex items-center gap-2 text-slate-900">
                <User className="h-5 w-5 text-violet-600" />
                Employé <span className="text-rose-500">*</span>
              </Label>

              {isEdit ? (
                  <Card className="border-2 border-violet-200 bg-gradient-to-br from-violet-50 to-indigo-50 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-violet-500/30">
                          {initialData?.employeNom?.charAt(0)?.toUpperCase() || 'E'}
                        </div>
                        <div className="flex-1">
                          <p className="font-bold text-slate-900 text-lg">{initialData?.employeNom}</p>
                          <p className="text-sm text-violet-700 font-medium">
                            Matricule: {initialData?.employeMatricule}
                          </p>
                        </div>
                        <Badge className="bg-gradient-to-r from-violet-100 to-indigo-100 text-violet-700 border-0 px-3 py-1 font-medium">
                          Sélectionné
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
              ) : (
                  <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                    <PopoverTrigger asChild>
                      <Button
                          variant="outline"
                          role="combobox"
                          aria-expanded={openCombobox}
                          className={cn(
                              "w-full justify-between h-14 border-2 hover:border-violet-300 transition-all duration-200 bg-white",
                              selectedEmploye && "border-violet-300 bg-gradient-to-r from-violet-50 to-indigo-50",
                              errors.employeId && "border-rose-300 hover:border-rose-400"
                          )}
                      >
                        {selectedEmploye ? (
                            <div className="flex items-center gap-3 flex-1">
                              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-semibold shadow-md shadow-violet-500/30">
                                {selectedEmploye.nom?.charAt(0)?.toUpperCase() || 'E'}
                              </div>
                              <div className="text-left">
                                <p className="font-semibold text-slate-900">
                                  {selectedEmploye.nomComplet || `${selectedEmploye.nom} ${selectedEmploye.prenom}`}
                                </p>
                                <p className="text-xs text-violet-600 font-medium">
                                  {selectedEmploye.matricule}
                                </p>
                              </div>
                            </div>
                        ) : (
                            <span className="text-slate-500 flex items-center gap-2">
                        <Search className="h-4 w-4" />
                        Rechercher un employé...
                      </span>
                        )}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[600px] p-0 border-2 border-violet-200 shadow-xl">
                      <Command className="bg-white">
                        <div className="border-b border-slate-200 bg-gradient-to-r from-violet-50 to-indigo-50 p-2">
                          <CommandInput
                              placeholder="Rechercher par nom, prénom ou matricule..."
                              value={searchValue}
                              onValueChange={setSearchValue}
                              className="border-0 bg-white"
                          />
                        </div>
                        <CommandList className="max-h-[300px]">
                          <CommandEmpty className="py-8 text-center">
                            <div className="flex flex-col items-center gap-3">
                              <div className="w-16 h-16 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center">
                                <User className="h-8 w-8 text-slate-400" />
                              </div>
                              <div>
                                <p className="font-semibold text-slate-700">Aucun employé trouvé</p>
                                <p className="text-sm text-slate-500 mt-1">Essayez une autre recherche</p>
                              </div>
                            </div>
                          </CommandEmpty>
                          <CommandGroup className="p-2">
                            {employesLoading ? (
                                <div className="py-8 text-center">
                                  <div className="inline-flex flex-col items-center gap-3">
                                    <div className="relative w-12 h-12">
                                      <div className="absolute inset-0 rounded-full border-4 border-violet-200"></div>
                                      <div className="absolute inset-0 rounded-full border-4 border-t-violet-600 animate-spin"></div>
                                    </div>
                                    <p className="text-slate-600 font-medium">Chargement...</p>
                                  </div>
                                </div>
                            ) : (
                                filteredEmployes.map((employe: any) => (
                                    <CommandItem
                                        key={employe.id}
                                        value={`${employe.matricule} ${employe.nom} ${employe.prenom} ${employe.nomComplet || ''}`}
                                        onSelect={() => {
                                          setValue('employeId', employe.id, { shouldValidate: true });
                                          setOpenCombobox(false);
                                          setSearchValue('');
                                        }}
                                        className="cursor-pointer rounded-xl mb-1 hover:bg-gradient-to-r hover:from-violet-50 hover:to-indigo-50 transition-all duration-200"
                                    >
                                      <div className="flex items-center gap-3 py-2 flex-1">
                                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-white font-semibold shadow-md shadow-violet-500/20">
                                          {employe.nom?.charAt(0)?.toUpperCase() || 'E'}
                                        </div>
                                        <div className="flex-1">
                                          <p className="font-semibold text-slate-900">
                                            {employe.nomComplet || `${employe.nom} ${employe.prenom}`}
                                          </p>
                                          <p className="text-xs text-slate-500 font-medium">
                                            Matricule: {employe.matricule}
                                          </p>
                                        </div>
                                        {selectedEmployeId === employe.id && (
                                            <Check className="h-5 w-5 text-violet-600" />
                                        )}
                                      </div>
                                    </CommandItem>
                                ))
                            )}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
              )}

              {errors.employeId && (
                  <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-rose-50 to-pink-50 border border-rose-200 rounded-xl">
                    <AlertCircle className="h-4 w-4 text-rose-600" />
                    <p className="text-sm text-rose-700 font-medium">{errors.employeId.message}</p>
                  </div>
              )}

              {isEdit && (
                  <div className="flex items-center gap-2 p-3 bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 rounded-xl">
                    <Info className="h-4 w-4 text-blue-600" />
                    <p className="text-sm text-blue-700 font-medium">
                      L'employé ne peut pas être modifié après la création
                    </p>
                  </div>
              )}
            </div>

            {/* Informations de l'historique avec design en grille moderne */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Année */}
              <div className="space-y-2">
                <Label htmlFor="anneeConge" className="text-base font-semibold flex items-center gap-2 text-slate-900">
                  <Calendar className="h-4 w-4 text-blue-600" />
                  Année <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                      id="anneeConge"
                      type="number"
                      {...register('anneeConge', { valueAsNumber: true })}
                      min="2020"
                      max="2030"
                      className={cn(
                          "h-12 border-2 transition-all duration-200 font-medium text-base pl-4",
                          focusedField === 'annee' && "ring-4 ring-violet-500/20 border-violet-400",
                          errors.anneeConge ? "border-rose-300 focus:border-rose-400" : "border-slate-200 focus:border-violet-400"
                      )}
                      onFocus={() => setFocusedField('annee')}
                      onBlur={() => setFocusedField(null)}
                  />
                </div>
                {errors.anneeConge && (
                    <div className="flex items-center gap-2 text-sm text-rose-600 font-medium">
                      <AlertCircle className="h-4 w-4" />
                      {errors.anneeConge.message}
                    </div>
                )}
              </div>

              {/* Jours attribués */}
              <div className="space-y-2">
                <Label htmlFor="nombreJoursAttribues" className="text-base font-semibold flex items-center gap-2 text-slate-900">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  Jours attribués <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                      id="nombreJoursAttribues"
                      type="number"
                      step="0.5"
                      {...register('nombreJoursAttribues', { valueAsNumber: true })}
                      min="0"
                      max="60"
                      className={cn(
                          "h-12 border-2 transition-all duration-200 font-medium text-base pl-4",
                          focusedField === 'attribues' && "ring-4 ring-emerald-500/20 border-emerald-400",
                          errors.nombreJoursAttribues ? "border-rose-300 focus:border-rose-400" : "border-slate-200 focus:border-emerald-400"
                      )}
                      onFocus={() => setFocusedField('attribues')}
                      onBlur={() => setFocusedField(null)}
                  />
                </div>
                {errors.nombreJoursAttribues && (
                    <div className="flex items-center gap-2 text-sm text-rose-600 font-medium">
                      <AlertCircle className="h-4 w-4" />
                      {errors.nombreJoursAttribues.message}
                    </div>
                )}
              </div>

              {/* Jours consommés */}
              <div className="space-y-2">
                <Label htmlFor="nombreJoursConsommes" className="text-base font-semibold flex items-center gap-2 text-slate-900">
                  <TrendingDown className="h-4 w-4 text-amber-600" />
                  Jours consommés <span className="text-rose-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                      id="nombreJoursConsommes"
                      type="number"
                      step="0.5"
                      {...register('nombreJoursConsommes', { valueAsNumber: true })}
                      min="0"
                      max="60"
                      className={cn(
                          "h-12 border-2 transition-all duration-200 font-medium text-base pl-4",
                          focusedField === 'consommes' && "ring-4 ring-amber-500/20 border-amber-400",
                          errors.nombreJoursConsommes ? "border-rose-300 focus:border-rose-400" : "border-slate-200 focus:border-amber-400"
                      )}
                      onFocus={() => setFocusedField('consommes')}
                      onBlur={() => setFocusedField(null)}
                  />
                </div>
                {errors.nombreJoursConsommes && (
                    <div className="flex items-center gap-2 text-sm text-rose-600 font-medium">
                      <AlertCircle className="h-4 w-4" />
                      {errors.nombreJoursConsommes.message}
                    </div>
                )}
              </div>
            </div>

            {/* Carte de jours restants ultra moderne */}
            <div className="space-y-3">
              <Label className="text-base font-semibold flex items-center gap-2 text-slate-900">
                <Calculator className="h-4 w-4 text-violet-600" />
                Solde de jours restants
              </Label>
              <Card className={cn(
                  "border-2 shadow-lg transition-all duration-300",
                  restantStatus.border,
                  restantStatus.bg
              )}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                          "p-3 rounded-2xl shadow-lg",
                          restantStatus.iconBg
                      )}>
                        <RestantIcon className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-slate-600 mb-1">
                          Solde disponible
                        </p>
                        <p className="text-xs text-slate-500">
                          Calculé automatiquement: Attribués - Consommés
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={cn("text-4xl font-bold mb-1", restantStatus.color)}>
                        {nombreJoursRestants.toFixed(1)}
                      </p>
                      <Badge
                          className={cn(
                              "text-xs font-semibold px-3 py-1 border-2",
                              restantStatus.bg,
                              restantStatus.border,
                              restantStatus.color
                          )}
                      >
                        {restantStatus.label}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Remarque avec style moderne */}
            <div className="space-y-2">
              <Label htmlFor="remarque" className="text-base font-semibold text-slate-900">
                Remarque (optionnelle)
              </Label>
              <Input
                  id="remarque"
                  {...register('remarque')}
                  placeholder="Ajouter une remarque ou un commentaire..."
                  className={cn(
                      "h-12 border-2 transition-all duration-200 font-medium",
                      focusedField === 'remarque' && "ring-4 ring-slate-500/20 border-slate-400",
                      "border-slate-200 focus:border-slate-400"
                  )}
                  onFocus={() => setFocusedField('remarque')}
                  onBlur={() => setFocusedField(null)}
              />
            </div>

            {/* Message d'information en édition */}
            {isEdit && (
                <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-cyan-50 shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-xl shadow-lg shadow-blue-500/30">
                        <Info className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-bold text-blue-900 mb-1">
                          Modification en cours
                        </p>
                        <p className="text-sm text-blue-700">
                          Vous modifiez l'historique de l'année{' '}
                          <span className="font-bold">{initialData?.anneeConge}</span> pour{' '}
                          <span className="font-bold">{initialData?.employeNom}</span>
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
            )}

            {/* Boutons du footer modernes */}
            <DialogFooter className="pt-6 border-t border-slate-200 gap-3">
              <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isPending}
                  className="h-12 px-6 border-2 hover:bg-slate-50 font-semibold transition-all duration-200"
              >
                Annuler
              </Button>
              <Button
                  type="submit"
                  disabled={isPending || !selectedEmployeId}
                  className={cn(
                      "h-12 px-6 font-semibold shadow-lg transition-all duration-200",
                      isEdit
                          ? "bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-blue-500/30 hover:shadow-xl hover:shadow-blue-500/40"
                          : "bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-violet-500/30 hover:shadow-xl hover:shadow-violet-500/40"
                  )}
              >
                {isPending ? (
                    <>
                      <div className="h-5 w-5 border-3 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Enregistrement...
                    </>
                ) : isEdit ? (
                    <>
                      <Briefcase className="h-5 w-5 mr-2" />
                      Modifier l'historique
                    </>
                ) : (
                    <>
                      <Sparkles className="h-5 w-5 mr-2" />
                      Créer l'historique
                    </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
  );
}