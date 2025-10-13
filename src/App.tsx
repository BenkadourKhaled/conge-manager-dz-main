import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Employes from './pages/Employes';
import DemandesConges from './pages/DemandesConges';
import SuiviICA from './pages/SuiviICA';
import SousDirections from './pages/SousDirections';
import Services from './pages/Services';

import EmployesPage from '@/pages/Employes';
import NotFound from './pages/NotFound';
import HistoriqueCongesPage from './pages/historique-conges-page';
import ManagementUser from './pages/ManagementUser';
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
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
            // Dans vos routes
            <Route
              path="/historique-conges"
              element={
                <ProtectedRoute>
                  <HistoriqueCongesPage />
                </ProtectedRoute>
              }
            />
            <Route path="/employes" element={<EmployesPage />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
