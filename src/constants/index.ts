/**
 * Constantes de l'application
 */

import type { EmployeStatut, DemandeStatut, UserRole } from '@/types/api.types';
import {
  CheckCircle2,
  AlertCircle,
  Clock,
  XCircle,
  type LucideIcon
} from 'lucide-react';

// ============================================
// CONFIGURATION API
// ============================================

export const API_CONFIG = {
  BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
} as const;

// ============================================
// REACT QUERY
// ============================================

export const QUERY_KEYS = {
  // Dashboard
  DASHBOARD_STATS: ['dashboard-stats'] as const,

  // Utilisateurs
  USERS: ['users'] as const,
  USER: (id: number) => ['users', id] as const,

  // Sous-Directions
  SOUS_DIRECTIONS: ['sous-directions'] as const,
  SOUS_DIRECTION: (id: number) => ['sous-directions', id] as const,

  // Services
  SERVICES: ['services'] as const,
  SERVICE: (id: number) => ['services', id] as const,

  // Employés
  EMPLOYES: ['employes'] as const,
  EMPLOYE: (id: number) => ['employes', id] as const,
  EMPLOYES_SEARCH: (keyword: string) => ['employes', 'search', keyword] as const,

  // Demandes de Congé
  DEMANDES_CONGES: ['demandes-conges'] as const,
  DEMANDE_CONGE: (id: number) => ['demandes-conges', id] as const,
  DEMANDES_EN_ATTENTE: ['demandes-conges', 'en-attente'] as const,

  // Historique Congés
  HISTORIQUE_CONGES: ['historique-conges'] as const,
  HISTORIQUE_CONGE: (id: number) => ['historique-conges', id] as const,
  HISTORIQUE_BY_EMPLOYE: (employeId: number) => ['historique-conges', 'employe', employeId] as const,
  HISTORIQUE_BY_ANNEE: (annee: number) => ['historique-conges', 'annee', annee] as const,

  // ICA
  ICA_SUIVI_COMPLET: (annee?: number) => ['ica', 'suivi', annee] as const,
  ICA_SUIVI_SOUS_DIRECTION: (sousDirectionId: number, annee?: number) =>
    ['ica', 'suivi', 'sous-direction', sousDirectionId, annee] as const,
  ICA_SUIVI_SERVICE: (serviceId: number, annee?: number) =>
    ['ica', 'suivi', 'service', serviceId, annee] as const,
  ICA_STATISTIQUES: (annee?: number) => ['ica', 'statistiques', annee] as const,
  ICA_SUIVI_EMPLOYE: (employeId: number, annee?: number) =>
    ['ica', 'suivi', 'employe', employeId, annee] as const,
  ICA_ELIGIBLES: (annee?: number) => ['ica', 'eligibles', annee] as const,

  // Audit
  AUDIT_RECENT: ['audit', 'recent'] as const,
  AUDIT_MY_ACTIVITY: (page: number, size: number) => ['audit', 'my-activity', page, size] as const,
  AUDIT_ENTITY: (entityName: string, entityId: number) =>
    ['audit', 'entity', entityName, entityId] as const,
  AUDIT_STATISTICS: (startDate: string, endDate: string) =>
    ['audit', 'statistics', startDate, endDate] as const,
} as const;

export const QUERY_STALE_TIME = {
  SHORT: 30 * 1000, // 30 secondes
  MEDIUM: 5 * 60 * 1000, // 5 minutes
  LONG: 30 * 60 * 1000, // 30 minutes
} as const;

// ============================================
// STATUTS
// ============================================

export interface StatutConfig {
  label: string;
  color: string;
  lightBg: string;
  textColor: string;
  borderColor: string;
  icon: LucideIcon;
}

export const EMPLOYE_STATUT_CONFIG: Record<EmployeStatut, StatutConfig> = {
  ACTIF: {
    label: 'Actif',
    color: 'bg-emerald-500',
    lightBg: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    icon: CheckCircle2,
  },
  MALADIE: {
    label: 'En Maladie',
    color: 'bg-amber-500',
    lightBg: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    icon: AlertCircle,
  },
  SUSPENDU: {
    label: 'Suspendu',
    color: 'bg-rose-500',
    lightBg: 'bg-rose-50',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-200',
    icon: XCircle,
  },
  SUSPENDU_TEMPORAIREMENT: {
    label: 'Suspension Temporaire',
    color: 'bg-slate-500',
    lightBg: 'bg-slate-50',
    textColor: 'text-slate-700',
    borderColor: 'border-slate-200',
    icon: Clock,
  },
} as const;

