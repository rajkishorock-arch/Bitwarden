import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, Mail, AlertCircle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { Input } from '../../../components/ui/Input';
import { PasswordInput } from '../../../components/ui/PasswordInput';
import { Button } from '../../../components/ui/Button';
import { authService } from '../auth.service';
import { validateRegisterForm } from '../validation';
import './AuthForm.css';

export const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [masterPassword, setMasterPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ email?: string; masterPassword?: string; confirmPassword?: string }>({});
  const [serverError, setServerError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');

    const validation = validateRegisterForm(email, masterPassword, confirmPassword);
    setErrors(validation.errors);

    if (!validation.isValid) return;

    setIsLoading(true);

    try {
      await authService.register({ email, masterPasswordStr: masterPassword });
      navigate('/app/vault');
    } catch (err: any) {
      setServerError(err.message || 'Failed to create account. Please try again.');
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
        <h1 className="auth-title">Create Master Vault</h1>
        <p className="auth-subtitle">Set up your secure, zero-knowledge password vault</p>
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
            if (errors.email) setErrors((prev) => ({ ...prev, email: undefined }));
          }}
          placeholder="name@company.com"
          error={errors.email}
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
            if (errors.masterPassword) setErrors((prev) => ({ ...prev, masterPassword: undefined }));
          }}
          placeholder="At least 8 characters"
          error={errors.masterPassword}
          helperText="Make sure to remember your master password. It cannot be recovered."
          leftIcon={<Lock size={16} />}
          required
          autoComplete="new-password"
        />

        <PasswordInput
          label="Confirm Master Password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: undefined }));
          }}
          placeholder="Re-enter master password"
          error={errors.confirmPassword}
          leftIcon={<Lock size={16} />}
          required
          autoComplete="new-password"
        />

        <div className="auth-security-note">
          <CheckCircle2 size={16} className="auth-security-icon" />
          <span>Your master password is never stored or sent in plaintext to our servers.</span>
        </div>

        <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="auth-submit-btn">
          Create Account & Vault
        </Button>
      </form>

      <div className="auth-footer">
        <span>Already have an account?</span>{' '}
        <Link to="/login" className="auth-link">
          Log in
        </Link>
      </div>
    </div>
  );
};
