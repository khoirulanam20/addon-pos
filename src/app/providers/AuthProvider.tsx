import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import * as authApi from '@/api/auth'
import { clearToken, getToken } from '@/api/client'
import type { MeData, UserPayload } from '@/api/types'
import type { ShiftPayload } from '@/api/types'

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
  const [shift, setShift] = useState<ShiftPayload>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null)
      setShift(null)
      return
    }
    const data: MeData = await authApi.fetchMe()
    setUser(data.user)
    setShift(data.currentShift)
  }, [])

  useEffect(() => {
    refresh()
      .catch(() => {
        clearToken()
        setUser(null)
        setShift(null)
      })
      .finally(() => setLoading(false))
  }, [refresh])

  const login = async (email: string, password: string) => {
    const data = await authApi.login(email, password)
    setUser(data.user)
    setShift(data.currentShift)
  }

  const logout = async () => {
    await authApi.logout()
    setUser(null)
    setShift(null)
  }

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
