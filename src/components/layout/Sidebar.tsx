import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Building2,
  Briefcase,
  Award,
  UserCog,
  LogOut,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'MANAGER_RH', 'EMPLOYE_RH'] },
  { name: 'Employés', href: '/employes', icon: Users, roles: ['ADMIN', 'MANAGER_RH', 'EMPLOYE_RH'] },
  { name: 'Demandes de Congé', href: '/demandes-conges', icon: Calendar, roles: ['ADMIN', 'MANAGER_RH', 'EMPLOYE_RH'] },
  { name: 'Suivi ICA', href: '/ica', icon: Award, roles: ['ADMIN', 'MANAGER_RH', 'EMPLOYE_RH'] },
  { name: 'Sous-Directions', href: '/sous-directions', icon: Building2, roles: ['ADMIN', 'MANAGER_RH'] },
  { name: 'Services', href: '/services', icon: Briefcase, roles: ['ADMIN', 'MANAGER_RH'] },
  { name: 'Utilisateurs', href: '/utilisateurs', icon: UserCog, roles: ['ADMIN'] },
];

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();

  const filteredNavigation = navigation.filter(item => 
    user && item.roles.includes(user.role)
  );

  return (
    <div className="flex h-screen w-64 flex-col bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center border-b border-sidebar-border px-6">
        <h1 className="text-xl font-bold text-sidebar-foreground">CNAS Constantine</h1>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
        {filteredNavigation.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <Link
              key={item.name}
              to={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="border-t border-sidebar-border p-4">
        <div className="mb-3 rounded-lg bg-sidebar-accent p-3">
          <p className="text-sm font-medium text-sidebar-accent-foreground">{user?.username}</p>
          <p className="text-xs text-sidebar-accent-foreground/70">{user?.role}</p>
        </div>
        <button
          onClick={logout}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors"
        >
          <LogOut className="h-5 w-5" />
          Déconnexion
        </button>
      </div>
    </div>
  );
}
