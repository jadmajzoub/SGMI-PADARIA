import * as React from "react";
import { 
  AppBar, 
  Box, 
  Container, 
  IconButton, 
  Toolbar, 
  Typography, 
  Menu, 
  MenuItem,
  Avatar,
  Chip 
} from "@mui/material";
import LightModeIcon from "@mui/icons-material/LightMode";
import DarkModeIcon from "@mui/icons-material/DarkMode";
import LogoutIcon from "@mui/icons-material/Logout";
import { useAuth } from "../hooks/useAuth";

type AppShellProps = {
  title: string;
  children: React.ReactNode;
  mode: "light" | "dark";
  onToggleMode: () => void;
};

export function AppShell({ title, children, mode, onToggleMode }: AppShellProps) {
  const { user, logout } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    handleClose();
  };

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map((part) => part[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'DIRECTOR':
        return 'error';
      case 'MANAGER':
        return 'warning';
      case 'OPERATOR':
        return 'success';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ minHeight: "100vh", bgcolor: "background.default" }}>
      <AppBar position="sticky" color="default" sx={{ borderBottom: 1, borderColor: "divider" }}>
        <Toolbar sx={{ maxWidth: 1200, mx: "auto", width: "100%" }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {title}
          </Typography>
          
          {user && (
            <>
              <Chip
                label={user.role}
                color={getRoleColor(user.role)}
                size="small"
                sx={{ mr: 2, fontWeight: 'bold' }}
              />
              
              <IconButton onClick={handleClick} size="small">
                <Avatar sx={{ width: 32, height: 32, fontSize: '0.9rem' }}>
                  {getUserInitials(user.name)}
                </Avatar>
              </IconButton>
              
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                onClick={handleClose}
                transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
              >
                <MenuItem onClick={handleLogout}>
                  <LogoutIcon sx={{ mr: 1 }} />
                  Sair
                </MenuItem>
              </Menu>
            </>
          )}
          
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
