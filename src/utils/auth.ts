import { AuthToken, AuthUser, LoginCredentials } from '../types/auth'
import { authService, BackendUser } from '../services/auth'

const AUTH_TOKEN_KEY = 'sgmi_padaria_auth_token'
const AUTH_USER_KEY = 'sgmi_padaria_auth_user'

export const tokenStorage = {
  saveToken: (token: AuthToken): void => {
    try {
      localStorage.setItem(AUTH_TOKEN_KEY, JSON.stringify(token))
    } catch (error) {
      console.error('Erro ao salvar token:', error)
    }
  },

  getToken: (): AuthToken | null => {
    try {
      const tokenString = localStorage.getItem(AUTH_TOKEN_KEY)
      if (!tokenString) return null
      
      const token: AuthToken = JSON.parse(tokenString)
      
      if (token.expiresAt < Date.now()) {
        tokenStorage.removeToken()
        return null
      }
      
      return token
    } catch (error) {
      console.error('Erro ao recuperar token:', error)
      tokenStorage.removeToken()
      return null
    }
  },

  removeToken: (): void => {
    try {
      localStorage.removeItem(AUTH_TOKEN_KEY)
    } catch (error) {
      console.error('Erro ao remover token:', error)
    }
  },

  isTokenValid: (token: AuthToken | null): boolean => {
    if (!token) return false
    return token.expiresAt > Date.now()
  }
}

export const userStorage = {
  saveUser: (user: AuthUser): void => {
    try {
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user))
    } catch (error) {
      console.error('Erro ao salvar usuário:', error)
    }
  },

  getUser: (): AuthUser | null => {
    try {
      const userString = localStorage.getItem(AUTH_USER_KEY)
      if (!userString) return null
      
      return JSON.parse(userString)
    } catch (error) {
      console.error('Erro ao recuperar usuário:', error)
      userStorage.removeUser()
      return null
    }
  },

  removeUser: (): void => {
    try {
      localStorage.removeItem(AUTH_USER_KEY)
    } catch (error) {
      console.error('Erro ao remover usuário:', error)
    }
  }
}

export const authStorage = {
  clear: (): void => {
    tokenStorage.removeToken()
    userStorage.removeUser()
  },

  isAuthenticated: (): boolean => {
    const token = tokenStorage.getToken()
    const user = userStorage.getUser()
    return !!token && !!user && tokenStorage.isTokenValid(token)
  }
}

// Token expiration time (15 minutes by default as per backend)
const FIFTEEN_MINUTES_MS = 15 * 60 * 1000

// Convert backend user to frontend user format
const convertBackendUser = (backendUser: BackendUser): AuthUser => ({
  id: backendUser.id,
  name: backendUser.name,
  email: backendUser.email,
  role: backendUser.role,
})

// Real authentication with backend
export const authenticateWithBackend = async (credentials: LoginCredentials): Promise<{ user: AuthUser; token: AuthToken }> => {
  try {
    const response = await authService.login(credentials)
    
    const user = convertBackendUser(response.data.user)
    const currentTime = Date.now()
    
    const token: AuthToken = {
      accessToken: response.data.tokens.accessToken,
      refreshToken: response.data.tokens.refreshToken,
      expiresAt: currentTime + FIFTEEN_MINUTES_MS,
    }

    return { user, token }
  } catch (error: any) {
    if (error.response?.data?.message) {
      throw new Error(error.response.data.message)
    } else if (error.response?.status === 401) {
      throw new Error('Credenciais inválidas')
    } else if (error.code === 'ECONNREFUSED') {
      throw new Error('Não foi possível conectar com o servidor')
    } else {
      throw new Error('Erro na autenticação')
    }
  }
}

// Refresh access token using refresh token
export const refreshAccessToken = async (refreshToken: string): Promise<string> => {
  try {
    const response = await authService.refreshToken(refreshToken)
    return response.data.accessToken
  } catch (error: any) {
    if (error.response?.status === 401) {
      throw new Error('Token de refresh inválido')
    }
    throw error
  }
}

// Logout and clear tokens
export const logoutFromBackend = async (refreshToken: string): Promise<void> => {
  try {
    await authService.logout(refreshToken)
  } catch (error) {
    console.error('Erro durante logout:', error)
  } finally {
    authStorage.clear()
  }
}