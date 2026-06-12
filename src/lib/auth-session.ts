import type { MeData } from '@/api/types'

const SESSION_KEY = 'pos_session_cache'

export function saveAuthSession(data: Pick<MeData, 'user' | 'currentShift'>) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(data))
}

export function loadAuthSession(): Pick<MeData, 'user' | 'currentShift'> | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Pick<MeData, 'currentShift' | 'user'>
  } catch {
    return null
  }
}

export function clearAuthSession() {
  localStorage.removeItem(SESSION_KEY)
}
