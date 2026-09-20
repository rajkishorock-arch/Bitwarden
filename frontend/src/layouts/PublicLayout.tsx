import React, { useState, useEffect } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { ShieldCheck, Moon, Sun, Menu, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import './PublicLayout.css';

export const PublicLayout: React.FC = () => {
  const location = useLocation();
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <div className="public-layout">
      <header className="public-header">
        <div className="public-header-container">
          <Link to="/" className="public-brand">
            <div className="public-brand-logo">
              <ShieldCheck size={22} />
            </div>
            <span className="public-brand-name">VaultGuard</span>
          </Link>

          <nav className={`public-nav ${mobileMenuOpen ? 'mobile-open' : ''}`}>
            <Link
              to="/features"
              className={`public-nav-link ${location.pathname === '/features' ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Features
            </Link>
            <Link
              to="/security"
              className={`public-nav-link ${location.pathname === '/security' ? 'active' : ''}`}
              onClick={() => setMobileMenuOpen(false)}
            >
              Security
            </Link>
            <Link
              to="/login"
              className="public-nav-link"
              onClick={() => setMobileMenuOpen(false)}
            >
              Sign In
            </Link>
            <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
              <Button variant="primary" size="sm">
                Get Started
              </Button>
            </Link>
          </nav>

          <div className="public-header-actions">
            <button
              type="button"
              className="theme-toggle-btn"
              onClick={toggleTheme}
              aria-label={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
            </button>

            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </header>

      <main className="public-main">
        <Outlet />
      </main>

      <footer className="public-footer">
        <div className="public-footer-container">
          <div className="public-footer-brand">
            <ShieldCheck size={20} className="footer-logo-icon" />
            <span>VaultGuard Security Vault</span>
          </div>
          <p className="public-footer-copy">
            Zero-Knowledge Architecture. Sensitive state is cleared on a best-effort basis.
          </p>
          <div className="public-footer-links">
            <Link to="/features">Features</Link>
            <Link to="/security">Security</Link>
            <Link to="/login">Sign In</Link>
            <Link to="/register">Register</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};
