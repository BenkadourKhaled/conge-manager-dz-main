import { useEffect, useState, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import {
  User,
  Calendar,
  Briefcase,
  MapPin,
  Building2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  CalendarDays,
  Save,
  UserCircle,
  Layers
} from 'lucide-react';

const schema = z.object({
  matricule: z.string().min(1, 'Matricule requis').max(20, 'Maximum 20 caractères'),
  nom: z.string().min(1, 'Nom requis').max(50, 'Maximum 50 caractères'),
  prenom: z.string().min(1, 'Prénom requis').max(50, 'Maximum 50 caractères'),
  dateNaissance: z.date({ required_error: 'Date de naissance requise' }),
  dateRecrutement: z.date({ required_error: 'Date de recrutement requise' }),
  fonction: z.string().min(1, 'Fonction requise').max(100, 'Maximum 100 caractères'),
  adresse: z.string().max(255, 'Maximum 255 caractères').optional(),
  statut: z.enum(['ACTIF', 'SUSPENDU', 'MALADIE', 'SUSPENDU_TEMPORAIREMENT']),
  serviceId: z.number().optional().nullable(),
  sousDirectionId: z.number().optional().nullable(),
});

type FormData = z.infer<typeof schema>;

interface EmployeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormData) => void;
  initialData?: any;
  isLoading?: boolean;
}

