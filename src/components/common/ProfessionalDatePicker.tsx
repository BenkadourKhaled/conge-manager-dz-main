import { useEffect, useState, useRef } from 'react';
import { format, parse, isValid, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, isToday as isDateToday, addMonths, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar as CalendarIcon,
  Clock,
} from 'lucide-react';
import { Label } from '@/components/ui/label';

interface ProfessionalDatePickerProps {
  value: Date | null;
  onChange: (date: Date | null) => void;
  label?: string;
  error?: any;
  maxDate?: Date;
  minDate?: Date;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

export const ProfessionalDatePicker = ({
  value,
  onChange,
  label,
  error,
  maxDate,
  minDate,
  placeholder = 'JJ/MM/AAAA',
  required = false,
  disabled = false,
}: ProfessionalDatePickerProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [currentMonth, setCurrentMonth] = useState(value || new Date());
  const [inputError, setInputError] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Mettre à jour l'input quand la valeur change
  useEffect(() => {
    if (value) {
      setInputValue(format(value, 'dd/MM/yyyy'));
      setCurrentMonth(value);
    } else {
      setInputValue('');
    }
    setInputError('');
  }, [value]);

  // Gérer le clic en dehors
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Formater l'entrée automatiquement
  const formatInputValue = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    const chars = numbers.split('');
    
    let formatted = '';
    
    if (chars.length > 0) {
      formatted += chars.slice(0, 2).join('');
    }
    if (chars.length >= 3) {
      formatted += '/' + chars.slice(2, 4).join('');
    }
    if (chars.length >= 5) {
      formatted += '/' + chars.slice(4, 8).join('');
    }
    
    return formatted;
  };

  // Valider la date saisie
  const validateDateString = (dateStr: string): { isValid: boolean; date?: Date; error?: string } => {
    if (!dateStr || dateStr.length === 0) {
      return { isValid: false, error: '' };
    }

    if (dateStr.length < 10) {
      return { isValid: false, error: 'Format incomplet (JJ/MM/AAAA)' };
    }

    const parts = dateStr.split('/');
    if (parts.length !== 3) {
      return { isValid: false, error: 'Format invalide' };
    }

    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10);
    const year = parseInt(parts[2], 10);

    if (isNaN(day) || isNaN(month) || isNaN(year)) {
      return { isValid: false, error: 'Date invalide' };
    }

    if (day < 1 || day > 31) {
      return { isValid: false, error: 'Jour invalide (1-31)' };
    }

    if (month < 1 || month > 12) {
      return { isValid: false, error: 'Mois invalide (1-12)' };
    }

    const currentYear = new Date().getFullYear();
    if (year < 1900 || year > currentYear + 100) {
      return { isValid: false, error: `Année invalide (1900-${currentYear + 100})` };
    }

    const date = new Date(year, month - 1, day);

    if (
      date.getDate() !== day ||
      date.getMonth() !== month - 1 ||
      date.getFullYear() !== year
    ) {
      return { isValid: false, error: 'Date inexistante' };
    }

    if (minDate && date < minDate) {
      return { isValid: false, error: `Date minimale: ${format(minDate, 'dd/MM/yyyy')}` };
    }

    if (maxDate && date > maxDate) {
      return { isValid: false, error: `Date maximale: ${format(maxDate, 'dd/MM/yyyy')}` };
    }

