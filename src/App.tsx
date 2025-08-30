import * as React from "react";
import { CssBaseline, Box, CircularProgress } from "@mui/material";
import type { PaletteMode } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { createAppTheme } from "./theme";
import { AppShell } from "./components/AppShell";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginPage } from "./containers/LoginPage";
import ProductionEntry from "./containers/ProductionEntry";
import ProductionSession from "./containers/ProductionSession";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";

const LoadingScreen = () => (
  <Box
    sx={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #0f172a 0%, #1f2937 100%)',
    }}
  >
    <CircularProgress size={50} />
  </Box>
);

export default function App() {
  const [mode, setMode] = React.useState<PaletteMode>("dark");
  const theme = React.useMemo(() => createAppTheme(mode), [mode]);
  const { isAuthenticated, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <LoadingScreen />
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          {/* Login route */}
          <Route 
            path="/login" 
            element={
              isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
            } 
          />
          
          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute 
                isAuthenticated={isAuthenticated} 
                user={user}
                requiredRoles={['OPERATOR', 'MANAGER', 'DIRECTOR']}
              >
                <AppShell
                  title="SGMI · Industrial Management"
                  mode={mode}
                  onToggleMode={() => setMode((m) => (m === "dark" ? "light" : "dark"))}
                >
                  <ProductionEntry />
                </AppShell>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/production/session"
            element={
              <ProtectedRoute 
                isAuthenticated={isAuthenticated} 
                user={user}
                requiredRoles={['OPERATOR', 'MANAGER', 'DIRECTOR']}
              >
                <AppShell
                  title="SGMI · Industrial Management"
                  mode={mode}
                  onToggleMode={() => setMode((m) => (m === "dark" ? "light" : "dark"))}
                >
                  <ProductionSession />
                </AppShell>
              </ProtectedRoute>
            }
          />

          {/* Redirect unknown routes */}
          <Route path="*" element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />} />
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}
