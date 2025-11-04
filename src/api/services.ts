import api from './axios';
import type {
  ApiResponse,
  SousDirectionResponse,
  SousDirectionRequest,
  ServiceResponse,
  ServiceRequest,
  EmployeResponse,
  EmployeRequest,
  DemandeCongeResponse,
  DemandeCongeRequest,
  StatutDemandeRequest,
  SuiviICAResponse,
  StatistiquesICAResponse,
  DashboardStatsResponse,
  HistoriqueCongeResponse,
  HistoriqueCongeRequest,
  UserResponse,
  UserRequest,
  AuditTrailResponse,
  AuditSearchRequest,
  PaginatedResponse,
  UserRole,
} from '@/types/api.types';

// Sous-Directions
export const sousDirectionsApi = {
  getAll: () => api.get<ApiResponse<SousDirectionResponse[]>>('/sous-directions'),
  getById: (id: number) => api.get<ApiResponse<SousDirectionResponse>>(`/sous-directions/${id}`),
  create: (data: SousDirectionRequest) =>
    api.post<ApiResponse<SousDirectionResponse>>('/sous-directions', data),
  update: (id: number, data: SousDirectionRequest) =>
    api.put<ApiResponse<SousDirectionResponse>>(`/sous-directions/${id}`, data),
  delete: (id: number) => api.delete<ApiResponse<void>>(`/sous-directions/${id}`),
};

// Services
export const servicesApi = {
  getAll: () => api.get<ApiResponse<ServiceResponse[]>>('/services'),
  getById: (id: number) => api.get<ApiResponse<ServiceResponse>>(`/services/${id}`),
  create: (data: ServiceRequest) => api.post<ApiResponse<ServiceResponse>>('/services', data),
  update: (id: number, data: ServiceRequest) =>
    api.put<ApiResponse<ServiceResponse>>(`/services/${id}`, data),
  delete: (id: number) => api.delete<ApiResponse<void>>(`/services/${id}`),
};

// Employés
export const employesApi = {
  getAll: () => api.get<ApiResponse<EmployeResponse[]>>('/employes'),
  getById: (id: number) => api.get<ApiResponse<EmployeResponse>>(`/employes/${id}`),
  create: (data: EmployeRequest) => api.post<ApiResponse<EmployeResponse>>('/employes', data),
  update: (id: number, data: EmployeRequest) =>
    api.put<ApiResponse<EmployeResponse>>(`/employes/${id}`, data),
  delete: (id: number) => api.delete<ApiResponse<void>>(`/employes/${id}`),
  search: (keyword: string) =>
    api.get<ApiResponse<EmployeResponse[]>>('/employes/search', { params: { keyword } }),
};

// Demandes de Congé
export const demandesCongesApi = {
  getAll: () => api.get<ApiResponse<DemandeCongeResponse[]>>('/demandes-conges'),
  getById: (id: number) => api.get<ApiResponse<DemandeCongeResponse>>(`/demandes-conges/${id}`),
  create: (data: DemandeCongeRequest) =>
    api.post<ApiResponse<DemandeCongeResponse>>('/demandes-conges', data),
  delete: (id: number) => api.delete<ApiResponse<void>>(`/demandes-conges/${id}`),
  updateStatut: (id: number, data: StatutDemandeRequest) =>
    api.put<ApiResponse<DemandeCongeResponse>>(`/demandes-conges/${id}/statut`, data),
  getEnAttente: () => api.get<ApiResponse<DemandeCongeResponse[]>>('/demandes-conges/en-attente'),
};

// ICA (Prime)
export const icaApi = {
  getSuiviComplet: async (annee?: number) => {
    const response = await api.get<ApiResponse<SuiviICAResponse[]>>('/ica/suivi', {
      params: { annee },
    });
    return response.data;
  },
  getSuiviParSousDirection: async (sousDirectionId: number, annee?: number) => {
    const response = await api.get<ApiResponse<SuiviICAResponse[]>>(
      `/ica/suivi/sous-direction/${sousDirectionId}`,
      { params: { annee } }
    );
    return response.data;
  },
  getSuiviParService: async (serviceId: number, annee?: number) => {
    const response = await api.get<ApiResponse<SuiviICAResponse[]>>(
      `/ica/suivi/service/${serviceId}`,
      { params: { annee } }
    );
    return response.data;
  },
  getStatistiques: async (annee?: number) => {
    const response = await api.get<ApiResponse<StatistiquesICAResponse>>('/ica/statistiques', {
      params: { annee },
    });
    return response.data;
  },
  getSuiviEmploye: async (employeId: number, annee?: number) => {
    const response = await api.get<ApiResponse<SuiviICAResponse>>(`/ica/employe/${employeId}`, {
      params: { annee },
    });
    return response.data;
  },
  getEligibles: async (annee?: number) => {
    const response = await api.get<ApiResponse<SuiviICAResponse[]>>('/ica/eligibles', {
      params: { annee },
    });
    return response.data;
  },
};

