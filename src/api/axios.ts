import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds timeout
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    // Handle successful responses
    if (response.data && !response.data.success && response.data.message) {
      // If the API returns success: false, treat it as an error
      console.warn('API returned success=false:', response.data.message);
    }
    return response;
  },
  (error: AxiosError<any>) => {
    // Handle errors
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || error.message;

      switch (status) {
        case 401:
          // Unauthorized - clear auth and redirect to login
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          toast.error('Session expirée. Veuillez vous reconnecter.');
          break;

        case 403:
          // Forbidden
          toast.error('Accès refusé. Vous n\'avez pas les permissions nécessaires.');
          break;

        case 404:
          // Not found
          toast.error('Ressource non trouvée.');
          break;

        case 409:
          // Conflict (e.g., duplicate entry)
          toast.error(message || 'Conflit de données. L\'élément existe déjà.');
          break;

        case 422:
          // Validation error
          toast.error(message || 'Données invalides. Veuillez vérifier les champs.');
          break;

        case 500:
          // Server error
          toast.error('Erreur serveur. Veuillez réessayer plus tard.');
          break;

        default:
          // Generic error
          if (message) {
            toast.error(message);
          } else {
            toast.error('Une erreur est survenue.');
          }
      }
    } else if (error.request) {
      // Request made but no response received
      toast.error('Impossible de contacter le serveur. Vérifiez votre connexion.');
    } else {
      // Something else happened
      toast.error('Une erreur inattendue s\'est produite.');
    }

    return Promise.reject(error);
  }
);

export default api;
