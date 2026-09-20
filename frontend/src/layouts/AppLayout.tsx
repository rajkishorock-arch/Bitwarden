import React, { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  KeyRound,
  CreditCard,
  FileText,
  RefreshCw,
  Activity,
  Settings,
  Star,
  LogOut,
  Search,
  Menu,
  X,
} from 'lucide-react';
import { useAuthStore } from '../features/auth/auth.store';
import { useCryptoStore } from '../crypto/key-store';
import { authService } from '../features/auth/auth.service';
import { VaultLockScreen } from '../features/auth/pages/VaultLockScreen';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import './AppLayout.css';

export const AppLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isInitialized } = useAuthStore();
  const isUnlocked = useCryptoStore((state) => state.isUnlocked);
  const lockVault = useCryptoStore((state) => state.lockVault);

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isInitialized && !isAuthenticated) {
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, isInitialized, navigate]);

  useEffect(() => {
    // Dynamically enforce noindex on private app routes
    let metaRobots = document.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (!metaRobots) {
      metaRobots = document.createElement('meta');
      metaRobots.name = 'robots';
      document.head.appendChild(metaRobots);
    }
    metaRobots.content = 'noindex, nofollow';

    return () => {
      if (metaRobots) {
        metaRobots.content = 'index, follow';
      }
    };
  }, []);

  if (!isAuthenticated) {
    return null;
  }

  if (!isUnlocked) {
    return <VaultLockScreen onUnlockSuccess={() => setSidebarOpen(false)} />;
  }

  return (
    <div className="app-shell">
      <header className="mobile-app-header">
        <button
          type="button"
          className="icon-menu-btn"
          onClick={() => setSidebarOpen((prev) => !prev)}
          aria-label="Toggle navigation menu"
        >
          {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
        </button>

        <div className="mobile-brand">
          <ShieldCheck size={20} className="brand-icon" />
          <span>VaultGuard</span>
        </div>

        <button
          type="button"
          className="icon-lock-btn"
          onClick={() => lockVault()}
          title="Lock Vault"
          aria-label="Lock Vault"
        >
          <Lock size={18} />
        </button>
      </header>

      <div className="app-body">
        <aside className={`app-sidebar ${sidebarOpen ? 'mobile-open' : ''}`}>
          <div className="sidebar-brand-header">
            <div className="sidebar-brand-logo">
              <ShieldCheck size={20} />
            </div>
            <div className="sidebar-brand-info">
              <span className="sidebar-brand-name">VaultGuard</span>
              <span className="sidebar-user-email">{user?.email}</span>
            </div>
          </div>

          <div className="sidebar-search-container">
            <Input
              placeholder="Search vault (Ctrl+K)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search size={14} />}
              className="sidebar-search-input"
            />
          </div>

          <nav className="sidebar-nav">
            <div className="nav-section-label">VAULT CATEGORIES</div>

            <NavLink
              to="/app/vault"
              className={({ isActive }) => `sidebar-item ${isActive && location.pathname === '/app/vault' ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <KeyRound size={16} />
              <span>All Items</span>
            </NavLink>

            <NavLink
              to="/app/favorites"
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Star size={16} />
              <span>Favorites</span>
            </NavLink>

            <NavLink
              to="/app/logins"
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <KeyRound size={16} />
              <span>Logins</span>
            </NavLink>

            <NavLink
              to="/app/cards"
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <CreditCard size={16} />
              <span>Cards</span>
            </NavLink>

            <NavLink
              to="/app/notes"
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <FileText size={16} />
              <span>Secure Notes</span>
            </NavLink>

            <div className="nav-section-label">TOOLS & AUDIT</div>

            <NavLink
              to="/app/generator"
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <RefreshCw size={16} />
              <span>Password Generator</span>
            </NavLink>

            <NavLink
              to="/app/health"
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Activity size={16} />
              <span>Vault Health</span>
            </NavLink>

            <NavLink
              to="/app/settings"
              className={({ isActive }) => `sidebar-item ${isActive ? 'active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <Settings size={16} />
              <span>Settings</span>
            </NavLink>
          </nav>

          <div className="sidebar-footer">
            <Button
              variant="outline"
              size="sm"
              icon={<Lock size={14} />}
              onClick={() => lockVault()}
              className="sidebar-action-btn"
            >
              Lock Vault
            </Button>
            <Button
              variant="ghost"
              size="sm"
              icon={<LogOut size={14} />}
              onClick={() => authService.logout()}
              className="sidebar-action-btn"
            >
              Log Out
            </Button>
          </div>
        </aside>

        <main className="app-content-area">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