// Dashboard
export const dashboardApi = {
  getStatistics: async () => {
    const response = await api.get<ApiResponse<DashboardStatsResponse>>('/dashboard/statistics');
    return response.data;
  },
};

// Historique Congés
export const historiqueCongesApi = {
  getAll: async () => {
    const response = await api.get<ApiResponse<HistoriqueCongeResponse[]>>('/historique-conges');
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get<ApiResponse<HistoriqueCongeResponse>>(
      `/historique-conges/${id}`
    );
    return response.data;
  },
  getByEmployeId: async (employeId: number) => {
    const response = await api.get<ApiResponse<HistoriqueCongeResponse[]>>(
      `/historique-conges/employe/${employeId}`
    );
    return response.data;
  },
  getByAnnee: async (annee: number) => {
    const response = await api.get<ApiResponse<HistoriqueCongeResponse[]>>(
      `/historique-conges/annee/${annee}`
    );
    return response.data;
  },
  create: async (data: HistoriqueCongeRequest) => {
    const response = await api.post<ApiResponse<HistoriqueCongeResponse>>(
      '/historique-conges',
      data
    );
    return response.data;
  },
  update: async (id: number, data: HistoriqueCongeRequest) => {
    const response = await api.put<ApiResponse<HistoriqueCongeResponse>>(
      `/historique-conges/${id}`,
      data
    );
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete<ApiResponse<void>>(`/historique-conges/${id}`);
    return response.data;
  },
  ajusterJours: async (
    id: number,
    data: { typeAjustement: string; nombreJours: number; motif: string }
  ) => {
    let ajustement = data.nombreJours;
    if (data.typeAjustement === 'RETRAIT') {
      ajustement = -ajustement;
    }

    const response = await api.put<ApiResponse<HistoriqueCongeResponse>>(
      `/historique-conges/${id}/ajuster`,
      null,
      {
        params: {
          ajustement: ajustement,
          remarque: data.motif,
        },
      }
    );
    return response.data;
  },
  recalculateICA: async (id: number) => {
    const response = await api.put<ApiResponse<HistoriqueCongeResponse>>(
      `/historique-conges/${id}/recalculer-ica`
    );
    return response.data;
  },
  recalculateICABulk: async (ids: number[]) => {
    if (!ids || ids.length === 0) {
      throw new Error('Aucun ID fourni pour le recalcul');
    }

    const promises = ids.map((id) =>
      api
        .put<ApiResponse<HistoriqueCongeResponse>>(`/historique-conges/${id}/recalculer-ica`)
        .then((response) => ({ success: true, id, data: response.data }))
        .catch((error: Error) => ({ success: false, id, error: error.message }))
    );

    const results = await Promise.all(promises);

    const failures = results.filter((r) => !r.success);
    if (failures.length > 0) {
      console.warn(`${failures.length} recalculations échouées:`, failures);
    }

    return results;
  },
};

// Utilisateurs (ADMIN uniquement)
export const usersApi = {
  getAll: async () => {
    const response = await api.get<ApiResponse<UserResponse[]>>('/users');
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get<ApiResponse<UserResponse>>(`/users/${id}`);
    return response.data;
  },
  create: async (data: UserRequest) => {
    const response = await api.post<ApiResponse<UserResponse>>('/users', data);
    return response.data;
  },
  update: async (id: number, data: UserRequest) => {
    const response = await api.put<ApiResponse<UserResponse>>(`/users/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete<ApiResponse<void>>(`/users/${id}`);
    return response.data;
  },
  updateRole: async (id: number, role: UserRole) => {
    const response = await api.put<ApiResponse<UserResponse>>(`/users/${id}/role`, null, {
      params: { role },
    });
    return response.data;
  },
};

// Authentification
export const authApi = {
  login: async (username: string, password: string) => {
    const response = await api.post('/auth/login', { username, password });
    return response.data;
  },
};

// Audit Trail
export const auditApi = {
  getRecent: async () => {
    const response = await api.get<ApiResponse<AuditTrailResponse[]>>('/audit/recent');
    return response.data;
  },
  getMyActivity: async (page = 0, size = 20) => {
    const response = await api.get<ApiResponse<PaginatedResponse<AuditTrailResponse>>>(
      '/audit/my-activity',
      {
        params: { page, size },
      }
    );
    return response.data;
  },
  getEntityHistory: async (entityName: string, entityId: number) => {
    const response = await api.get<ApiResponse<AuditTrailResponse[]>>(
      `/audit/entity/${entityName}/${entityId}`
    );
    return response.data;
  },
  getStatistics: async (startDate: string, endDate: string) => {
    const response = await api.get<ApiResponse<Record<string, number>>>('/audit/statistics', {
      params: { startDate, endDate },
    });
    return response.data;
  },
  search: async (searchRequest: AuditSearchRequest) => {
    const response = await api.post<ApiResponse<PaginatedResponse<AuditTrailResponse>>>(
      '/audit/search',
      searchRequest
    );
    return response.data;
  },
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
  audit: auditApi,
};