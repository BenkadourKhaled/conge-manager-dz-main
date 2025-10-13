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
/*
export const sousDirectionsApi = {
  getAll: async () => {
    const response = await api.get('/sous-directions');
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get(`/sous-directions/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/sous-directions', data);
    return response.data;
  },
  update: async (id: number, data: any) => {
    const response = await api.put(`/sous-directions/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/sous-directions/${id}`);
    return response.data;
  },
};
*/
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
  getSuiviComplet: async (annee?: number) => {
    const response = await api.get('/ica/suivi', { params: { annee } });
    return response.data;
  },
  getSuiviParSousDirection: async (sousDirectionId: number, annee?: number) => {
    const response = await api.get(
      `/ica/suivi/sous-direction/${sousDirectionId}`,
      {
        params: { annee },
      }
    );
    return response.data;
  },
  getSuiviParService: async (serviceId: number, annee?: number) => {
    const response = await api.get(`/ica/suivi/service/${serviceId}`, {
      params: { annee },
    });
    return response.data;
  },
  getStatistiques: async (annee?: number) => {
    const response = await api.get('/ica/statistiques', { params: { annee } });
    return response.data;
  },
  getSuiviEmploye: async (employeId: number, annee?: number) => {
    const response = await api.get(`/ica/employe/${employeId}`, {
      params: { annee },
    });
    return response.data;
  },
  getEligibles: async (annee?: number) => {
    const response = await api.get('/ica/eligibles', { params: { annee } });
    return response.data;
  },
};

// Dashboard
export const dashboardApi = {
  getStatistics: async () => {
    const response = await api.get('/dashboard/statistics');
    return response.data;
  },
};

// Historique Congés - CORRECTED TO MATCH SWAGGER
export const historiqueCongesApi = {
  getAll: async () => {
    const response = await api.get('/historique-conges');
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get(`/historique-conges/${id}`);
    return response.data;
  },
  getByEmployeId: async (employeId: number) => {
    const response = await api.get(`/historique-conges/employe/${employeId}`);
    return response.data;
  },
  // FIX: Uses path parameter, not query parameter
  getByAnnee: async (annee: number) => {
    const response = await api.get(`/historique-conges/annee/${annee}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/historique-conges', data);
    return response.data;
  },
  update: async (id: number, data: any) => {
    const response = await api.put(`/historique-conges/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/historique-conges/${id}`);
    return response.data;
  },
  // FIX: Backend expects query parameters, not request body
  ajusterJours: async (
    id: number,
    data: { typeAjustement: string; nombreJours: number; motif: string }
  ) => {
    // Convert frontend data to backend format
    let ajustement = data.nombreJours;
    if (data.typeAjustement === 'RETRAIT') {
      ajustement = -ajustement;
    }

    const response = await api.put(`/historique-conges/${id}/ajuster`, null, {
      params: {
        ajustement: ajustement,
        remarque: data.motif,
      },
    });
    return response.data;
  },
  // FIX: Backend only supports recalculating individual records, not bulk
  recalculateICA: async (id: number) => {
    const response = await api.put(`/historique-conges/${id}/recalculer-ica`);
    return response.data;
  },
  // Helper method for bulk recalculation (frontend-side)
  recalculateICABulk: async (ids: number[]) => {
    if (!ids || ids.length === 0) {
      throw new Error('Aucun ID fourni pour le recalcul');
    }

    const promises = ids.map((id) =>
      api
        .put(`/historique-conges/${id}/recalculer-ica`)
        .then((response) => ({ success: true, id, data: response.data }))
        .catch((error) => ({ success: false, id, error: error.message }))
    );

    const results = await Promise.all(promises);

    // Check if any failed
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
    const response = await api.get('/users');
    return response.data;
  },
  getById: async (id: number) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  create: async (data: any) => {
    const response = await api.post('/users', data);
    return response.data;
  },

  update: async (id: number, data: any) => {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },
  delete: async (id: number) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },
  updateRole: async (
    id: number,
    role: 'ADMIN' | 'MANAGER_RH' | 'EMPLOYE_RH'
  ) => {
    const response = await api.put(`/users/${id}/role`, null, {
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
