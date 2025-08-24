import * as React from "react";
import { CssBaseline } from "@mui/material";
import type { PaletteMode } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { createAppTheme } from "./theme";
import { AppShell } from "./components/AppShell";
import ProductionEntry from "./containers/ProductionEntry";
import ProductionSession from "./containers/ProductionSession";
import { BrowserRouter, Routes, Route } from "react-router-dom";

export default function App() {
  const [mode, setMode] = React.useState<PaletteMode>("dark");
  const theme = React.useMemo(() => createAppTheme(mode), [mode]);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <BrowserRouter>
        <AppShell
          title="SGMI · Industrial Management"
          mode={mode}
          onToggleMode={() => setMode((m) => (m === "dark" ? "light" : "dark"))}
        >
          <Routes>
            <Route path="/" element={<ProductionEntry />} />
            <Route path="/production/session" element={<ProductionSession />} />
          </Routes>
        </AppShell>
      </BrowserRouter>
    </ThemeProvider>
  );
}
