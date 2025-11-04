import axios, { AxiosError } from 'axios';
import { toast } from 'sonner';

const api = axios.create({
  baseURL: 'http://localhost:8080/api',
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
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
      if (response.data && !response.data.success && response.data.message) {
        console.warn('API returned success=false:', response.data.message);
      }
      return response;
    },
    (error: AxiosError<any>) => {
      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.message || error.message;

        switch (status) {
          case 401:
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/login';
            toast.error('Session expirée. Veuillez vous reconnecter.');
            break;
          case 403:
            toast.error('Accès refusé. Vous n\'avez pas les permissions nécessaires.');
            break;
          case 404:
            toast.error('Ressource non trouvée.');
            break;
          case 409:
            toast.error(message || 'Conflit de données. L\'élément existe déjà.');
            break;
          case 422:
            toast.error(message || 'Données invalides. Veuillez vérifier les champs.');
            break;
          case 500:
            toast.error('Erreur serveur. Veuillez réessayer plus tard.');
            break;
          default:
            if (message) {
              toast.error(message);
            } else {
              toast.error('Une erreur est survenue.');
            }
        }
      } else if (error.request) {
        toast.error('Impossible de contacter le serveur. Vérifiez votre connexion.');
      } else {
        toast.error('Une erreur inattendue s\'est produite.');
      }

      return Promise.reject(error);
    }
);

export default api;