export const DEMANDE_STATUT_CONFIG: Record<DemandeStatut, StatutConfig> = {
  EN_ATTENTE: {
    label: 'En Attente',
    color: 'bg-blue-500',
    lightBg: 'bg-blue-50',
    textColor: 'text-blue-700',
    borderColor: 'border-blue-200',
    icon: Clock,
  },
  APPROUVE: {
    label: 'Approuvé',
    color: 'bg-emerald-500',
    lightBg: 'bg-emerald-50',
    textColor: 'text-emerald-700',
    borderColor: 'border-emerald-200',
    icon: CheckCircle2,
  },
  REJETE: {
    label: 'Rejeté',
    color: 'bg-rose-500',
    lightBg: 'bg-rose-50',
    textColor: 'text-rose-700',
    borderColor: 'border-rose-200',
    icon: XCircle,
  },
  REPORTE: {
    label: 'Reporté',
    color: 'bg-amber-500',
    lightBg: 'bg-amber-50',
    textColor: 'text-amber-700',
    borderColor: 'border-amber-200',
    icon: AlertCircle,
  },
} as const;

// ============================================
// ROLES
// ============================================

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrateur',
  MANAGER_RH: 'Manager RH',
  EMPLOYE_RH: 'Employé RH',
} as const;

export const ROLE_PERMISSIONS = {
  ADMIN: ['all'],
  MANAGER_RH: [
    'dashboard.view',
    'employes.manage',
    'demandes.manage',
    'ica.view',
    'sous-directions.manage',
    'services.manage',
    'historique.manage',
  ],
  EMPLOYE_RH: [
    'dashboard.view',
    'employes.view',
    'demandes.view',
    'demandes.create',
    'ica.view',
    'historique.view',
  ],
} as const;

// ============================================
// PAGINATION
// ============================================

export const PAGINATION = {
  DEFAULT_PAGE: 0,
  DEFAULT_SIZE: 20,
  SIZE_OPTIONS: [10, 20, 50, 100] as const,
} as const;

// ============================================
// FORMATS DE DATE
// ============================================

export const DATE_FORMATS = {
  API: 'yyyy-MM-dd',
  DISPLAY: 'dd/MM/yyyy',
  DISPLAY_LONG: 'dd MMMM yyyy',
  DISPLAY_WITH_TIME: 'dd/MM/yyyy HH:mm',
  DISPLAY_TIME: 'HH:mm',
} as const;

// ============================================
// MESSAGES
// ============================================

export const MESSAGES = {
  SUCCESS: {
    CREATE: 'Élément créé avec succès',
    UPDATE: 'Élément mis à jour avec succès',
    DELETE: 'Élément supprimé avec succès',
    SAVE: 'Enregistrement réussi',
  },
  ERROR: {
    GENERIC: 'Une erreur est survenue',
    NETWORK: 'Erreur de connexion au serveur',
    UNAUTHORIZED: 'Vous n\'êtes pas autorisé à effectuer cette action',
    NOT_FOUND: 'Élément introuvable',
    VALIDATION: 'Veuillez vérifier les données saisies',
  },
  CONFIRM: {
    DELETE: 'Êtes-vous sûr de vouloir supprimer cet élément ?',
    UPDATE: 'Êtes-vous sûr de vouloir modifier cet élément ?',
  },
} as const;

// ============================================
// VALIDATION
// ============================================

export const VALIDATION = {
  USERNAME: {
    MIN_LENGTH: 3,
    MAX_LENGTH: 50,
    PATTERN: /^[a-zA-Z0-9_]+$/,
  },
  PASSWORD: {
    MIN_LENGTH: 6,
    MAX_LENGTH: 100,
  },
  MATRICULE: {
    MAX_LENGTH: 20,
    PATTERN: /^[A-Z0-9]+$/,
  },
  CODE: {
    MAX_LENGTH: 20,
  },
  NOM: {
    MAX_LENGTH: 100,
  },
  EMAIL: {
    PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
} as const;

// ============================================
// ANIMATIONS
// ============================================

export const ANIMATION_DURATION = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

// ============================================
// COULEURS GRADIENT
// ============================================

export const GRADIENTS = {
  PRIMARY: 'from-blue-500 via-blue-600 to-indigo-600',
  SUCCESS: 'from-emerald-500 via-teal-500 to-cyan-500',
  WARNING: 'from-amber-500 via-orange-500 to-red-500',
  DANGER: 'from-rose-500 via-pink-500 to-red-500',
  INFO: 'from-purple-500 via-pink-500 to-rose-500',
} as const;
