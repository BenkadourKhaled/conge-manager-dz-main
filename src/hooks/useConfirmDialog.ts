/**
 * Hook pour gérer les dialogues de confirmation
 */

import { useState, useCallback } from 'react';

interface ConfirmDialogState {
  isOpen: boolean;
  title: string;
  description: string;
  onConfirm?: () => void | Promise<void>;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
}

export const useConfirmDialog = () => {
  const [state, setState] = useState<ConfirmDialogState>({
    isOpen: false,
    title: '',
    description: '',
    confirmText: 'Confirmer',
    cancelText: 'Annuler',
    variant: 'default',
  });

  const [isLoading, setIsLoading] = useState(false);

  const showConfirm = useCallback(
    (options: Omit<ConfirmDialogState, 'isOpen'>) => {
      setState({
        isOpen: true,
        ...options,
      });
    },
    []
  );

  const hideConfirm = useCallback(() => {
    setState((prev) => ({ ...prev, isOpen: false }));
    setIsLoading(false);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (state.onConfirm) {
      setIsLoading(true);
      try {
        await state.onConfirm();
        hideConfirm();
      } catch (error) {
        console.error('Confirmation error:', error);
      } finally {
        setIsLoading(false);
      }
    } else {
      hideConfirm();
    }
  }, [state.onConfirm, hideConfirm]);

  return {
    ...state,
    isLoading,
    showConfirm,
    hideConfirm,
    handleConfirm,
  };
};

// Hook simplifié pour les suppressions
export const useDeleteConfirm = (onDelete: () => void | Promise<void>) => {
  const confirm = useConfirmDialog();

  const confirmDelete = useCallback(
    (itemName?: string) => {
      confirm.showConfirm({
        title: 'Confirmer la suppression',
        description: itemName
          ? `Êtes-vous sûr de vouloir supprimer "${itemName}" ? Cette action est irréversible.`
          : 'Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.',
        confirmText: 'Supprimer',
        cancelText: 'Annuler',
        variant: 'destructive',
        onConfirm: onDelete,
      });
    },
    [confirm, onDelete]
  );

  return {
    confirmDelete,
    ...confirm,
  };
};
