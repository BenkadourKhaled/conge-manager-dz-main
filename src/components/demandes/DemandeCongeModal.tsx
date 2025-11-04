import { useEffect, useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { employesApi } from '@/api/services';
import { format, differenceInCalendarDays, addDays, isBefore, startOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Calendar as CalendarIcon,
  User,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  Clock,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Search,
  X,
  Users,
  Building,
  Mail,
  Phone,
  Target,
  Award,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const schema = z.object({
  employeId: z.number().min(1, 'Veuillez sélectionner un employé'),
  dateDebut: z.date({ required_error: 'La date de début est requise' }),
  dateFin: z.date({ required_error: 'La date de fin est requise' }),
  adressePendantConge: z.string().optional(),
  anneeConge: z.number().min(2020, 'Année invalide'),
  typeConge: z.enum(['ANNUEL', 'MALADIE', 'EXCEPTIONNEL', 'SANS_SOLDE'], {
    required_error: 'Veuillez sélectionner un type de congé',
  }),
}).refine(
    (data) => {
      if (data.dateDebut && data.dateFin) {
        return !isBefore(data.dateFin, data.dateDebut);
      }
      return true;
    },
    {
      message: 'La date de fin doit être après la date de début',
      path: ['dateFin'],
    }
);

type FormData = z.infer<typeof schema>;

interface DemandeCongeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isLoading?: boolean;
}

const typeCongeConfig = {
  ANNUEL: {
    label: 'Congé Annuel',
    description: 'Congé payé annuel',
    icon: '🏖️',
    gradient: 'from-blue-500 to-cyan-600',
    bg: 'from-blue-50 to-cyan-50',
    border: 'border-blue-300',
    text: 'text-blue-700',
    shadow: 'shadow-blue-500/30',
  },
  MALADIE: {
    label: 'Congé Maladie',
    description: 'Raison médicale',
    icon: '🏥',
    gradient: 'from-rose-500 to-pink-600',
    bg: 'from-rose-50 to-pink-50',
    border: 'border-rose-300',
    text: 'text-rose-700',
    shadow: 'shadow-rose-500/30',
  },
  EXCEPTIONNEL: {
    label: 'Congé Exceptionnel',
    description: 'Événements spéciaux',
    icon: '⭐',
    gradient: 'from-violet-500 to-purple-600',
    bg: 'from-violet-50 to-purple-50',
    border: 'border-violet-300',
    text: 'text-violet-700',
    shadow: 'shadow-violet-500/30',
  },
  SANS_SOLDE: {
    label: 'Sans Solde',
    description: 'Non rémunéré',
    icon: '📋',
    gradient: 'from-slate-500 to-slate-600',
    bg: 'from-slate-50 to-slate-100',
    border: 'border-slate-300',
    text: 'text-slate-700',
    shadow: 'shadow-slate-500/30',
  },
};

// Composant de recherche d'employés ultra-moderne
const EmployeeSearchSelector = ({
                                  value,
                                  onChange,
                                  error,
                                  employes
                                }: {
  value: number | undefined;
  onChange: (id: number) => void;
  error?: any;
  employes: any[];
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);

  // Filtrer les employés en fonction du terme de recherche
  const filteredEmployees = useMemo(() => {
    if (!searchTerm) return employes;

    const lowercasedTerm = searchTerm.toLowerCase();
    return employes.filter((emp: any) =>
        emp.nomComplet?.toLowerCase().includes(lowercasedTerm) ||
        emp.matricule?.toLowerCase().includes(lowercasedTerm) ||
        emp.service?.toLowerCase().includes(lowercasedTerm)
    );
  }, [employes, searchTerm]);

  // Mettre à jour l'employé sélectionné quand la valeur change
  useEffect(() => {
    if (value) {
      const employee = employes.find((emp: any) => emp.id === value);
      setSelectedEmployee(employee || null);
    } else {
      setSelectedEmployee(null);
    }
  }, [value, employes]);

  // Gérer la sélection d'un employé
  const handleSelectEmployee = (employee: any) => {
    setSelectedEmployee(employee);
    onChange(employee.id);
    setIsOpen(false);
    setSearchTerm('');
  };

  // Effacer la sélection
  const handleClearSelection = () => {
    setSelectedEmployee(null);
    onChange(0);
    setSearchTerm('');
  };

  return (
      <div className="space-y-3">
        <Label className="text-base font-semibold flex items-center gap-2 text-slate-900">
          <User className="h-5 w-5 text-violet-600" />
          Sélectionner un employé <span className="text-rose-500">*</span>
        </Label>

        {selectedEmployee ? (
            // Affichage de l'employé sélectionné
            <div className="relative border-2 border-violet-300 rounded-xl bg-gradient-to-r from-violet-50 to-indigo-50 p-4 shadow-sm">
              <div className="flex items-center gap-4">
                <Avatar className="h-14 w-14 ring-4 ring-white shadow-lg">
                  <AvatarImage src={selectedEmployee.photo} />
                  <AvatarFallback className="bg-gradient-to-br from-violet-600 to-indigo-600 text-white font-bold text-lg">
                    {selectedEmployee.nom?.charAt(0)}{selectedEmployee.prenom?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="font-bold text-slate-900 text-lg">{selectedEmployee.nomComplet}</p>
                  <p className="text-sm text-violet-700 font-medium">Matricule: {selectedEmployee.matricule}</p>
                  {selectedEmployee.service && (
                      <p className="text-xs text-slate-600 mt-1">{selectedEmployee.service}</p>
                  )}
                </div>
                <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={handleClearSelection}
                    className="h-9 w-9 p-0 rounded-xl hover:bg-rose-50 hover:text-rose-700"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
        ) : (
            // Interface de recherche
            <div>
              <Popover open={isOpen} onOpenChange={setIsOpen}>
                <PopoverTrigger asChild>
                  <Button
                      type="button"
                      variant="outline"
                      className={cn(
                          "w-full justify-start h-14 border-2 text-left font-normal hover:border-violet-300 transition-all",
                          error ? "border-rose-300" : "border-slate-200"
                      )}
                  >
                    <Search className="mr-3 h-5 w-5 text-slate-400" />
                    <span className="text-slate-500">Rechercher un employé...</span>
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[500px] p-0 border-2 border-violet-200 shadow-2xl" align="start">
                  <div className="border-b border-slate-200 bg-gradient-to-r from-violet-50 to-indigo-50 p-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                          placeholder="Rechercher par nom, matricule..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 border-2 border-slate-200 focus:border-violet-400"
                      />
                    </div>
                  </div>
                  <div className="max-h-[300px] overflow-y-auto p-2">
                    {filteredEmployees.length > 0 ? (
                        <div className="space-y-1">
                          {filteredEmployees.map((emp: any) => (
                              <button
                                  key={emp.id}
                                  type="button"
                                  onClick={() => handleSelectEmployee(emp)}
                                  className="w-full p-3 rounded-xl hover:bg-gradient-to-r hover:from-violet-50 hover:to-indigo-50 transition-all duration-200 text-left group"
                              >
                                <div className="flex items-center gap-3">
                                  <Avatar className="h-12 w-12 ring-2 ring-white shadow-md">
                                    <AvatarImage src={emp.photo} />
                                    <AvatarFallback className="bg-gradient-to-br from-violet-600 to-indigo-600 text-white font-semibold">
                                      {emp.nom?.charAt(0)}{emp.prenom?.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                  <div className="flex-1">
                                    <p className="font-semibold text-slate-900 group-hover:text-violet-700 transition-colors">
                                      {emp.nomComplet}
                                    </p>
                                    <p className="text-sm text-slate-500">{emp.matricule}</p>
                                    {emp.service && (
                                        <p className="text-xs text-slate-400 mt-0.5">{emp.service}</p>
                                    )}
                                  </div>
                                </div>
                              </button>
                          ))}
                        </div>
                    ) : (
                        <div className="py-12 text-center">
                          <Users className="h-12 w-12 mx-auto text-slate-300 mb-3" />
                          <p className="text-sm text-slate-500 font-medium">Aucun employé trouvé</p>
                          <p className="text-xs text-slate-400 mt-1">Essayez une autre recherche</p>
                        </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              {error && (
                  <p className="text-sm text-rose-600 flex items-center gap-2 mt-2">
                    <AlertCircle className="h-4 w-4" />
                    {error.message}
                  </p>
              )}
            </div>
        )}
      </div>
  );
};

export default function DemandeCongeModal({
                                            open,
                                            onOpenChange,
                                            onSubmit,
                                            isLoading,
                                          }: DemandeCongeModalProps) {
  const [step, setStep] = useState(1);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
    control,
    setValue,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      employeId: 0,
      anneeConge: new Date().getFullYear(),
      typeConge: 'ANNUEL',
    },
  });

  // Récupérer les employés
  const { data: employesData, isLoading: employesLoading } = useQuery({
    queryKey: ['employes'],
    queryFn: () => employesApi.getAll(),
  });

  const employes = employesData?.data?.data || [];
  const employesActifs = employes.filter((emp: any) => emp.statut === 'ACTIF');

  useEffect(() => {
    if (!open) {
      reset({
        employeId: 0,
        anneeConge: new Date().getFullYear(),
        typeConge: 'ANNUEL',
      });
      setStep(1);
    }
  }, [open, reset]);

  const employeId = watch('employeId');
  const typeConge = watch('typeConge');
  const dateDebut = watch('dateDebut');
  const dateFin = watch('dateFin');

  const selectedEmploye = employesActifs.find((e: any) => e.id === employeId);

  const nombreJours = useMemo(() => {
    if (!dateDebut || !dateFin) return 0;
    return differenceInCalendarDays(dateFin, dateDebut) + 1;
  }, [dateDebut, dateFin]);

  const canProceedToStep2 = employeId && typeConge && dateDebut && dateFin && nombreJours > 0;

  const today = startOfDay(new Date());

  const handleFormSubmit = (data: FormData) => {
    const payload = {
      ...data,
      nombreJours,
    };
    onSubmit(payload);
  };

  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white via-violet-50/20 to-indigo-50/20 border-0 shadow-2xl p-0">
          {/* En-tête moderne avec dégradé */}
          <div className="sticky top-0 z-10 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-8 py-6 border-b border-violet-500/20">
            <DialogHeader>
              <div className="flex items-center gap-4 mb-2">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
                  <Sparkles className="h-7 w-7 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-2xl font-bold">
                    Nouvelle demande de congé
                  </DialogTitle>
                  <DialogDescription className="text-violet-100 mt-1">
                    Étape {step} sur 2 - {step === 1 ? 'Informations principales' : 'Finalisation'}
                  </DialogDescription>
                </div>
              </div>
              {/* Progress bar */}
              <div className="mt-4 h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                    className="h-full bg-white transition-all duration-500 rounded-full"
                    style={{ width: `${(step / 2) * 100}%` }}
                />
              </div>
            </DialogHeader>
          </div>

          <form onSubmit={handleSubmit(handleFormSubmit)} className="p-8">
            <div className="space-y-6">
              {step === 1 && (
                  <div className="space-y-6">
                    {/* Sélection employé */}
                    <Controller
                        name="employeId"
                        control={control}
                        render={({ field }) => (
                            <EmployeeSearchSelector
                                value={field.value}
                                onChange={field.onChange}
                                error={errors.employeId}
                                employes={employesActifs}
                            />
                        )}
                    />

                    {/* Type de congé */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold flex items-center gap-2 text-slate-900">
                        <Award className="h-5 w-5 text-violet-600" />
                        Type de congé <span className="text-rose-500">*</span>
                      </Label>
                      <Controller
                          name="typeConge"
                          control={control}
                          render={({ field }) => (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {Object.entries(typeCongeConfig).map(([key, config]) => {
                                  const isSelected = field.value === key;
                                  return (
                                      <button
                                          key={key}
                                          type="button"
                                          onClick={() => field.onChange(key)}
                                          className={cn(
                                              'relative p-5 rounded-2xl border-2 transition-all duration-300 text-left group',
                                              'hover:shadow-lg hover:scale-[1.02] active:scale-[0.98]',
                                              isSelected
                                                  ? `${config.border} bg-gradient-to-br ${config.bg} shadow-md ${config.shadow}`
                                                  : 'border-slate-200 hover:border-slate-300'
                                          )}
                                      >
                                        <div className="flex items-start gap-4">
                                          <div className={cn(
                                              'text-4xl p-3 rounded-xl transition-transform duration-300',
                                              isSelected ? 'scale-110' : 'group-hover:scale-105'
                                          )}>
                                            {config.icon}
                                          </div>
                                          <div className="flex-1">
                                            <p className={cn(
                                                'font-bold text-lg mb-1',
                                                isSelected ? config.text : 'text-slate-900'
                                            )}>
                                              {config.label}
                                            </p>
                                            <p className="text-sm text-slate-600">{config.description}</p>
                                          </div>
                                          {isSelected && (
                                              <CheckCircle2 className={cn('h-6 w-6 absolute top-4 right-4', config.text)} />
                                          )}
                                        </div>
                                      </button>
                                  );
                                })}
                              </div>
                          )}
                      />
                    </div>

                    {/* Dates */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label className="text-base font-semibold flex items-center gap-2 text-slate-900">
                          <CalendarIcon className="h-5 w-5 text-violet-600" />
                          Date de début <span className="text-rose-500">*</span>
                        </Label>
                        <Controller
                            name="dateDebut"
                            control={control}
                            render={({ field }) => (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            'w-full h-14 justify-start border-2 text-left font-normal hover:border-violet-300 transition-all',
                                            !field.value && 'text-slate-500',
                                            errors.dateDebut && 'border-rose-300'
                                        )}
                                    >
                                      <CalendarIcon className="mr-3 h-5 w-5 text-violet-600" />
                                      {field.value ? (
                                          format(field.value, 'dd MMMM yyyy', { locale: fr })
                                      ) : (
                                          <span>Choisir...</span>
                                      )}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0 border-2 border-violet-200" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={{ before: today }}
                                        locale={fr}
                                        initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                            )}
                        />
                        {errors.dateDebut && (
                            <p className="text-sm text-rose-600 flex items-center gap-2">
                              <AlertCircle className="h-4 w-4" />
                              {errors.dateDebut.message}
                            </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-base font-semibold flex items-center gap-2 text-slate-900">
                          <CalendarIcon className="h-5 w-5 text-violet-600" />
                          Date de fin <span className="text-rose-500">*</span>
                        </Label>
                        <Controller
                            name="dateFin"
                            control={control}
                            render={({ field }) => (
                                <Popover>
                                  <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            'w-full h-14 justify-start border-2 text-left font-normal hover:border-violet-300 transition-all',
                                            !field.value && 'text-slate-500',
                                            errors.dateFin && 'border-rose-300'
                                        )}
                                        disabled={!dateDebut}
                                    >
                                      <CalendarIcon className="mr-3 h-5 w-5 text-violet-600" />
                                      {field.value ? (
                                          format(field.value, 'dd MMMM yyyy', { locale: fr })
                                      ) : (
                                          <span>Choisir...</span>
                                      )}
                                    </Button>
                                  </PopoverTrigger>
                                  <PopoverContent className="w-auto p-0 border-2 border-violet-200" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={{
                                          before: dateDebut ? addDays(dateDebut, 0) : today,
                                        }}
                                        locale={fr}
                                        initialFocus
                                    />
                                  </PopoverContent>
                                </Popover>
                            )}
                        />
                        {errors.dateFin && (
                            <p className="text-sm text-rose-600 flex items-center gap-2">
                              <AlertCircle className="h-4 w-4" />
                              {errors.dateFin.message}
                            </p>
                        )}
                      </div>
                    </div>

                    {/* Durée calculée */}
                    {dateDebut && dateFin && nombreJours > 0 && (
                        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-2xl p-6 shadow-lg">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-lg">
                                <Target className="h-6 w-6 text-white" />
                              </div>
                              <div>
                                <p className="text-sm font-semibold text-blue-900">Durée totale</p>
                                <p className="text-sm text-blue-600 mt-0.5">
                                  {format(dateDebut, 'dd MMM', { locale: fr })} - {format(dateFin, 'dd MMM yyyy', { locale: fr })}
                                </p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-4xl font-bold text-blue-600">{nombreJours}</p>
                              <p className="text-sm text-blue-600 font-medium">jour{nombreJours > 1 ? 's' : ''}</p>
                            </div>
                          </div>
                        </div>
                    )}
                  </div>
              )}

              {step === 2 && (
                  <div className="space-y-6">
                    {/* Récapitulatif */}
                    <div className="bg-gradient-to-br from-violet-50 to-indigo-50 border-2 border-violet-200 rounded-2xl p-6 shadow-lg">
                      <div className="flex items-center gap-3 mb-5">
                        <div className="p-2.5 bg-gradient-to-br from-violet-600 to-indigo-600 rounded-xl shadow-lg">
                          <CheckCircle2 className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-900">Récapitulatif de votre demande</h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white rounded-xl p-4 border-2 border-violet-200 shadow-sm">
                          <p className="text-xs font-bold text-violet-600 uppercase mb-2">Employé</p>
                          <p className="font-bold text-slate-900">{selectedEmploye?.nomComplet}</p>
                          <p className="text-sm text-slate-500 mt-1">{selectedEmploye?.matricule}</p>
                        </div>

                        <div className="bg-white rounded-xl p-4 border-2 border-violet-200 shadow-sm">
                          <p className="text-xs font-bold text-violet-600 uppercase mb-2">Type de congé</p>
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{typeCongeConfig[typeConge]?.icon}</span>
                            <span className="font-bold text-slate-900">{typeCongeConfig[typeConge]?.label}</span>
                          </div>
                        </div>

                        <div className="bg-white rounded-xl p-4 border-2 border-violet-200 shadow-sm">
                          <p className="text-xs font-bold text-violet-600 uppercase mb-2">Période</p>
                          <p className="font-semibold text-slate-900">
                            {dateDebut && format(dateDebut, 'dd MMM', { locale: fr })} - {dateFin && format(dateFin, 'dd MMM yyyy', { locale: fr })}
                          </p>
                        </div>

                        <div className="bg-white rounded-xl p-4 border-2 border-violet-200 shadow-sm">
                          <p className="text-xs font-bold text-violet-600 uppercase mb-2">Durée</p>
                          <p className="text-3xl font-bold text-violet-600">
                            {nombreJours}
                            <span className="text-base font-normal text-slate-600 ml-2">
                          jour{nombreJours > 1 ? 's' : ''}
                        </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Adresse */}
                    <div className="space-y-3">
                      <Label className="text-base font-semibold flex items-center gap-2 text-slate-900">
                        <MapPin className="h-5 w-5 text-violet-600" />
                        Adresse pendant le congé
                        <span className="text-sm text-slate-500 font-normal">(optionnel)</span>
                      </Label>
                      <Textarea
                          {...register('adressePendantConge')}
                          placeholder="Indiquez une adresse où vous serez joignable..."
                          rows={3}
                          className="resize-none border-2 border-slate-200 focus:border-violet-400 transition-all"
                      />
                      <p className="text-sm text-slate-500">
                        Cette information peut être utile en cas d'urgence
                      </p>
                    </div>
                  </div>
              )}
            </div>

            {/* Footer actions */}
            <div className="flex items-center justify-between gap-4 mt-8 pt-6 border-t-2 border-slate-200">
              {step === 2 && (
                  <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(1)}
                      className="gap-2 border-2 hover:bg-slate-50 h-12 px-6"
                  >
                    <ArrowLeft className="h-5 w-5" />
                    Retour
                  </Button>
              )}

              <div className="flex items-center gap-3 ml-auto">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="border-2 h-12 px-6"
                >
                  Annuler
                </Button>

                {step === 1 ? (
                    <Button
                        type="button"
                        onClick={() => setStep(2)}
                        disabled={!canProceedToStep2}
                        className="gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-lg hover:shadow-xl shadow-violet-500/30 hover:shadow-violet-500/40 transition-all duration-300 h-12 px-6"
                    >
                      Suivant
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                ) : (
                    <Button
                        type="submit"
                        disabled={isLoading || employesLoading}
                        className="gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-lg hover:shadow-xl shadow-emerald-500/30 hover:shadow-emerald-500/40 transition-all duration-300 h-12 px-6"
                    >
                      {isLoading ? (
                          <>
                            <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            Création...
                          </>
                      ) : (
                          <>
                            <CheckCircle2 className="h-5 w-5" />
                            Créer la demande
                          </>
                      )}
                    </Button>
                )}
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
  );
}