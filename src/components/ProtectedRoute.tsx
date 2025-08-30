import React from 'react';
import { Navigate } from 'react-router-dom';
import { AuthUser } from '../types/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
  user: AuthUser | null;
  requiredRoles?: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  isAuthenticated,
  user,
  requiredRoles = [],
}) => {
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  if (requiredRoles.length > 0 && !requiredRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};