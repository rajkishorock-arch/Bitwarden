import React, { useEffect } from 'react';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { PublicLayout } from '../layouts/PublicLayout';
import { AppLayout } from '../layouts/AppLayout';
import { LandingPage } from '../pages/LandingPage';
import { FeaturesPage } from '../pages/FeaturesPage';
import { SecurityPage } from '../pages/SecurityPage';
import { LoginPage } from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';
import { VaultPage } from '../features/vault/pages/VaultPage';
import { NotFoundPage } from '../pages/NotFoundPage';
import { authService } from '../features/auth/auth.service';
import { useAuthStore } from '../features/auth/auth.store';

const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    errorElement: <NotFoundPage />,
    children: [
      { index: true, element: <LandingPage /> },
      { path: 'features', element: <FeaturesPage /> },
      { path: 'security', element: <SecurityPage /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
    ],
  },
  {
    path: '/app',
    element: <AppLayout />,
    errorElement: <NotFoundPage />,
    children: [
      { path: 'vault', element: <VaultPage /> },
      { path: 'favorites', element: <VaultPage /> },
      { path: 'logins', element: <VaultPage /> },
      { path: 'cards', element: <VaultPage /> },
      { path: 'notes', element: <VaultPage /> },
      { path: 'generator', element: <VaultPage /> },
      { path: 'health', element: <VaultPage /> },
      { path: 'settings', element: <VaultPage /> },
    ],
  },
  {
    path: '*',
    element: <NotFoundPage />,
  },
]);

export const AppRouter: React.FC = () => {
  const setInitialized = useAuthStore((state) => state.setInitialized);

  useEffect(() => {
    authService.restoreSession().finally(() => {
      setInitialized(true);
    });
  }, [setInitialized]);

  return <RouterProvider router={router} />;
};
