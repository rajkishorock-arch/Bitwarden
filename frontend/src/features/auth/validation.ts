export interface ValidationError {
  email?: string;
  masterPassword?: string;
  confirmPassword?: string;
}

export function validateEmail(email: string): string | undefined {
  if (!email.trim()) {
    return 'Email is required.';
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email.trim())) {
    return 'Please enter a valid email address.';
  }
  return undefined;
}

export function validateMasterPassword(password: string): string | undefined {
  if (!password) {
    return 'Master password is required.';
  }
  if (password.length < 8) {
    return 'Master password must be at least 8 characters long.';
  }
  return undefined;
}

export function validateRegisterForm(
  email: string,
  password: string,
  confirmPassword: string
): { isValid: boolean; errors: ValidationError } {
  const errors: ValidationError = {};

  const emailErr = validateEmail(email);
  if (emailErr) errors.email = emailErr;

  const pwdErr = validateMasterPassword(password);
  if (pwdErr) errors.masterPassword = pwdErr;

  if (password !== confirmPassword) {
    errors.confirmPassword = 'Master passwords do not match.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}
