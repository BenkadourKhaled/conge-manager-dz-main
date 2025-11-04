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
  MoreVertical,
  Users,
  Settings,
  User,
  Grid,
  Table,
  Eye,
  Lock,
  Unlock,
  AlertCircle,
} from 'lucide-react';
import { usersApi } from '../api/services';
import UserModal from '../components/user/UserModal';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import ConfirmDialog from '@/components/common/ConfirmDialog';
interface User {
  id: number;
  username: string;
  email: string;
  role: 'ADMIN' | 'MANAGER_RH' | 'EMPLOYE_RH';
  actif: boolean;
  avatar?: string;
  lastLogin?: string;
  createdAt?: string;
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

const roleIcons = {
  ADMIN: <Shield className="h-3 w-3" />,
  MANAGER_RH: <Settings className="h-3 w-3" />,
  EMPLOYE_RH: <User className="h-3 w-3" />,
};

const ITEMS_PER_PAGE = 8;

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
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<number | null>(null);

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
    setUserToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!userToDelete) return;

    try {
      const response = await usersApi.delete(userToDelete);
      if (response.data?.success || response.success) {
        toast.success('Utilisateur supprimé avec succès');
        loadUsers();
        setDeleteDialogOpen(false);
        setUserToDelete(null);
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
        <div className="h-[calc(100vh-4rem)] overflow-hidden flex flex-col gap-6 p-6 bg-slate-50">
          <div className="flex-shrink-0">
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <div className="flex-shrink-0 grid grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
                <Card key={i} className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-8 w-16" />
                    </div>
                    <Skeleton className="h-10 w-10 rounded-lg" />
                  </div>
                </Card>
            ))}
          </div>
          <Card className="flex-1 min-h-0 p-4">
            <div className="space-y-4">
              <div className="flex gap-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-10 w-48" />
              </div>
              <div className="space-y-2">
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border rounded-lg">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-48" />
                        <Skeleton className="h-4 w-64" />
                      </div>
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-8 w-20" />
                      <Skeleton className="h-8 w-24" />
                    </div>
                ))}
              </div>
            </div>
          </Card>
        </div>
    );
  }

  return (
      <div className="h-[calc(100vh-4rem)] overflow-hidden flex flex-col gap-6 p-6 bg-slate-50">
        {/* En-tête */}
        <div className="flex-shrink-0 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
              <Users className="h-8 w-8 text-blue-600" />
              Gestion des Utilisateurs
            </h1>
            <p className="text-slate-500 mt-2">
              Gérez les comptes et les permissions des utilisateurs du système
            </p>
          </div>
          <Button
              onClick={handleCreate}
              className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all"
          >
            <Plus size={18} />
            Nouvel utilisateur
          </Button>
        </div>

        {/* Statistiques */}
        <div className="flex-shrink-0 grid grid-cols-4 gap-4">
          <Card className="p-4 bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Total utilisateurs</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">
                  {users.length}
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Comptes actifs</p>
                <p className="text-2xl font-bold text-emerald-600 mt-1">
                  {users.filter((u) => u.actif).length}
                </p>
              </div>
              <div className="p-2 bg-emerald-100 rounded-lg">
                <UserCheck className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Administrateurs</p>
                <p className="text-2xl font-bold text-red-600 mt-1">
                  {users.filter((u) => u.role === 'ADMIN').length}
                </p>
              </div>
              <div className="p-2 bg-red-100 rounded-lg">
                <Shield className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </Card>

          <Card className="p-4 bg-white border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">Managers RH</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">
                  {users.filter((u) => u.role === 'MANAGER_RH').length}
                </p>
              </div>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Settings className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Filtres et recherche */}
        <Card className="flex-shrink-0 p-4 bg-white border-slate-200 shadow-sm">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400"
                  size={18}
              />
              <Input
                  type="text"
                  placeholder="Rechercher par nom ou email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 border-slate-200 focus:border-blue-500 focus:ring-blue-500"
              />
            </div>

            <Select
                value={filterRole}
                onValueChange={setFilterRole}
            >
              <SelectTrigger className="w-[200px] border-slate-200 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Tous les rôles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les rôles</SelectItem>
                <SelectItem value="ADMIN">Administrateur</SelectItem>
                <SelectItem value="MANAGER_RH">Manager RH</SelectItem>
                <SelectItem value="EMPLOYE_RH">Employé RH</SelectItem>
              </SelectContent>
            </Select>

            <Select
                value={filterStatus}
                onValueChange={setFilterStatus}
            >
              <SelectTrigger className="w-[180px] border-slate-200 focus:border-blue-500 focus:ring-blue-500">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tous les statuts</SelectItem>
                <SelectItem value="ACTIF">Actifs</SelectItem>
                <SelectItem value="INACTIF">Inactifs</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-2 ml-auto">
              <Button
                  variant={viewMode === 'table' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className={viewMode === 'table' ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-200 hover:bg-slate-100'}
              >
                <Table className="h-4 w-4 mr-1" />
                Tableau
              </Button>
              <Button
                  variant={viewMode === 'grid' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className={viewMode === 'grid' ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-200 hover:bg-slate-100'}
              >
                <Grid className="h-4 w-4 mr-1" />
                Grille
              </Button>
            </div>
          </div>
        </Card>

        {/* Tableau ou Grille */}
        <Card className="flex-1 min-h-0 bg-white border-slate-200 shadow-sm flex flex-col">
          <div className="flex-1 min-h-0 flex flex-col">
            {currentUsers.length === 0 ? (
                <div className="flex items-center justify-center flex-1 text-slate-500">
                  <div className="text-center">
                    <UserX size={48} className="mx-auto mb-4 text-slate-300" />
                    <h3 className="text-lg font-medium text-slate-900 mb-1">
                      Aucun utilisateur trouvé
                    </h3>
                    <p className="text-sm">
                      {searchTerm ||
                      filterRole !== 'ALL' ||
                      filterStatus !== 'ALL'
                          ? 'Essayez de modifier vos critères de recherche'
                          : 'Créez votre premier utilisateur pour commencer'}
                    </p>
                    {!searchTerm && filterRole === 'ALL' && filterStatus === 'ALL' && (
                        <Button
                            className="mt-4 bg-blue-600 hover:bg-blue-700"
                            onClick={handleCreate}
                        >
                          <Plus className="h-4 w-4 mr-2" />
                          Créer un utilisateur
                        </Button>
                    )}
                  </div>
                </div>
            ) : (
                <>
                  {viewMode === 'table' ? (
                      <div className="flex-1 min-h-0 overflow-auto">
                        <table className="min-w-full divide-y divide-slate-200">
                          <thead className="bg-slate-50 sticky top-0">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Utilisateur
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Rôle
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Statut
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                              Actions
                            </th>
                          </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-200">
                          {currentUsers.map((user) => (
                              <tr
                                  key={user.id}
                                  className="hover:bg-slate-50 transition-colors"
                              >
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="flex items-center">
                                    <Avatar className="h-10 w-10 mr-3">
                                      <AvatarImage src={user.avatar} alt={user.username} />
                                      <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                                        {user.username.substring(0, 2).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <div className="text-sm font-medium text-slate-900">
                                        {user.username}
                                      </div>
                                      {user.lastLogin && (
                                          <div className="text-xs text-slate-500">
                                            Dernière connexion: {new Date(user.lastLogin).toLocaleDateString('fr-FR')}
                                          </div>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <div className="text-sm text-slate-900">{user.email}</div>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <Badge
                                      className={`inline-flex items-center gap-1 ${roleBadgeColors[user.role]}`}
                                  >
                                    {roleIcons[user.role]}
                                    {roleLabels[user.role]}
                                  </Badge>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                  <button
                                      onClick={() => handleToggleStatus(user)}
                                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                          user.actif
                                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                              : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
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
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                  <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                        <MoreVertical className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                          className="cursor-pointer"
                                          onClick={() => handleEdit(user)}
                                      >
                                        <Edit className="h-4 w-4 mr-2" />
                                        Modifier
                                      </DropdownMenuItem>
                                      <DropdownMenuItem
                                          className="cursor-pointer"
                                          onClick={() => handleToggleStatus(user)}
                                      >
                                        {user.actif ? (
                                            <>
                                              <Lock className="h-4 w-4 mr-2" />
                                              Désactiver
                                            </>
                                        ) : (
                                            <>
                                              <Unlock className="h-4 w-4 mr-2" />
                                              Activer
                                            </>
                                        )}
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem
                                          className="cursor-pointer text-red-600 focus:text-red-600"
                                          onClick={() => handleDelete(user.id)}
                                      >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Supprimer
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </td>
                              </tr>
                          ))}
                          </tbody>
                        </table>
                      </div>
                  ) : (
                      <div className="flex-1 min-h-0 overflow-auto p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                          {currentUsers.map((user) => (
                              <Card key={user.id} className="p-4 border-slate-200 hover:shadow-md transition-shadow">
                                <div className="flex items-start justify-between mb-3">
                                  <Avatar className="h-12 w-12">
                                    <AvatarImage src={user.avatar} alt={user.username} />
                                    <AvatarFallback className="bg-blue-100 text-blue-600 font-medium">
                                      {user.username.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                  </Avatar>
                                  <Badge
                                      className={`inline-flex items-center gap-1 ${roleBadgeColors[user.role]}`}
                                  >
                                    {roleIcons[user.role]}
                                    {roleLabels[user.role]}
                                  </Badge>
                                </div>
                                <div className="mb-3">
                                  <h3 className="font-medium text-slate-900">{user.username}</h3>
                                  <p className="text-sm text-slate-500">{user.email}</p>
                                  {user.lastLogin && (
                                      <p className="text-xs text-slate-400 mt-1">
                                        Dernière connexion: {new Date(user.lastLogin).toLocaleDateString('fr-FR')}
                                      </p>
                                  )}
                                </div>
                                <div className="mb-4">
                                  <button
                                      onClick={() => handleToggleStatus(user)}
                                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                          user.actif
                                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                              : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
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
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                      variant="outline"
                                      size="sm"
                                      className="flex-1 border-slate-200 hover:bg-slate-100"
                                      onClick={() => handleEdit(user)}
                                  >
                                    <Edit className="h-4 w-4 mr-1" />
                                    Modifier
                                  </Button>
                                  <Button
                                      variant="outline"
                                      size="sm"
                                      className="text-red-600 border-red-200 hover:bg-red-50"
                                      onClick={() => handleDelete(user.id)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </Card>
                          ))}
                        </div>
                      </div>
                  )}

                  {/* Pagination */}
                  <div className="flex-shrink-0 bg-slate-50 px-6 py-4 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-slate-700">
                        Affichage de{' '}
                        <span className="font-medium">{startIndex + 1}</span> à{' '}
                        <span className="font-medium">
                      {Math.min(endIndex, filteredUsers.length)}
                    </span>{' '}
                        sur <span className="font-medium">{filteredUsers.length}</span>{' '}
                        résultat(s)
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={goToPreviousPage}
                            disabled={currentPage === 1}
                            className="border-slate-200 hover:bg-slate-100"
                        >
                          <ChevronLeft size={18} />
                          Précédent
                        </Button>

                        <div className="flex items-center gap-1">
                          {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                              (page) => {
                                if (
                                    page === 1 ||
                                    page === totalPages ||
                                    (page >= currentPage - 1 && page <= currentPage + 1)
                                ) {
                                  return (
                                      <Button
                                          key={page}
                                          variant={
                                            currentPage === page ? 'default' : 'outline'
                                          }
                                          size="sm"
                                          onClick={() => goToPage(page)}
                                          className={`w-10 ${currentPage === page ? 'bg-blue-600 hover:bg-blue-700' : 'border-slate-200 hover:bg-slate-100'}`}
                                      >
                                        {page}
                                      </Button>
                                  );
                                } else if (
                                    page === currentPage - 2 ||
                                    page === currentPage + 2
                                ) {
                                  return (
                                      <span key={page} className="px-2 text-slate-500">
                                ...
                              </span>
                                  );
                                }
                                return null;
                              }
                          )}
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={goToNextPage}
                            disabled={currentPage === totalPages}
                            className="border-slate-200 hover:bg-slate-100"
                        >
                          Suivant
                          <ChevronRight size={18} />
                        </Button>
                      </div>
                    </div>
                  </div>
                </>
            )}
          </div>
        </Card>

        {/* Modal */}
        {isModalOpen && (
            <UserModal user={selectedUser} onClose={handleModalClose} />
        )}

        {/* Dialog de confirmation de suppression */}
        <ConfirmDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onConfirm={confirmDelete}
            title="Supprimer l'utilisateur"
            description="Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible et supprimera également toutes ses données associées."
            variant="destructive"
        />
      </div>
  );
}