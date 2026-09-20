import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input } from './Input';

interface PasswordInputProps extends React.ComponentProps<typeof Input> {}

export const PasswordInput: React.FC<PasswordInputProps> = (props) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <Input
      {...props}
      type={showPassword ? 'text' : 'password'}
      rightIcon={
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setShowPassword((prev) => !prev)}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
          style={{ background: 'none', border: 'none', padding: 0, display: 'flex', cursor: 'pointer', color: 'inherit' }}
        >
          {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      }
    />
  );
};
