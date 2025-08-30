import React from 'react';
import { LoginForm } from '../components/LoginForm';
import { useAuth } from '../hooks/useAuth';

export const LoginPage: React.FC = () => {
  const { login, authError, isLoading, clearError } = useAuth();

  return (
    <LoginForm
      onLogin={login}
      authError={authError}
      isLoading={isLoading}
      onClearError={clearError}
    />
  );
};