    return { isValid: true, date };
  };

  // Gérer la saisie
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    const formatted = formatInputValue(rawValue);
    setInputValue(formatted);

    if (formatted.length === 10) {
      const validation = validateDateString(formatted);
      if (validation.isValid && validation.date) {
        onChange(validation.date);
        setInputError('');
      } else {
        setInputError(validation.error || '');
      }
    } else {
      setInputError('');
    }
  };

  // Gérer la perte de focus
  const handleBlur = () => {
    if (inputValue && inputValue.length < 10) {
      setInputError('Format incomplet (JJ/MM/AAAA)');
    }
  };

  // Gérer le clic sur une date
  const handleDateClick = (date: Date) => {
    onChange(date);
    setIsOpen(false);
    setInputError('');
  };

  // Effacer la date
  const handleClear = () => {
    onChange(null);
    setInputValue('');
    setInputError('');
    inputRef.current?.focus();
  };

  // Générer les jours du calendrier
  const generateCalendarDays = () => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    
    const days = eachDayOfInterval({ start, end });
    
    // Ajouter les jours du mois précédent
    const startDay = start.getDay();
    const previousMonthDays = [];
    for (let i = startDay - 1; i >= 0; i--) {
      const date = new Date(start);
      date.setDate(date.getDate() - (i + 1));
      previousMonthDays.push(date);
    }
    
    // Ajouter les jours du mois suivant
    const endDay = end.getDay();
    const nextMonthDays = [];
    for (let i = 1; i < 7 - endDay; i++) {
      const date = new Date(end);
      date.setDate(date.getDate() + i);
      nextMonthDays.push(date);
    }
    
    return [...previousMonthDays, ...days, ...nextMonthDays];
  };

  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true;
    if (maxDate && date > maxDate) return true;
    return false;
  };

  const calendarDays = generateCalendarDays();

  // Raccourcis rapides
  const quickSelections = [
    { label: "Aujourd'hui", getValue: () => new Date() },
    { label: "Hier", getValue: () => { const d = new Date(); d.setDate(d.getDate() - 1); return d; } },
    { label: "Il y a 7 jours", getValue: () => { const d = new Date(); d.setDate(d.getDate() - 7); return d; } },
    { label: "Il y a 1 mois", getValue: () => { const d = new Date(); d.setMonth(d.getMonth() - 1); return d; } },
  ];

  const handleQuickSelect = (getValue: () => Date) => {
    const date = getValue();
    if (!isDateDisabled(date)) {
      onChange(date);
      setIsOpen(false);
      setInputError('');
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <Label className="text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1">
          {label}
          {required && <span className="text-red-500">*</span>}
        </Label>
      )}

      {/* Input Container */}
      <div
        className={`
          relative flex items-center gap-2 h-12 px-4 rounded-lg border-2 transition-all duration-200
          ${disabled ? 'bg-slate-50 cursor-not-allowed' : 'bg-white cursor-text'}
          ${error || inputError
            ? 'border-red-400 focus-within:border-red-500 focus-within:ring-4 focus-within:ring-red-500/10'
            : isFocused || isOpen
              ? 'border-blue-500 ring-4 ring-blue-500/10'
              : 'border-slate-300 hover:border-slate-400'
          }
        `}
        onClick={() => {
          if (!disabled) {
            inputRef.current?.focus();
          }
        }}
      >
        <CalendarIcon className={`h-5 w-5 flex-shrink-0 transition-colors ${
          isFocused || isOpen ? 'text-blue-600' : 'text-slate-400'
        }`} />
        
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => {
            setIsFocused(true);
            setIsOpen(true);
          }}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          maxLength={10}
          className="flex-1 bg-transparent outline-none text-slate-900 placeholder:text-slate-400 text-base font-medium disabled:cursor-not-allowed"
        />

        <div className="flex items-center gap-1 flex-shrink-0">
          {value && !disabled && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClear();
              }}
              className="p-1.5 rounded-md hover:bg-slate-100 transition-colors group"
            >
              <X className="h-4 w-4 text-slate-400 group-hover:text-slate-600" />
            </button>
          )}
          
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (!disabled) {
                setIsOpen(!isOpen);
                inputRef.current?.focus();
              }
            }}
            disabled={disabled}
            className={`p-1.5 rounded-md transition-colors ${
              isOpen
                ? 'bg-blue-100 text-blue-600'
                : 'hover:bg-slate-100 text-slate-400 hover:text-slate-600'
            }`}
          >
            <CalendarDays className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Message d'erreur */}
      {(error || inputError) && (
        <p className="mt-1.5 text-xs text-red-500 font-medium flex items-center gap-1">
          <span className="inline-block w-1 h-1 rounded-full bg-red-500" />
          {error?.message || inputError}
        </p>
      )}

      {/* Valeur sélectionnée */}
      {value && !error && !inputError && (
        <p className="mt-1.5 text-xs text-slate-500 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {format(value, 'EEEE d MMMM yyyy', { locale: fr })}
        </p>
      )}

      {/* Calendrier Dropdown */}
      {isOpen && !disabled && (
        <div
          ref={calendarRef}
          className="absolute z-50 mt-2 bg-white rounded-xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
          style={{ width: '340px' }}
        >
          {/* En-tête du calendrier */}
          <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-slate-50 border-b border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <button
                type="button"
                onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                className="p-2 rounded-lg hover:bg-white transition-all shadow-sm hover:shadow"
              >
                <ChevronLeft className="h-5 w-5 text-slate-600" />
              </button>
              
              <div className="text-center">
                <h3 className="text-base font-bold text-slate-800 capitalize">
                  {format(currentMonth, 'MMMM yyyy', { locale: fr })}
                </h3>
              </div>
              
              <button
                type="button"
                onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                className="p-2 rounded-lg hover:bg-white transition-all shadow-sm hover:shadow"
              >
                <ChevronRight className="h-5 w-5 text-slate-600" />
              </button>
            </div>

            {/* Bouton aujourd'hui */}
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                if (!isDateDisabled(today)) {
                  onChange(today);
                  setIsOpen(false);
                  setInputError('');
                }
                setCurrentMonth(today);
              }}
              className="w-full py-2 px-3 text-xs font-semibold text-blue-600 bg-white hover:bg-blue-50 rounded-lg transition-colors"
            >
              Aller à aujourd'hui
            </button>
          </div>

          {/* Grille du calendrier */}
          <div className="p-4">
            {/* Jours de la semaine */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'].map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-bold text-slate-500 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Jours du mois */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, index) => {
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isSelected = value && isSameDay(day, value);
                const isToday = isDateToday(day);
                const isDisabled = isDateDisabled(day);

                return (
                  <button
                    key={index}
                    type="button"
                    onClick={() => !isDisabled && handleDateClick(day)}
                    disabled={isDisabled}
                    className={`
                      relative p-2 text-sm font-medium rounded-lg transition-all
                      ${!isCurrentMonth && 'text-slate-300'}
                      ${isCurrentMonth && !isDisabled && 'text-slate-700 hover:bg-blue-50'}
                      ${isDisabled && 'text-slate-300 cursor-not-allowed opacity-50'}
                      ${isSelected && 'bg-blue-600 text-white hover:bg-blue-700 shadow-md scale-105'}
                      ${isToday && !isSelected && 'bg-blue-50 text-blue-600 font-bold border-2 border-blue-200'}
                    `}
                  >
                    {day.getDate()}
                    {isToday && !isSelected && (
                      <span className="absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full bg-blue-600" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sélections rapides */}
          <div className="px-4 pb-4 pt-2 border-t border-slate-200 bg-slate-50">
            <p className="text-xs font-semibold text-slate-600 mb-2 flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Sélection rapide
            </p>
            <div className="grid grid-cols-2 gap-2">
              {quickSelections.map((selection, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleQuickSelect(selection.getValue)}
                  className="px-3 py-2 text-xs font-medium text-slate-600 bg-white hover:bg-blue-50 hover:text-blue-600 rounded-lg transition-all border border-slate-200 hover:border-blue-300"
                >
                  {selection.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfessionalDatePicker;
