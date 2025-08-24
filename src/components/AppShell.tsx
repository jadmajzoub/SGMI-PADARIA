import * as React from "react";
import { AppBar, Box, Container, IconButton, Toolbar, Typography } from "@mui/material";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";

type AppShellProps = {
  title: string;
  children: React.ReactNode;
  mode: "light" | "dark";
  onToggleMode: () => void;
};

export function AppShell({ title, children, mode, onToggleMode }: AppShellProps) {
  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="sticky" color="default" sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Toolbar sx={{ maxWidth: 1200, mx: "auto", width: "100%" }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {title}
          </Typography>
          <IconButton onClick={onToggleMode} size="small" aria-label="toggle theme">
            {mode === "dark" ? <LightModeIcon /> : <DarkModeIcon />}
          </IconButton>
        </Toolbar>
      </AppBar>

      <Container sx={{ py: { xs: 4, md: 6 } }}>{children}</Container>

      {/* subtle watermark corner (optional) */}
      <Box
        sx={{
          position: "fixed",
          right: 18,
          bottom: 14,
          opacity: 0.16,
          userSelect: "none",
          fontWeight: 700,
          letterSpacing: 0.4,
        }}
      >
        SGMI
      </Box>
    </Box>
  );
}
