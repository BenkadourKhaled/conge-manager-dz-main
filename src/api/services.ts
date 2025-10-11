import api from './axios';

// Types pour typage fort
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

// Sous-Directions
export const sousDirectionsApi = {
  getAll: () => api.get<ApiResponse<any[]>>('/sous-directions'),
  getById: (id: number) => api.get<ApiResponse<any>>(`/sous-directions/${id}`),
  create: (data: any) => api.post<ApiResponse<any>>('/sous-directions', data),
  update: (id: number, data: any) =>
    api.put<ApiResponse<any>>(`/sous-directions/${id}`, data),
  delete: (id: number) =>
    api.delete<ApiResponse<void>>(`/sous-directions/${id}`),
};

// Services
export const servicesApi = {
  getAll: () => api.get<ApiResponse<any[]>>('/services'),
  getById: (id: number) => api.get<ApiResponse<any>>(`/services/${id}`),
  create: (data: any) => api.post<ApiResponse<any>>('/services', data),
  update: (id: number, data: any) =>
    api.put<ApiResponse<any>>(`/services/${id}`, data),
  delete: (id: number) => api.delete<ApiResponse<void>>(`/services/${id}`),
};

// Employés
export const employesApi = {
  getAll: () => api.get<ApiResponse<any[]>>('/employes'),
  getById: (id: number) => api.get<ApiResponse<any>>(`/employes/${id}`),
  create: (data: any) => api.post<ApiResponse<any>>('/employes', data),
  update: (id: number, data: any) =>
    api.put<ApiResponse<any>>(`/employes/${id}`, data),
  delete: (id: number) => api.delete<ApiResponse<void>>(`/employes/${id}`),
  search: (keyword: string) =>
    api.get<ApiResponse<any[]>>('/employes/search', { params: { keyword } }),
};

// Demandes de Congé
export const demandesCongesApi = {
  getAll: () => api.get<ApiResponse<any[]>>('/demandes-conges'),
  getById: (id: number) => api.get<ApiResponse<any>>(`/demandes-conges/${id}`),
  create: (data: any) => api.post<ApiResponse<any>>('/demandes-conges', data),
  delete: (id: number) =>
    api.delete<ApiResponse<void>>(`/demandes-conges/${id}`),
  updateStatut: (id: number, data: any) =>
    api.put<ApiResponse<any>>(`/demandes-conges/${id}/statut`, data),
  getEnAttente: () =>
    api.get<ApiResponse<any[]>>('/demandes-conges/en-attente'),
};

// ICA (Prime)
export const icaApi = {
  getSuiviComplet: (annee?: number) =>
    api.get<ApiResponse<any[]>>('/ica/suivi', { params: { annee } }),
  getSuiviParSousDirection: (sousDirectionId: number, annee?: number) =>
    api.get<ApiResponse<any[]>>(
      `/ica/suivi/sous-direction/${sousDirectionId}`,
      { params: { annee } }
    ),
  getSuiviParService: (serviceId: number, annee?: number) =>
    api.get<ApiResponse<any[]>>(`/ica/suivi/service/${serviceId}`, {
      params: { annee },
    }),
  getStatistiques: (annee?: number) =>
    api.get<ApiResponse<any>>('/ica/statistiques', { params: { annee } }),
  getSuiviEmploye: (employeId: number, annee?: number) =>
    api.get<ApiResponse<any>>(`/ica/employe/${employeId}`, {
      params: { annee },
    }),
  getEligibles: (annee?: number) =>
    api.get<ApiResponse<any[]>>('/ica/eligibles', { params: { annee } }),
};

// Dashboard
export const dashboardApi = {
  getStatistics: () => api.get<ApiResponse<any>>('/dashboard/statistics'),
};

// Historique Congés
export const historiqueCongesApi = {
  getAll: () => api.get<ApiResponse<any[]>>('/historique-conges'),
  getById: (id: number) =>
    api.get<ApiResponse<any>>(`/historique-conges/${id}`),
  create: (data: any) => api.post<ApiResponse<any>>('/historique-conges', data),
  update: (id: number, data: any) =>
    api.put<ApiResponse<any>>(`/historique-conges/${id}`, data),
  delete: (id: number) =>
    api.delete<ApiResponse<void>>(`/historique-conges/${id}`),
  getByEmployeId: (employeId: number) =>
    api.get<ApiResponse<any[]>>(`/historique-conges/employe/${employeId}`),
  getByAnnee: (annee: number) =>
    api.get<ApiResponse<any[]>>(`/historique-conges/annee/${annee}`),
  recalculerICA: (id: number) =>
    api.put<ApiResponse<any>>(`/historique-conges/${id}/recalculer-ica`),
  ajuster: (id: number, ajustement: number, remarque?: string) =>
    api.put<ApiResponse<any>>(`/historique-conges/${id}/ajuster`, null, {
      params: { ajustement, remarque },
    }),
};

// Utilisateurs (ADMIN uniquement)
export const usersApi = {
  getAll: () => api.get<ApiResponse<any[]>>('/users'),
  getById: (id: number) => api.get<ApiResponse<any>>(`/users/${id}`),
  create: (data: any) => api.post<ApiResponse<any>>('/users', data),
  update: (id: number, data: any) =>
    api.put<ApiResponse<any>>(`/users/${id}`, data),
  delete: (id: number) => api.delete<ApiResponse<void>>(`/users/${id}`),
  updateRole: (id: number, role: 'ADMIN' | 'MANAGER_RH' | 'EMPLOYE_RH') =>
    api.put<ApiResponse<any>>(`/users/${id}/role`, null, { params: { role } }),
};

// Authentification
export const authApi = {
  login: (username: string, password: string) =>
    api.post<ApiResponse<any>>('/auth/login', { username, password }),
};

// Export all APIs
export default {
  sousDirections: sousDirectionsApi,
  services: servicesApi,
  employes: employesApi,
  demandesConges: demandesCongesApi,
  ica: icaApi,
  dashboard: dashboardApi,
  historiqueConges: historiqueCongesApi,
  users: usersApi,
  auth: authApi,
};
