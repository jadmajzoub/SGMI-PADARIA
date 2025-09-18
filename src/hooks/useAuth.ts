import { useCallback, useMemo, useState, useEffect } from 'react'
import type { AuthState, LoginCredentials, AuthError } from '../types/auth'
import { 
  authStorage, 
  tokenStorage, 
  userStorage, 
  authenticateWithBackend, 
  refreshAccessToken,
  logoutFromBackend 
} from '../utils/auth'

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
    lastUpdate: Date.now()
  })
  const [authError, setAuthError] = useState<AuthError | null>(null)

  useEffect(() => {
    const initializeAuth = () => {
      try {
        const storedToken = tokenStorage.getToken()
        const storedUser = userStorage.getUser()
        
        if (storedToken && storedUser && tokenStorage.isTokenValid(storedToken)) {
          setAuthState({
            user: storedUser,
            token: storedToken,
            isAuthenticated: true,
            isLoading: false,
            lastUpdate: Date.now()
          })
        } else {
          authStorage.clear()
          setAuthState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
            lastUpdate: Date.now()
          })
        }
      } catch (error) {
        console.error('Erro ao inicializar autenticação:', error)
        authStorage.clear()
        setAuthState({
          user: null,
          token: null,
          isAuthenticated: false,
          isLoading: false,
          lastUpdate: Date.now()
        })
      }
    }

    initializeAuth()
  }, [])

  const login = useCallback(async (credentials?: LoginCredentials) => {
    try {
      setAuthState(prev => ({ ...prev, isLoading: true, lastUpdate: Date.now() }))
      setAuthError(null)
      
      if (!credentials?.username || !credentials?.password) {
        throw new Error('Credenciais inválidas')
      }
      
      const { user, token } = await authenticateWithBackend(credentials)
      
      tokenStorage.saveToken(token)
      userStorage.saveUser(user)
      
      const newState = {
        user,
        token,
        isAuthenticated: true,
        isLoading: false,
        lastUpdate: Date.now()
      }
      setAuthState(() => {
        return newState
      })
      
      // Backup redirect mechanism since React routing has re-render issues
      setTimeout(() => {
        if (window.location.pathname === '/') {
          window.location.href = '/production-entry'
        }
      }, 500)
    } catch (error) {
      const authError: AuthError = {
        message: error instanceof Error ? error.message : 'Falha na autenticação',
        code: 'AUTH_ERROR'
      }
      setAuthError(authError)
      setAuthState(prev => ({ ...prev, isLoading: false, lastUpdate: Date.now() }))
      console.error('Authentication error:', authError)
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      const currentToken = authState.token
      if (currentToken?.refreshToken) {
        await logoutFromBackend(currentToken.refreshToken)
      } else {
        authStorage.clear()
      }
      
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        lastUpdate: Date.now()
      })
      setAuthError(null)
    } catch (error) {
      console.error('Logout error:', error)
      authStorage.clear()
      setAuthState({
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        lastUpdate: Date.now()
      })
      setAuthError(null)
    }
  }, [authState.token])

  const clearError = useCallback(() => {
    setAuthError(null)
  }, [])

  const refreshToken = useCallback(async () => {
    try {
      const currentToken = authState.token
      const currentUser = authState.user
      
      if (!currentToken || !currentUser) {
        logout()
        return false
      }
      
      if (tokenStorage.isTokenValid(currentToken)) {
        return true
      }
      
      const newAccessToken = await refreshAccessToken(currentToken.refreshToken)
      const updatedToken = {
        ...currentToken,
        accessToken: newAccessToken,
        expiresAt: Date.now() + (15 * 60 * 1000) // 15 minutes
      }
      
      tokenStorage.saveToken(updatedToken)
      
      setAuthState(prev => ({
        ...prev,
        token: updatedToken,
        lastUpdate: Date.now()
      }))
      
      return true
    } catch (error) {
      console.error('Erro ao renovar token:', error)
      logout()
      return false
    }
  }, [authState.token, authState.user, logout])

  return useMemo(() => ({ 
    isAuthenticated: authState.isAuthenticated,
    user: authState.user,
    token: authState.token,
    authError, 
    isLoading: authState.isLoading, 
    login, 
    logout, 
    clearError,
    refreshToken
  }), [authState, authError, login, logout, clearError, refreshToken])
}