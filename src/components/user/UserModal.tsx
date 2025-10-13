import { useState, useEffect } from 'react';
import { X, Shield, Mail, User, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { usersApi } from '@/api/services';

interface User {
  id: number;
  username: string;
  email: string;
  role: 'ADMIN' | 'MANAGER_RH' | 'EMPLOYE_RH';
  actif: boolean;
}

interface UserModalProps {
  user: User | null;
  onClose: (refresh: boolean) => void;
}

interface FormData {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'ADMIN' | 'MANAGER_RH' | 'EMPLOYE_RH';
  actif: boolean;
}

const roleOptions = [
  {
    value: 'ADMIN',
    label: 'Administrateur',
    description: 'Accès complet au système',
    color: 'red',
  },
  {
    value: 'MANAGER_RH',
    label: 'Manager RH',
    description: 'Gestion complète des RH',
    color: 'blue',
  },
  {
    value: 'EMPLOYE_RH',
    label: 'Employé RH',
    description: 'Consultation et saisie',
    color: 'green',
  },
];

export default function UserModal({ user, onClose }: UserModalProps) {
  const [formData, setFormData] = useState<FormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'EMPLOYE_RH',
    actif: true,
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        password: '',
        confirmPassword: '',
        role: user.role,
        actif: user.actif,
      });
    }
  }, [user]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Username
    if (!formData.username.trim()) {
      newErrors.username = "Le nom d'utilisateur est requis";
    } else if (formData.username.length < 3) {
      newErrors.username =
        "Le nom d'utilisateur doit contenir au moins 3 caractères";
    } else if (formData.username.length > 50) {
      newErrors.username =
        "Le nom d'utilisateur ne peut pas dépasser 50 caractères";
    }

    // Email
    if (!formData.email.trim()) {
      newErrors.email = "L'email est requis";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "L'email n'est pas valide";
    }

    // Password (uniquement pour création ou si modifié)
    if (!user && !formData.password) {
      newErrors.password = 'Le mot de passe est requis';
    } else if (formData.password && formData.password.length < 6) {
      newErrors.password =
        'Le mot de passe doit contenir au moins 6 caractères';
    }

    // Confirm password
    if (formData.password && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Les mots de passe ne correspondent pas';
    }

    // Role
    if (!formData.role) {
      newErrors.role = 'Le rôle est requis';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Veuillez corriger les erreurs dans le formulaire');
      return;
    }

    setLoading(true);

    try {
      const payload: any = {
        username: formData.username,
        email: formData.email,
        role: formData.role,
        actif: formData.actif,
      };

      // ✅ CORRECTION : Ne pas envoyer le champ password s'il est vide lors d'une modification
      if (formData.password && formData.password.trim() !== '') {
        payload.password = formData.password;
      } else if (!user) {
        // Si c'est une création et que le password est vide, erreur
        toast.error('Le mot de passe est requis pour la création');
        setLoading(false);
        return;
      }

      let response;
      if (user) {
        response = await usersApi.update(user.id, payload);
      } else {
        response = await usersApi.create(payload);
      }

      const isSuccess =
        response?.data?.success || response?.success || response?.data?.data;

      if (isSuccess) {
        toast.success(
          user
            ? 'Utilisateur modifié avec succès'
            : 'Utilisateur créé avec succès'
        );
        onClose(true);
      } else {
        toast.error('Erreur lors de la sauvegarde');
      }
    } catch (error: any) {
      console.error('Erreur lors de la sauvegarde:', error);
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Erreur lors de la sauvegarde';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof FormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Effacer l'erreur du champ modifié
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Shield className="text-blue-600" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {user ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                {user
                  ? "Modifiez les informations de l'utilisateur"
                  : 'Créez un nouveau compte utilisateur'}
              </p>
            </div>
          </div>
          <button
            onClick={() => onClose(false)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            disabled={loading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Username */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <User size={16} />
              Nom d'utilisateur
              <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => handleChange('username', e.target.value)}
              disabled={loading}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.username ? 'border-red-500' : 'border-gray-300'
              } ${loading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              placeholder="Ex: jdupont"
            />
            {errors.username && (
              <p className="mt-1 text-sm text-red-600">{errors.username}</p>
            )}
          </div>

          {/* Email */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Mail size={16} />
              Email
              <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              disabled={loading}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              } ${loading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              placeholder="Ex: jean.dupont@cnas.dz"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email}</p>
            )}
          </div>

          {/* Password */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Lock size={16} />
              Mot de passe
              {!user && <span className="text-red-500">*</span>}
              {user && (
                <span className="text-gray-500 text-xs font-normal ml-1">
                  (Laissez vide pour ne pas modifier)
                </span>
              )}
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                disabled={loading}
                className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                } ${loading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={loading}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password}</p>
            )}
          </div>

          {/* Confirm Password */}
          {formData.password && (
            <div>
              <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                <Lock size={16} />
                Confirmer le mot de passe
                <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) =>
                    handleChange('confirmPassword', e.target.value)
                  }
                  disabled={loading}
                  className={`w-full px-4 py-2 pr-10 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    errors.confirmPassword
                      ? 'border-red-500'
                      : 'border-gray-300'
                  } ${loading ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  disabled={loading}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.confirmPassword}
                </p>
              )}
            </div>
          )}

          {/* Role */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
              <Shield size={16} />
              Rôle
              <span className="text-red-500">*</span>
            </label>
            <div className="space-y-3">
              {roleOptions.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    formData.role === option.value
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={option.value}
                    checked={formData.role === option.value}
                    onChange={(e) =>
                      handleChange('role', e.target.value as any)
                    }
                    disabled={loading}
                    className="mt-1 mr-3 text-blue-600"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">
                      {option.label}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {option.description}
                    </div>
                  </div>
                </label>
              ))}
            </div>
            {errors.role && (
              <p className="mt-1 text-sm text-red-600">{errors.role}</p>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Statut du compte</div>
              <div className="text-sm text-gray-600 mt-1">
                {formData.actif
                  ? 'Le compte est actif et peut se connecter'
                  : 'Le compte est désactivé'}
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleChange('actif', !formData.actif)}
              disabled={loading}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.actif ? 'bg-green-600' : 'bg-gray-300'
              } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.actif ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => onClose(false)}
              disabled={loading}
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Enregistrement...</span>
                </>
              ) : (
                <span>
                  {user
                    ? 'Enregistrer les modifications'
                    : "Créer l'utilisateur"}
                </span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
