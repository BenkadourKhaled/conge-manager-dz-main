/**
 * Hooks personnalisés pour les appels API avec React Query
 */

import { useQuery, useMutation, useQueryClient, type UseQueryOptions, type UseMutationOptions } from '@tanstack/react-query';
import { toast } from 'sonner';
import { QUERY_KEYS, MESSAGES } from '@/constants';
import type { ApiResponse } from '@/types/api.types';
import api from '@/api/services';

// ============================================
// TYPES
// ============================================

interface MutationConfig<TData = unknown, TVariables = unknown> {
  onSuccessMessage?: string;
  onErrorMessage?: string;
  invalidateQueries?: readonly unknown[][];
  onSuccessCallback?: (data: TData) => void;
  onErrorCallback?: (error: Error) => void;
}

// ============================================
// DASHBOARD
// ============================================

export const useDashboardStats = () => {
  return useQuery({
    queryKey: QUERY_KEYS.DASHBOARD_STATS,
    queryFn: () => api.dashboard.getStatistics(),
    refetchInterval: 30000,
  });
};

// ============================================
// UTILISATEURS
// ============================================

export const useUsers = (options?: Omit<UseQueryOptions, 'queryKey' | 'queryFn'>) => {
  return useQuery({
    queryKey: QUERY_KEYS.USERS,
    queryFn: () => api.users.getAll(),
    ...options,
  });
};

export const useUser = (id: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.USER(id),
    queryFn: () => api.users.getById(id),
    enabled: !!id,
  });
};

export const useCreateUser = (config?: MutationConfig) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => api.users.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS });
      toast.success(config?.onSuccessMessage || MESSAGES.SUCCESS.CREATE);
      config?.onSuccessCallback?.(data);
    },
    onError: (error: Error) => {
      toast.error(config?.onErrorMessage || MESSAGES.ERROR.GENERIC);
      config?.onErrorCallback?.(error);
    },
  });
};

export const useUpdateUser = (config?: MutationConfig) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.users.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USER(variables.id) });
      toast.success(config?.onSuccessMessage || MESSAGES.SUCCESS.UPDATE);
      config?.onSuccessCallback?.(data);
    },
    onError: (error: Error) => {
      toast.error(config?.onErrorMessage || MESSAGES.ERROR.GENERIC);
      config?.onErrorCallback?.(error);
    },
  });
};

export const useDeleteUser = (config?: MutationConfig) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.users.delete(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.USERS });
      toast.success(config?.onSuccessMessage || MESSAGES.SUCCESS.DELETE);
      config?.onSuccessCallback?.(data);
    },
    onError: (error: Error) => {
      toast.error(config?.onErrorMessage || MESSAGES.ERROR.GENERIC);
      config?.onErrorCallback?.(error);
    },
  });
};

// ============================================
// EMPLOYÉS
// ============================================

export const useEmployes = (options?: Omit<UseQueryOptions, 'queryKey' | 'queryFn'>) => {
  return useQuery({
    queryKey: QUERY_KEYS.EMPLOYES,
    queryFn: () => api.employes.getAll(),
    ...options,
  });
};

export const useEmploye = (id: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.EMPLOYE(id),
    queryFn: () => api.employes.getById(id),
    enabled: !!id,
  });
};

export const useSearchEmployes = (keyword: string, enabled = true) => {
  return useQuery({
    queryKey: QUERY_KEYS.EMPLOYES_SEARCH(keyword),
    queryFn: () => api.employes.search(keyword),
    enabled: enabled && keyword.length > 0,
  });
};

export const useCreateEmploye = (config?: MutationConfig) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => api.employes.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EMPLOYES });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_STATS });
      toast.success(config?.onSuccessMessage || 'Employé créé avec succès');
      config?.onSuccessCallback?.(data);
    },
    onError: (error: Error) => {
      toast.error(config?.onErrorMessage || MESSAGES.ERROR.GENERIC);
      config?.onErrorCallback?.(error);
    },
  });
};

export const useUpdateEmploye = (config?: MutationConfig) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) => api.employes.update(id, data),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EMPLOYES });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EMPLOYE(variables.id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_STATS });
      toast.success(config?.onSuccessMessage || 'Employé mis à jour avec succès');
      config?.onSuccessCallback?.(data);
    },
    onError: (error: Error) => {
      toast.error(config?.onErrorMessage || MESSAGES.ERROR.GENERIC);
      config?.onErrorCallback?.(error);
    },
  });
};

