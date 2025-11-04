import { Suspense, lazy } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import { LoadingFallback } from './components/common/LoadingFallback';
import { QUERY_STALE_TIME } from './constants';

// Lazy loading des pages pour améliorer les performances
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Employes = lazy(() => import('./pages/Employes'));
const DemandesConges = lazy(() => import('./pages/DemandesConges'));
const SuiviICA = lazy(() => import('./pages/SuiviICA'));
const SousDirections = lazy(() => import('./pages/SousDirections'));
const Services = lazy(() => import('./pages/Services'));
const ManagementUser = lazy(() => import('./pages/ManagementUser'));
const HistoriqueCongesPage = lazy(() => import('./pages/historique-conges-page'));
const AuditTrail = lazy(() => import('./pages/AuditTrail'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Configuration optimisée de React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: QUERY_STALE_TIME.MEDIUM,
      gcTime: 10 * 60 * 1000, // 10 minutes
    },
    mutations: {
      retry: 0,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner position="top-right" />
        <BrowserRouter>
          <Suspense fallback={<LoadingFallback />}>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<Login />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/employes"
                element={
                  <ProtectedRoute>
                    <Employes />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/demandes-conges"
                element={
                  <ProtectedRoute>
                    <DemandesConges />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/ica"
                element={
                  <ProtectedRoute>
                    <SuiviICA />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/sous-directions"
                element={
                  <ProtectedRoute>
                    <SousDirections />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/services"
                element={
                  <ProtectedRoute>
                    <Services />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/utilisateurs"
                element={
                  <ProtectedRoute>
                    <ManagementUser />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/historique-conges"
                element={
                  <ProtectedRoute>
                    <HistoriqueCongesPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/audit"
                element={
                  <ProtectedRoute>
                    <AuditTrail />
                  </ProtectedRoute>
                }
              />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
