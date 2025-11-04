/**
 * Hook pour gérer les permissions basées sur les rôles
 */

import { useAuth } from '@/context/AuthContext';
import { ROLE_PERMISSIONS } from '@/constants';
import type { UserRole } from '@/types/api.types';

export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;

    const role = user.role as UserRole;
    const permissions = ROLE_PERMISSIONS[role];

    // ADMIN a toutes les permissions
    if (permissions.includes('all')) return true;

    return permissions.includes(permission);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    return permissions.some((permission) => hasPermission(permission));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    return permissions.every((permission) => hasPermission(permission));
  };

  const isAdmin = (): boolean => {
    return user?.role === 'ADMIN';
  };

  const isManagerRH = (): boolean => {
    return user?.role === 'MANAGER_RH';
  };

  const isEmployeRH = (): boolean => {
    return user?.role === 'EMPLOYE_RH';
  };

  const canManage = (): boolean => {
    return isAdmin() || isManagerRH();
  };

  return {
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    isManagerRH,
    isEmployeRH,
    canManage,
  };
};
