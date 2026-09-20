import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Shield, User, Database, Lock, LogOut, Moon } from 'lucide-react';
import { useAuthStore } from '../../auth/auth.store';
import { authService } from '../../auth/auth.service';
import { useCryptoStore } from '../../../crypto/key-store';
import { lockVault } from '../../../crypto/keyLifecycle';
import { Button } from '../../../components/ui/Button';
import './SettingsPage.css';

export const SettingsPage: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { autoLockMinutes, setAutoLockMinutes } = useCryptoStore();

  const handleAutoLockChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAutoLockMinutes(Number(e.target.value));
  };

  const handleLockNow = () => {
    lockVault();
  };

  const handleLogout = () => {
    authService.logout();
  };

  return (
    <div className="settings-page-container">
      <div className="settings-page-header">
        <div className="header-title-group">
          <Settings size={24} className="header-icon" />
          <h1>Account & Application Settings</h1>
        </div>
        <p className="settings-page-subtitle">
          Manage your security preferences, auto-lock timeouts, account session, and encrypted backups.
        </p>
      </div>

      <div className="settings-sections-list">
        {/* Security Preferences */}
        <div className="settings-card">
          <div className="card-title-row">
            <Shield size={18} className="card-icon" />
            <h2>Security & Auto-Lock</h2>
          </div>

          <div className="setting-item-row">
            <div className="setting-info">
              <span className="setting-title">Auto-Lock Vault Timeout</span>
              <span className="setting-description">
                Automatically purges Master Encryption Key and decrypted items from memory after period of inactivity.
              </span>
            </div>
            <select
              value={autoLockMinutes}
              onChange={handleAutoLockChange}
              className="settings-select"
            >
              <option value={1}>1 Minute</option>
              <option value={5}>5 Minutes</option>
              <option value={10}>10 Minutes (Default)</option>
              <option value={30}>30 Minutes</option>
              <option value={0}>Never Auto-Lock</option>
            </select>
          </div>

          <div className="setting-item-row">
            <div className="setting-info">
              <span className="setting-title">Clipboard Auto-Clear</span>
              <span className="setting-description">
                Sensitive passwords and CVVs copied to clipboard are automatically cleared after 30 seconds.
              </span>
            </div>
            <span className="badge-status-active">30s Active</span>
          </div>

          <div className="setting-item-row">
            <div className="setting-info">
              <span className="setting-title">Immediate Manual Lock</span>
              <span className="setting-description">
                Purges memory references instantly and returns to the master password lock screen.
              </span>
            </div>
            <Button variant="outline" size="sm" icon={<Lock size={14} />} onClick={handleLockNow}>
              Lock Vault Now
            </Button>
          </div>
        </div>

        {/* Account Session */}
        <div className="settings-card">
          <div className="card-title-row">
            <User size={18} className="card-icon" />
            <h2>Account Session</h2>
          </div>

          <div className="setting-item-row">
            <div className="setting-info">
              <span className="setting-title">Authenticated Email</span>
              <span className="setting-description">Your primary zero-knowledge account identifier.</span>
            </div>
            <span className="email-display-value">{user?.email}</span>
          </div>

          <div className="setting-item-row">
            <div className="setting-info">
              <span className="setting-title">Terminate Session</span>
              <span className="setting-description">
                Locks the vault and logs out your HTTP-Only session token on the backend server.
              </span>
            </div>
            <Button variant="danger" size="sm" icon={<LogOut size={14} />} onClick={handleLogout}>
              Log Out Account
            </Button>
          </div>
        </div>

        {/* Vault Data & Backups */}
        <div className="settings-card">
          <div className="card-title-row">
            <Database size={18} className="card-icon" />
            <h2>Vault Data & Encrypted Backups</h2>
          </div>

          <div className="setting-item-row">
            <div className="setting-info">
              <span className="setting-title">Encrypted Backup & Restore</span>
              <span className="setting-description">
                Export or import your vault items using standalone password-protected AES-256-GCM files.
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate('/app/backup')}>
              Manage Backups
            </Button>
          </div>
        </div>

        {/* Appearance & System */}
        <div className="settings-card">
          <div className="card-title-row">
            <Moon size={18} className="card-icon" />
            <h2>Appearance</h2>
          </div>

          <div className="setting-item-row">
            <div className="setting-info">
              <span className="setting-title">Color Theme</span>
              <span className="setting-description">Sleek, high-contrast dark theme optimized for clarity and reduced eye strain.</span>
            </div>
            <span className="badge-status-active">Dark Mode (Default)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
