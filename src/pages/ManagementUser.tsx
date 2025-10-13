import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
  Plus,
  Edit,
  Trash2,
  Shield,
  Search,
  UserCheck,
  UserX,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { usersApi } from '../api/services';
import UserModal from '../components/user/UserModal';

interface User {
  id: number;
  username: string;
  email: string;
  role: 'ADMIN' | 'MANAGER_RH' | 'EMPLOYE_RH';
  actif: boolean;
}

const roleLabels = {
  ADMIN: 'Administrateur',
  MANAGER_RH: 'Manager RH',
  EMPLOYE_RH: 'Employé RH',
};

const roleBadgeColors = {
  ADMIN: 'bg-red-100 text-red-800 border-red-200',
  MANAGER_RH: 'bg-blue-100 text-blue-800 border-blue-200',
  EMPLOYE_RH: 'bg-green-100 text-green-800 border-green-200',
};

const ITEMS_PER_PAGE = 4;

export default function ManagementUser() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [filterRole, setFilterRole] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
    setCurrentPage(1);
  }, [users, searchTerm, filterRole, filterStatus]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await usersApi.getAll();
      console.log('Response complète:', response);

      if (response.data && response.data.success) {
        setUsers(response.data.data);
      } else if (response.success) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = [...users];

    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterRole !== 'ALL') {
      filtered = filtered.filter((user) => user.role === filterRole);
    }

    if (filterStatus !== 'ALL') {
      filtered = filtered.filter((user) =>
        filterStatus === 'ACTIF' ? user.actif : !user.actif
      );
    }

    setFilteredUsers(filtered);
  };

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const currentUsers = filteredUsers.slice(startIndex, endIndex);

  const handleCreate = () => {
    setSelectedUser(null);
    setIsModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (
      !window.confirm(
        'Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.'
      )
    ) {
      return;
    }

    try {
      const response = await usersApi.delete(id);
      if (response.data?.success || response.success) {
        toast.success('Utilisateur supprimé avec succès');
        loadUsers();
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const response = await usersApi.update(user.id, {
        username: user.username,
        email: user.email,
        role: user.role,
        actif: !user.actif,
      });

      if (response.data?.success || response.success) {
        toast.success(
          `Utilisateur ${!user.actif ? 'activé' : 'désactivé'} avec succès`
        );
        loadUsers();
      }
    } catch (error) {
      console.error('Erreur:', error);
      toast.error('Erreur lors de la modification du statut');
    }
  };

  const handleModalClose = (refresh: boolean) => {
    setIsModalOpen(false);
    setSelectedUser(null);
    if (refresh) {
      loadUsers();
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des utilisateurs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-4rem)] overflow-hidden flex flex-col gap-4 p-4 bg-gray-50">
      {/* En-tête */}
      <div className="flex-shrink-0 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Gestion des Utilisateurs
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Gérez les comptes et les permissions des utilisateurs du système
          </p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
        >
          <Plus size={18} />
          Nouvel utilisateur
        </button>
      </div>

      {/* Statistiques */}
      <div className="flex-shrink-0 grid grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs">Total utilisateurs</p>
              <p className="text-xl font-bold text-gray-900 mt-1">
                {users.length}
              </p>
            </div>
            <div className="bg-blue-100 p-2 rounded-lg">
              <Shield className="text-blue-600" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs">Comptes actifs</p>
              <p className="text-xl font-bold text-green-600 mt-1">
                {users.filter((u) => u.actif).length}
              </p>
            </div>
            <div className="bg-green-100 p-2 rounded-lg">
              <UserCheck className="text-green-600" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs">Administrateurs</p>
              <p className="text-xl font-bold text-red-600 mt-1">
                {users.filter((u) => u.role === 'ADMIN').length}
              </p>
            </div>
            <div className="bg-red-100 p-2 rounded-lg">
              <Shield className="text-red-600" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-600 text-xs">Managers RH</p>
              <p className="text-xl font-bold text-blue-600 mt-1">
                {users.filter((u) => u.role === 'MANAGER_RH').length}
              </p>
            </div>
            <div className="bg-blue-100 p-2 rounded-lg">
              <Shield className="text-blue-600" size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* Filtres et recherche */}
      <div className="flex-shrink-0 bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-3 gap-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Rechercher par nom ou email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ALL">Tous les rôles</option>
            <option value="ADMIN">Administrateur</option>
            <option value="MANAGER_RH">Manager RH</option>
            <option value="EMPLOYE_RH">Employé RH</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="ALL">Tous les statuts</option>
            <option value="ACTIF">Actifs</option>
            <option value="INACTIF">Inactifs</option>
          </select>
        </div>
      </div>

      {/* Tableau */}
      <div className="flex-1 min-h-0 bg-white rounded-lg shadow flex flex-col">
        <div className="flex-1 min-h-0 overflow-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Utilisateur
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Rôle
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentUsers.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    <UserX size={48} className="mx-auto mb-4 text-gray-300" />
                    <p className="text-lg font-medium">
                      Aucun utilisateur trouvé
                    </p>
                    <p className="text-sm mt-2">
                      {searchTerm ||
                      filterRole !== 'ALL' ||
                      filterStatus !== 'ALL'
                        ? 'Essayez de modifier vos critères de recherche'
                        : 'Créez votre premier utilisateur pour commencer'}
                    </p>
                  </td>
                </tr>
              ) : (
                currentUsers.map((user) => (
                  <tr
                    key={user.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-8 w-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                          <span className="text-white font-semibold text-xs">
                            {user.username.substring(0, 2).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">
                            {user.username}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                          roleBadgeColors[user.role]
                        }`}
                      >
                        <Shield size={12} className="mr-1" />
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <button
                        onClick={() => handleToggleStatus(user)}
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          user.actif
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                        } transition-colors`}
                      >
                        {user.actif ? (
                          <>
                            <UserCheck size={12} className="mr-1" />
                            Actif
                          </>
                        ) : (
                          <>
                            <UserX size={12} className="mr-1" />
                            Inactif
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filteredUsers.length > 0 && (
          <div className="flex-shrink-0 bg-gray-50 px-4 py-3 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Affichage de{' '}
                <span className="font-medium">{startIndex + 1}</span> à{' '}
                <span className="font-medium">
                  {Math.min(endIndex, filteredUsers.length)}
                </span>{' '}
                sur <span className="font-medium">{filteredUsers.length}</span>{' '}
                résultat(s)
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg border ${
                    currentPage === 1
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                  } transition-colors`}
                >
                  <ChevronLeft size={18} />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => {
                      if (
                        page === 1 ||
                        page === totalPages ||
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      ) {
                        return (
                          <button
                            key={page}
                            onClick={() => goToPage(page)}
                            className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                              currentPage === page
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                            }`}
                          >
                            {page}
                          </button>
                        );
                      } else if (
                        page === currentPage - 2 ||
                        page === currentPage + 2
                      ) {
                        return (
                          <span key={page} className="px-2 text-gray-500">
                            ...
                          </span>
                        );
                      }
                      return null;
                    }
                  )}
                </div>

                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg border ${
                    currentPage === totalPages
                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                      : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                  } transition-colors`}
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <UserModal user={selectedUser} onClose={handleModalClose} />
      )}
    </div>
  );
}
