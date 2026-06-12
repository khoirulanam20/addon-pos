import { API_BASE, getToken } from '@/api/client'

export function isBrowserOnline() {
  return navigator.onLine
}

export async function pingApi(): Promise<boolean> {
  if (!navigator.onLine || !getToken()) return false
  try {
    const res = await fetch(`${API_BASE}/me`, {
      headers: { Accept: 'application/json', Authorization: `Bearer ${getToken()}` },
    })
    return res.ok
  } catch {
    return false
  }
}
