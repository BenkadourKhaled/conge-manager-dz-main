/**
 * Composant de chargement pour le lazy loading des routes
 */

import { Activity } from 'lucide-react';

export const LoadingFallback = () => {
  return (
    <div className="flex items-center justify-center h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="text-center space-y-4">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Activity className="h-6 w-6 text-primary animate-pulse" />
          </div>
        </div>
        <div>
          <p className="text-lg font-semibold text-foreground">Chargement...</p>
          <p className="text-sm text-muted-foreground mt-1">Veuillez patienter</p>
        </div>
      </div>
    </div>
  );
};

export const PageLoadingFallback = () => {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center space-y-3">
        <div className="relative">
          <div className="animate-spin rounded-full h-12 w-12 border-3 border-primary border-t-transparent mx-auto"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Activity className="h-5 w-5 text-primary animate-pulse" />
          </div>
        </div>
        <p className="text-sm text-muted-foreground">Chargement de la page...</p>
      </div>
    </div>
  );
};
