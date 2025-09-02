import * as React from "react";
import { CssBaseline } from "@mui/material";
import type { PaletteMode } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { createAppTheme } from "./theme";
import { BrowserRouter } from "react-router-dom";
import { useAuth } from "./hooks/useAuth";
import AppRoutes from "./routes/AppRoutes";
import { SkeletonProductionEntry } from "./components/Skeleton";

export default function App() {
  const [mode, setMode] = React.useState<PaletteMode>("dark");
  const theme = React.useMemo(() => createAppTheme(mode), [mode]);
  const { isAuthenticated, user, isLoading, authError, login, clearError } = useAuth();

  if (isLoading) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <SkeletonProductionEntry />
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
