import { api } from './api';
import { LoginCredentials } from '../types/auth';

export interface BackendUser {
  id: string;
  name: string;
  email: string;
  role: 'OPERATOR' | 'MANAGER' | 'DIRECTOR';
  passwordHash: string;
  createdAt: string;
}

export interface BackendAuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface BackendLoginResponse {
  success: boolean;
  data: {
    user: BackendUser;
    tokens: BackendAuthTokens;
  };
  message: string;
}

export interface BackendRegisterResponse {
  success: boolean;
  data: {
    id: string;
  };
  message: string;
}

export interface BackendRefreshResponse {
  success: boolean;
  data: {
    accessToken: string;
  };
  message: string;
}

export const authService = {
  async login(credentials: LoginCredentials): Promise<BackendLoginResponse> {
    const response = await api.post<BackendLoginResponse>('/auth/login', {
      email: credentials.username,
      password: credentials.password,
    });
    return response.data;
  },

  async register(userData: {
    name: string;
    email: string;
    password: string;
    role: 'OPERATOR' | 'MANAGER' | 'DIRECTOR';
  }): Promise<BackendRegisterResponse> {
    const response = await api.post<BackendRegisterResponse>('/auth/register', userData);
    return response.data;
  },

  async refreshToken(refreshToken: string): Promise<BackendRefreshResponse> {
    const response = await api.post<BackendRefreshResponse>('/auth/refresh', {
      refreshToken,
    });
    return response.data;
  },

  async logout(refreshToken: string): Promise<void> {
    await api.post('/auth/logout', {
      refreshToken,
    });
  },

  async getProfile(): Promise<{ success: boolean; data: BackendUser }> {
    const response = await api.get<{ success: boolean; data: BackendUser }>('/auth/profile');
    return response.data;
  },
};