export const useDeleteEmploye = (config?: MutationConfig) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => api.employes.delete(id),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.EMPLOYES });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_STATS });
      toast.success(config?.onSuccessMessage || 'Employé supprimé avec succès');
      config?.onSuccessCallback?.(data);
    },
    onError: (error: Error) => {
      toast.error(config?.onErrorMessage || MESSAGES.ERROR.GENERIC);
      config?.onErrorCallback?.(error);
    },
  });
};

// ============================================
// DEMANDES DE CONGÉ
// ============================================

export const useDemandesConges = (options?: Omit<UseQueryOptions, 'queryKey' | 'queryFn'>) => {
  return useQuery({
    queryKey: QUERY_KEYS.DEMANDES_CONGES,
    queryFn: () => api.demandesConges.getAll(),
    ...options,
  });
};

export const useDemandesEnAttente = () => {
  return useQuery({
    queryKey: QUERY_KEYS.DEMANDES_EN_ATTENTE,
    queryFn: () => api.demandesConges.getEnAttente(),
    refetchInterval: 30000,
  });
};

export const useCreateDemandeConge = (config?: MutationConfig) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => api.demandesConges.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DEMANDES_CONGES });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DEMANDES_EN_ATTENTE });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_STATS });
      toast.success(config?.onSuccessMessage || 'Demande de congé créée avec succès');
      config?.onSuccessCallback?.(data);
    },
    onError: (error: Error) => {
      toast.error(config?.onErrorMessage || MESSAGES.ERROR.GENERIC);
      config?.onErrorCallback?.(error);
    },
  });
};

export const useUpdateStatutDemande = (config?: MutationConfig) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      api.demandesConges.updateStatut(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DEMANDES_CONGES });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DEMANDES_EN_ATTENTE });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_STATS });
      toast.success(config?.onSuccessMessage || 'Statut mis à jour avec succès');
      config?.onSuccessCallback?.(data);
    },
    onError: (error: Error) => {
      toast.error(config?.onErrorMessage || MESSAGES.ERROR.GENERIC);
      config?.onErrorCallback?.(error);
    },
  });
};

// ============================================
// ICA
// ============================================

export const useSuiviICA = (annee?: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.ICA_SUIVI_COMPLET(annee),
    queryFn: () => api.ica.getSuiviComplet(annee),
  });
};

export const useStatistiquesICA = (annee?: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.ICA_STATISTIQUES(annee),
    queryFn: () => api.ica.getStatistiques(annee),
  });
};

// ============================================
// SOUS-DIRECTIONS
// ============================================

export const useSousDirections = () => {
  return useQuery({
    queryKey: QUERY_KEYS.SOUS_DIRECTIONS,
    queryFn: () => api.sousDirections.getAll(),
  });
};

export const useCreateSousDirection = (config?: MutationConfig) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => api.sousDirections.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SOUS_DIRECTIONS });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_STATS });
      toast.success(config?.onSuccessMessage || 'Sous-direction créée avec succès');
      config?.onSuccessCallback?.(data);
    },
    onError: (error: Error) => {
      toast.error(config?.onErrorMessage || MESSAGES.ERROR.GENERIC);
      config?.onErrorCallback?.(error);
    },
  });
};

// ============================================
// SERVICES
// ============================================

export const useServices = () => {
  return useQuery({
    queryKey: QUERY_KEYS.SERVICES,
    queryFn: () => api.services.getAll(),
  });
};

export const useCreateService = (config?: MutationConfig) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => api.services.create(data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.SERVICES });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.DASHBOARD_STATS });
      toast.success(config?.onSuccessMessage || 'Service créé avec succès');
      config?.onSuccessCallback?.(data);
    },
    onError: (error: Error) => {
      toast.error(config?.onErrorMessage || MESSAGES.ERROR.GENERIC);
      config?.onErrorCallback?.(error);
    },
  });
};

// ============================================
// HISTORIQUE CONGÉS
// ============================================

export const useHistoriqueConges = () => {
  return useQuery({
    queryKey: QUERY_KEYS.HISTORIQUE_CONGES,
    queryFn: () => api.historiqueConges.getAll(),
  });
};

export const useHistoriqueByEmploye = (employeId: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.HISTORIQUE_BY_EMPLOYE(employeId),
    queryFn: () => api.historiqueConges.getByEmployeId(employeId),
    enabled: !!employeId,
  });
};

export const useAjusterJoursConges = (config?: MutationConfig) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      api.historiqueConges.ajusterJours(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.HISTORIQUE_CONGES });
      toast.success(config?.onSuccessMessage || 'Ajustement effectué avec succès');
      config?.onSuccessCallback?.(data);
    },
    onError: (error: Error) => {
      toast.error(config?.onErrorMessage || MESSAGES.ERROR.GENERIC);
      config?.onErrorCallback?.(error);
    },
  });
};
