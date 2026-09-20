import React from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import { Button } from '../components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div style={{ textAlign: 'center', padding: '100px 16px' }}>
      <AlertTriangle size={48} style={{ color: 'var(--color-warning)', marginBottom: 16 }} />
      <h1 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>404 - Page Not Found</h1>
      <p style={{ color: 'var(--text-secondary)', marginBottom: 24 }}>
        The page you are looking for does not exist or has been moved.
      </p>
      <Link to="/">
        <Button variant="primary">Return to Homepage</Button>
      </Link>
    </div>
  );
};
