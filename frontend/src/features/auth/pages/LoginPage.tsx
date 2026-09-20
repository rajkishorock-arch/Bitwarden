import React from 'react';
import { LoginForm } from '../components/LoginForm';

export const LoginPage: React.FC = () => {
  return (
    <div style={{ padding: '60px 16px', display: 'flex', justifyContent: 'center' }}>
      <LoginForm />
    </div>
  );
};
