import React from 'react';
import { RegisterForm } from '../components/RegisterForm';

export const RegisterPage: React.FC = () => {
  return (
    <div style={{ padding: '60px 16px', display: 'flex', justifyContent: 'center' }}>
      <RegisterForm />
    </div>
  );
};
