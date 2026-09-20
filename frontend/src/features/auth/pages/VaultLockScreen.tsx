import React, { useState } from 'react';
import { ShieldAlert, Lock, LogOut } from 'lucide-react';
import { PasswordInput } from '../../../components/ui/PasswordInput';
import { Button } from '../../../components/ui/Button';
import { useAuthStore } from '../auth.store';
import { authService } from '../auth.service';
import './VaultLockScreen.css';

interface VaultLockScreenProps {
  onUnlockSuccess?: () => void;
}

export const VaultLockScreen: React.FC<VaultLockScreenProps> = ({ onUnlockSuccess }) => {
  const user = useAuthStore((state) => state.user);
  const [masterPassword, setMasterPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!masterPassword) {
      setError('Please enter your master password to unlock your vault.');
      return;
    }

    setIsLoading(true);

    try {
      await authService.unlockVault(masterPassword);
      if (onUnlockSuccess) onUnlockSuccess();
    } catch (err: any) {
      setError(err.message || 'Incorrect master password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="vault-lock-backdrop">
      <div className="vault-lock-modal">
        <div className="vault-lock-icon-container">
          <ShieldAlert size={32} className="vault-lock-icon" />
        </div>

        <h2 className="vault-lock-title">Vault Locked</h2>
        <p className="vault-lock-description">
          Your vault is protected for email <strong>{user?.email}</strong>. Enter your master password to decrypt your saved items.
        </p>

        {error && <div className="vault-lock-error-message">{error}</div>}

        <form onSubmit={handleUnlock} className="vault-lock-form">
          <PasswordInput
            label="Master Password"
            value={masterPassword}
            onChange={(e) => {
              setMasterPassword(e.target.value);
              if (error) setError('');
            }}
            placeholder="Enter master password"
            leftIcon={<Lock size={16} />}
            autoFocus
          />

          <Button type="submit" variant="primary" size="md" isLoading={isLoading} className="vault-lock-submit-btn">
            Unlock Vault
          </Button>
        </form>

        <div className="vault-lock-footer">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            icon={<LogOut size={14} />}
            onClick={() => authService.logout()}
          >
            Log Out Account
          </Button>

          <span className="vault-lock-disclaimer">
            Sensitive in-memory state is cleared on lock/logout on a best-effort basis.
          </span>
        </div>
      </div>
    </div>
  );
};
