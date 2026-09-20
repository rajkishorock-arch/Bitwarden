import React, { type InputHTMLAttributes, forwardRef } from 'react';
import './Input.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  id,
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`input-field-group ${error ? 'input-error' : ''} ${className}`}>
      {label && <label htmlFor={inputId} className="input-label">{label}</label>}
      <div className="input-wrapper">
        {leftIcon && <span className="input-icon left">{leftIcon}</span>}
        <input
          ref={ref}
          id={inputId}
          className={`input-control ${leftIcon ? 'has-left-icon' : ''} ${rightIcon ? 'has-right-icon' : ''}`}
          {...props}
        />
        {rightIcon && <span className="input-icon right">{rightIcon}</span>}
      </div>
      {error && <span className="input-message error">{error}</span>}
      {!error && helperText && <span className="input-message helper">{helperText}</span>}
    </div>
  );
});

Input.displayName = 'Input';
