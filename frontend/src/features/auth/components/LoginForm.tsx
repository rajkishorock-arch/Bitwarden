import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, AlertCircle, ShieldCheck } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { PasswordInput } from '../../../components/ui/PasswordInput';
import { Button } from '../../../components/ui/Button';
import { authService } from '../auth.service';
import { validateEmail, validateMasterPassword } from '../validation';
import './AuthForm.css';

export const LoginForm: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');

    const eErr = validateEmail(email);
    const pErr = validateMasterPassword(masterPassword);

    setEmailError(eErr || '');
    setPasswordError(pErr || '');

    if (eErr || pErr) return;

    setIsLoading(true);

    try {
      await authService.login({ email, masterPasswordStr: masterPassword });
      navigate('/app/vault');
    } catch (err: any) {
      setServerError(err.message || 'Invalid email address or master password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-card-container">
      <div className="auth-header">
        <div className="auth-brand-badge">
          <ShieldCheck size={24} className="auth-brand-icon" />
        </div>
        <h1 className="auth-title">Log in to VaultGuard</h1>
        <p className="auth-subtitle">Access your zero-knowledge encrypted password vault</p>
      </div>

      {serverError && (
        <div className="auth-error-banner" role="alert">
          <AlertCircle size={18} />
          <span>{serverError}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="auth-form" noValidate>
        <Input
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (emailError) setEmailError('');
          }}
          placeholder="name@company.com"
          error={emailError}
          leftIcon={<Mail size={16} />}
          required
          autoComplete="email"
          autoFocus
        />

        <PasswordInput
          label="Master Password"
          value={masterPassword}
          onChange={(e) => {
            setMasterPassword(e.target.value);
            if (passwordError) setPasswordError('');
          }}
          placeholder="••••••••••••"
          error={passwordError}
          leftIcon={<Lock size={16} />}
          required
          autoComplete="current-password"
        />

        <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="auth-submit-btn">
          Sign In
        </Button>
      </form>

      <div className="auth-footer">
        <span>Don't have an account?</span>{' '}
        <Link to="/register" className="auth-link">
          Create master vault
        </Link>
      </div>
    </div>
  );
};
