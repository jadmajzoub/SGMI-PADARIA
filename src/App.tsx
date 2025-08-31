import * as React from "react";
import { CssBaseline, Box, CircularProgress } from "@mui/material";
import type { PaletteMode } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { createAppTheme } from "./theme";
import { BrowserRouter } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import AppRoutes from "./routes/AppRoutes";

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
  const { isAuthenticated, user, isLoading, authError, login, clearError } = useAuth();

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
        <AppRoutes 
          isAuthenticated={isAuthenticated}
          user={user}
          authError={authError}
          onLogin={login}
          onClearAuthError={clearError}
          mode={mode}
          onToggleMode={() => setMode((m) => (m === "dark" ? "light" : "dark"))}
        />
      </BrowserRouter>
    </ThemeProvider>
  );
}
