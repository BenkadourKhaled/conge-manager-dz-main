// Types pour l'historique des congés

export interface HistoriqueConge {
    id: number;
    employeId: number;
    employeNom: string;
    employeMatricule?: string;
    anneeConge: number;
    nombreJoursAttribues: number;
    nombreJoursConsommes: number;
    nombreJoursRestants: number;
    eligibleICA: boolean;
    remarque?: string;
    dateCreation?: string;
    dateModification?: string;
}

export interface HistoriqueCongeRequest {
    employeId: number;
    anneeConge: number;
    nombreJoursAttribues: number;
    nombreJoursConsommes: number;
    remarque?: string;
}

export interface AjustementRequest {
    typeAjustement: 'AJOUT' | 'RETRAIT' | 'CORRECTION';
    nombreJours: number;
    motif: string;
}

export interface Employe {
    id: number;
    matricule: string;
    nom: string;
    prenom: string;
    nomComplet: string;
    dateNaissance: string;
    dateRecrutement: string;
    fonction: string;
    adresse?: string;
    statut: 'ACTIF' | 'SUSPENDU' | 'MALADIE' | 'SUSPENDU_TEMPORAIREMENT';
    serviceId?: number;
    serviceNom?: string;
    sousDirectionId?: number;
    sousDirectionNom?: string;
}

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data: T;
    timestamp: string;
}

export interface PaginatedResponse<T> {
    content: T[];
    totalElements: number;
    totalPages: number;
    size: number;
    number: number;
}

export interface StatistiquesHistorique {
    totalEmployes: number;
    totalJoursAcquis: number;
    totalJoursUtilises: number;
    totalJoursRestants: number;
    eligiblesICA: number;
    tauxConsommation: number;
    tauxEligibiliteICA: number;
}