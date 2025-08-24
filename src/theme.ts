import { createTheme, type ThemeOptions } from "@mui/material/styles";
import type { PaletteMode } from "@mui/material";

export const getDesignTokens = (mode: PaletteMode): ThemeOptions => ({
  palette: {
    mode,
    ...(mode === "dark"
      ? {
          background: { default: "#0b0d10", paper: "#111418" },
          primary: { main: "#2ea06f" }, // subtle green for action
          text: { primary: "#e7eaf0", secondary: "#9aa3b2" },
          divider: "#1b212a",
        }
      : {
          background: { default: "#f7f9fc", paper: "#ffffff" },
          primary: { main: "#2ea06f" },
          text: { primary: "#0b1220", secondary: "#64748b" },
          divider: "#e2e8f0",
        }),
  },
  shape: { borderRadius: 18 },
  typography: {
    fontFamily:
      'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, Helvetica, Arial',
    h3: { fontSize: "1.6rem", fontWeight: 700, letterSpacing: 0.2 },
    body2: { letterSpacing: 0.2 },
    button: { textTransform: "none", fontWeight: 600, letterSpacing: 0.3 },
  },
  components: {
    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: ({ theme }) => ({
          border: "1px solid",
          borderColor: theme.palette.divider,
        }),
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: { backgroundImage: "none", backdropFilter: "saturate(130%) blur(8px)" },
      },
    },
    MuiTextField: {
      defaultProps: { size: "medium" },
    },
  },
});

export const createAppTheme = (mode: PaletteMode) => createTheme(getDesignTokens(mode));
