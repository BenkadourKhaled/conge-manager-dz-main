/**
 * Types API - Générés depuis la documentation OpenAPI
 * API Gestion des Congés CNAS Constantine
 * Version: 1.0.0
 */

// ============================================
// TYPES DE BASE
// ============================================

export type UserRole = 'ADMIN' | 'MANAGER_RH' | 'EMPLOYE_RH';

export type EmployeStatut = 'ACTIF' | 'SUSPENDU' | 'MALADIE' | 'SUSPENDU_TEMPORAIREMENT';

export type DemandeStatut = 'EN_ATTENTE' | 'APPROUVE' | 'REJETE' | 'REPORTE';

export type TypeConge = 'ANNUEL' | 'MALADIE' | 'EXCEPTIONNEL' | 'SANS_SOLDE';

export type OperationType = 'CREATE' | 'UPDATE' | 'DELETE';

// ============================================
// RÉPONSES API GÉNÉRIQUES
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
}

export interface PageableObject {
  offset: number;
  sort: SortObject;
  pageSize: number;
  pageNumber: number;
  unpaged: boolean;
  paged: boolean;
}

export interface SortObject {
  empty: boolean;
  sorted: boolean;
  unsorted: boolean;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  numberOfElements: number;
  size: number;
  number: number;
  sort: SortObject;
  first: boolean;
  last: boolean;
  pageable: PageableObject;
  empty: boolean;
}

// ============================================
// UTILISATEURS
// ============================================

export interface UserResponse {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  actif: boolean;
}

export interface UserRequest {
  username: string;
  email: string;
  password?: string;
  role: UserRole;
  actif?: boolean;
}

// ============================================
// AUTHENTIFICATION
// ============================================

export interface LoginRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  type: string;
  userId: number;
  username: string;
  email: string;
  role: UserRole;
}

// ============================================
// SOUS-DIRECTIONS
// ============================================

export interface SousDirectionResponse {
  id: number;
  code: string;
  nom: string;
  libelle?: string;
  nombreEmployes: number;
}

export interface SousDirectionRequest {
  code: string;
  nom: string;
  libelle?: string;
}

// ============================================
// SERVICES
// ============================================

export interface ServiceResponse {
  id: number;
  code: string;
  nom: string;
  nombreEmployes: number;
  sousDirectionId: number;
  sousDirectionNom: string;
}

export interface ServiceRequest {
  code: string;
  nom: string;
  sousDirectionId: number;
}

// ============================================
// EMPLOYÉS
// ============================================

export interface EmployeResponse {
  id: number;
  matricule: string;
  nom: string;
  prenom: string;
  nomComplet: string;
  dateNaissance: string;
  dateRecrutement: string;
  fonction: string;
  adresse?: string;
  statut: EmployeStatut;
  serviceId?: number;
  serviceNom?: string;
  sousDirectionId?: number;
  sousDirectionNom?: string;
}

export interface EmployeRequest {
  matricule: string;
  nom: string;
  prenom: string;
  dateNaissance: string;
  dateRecrutement: string;
  fonction: string;
  adresse?: string;
  statut?: EmployeStatut;
  serviceId?: number;
  sousDirectionId?: number;
}

// ============================================
// DEMANDES DE CONGÉ
// ============================================

export interface DemandeCongeResponse {
  id: number;
  dateDebut: string;
  dateFin: string;
  nombreJours: number;
  adressePendantConge?: string;
  statut: DemandeStatut;
  remarqueResponsable?: string;
  dateCreation: string;
  dateTraitement?: string;
  employeId: number;
  employeNom: string;
  employeMatricule: string;
}

export interface DemandeCongeRequest {
  employeId: number;
  dateDebut: string;
  dateFin: string;
  adressePendantConge?: string;
  anneeConge: number;
  typeConge: TypeConge;
}

export interface StatutDemandeRequest {
  statut: DemandeStatut;
  remarque?: string;
}

// ============================================
// HISTORIQUE CONGÉS
// ============================================

export interface HistoriqueCongeResponse {
  id: number;
  anneeConge: number;
  nombreJoursAttribues: number;
  nombreJoursConsommes: number;
  nombreJoursRestants: number;
  eligibleICA: boolean;
  employeId: number;
  employeNom: string;
  employeMatricule?: string;
  employePrenom?: string;
  remarque?: string;
  dateCreation?: string;
  dateModification?: string;
}

export interface HistoriqueCongeRequest {
  employeId: number;
  anneeConge: number;
  nombreJoursAttribues: number;
  nombreJoursConsommes?: number;
  remarque?: string;
}

export interface AjustementRequest {
  typeAjustement: 'AJOUT' | 'RETRAIT' | 'CORRECTION';
  nombreJours: number;
  motif: string;
}

// ============================================
// SUIVI ICA (PRIME)
// ============================================

export interface SuiviICAResponse {
  employeId: number;
  matricule: string;
  nom: string;
  prenom: string;
  nomComplet: string;
  dateNaissance: string;
  dateRecrutement: string;
  fonction: string;
  statut: EmployeStatut;
  annee: number;
  joursAttribues: number;
  joursConsommes: number;
  joursRestants: number;
  eligibleICA: boolean;
  sousDirection?: string;
  service?: string;
  nombreAnneesService: number;
  remarque?: string;
}

export interface StatistiquesICAResponse {
  annee: number;
  totalEmployes: number;
  employesAvecHistorique: number;
  employesEligiblesICA: number;
  pourcentageEligibilite: number;
  totalJoursAttribues: number;
  totalJoursConsommes: number;
  tauxConsommation: number;
}

// ============================================
// DASHBOARD
// ============================================

export interface DashboardStatsResponse {
  totalEmployes: number;
  employesActifs: number;
  employesEnConge: number;
  demandesEnAttente: number;
  beneficiairesICA: number;
  totalSousDirections: number;
  totalServices: number;
}

// ============================================
// AUDIT TRAIL
// ============================================

export interface AuditTrailResponse {
  id: number;
  entityName: string;
  entityId: number;
  operationType: OperationType;
  performedBy: string;
  performedAt: string;
  oldValues?: string;
  newValues?: string;
  ipAddress?: string;
  userAgent?: string;
  description?: string;
  success: boolean;
  errorMessage?: string;
}

export interface AuditSearchRequest {
  entityName?: string;
  entityId?: number;
  operationType?: OperationType;
  performedBy?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  size?: number;
  sortBy?: string;
  sortDirection?: string;
}

// ============================================
// TYPES UTILITAIRES
// ============================================

export type ApiVoidResponse = ApiResponse<void>;

export type ApiMapStringLong = ApiResponse<Record<string, number>>;