const statutConfig = {
  ACTIF: { label: 'Actif', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  SUSPENDU: { label: 'Suspendu', icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' },
  MALADIE: { label: 'Maladie', icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200' },
  SUSPENDU_TEMPORAIREMENT: { label: 'Suspendu Temp.', icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200' },
};

// Composant DatePicker ultra-moderne et compact
const ModernDatePicker = ({
                            value,
                            onChange,
                            label,
                            error,
                            maxDate,
                            placeholder
                          }: {
  value: Date | null;
  onChange: (date: Date | null) => void;
  label: string;
  error?: any;
  maxDate?: Date;
  placeholder?: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [inputError, setInputError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      setInputValue(format(value, 'dd/MM/yyyy'));
    } else {
      setInputValue('');
    }
    setInputError('');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
          calendarRef.current &&
          !calendarRef.current.contains(event.target as Node) &&
          inputRef.current &&
          !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const formatInputValue = (value: string): string => {
    let formattedValue = value.replace(/[^\d]/g, '');
    if (formattedValue.length > 8) formattedValue = formattedValue.substring(0, 8);
    if (formattedValue.length > 2) {
      formattedValue = formattedValue.substring(0, 2) + '/' + formattedValue.substring(2);
    }
    if (formattedValue.length > 5) {
      formattedValue = formattedValue.substring(0, 5) + '/' + formattedValue.substring(5);
    }
    return formattedValue;
  };

  const validateDate = (dateString: string): { isValid: boolean; date?: Date; error?: string } => {
    const regex = /^(\d{2})\/(\d{2})\/(\d{4})$/;
    if (!regex.test(dateString)) {
      return { isValid: false, error: 'Format : JJ/MM/AAAA' };
    }

    const match = dateString.match(regex);
    if (!match) return { isValid: false, error: 'Format invalide' };

    const day = parseInt(match[1], 10);
    const month = parseInt(match[2], 10);
    const year = parseInt(match[3], 10);

    if (day < 1 || day > 31) return { isValid: false, error: 'Jour invalide' };
    if (month < 1 || month > 12) return { isValid: false, error: 'Mois invalide' };

    const currentYear = new Date().getFullYear();
    if (year < 1900 || year > currentYear) {
      return { isValid: false, error: `Année invalide (1900-${currentYear})` };
    }

    const date = new Date(year, month - 1, day);

    if (date.getDate() !== day || date.getMonth() !== month - 1 || date.getFullYear() !== year) {
      return { isValid: false, error: 'Date invalide' };
    }

    if (maxDate && date > maxDate) {
      return { isValid: false, error: `Max: ${format(maxDate, 'dd/MM/yyyy')}` };
    }

    return { isValid: true, date };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formattedValue = formatInputValue(rawValue);
    setInputValue(formattedValue);

    if (formattedValue.length === 10) {
      const validation = validateDate(formattedValue);
      if (validation.isValid && validation.date) {
        onChange(validation.date);
        setInputError('');
      } else {
        setInputError(validation.error || 'Date invalide');
      }
    } else {
      setInputError('');
    }
  };

  const handleInputBlur = () => {
    if (inputValue.length > 0 && inputValue.length < 10) {
      setInputError('Format incomplet');
    }
  };

  const handleDateClick = (day: Date) => {
    onChange(day);
    setIsOpen(false);
    setInputError('');
  };

  const generateDaysForMonth = () => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const startDate = new Date(firstDayOfMonth);
    startDate.setDate(startDate.getDate() - firstDayOfMonth.getDay());

    const days = [];
    const currentDay = new Date(startDate);

    for (let i = 0; i < 42; i++) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }

    return days;
  };

  const isCurrentMonth = (day: Date) => day.getMonth() === currentMonth.getMonth();
  const isToday = (day: Date) => {
    const today = new Date();
    return day.getDate() === today.getDate() &&
        day.getMonth() === today.getMonth() &&
        day.getFullYear() === today.getFullYear();
  };
  const isSelected = (day: Date) => {
    if (!value) return false;
    return day.getDate() === value.getDate() &&
        day.getMonth() === value.getMonth() &&
        day.getFullYear() === value.getFullYear();
  };
  const isDisabled = (day: Date) => maxDate ? day > maxDate : false;

  return (
      <div className="relative">
        <div className={`flex items-center gap-2 h-11 px-3 rounded-lg border transition-all ${
            error || inputError
                ? 'border-red-300 bg-red-50/50 focus-within:border-red-500 focus-within:ring-2 focus-within:ring-red-500/20'
                : 'border-slate-300 bg-white hover:border-slate-400 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20'
        }`}>
          <CalendarDays className="h-4 w-4 text-slate-400 flex-shrink-0" />
          <input
              ref={inputRef}
              type="text"
              value={inputValue}
              onChange={handleInputChange}
              onFocus={() => setIsOpen(true)}
              onBlur={handleInputBlur}
              placeholder={placeholder || 'JJ/MM/AAAA'}
              className="w-full bg-transparent outline-none text-sm text-slate-700 placeholder:text-slate-400"
              maxLength={10}
          />
          {value && (
              <button
                  type="button"
                  onClick={() => {
                    onChange(null);
                    setInputError('');
                  }}
                  className="p-1 rounded hover:bg-slate-100 transition-colors"
              >
                <XCircle className="h-4 w-4 text-slate-400 hover:text-slate-600" />
              </button>
          )}
        </div>

        {(error || inputError) && (
            <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3" />
              {error?.message || inputError}
            </p>
        )}

        {isOpen && (
            <div
                ref={calendarRef}
                className="absolute z-50 mt-2 p-4 bg-white border border-slate-200 rounded-xl shadow-xl"
                style={{ width: '300px' }}
            >
              <div className="flex items-center justify-between mb-3">
                <button
                    type="button"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}
                    className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <ChevronLeft className="h-4 w-4 text-slate-600" />
                </button>
                <div className="font-semibold text-sm text-slate-700">
                  {format(currentMonth, 'MMMM yyyy', { locale: fr })}
                </div>
                <button
                    type="button"
                    onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}
                    className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <ChevronRight className="h-4 w-4 text-slate-600" />
                </button>
              </div>

              <div className="grid grid-cols-7 gap-1 mb-2">
                {['D', 'L', 'M', 'M', 'J', 'V', 'S'].map((day) => (
                    <div key={day} className="text-center text-xs font-medium text-slate-500 py-1">
                      {day}
                    </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {generateDaysForMonth().map((day, index) => (
                    <button
                        key={index}
                        type="button"
                        onClick={() => !isDisabled(day) && handleDateClick(day)}
                        disabled={isDisabled(day)}
                        className={`p-2 text-center text-sm rounded-lg transition-all ${
                            !isCurrentMonth(day)
                                ? 'text-slate-300'
                                : isDisabled(day)
                                    ? 'text-slate-300 cursor-not-allowed'
                                    : 'text-slate-700 hover:bg-blue-50'
                        } ${
                            isSelected(day)
                                ? 'bg-blue-600 text-white hover:bg-blue-700 font-semibold'
                                : isToday(day)
                                    ? 'bg-blue-50 text-blue-600 font-medium'
                                    : ''
                        }`}
                    >
                      {day.getDate()}
                    </button>
                ))}
              </div>
            </div>
        )}
      </div>
  );
};

// Composant Tabs
const Tabs = ({ children, value, onValueChange }: any) => {
  return (
      <div className="flex flex-col h-full">
        {children}
      </div>
  );
};

const TabsList = ({ children }: any) => {
  return (
      <div className="flex border-b border-slate-200 bg-slate-50/50">
        {children}
      </div>
  );
};

const TabsTrigger = ({ value, currentValue, onChange, children, icon: Icon }: any) => {
  const isActive = value === currentValue;
  return (
      <button
          type="button"
          onClick={() => onChange(value)}
          className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-all relative ${
              isActive
                  ? 'text-blue-600 bg-white'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/50'
          }`}
      >
        <Icon className="h-4 w-4" />
        <span>{children}</span>
        {isActive && (
            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />
        )}
      </button>
  );
};

const TabsContent = ({ value, currentValue, children }: any) => {
  if (value !== currentValue) return null;
  return (
      <div className="flex-1 overflow-y-auto p-6">
        {children}
      </div>
  );
};

export default function EmployeModal({
                                       open,
                                       onOpenChange,
                                       onSubmit,
                                       initialData,
                                       isLoading,
                                     }: EmployeModalProps) {
  const [activeTab, setActiveTab] = useState('info');
  const [dateNaissance, setDateNaissance] = useState<Date | null>(null);
  const [dateRecrutement, setDateRecrutement] = useState<Date | null>(null);

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
    control,
    formState: { errors },
    reset,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      matricule: '',
      nom: '',
      prenom: '',
      dateNaissance: undefined,
      dateRecrutement: undefined,
      fonction: '',
      adresse: '',
      statut: 'ACTIF',
      serviceId: null,
      sousDirectionId: null,
    },
  });

  const statut = watch('statut');

  useEffect(() => {
    if (open) {
      setActiveTab('info');
      if (initialData) {
        const dateNaissanceValue = initialData.dateNaissance ? new Date(initialData.dateNaissance) : null;
        const dateRecrutementValue = initialData.dateRecrutement ? new Date(initialData.dateRecrutement) : null;

        setDateNaissance(dateNaissanceValue);
        setDateRecrutement(dateRecrutementValue);

        reset({
          matricule: initialData.matricule || '',
          nom: initialData.nom || '',
          prenom: initialData.prenom || '',
          dateNaissance: dateNaissanceValue || undefined,
          dateRecrutement: dateRecrutementValue || undefined,
          fonction: initialData.fonction || '',
          adresse: initialData.adresse || '',
          statut: initialData.statut || 'ACTIF',
          serviceId: initialData.serviceId || null,
          sousDirectionId: initialData.sousDirectionId || null,
        });
      } else {
        setDateNaissance(null);
        setDateRecrutement(null);
        reset({
          matricule: '',
          nom: '',
          prenom: '',
          dateNaissance: undefined,
          dateRecrutement: undefined,
          fonction: '',
          adresse: '',
          statut: 'ACTIF',
          serviceId: null,
          sousDirectionId: null,
        });
      }
    }
  }, [initialData, reset, open]);

  const handleFormSubmit = (data: FormData) => {
    const cleanedData = {
      ...data,
      serviceId: data.serviceId || undefined,
      sousDirectionId: data.sousDirectionId || undefined,
      adresse: data.adresse || undefined,
    };
    onSubmit(cleanedData);
  };

  const StatutIcon = statutConfig[statut]?.icon || CheckCircle2;

  return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl h-[85vh] p-0 gap-0 bg-white overflow-hidden">
          {/* Header */}
          <DialogHeader className="px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white">
            <DialogTitle className="text-xl font-bold flex items-center gap-3 text-slate-800">
              <div className="p-2 rounded-lg bg-blue-600 text-white">
                <UserCircle className="h-5 w-5" />
              </div>
              {initialData ? "Modifier l'employé" : 'Nouvel employé'}
            </DialogTitle>
          </DialogHeader>

          {/* Tabs Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger
                  value="info"
                  currentValue={activeTab}
                  onChange={setActiveTab}
                  icon={UserCircle}
              >
                Informations
              </TabsTrigger>
              <TabsTrigger
                  value="dates"
                  currentValue={activeTab}
                  onChange={setActiveTab}
                  icon={Calendar}
              >
                Dates & Statut
              </TabsTrigger>
              <TabsTrigger
                  value="org"
                  currentValue={activeTab}
                  onChange={setActiveTab}
                  icon={Layers}
              >
                Organisation
              </TabsTrigger>
            </TabsList>

            {/* Tab: Informations */}
            <TabsContent value="info" currentValue={activeTab}>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="matricule" className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                      Matricule <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="matricule"
                        {...register('matricule')}
                        className="h-11 bg-white border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        placeholder="EMP001"
                    />
                    {errors.matricule && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.matricule.message}
                        </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="nom" className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                      Nom <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="nom"
                        {...register('nom')}
                        className="h-11 bg-white border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        placeholder="Benali"
                    />
                    {errors.nom && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.nom.message}
                        </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="prenom" className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                      Prénom <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="prenom"
                        {...register('prenom')}
                        className="h-11 bg-white border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        placeholder="Ahmed"
                    />
                    {errors.prenom && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.prenom.message}
                        </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fonction" className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                      Fonction <span className="text-red-500">*</span>
                    </Label>
                    <Input
                        id="fonction"
                        {...register('fonction')}
                        className="h-11 bg-white border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                        placeholder="Ingénieur Informatique"
                    />
                    {errors.fonction && (
                        <p className="text-xs text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3" />
                          {errors.fonction.message}
                        </p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="adresse" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-500" />
                    Adresse
                  </Label>
                  <Textarea
                      id="adresse"
                      {...register('adresse')}
                      className="min-h-[100px] bg-white border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none"
                      placeholder="123 Rue de la République, Constantine"
                  />
                  {errors.adresse && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.adresse.message}
                      </p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* Tab: Dates & Statut */}
            <TabsContent value="dates" currentValue={activeTab}>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                      Date de naissance <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                        name="dateNaissance"
                        control={control}
                        render={({ field }) => (
                            <ModernDatePicker
                                value={dateNaissance}
                                onChange={(date) => {
                                  setDateNaissance(date);
                                  field.onChange(date);
                                }}
                                label="date de naissance"
                                error={errors.dateNaissance}
                                maxDate={new Date()}
                                placeholder="JJ/MM/AAAA"
                            />
                        )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                      Date de recrutement <span className="text-red-500">*</span>
                    </Label>
                    <Controller
                        name="dateRecrutement"
                        control={control}
                        render={({ field }) => (
                            <ModernDatePicker
                                value={dateRecrutement}
                                onChange={(date) => {
                                  setDateRecrutement(date);
                                  field.onChange(date);
                                }}
                                label="date de recrutement"
                                error={errors.dateRecrutement}
                                maxDate={new Date()}
                                placeholder="JJ/MM/AAAA"
                            />
                        )}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="statut" className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                    Statut <span className="text-red-500">*</span>
                  </Label>
                  <Controller
                      name="statut"
                      control={control}
                      render={({ field }) => (
                          <Select value={field.value} onValueChange={field.onChange}>
                            <SelectTrigger className="h-11 bg-white border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
                              <SelectValue>
                                <div className="flex items-center gap-2">
                                  <StatutIcon className={`h-4 w-4 ${statutConfig[statut]?.color}`} />
                                  <span className="font-medium">{statutConfig[statut]?.label}</span>
                                </div>
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              {Object.entries(statutConfig).map(([key, config]) => {
                                const Icon = config.icon;
                                return (
                                    <SelectItem key={key} value={key}>
                                      <div className="flex items-center gap-2">
                                        <Icon className={`h-4 w-4 ${config.color}`} />
                                        <span>{config.label}</span>
                                      </div>
                                    </SelectItem>
                                );
                              })}
                            </SelectContent>
                          </Select>
                      )}
                  />
                  {errors.statut && (
                      <p className="text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />
                        {errors.statut.message}
                      </p>
                  )}
                </div>

                {/* Statut Card */}
                <div className={`p-4 rounded-lg border-2 ${statutConfig[statut]?.bg} ${statutConfig[statut]?.border}`}>
                  <div className="flex items-center gap-3">
                    <StatutIcon className={`h-8 w-8 ${statutConfig[statut]?.color}`} />
                    <div>
                      <p className="font-semibold text-slate-700">Statut actuel</p>
                      <p className={`text-sm ${statutConfig[statut]?.color} font-medium`}>
                        {statutConfig[statut]?.label}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Tab: Organisation */}
            <TabsContent value="org" currentValue={activeTab}>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="sousDirectionId" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-slate-500" />
                      Sous-Direction
                    </Label>
                    <Controller
                        name="sousDirectionId"
                        control={control}
                        render={({ field }) => (
                            <Select
                                value={field.value?.toString() || 'none'}
                                onValueChange={(value) => field.onChange(value === 'none' ? null : parseInt(value))}
                            >
                              <SelectTrigger className="h-11 bg-white border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
                                <SelectValue placeholder="Sélectionner..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">
                                  <span className="text-slate-400">Aucune</span>
                                </SelectItem>
                                {sousDirectionsData?.data?.data?.map((sd: any) => (
                                    <SelectItem key={sd.id} value={sd.id.toString()}>
                                      {sd.code} - {sd.nom}
                                    </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                        )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="serviceId" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                      <Layers className="h-4 w-4 text-slate-500" />
                      Service
                    </Label>
                    <Controller
                        name="serviceId"
                        control={control}
                        render={({ field }) => (
                            <Select
                                value={field.value?.toString() || 'none'}
                                onValueChange={(value) => field.onChange(value === 'none' ? null : parseInt(value))}
                            >
                              <SelectTrigger className="h-11 bg-white border-slate-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
                                <SelectValue placeholder="Sélectionner..." />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="none">
                                  <span className="text-slate-400">Aucun</span>
                                </SelectItem>
                                {servicesData?.data?.data?.map((service: any) => (
                                    <SelectItem key={service.id} value={service.id.toString()}>
                                      {service.code} - {service.nom}
                                    </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                        )}
                    />
                  </div>
                </div>

                {/* Hiérarchie visuelle */}
                <div className="mt-8 p-6 bg-slate-50 rounded-lg border border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                    <Layers className="h-4 w-4 text-blue-600" />
                    Hiérarchie organisationnelle
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-blue-600" />
                      <span className="text-slate-600">Sous-Direction:</span>
                      <span className="font-medium text-slate-800">
                      {watch('sousDirectionId')
                          ? sousDirectionsData?.data?.data?.find((sd: any) => sd.id === watch('sousDirectionId'))?.nom || 'Non définie'
                          : 'Non définie'}
                    </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm ml-4">
                      <div className="w-2 h-2 rounded-full bg-blue-400" />
                      <span className="text-slate-600">Service:</span>
                      <span className="font-medium text-slate-800">
                      {watch('serviceId')
                          ? servicesData?.data?.data?.find((s: any) => s.id === watch('serviceId'))?.nom || 'Non défini'
                          : 'Non défini'}
                    </span>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
            <p className="text-xs text-slate-500">
              <span className="text-red-500">*</span> Champs obligatoires
            </p>
            <div className="flex gap-3">
              <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                  className="px-6 h-11 border-slate-300 hover:bg-slate-100 text-slate-700"
              >
                Annuler
              </Button>
              <Button
                  type="submit"
                  disabled={isLoading}
                  onClick={handleSubmit(handleFormSubmit)}
                  className="px-8 h-11 bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
              >
                {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Enregistrement...</span>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                      <Save className="h-4 w-4" />
                      <span>Enregistrer</span>
                    </div>
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
  );
}