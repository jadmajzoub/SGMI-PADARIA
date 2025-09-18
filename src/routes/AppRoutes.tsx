import type { PaletteMode } from '@mui/material';
import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShell } from '../components/AppShell';
import { LoginPage } from '../containers/LoginPage';
import ProductionEntry from '../containers/ProductionEntry';
import ProductionSession from '../containers/ProductionSession';
import type { AuthError, AuthUser, LoginCredentials } from '../types/auth';

interface Props {
  isAuthenticated: boolean
  user: AuthUser | null
  authError: AuthError | null
  onLogin: (credentials: LoginCredentials) => Promise<void>
  onClearAuthError: () => void
  mode: PaletteMode
  onToggleMode: () => void
}

// Helper function to check if user has required role
const hasRole = (user: AuthUser | null, requiredRoles: string[]): boolean => {
  if (!user) return false;
  return requiredRoles.includes(user.role);
};

export default function AppRoutes({ 
  isAuthenticated, 
  user, 
  mode,
  onToggleMode 
}: Props) {

  return (
    <Routes>
      <Route 
        path="/" 
        element={
          isAuthenticated ? <Navigate to="/production-entry" replace /> : (
            <LoginPage />
          )
        } 
      />
      
      <Route
        path="/production-entry"
        element={
          isAuthenticated && hasRole(user, ['OPERATOR', 'MANAGER', 'DIRECTOR']) ? (
            <AppShell
              title="SGMI · Industrial Management"
              mode={mode}
              onToggleMode={onToggleMode}
            >
              <ProductionEntry />
            </AppShell>
          ) : (
            <Navigate to="/" replace />
          )
        }
      />
      
      <Route
        path="/production/session"
        element={
          isAuthenticated && hasRole(user, ['OPERATOR', 'MANAGER', 'DIRECTOR']) ? (
            <AppShell
              title="SGMI · Industrial Management"
              mode={mode}
              onToggleMode={onToggleMode}
            >
              <ProductionSession />
            </AppShell>
          ) : (
            <Navigate to="/" replace />
          )
        }
      />

      {/* Redirect unknown routes */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}