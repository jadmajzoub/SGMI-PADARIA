import React, { useState } from 'react';
import {
  Box,
  Paper,
  TextField,
  Button,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { LoginCredentials, AuthError } from '../types/auth';

interface LoginFormProps {
  onLogin: (credentials: LoginCredentials) => Promise<void>;
  authError: AuthError | null;
  isLoading: boolean;
  onClearError: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onLogin,
  authError,
  isLoading,
  onClearError,
}) => {
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });

  const [errors, setErrors] = useState({
    username: '',
    password: '',
  });

  const validateForm = () => {
    const newErrors = {
      username: '',
      password: '',
    };

    if (!formData.username.trim()) {
      newErrors.username = 'Email é obrigatório';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 4) {
      newErrors.password = 'Senha deve ter pelo menos 4 caracteres';
    }

    setErrors(newErrors);
    return !newErrors.username && !newErrors.password;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    await onLogin(formData);
  };

  const handleInputChange = (field: 'username' | 'password') => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setFormData({
      ...formData,
      [field]: e.target.value,
    });

    // Clear errors when user starts typing
    if (errors[field]) {
      setErrors({
        ...errors,
        [field]: '',
      });
    }

    // Clear auth error when user starts typing
    if (authError) {
      onClearError();
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0f172a 0%, #1f2937 100%)',
        p: 2,
      }}
    >
      <Paper
        elevation={8}
        sx={{
          p: 4,
          maxWidth: 400,
          width: '100%',
          backgroundColor: 'background.paper',
        }}
      >
        <Box sx={{ textAlign: 'center', mb: 3 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            SGMI Padaria
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Faça login para continuar
          </Typography>
        </Box>

        {authError && (
          <Alert 
            severity="error" 
            sx={{ mb: 2 }}
            onClose={onClearError}
          >
            {authError.message}
          </Alert>
        )}

        <Box component="form" onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            variant="outlined"
            value={formData.username}
            onChange={handleInputChange('username')}
            error={!!errors.username}
            helperText={errors.username}
            disabled={isLoading}
            sx={{ mb: 2 }}
          />

          <TextField
            fullWidth
            label="Senha"
            type="password"
            variant="outlined"
            value={formData.password}
            onChange={handleInputChange('password')}
            error={!!errors.password}
            helperText={errors.password}
            disabled={isLoading}
            sx={{ mb: 3 }}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={isLoading}
            sx={{ py: 1.5 }}
          >
            {isLoading ? (
              <>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                Entrando...
              </>
            ) : (
              'Entrar'
            )}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};