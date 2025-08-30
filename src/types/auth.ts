export interface AuthToken {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

export interface AuthUser {
  id: string
  name: string
  email: string
  role: 'OPERATOR' | 'MANAGER' | 'DIRECTOR'
}

export interface AuthState {
  user: AuthUser | null
  token: AuthToken | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface LoginCredentials {
  username: string
  password: string
}

export interface LoginResponse {
  user: AuthUser
  token: AuthToken
}

export interface AuthError {
  message: string
  code?: string
}