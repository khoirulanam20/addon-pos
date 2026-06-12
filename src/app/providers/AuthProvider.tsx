import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import * as authApi from '@/api/auth'
import { ApiError, clearToken, getToken } from '@/api/client'
import type { MeData, UserPayload } from '@/api/types'
import type { ShiftPayload } from '@/api/types'
import { clearAuthSession, loadAuthSession, saveAuthSession } from '@/lib/auth-session'

type AuthContextValue = {
  user: UserPayload | null
  shift: ShiftPayload
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  refresh: () => Promise<void>
  setShift: (shift: ShiftPayload) => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserPayload | null>(null)
  const [shift, setShiftState] = useState<ShiftPayload>(null)
  const [loading, setLoading] = useState(true)

  const applySession = useCallback((data: Pick<MeData, 'user' | 'currentShift'>) => {
    setUser(data.user)
    setShiftState(data.currentShift)
    saveAuthSession(data)
  }, [])

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null)
      setShiftState(null)
      return
    }
    try {
      const data = await authApi.fetchMe()
      applySession(data)
    } catch (err) {
      const isUnauthorized = err instanceof ApiError && err.status === 401
      const cached = loadAuthSession()
      if (isUnauthorized) {
        clearToken()
        clearAuthSession()
        setUser(null)
        setShiftState(null)
        return
      }
      if (cached) {
        setUser(cached.user)
        setShiftState(cached.currentShift)
        return
      }
      clearToken()
      clearAuthSession()
      setUser(null)
      setShiftState(null)
    }
  }, [applySession])

  useEffect(() => {
    void refresh().finally(() => setLoading(false))
  }, [refresh])

  const login = async (email: string, password: string) => {
    const data = await authApi.login(email, password)
    applySession({ user: data.user, currentShift: data.currentShift })
  }

  const logout = async () => {
    await authApi.logout()
    clearAuthSession()
    setUser(null)
    setShiftState(null)
  }

  const setShift = useCallback(
    (next: ShiftPayload) => {
      setShiftState(next)
      setUser((current) => {
        if (current) saveAuthSession({ user: current, currentShift: next })
        return current
      })
    },
    [],
  )

  return (
    <AuthContext.Provider value={{ user, shift, loading, login, logout, refresh, setShift }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
