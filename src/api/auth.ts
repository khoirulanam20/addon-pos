import { apiFetch, clearToken, setToken } from './client'
import type { LoginData, MeData } from './types'

export async function login(email: string, password: string, deviceName = 'pos-terminal') {
  const { data } = await apiFetch<LoginData>(
    '/login',
    {
      method: 'POST',
      body: JSON.stringify({ email, password, device_name: deviceName }),
    },
    false,
  )
  setToken(data.token)
  return data
}

export async function logout() {
  try {
    await apiFetch<{ loggedOut: boolean }>('/logout', { method: 'POST' })
  } finally {
    clearToken()
  }
}

export async function fetchMe() {
  const { data } = await apiFetch<MeData>('/me')
  return data
}

export async function updateProfile(payload: {
  name?: string
  email?: string
  current_password?: string
  password?: string
  password_confirmation?: string
}) {
  const { data } = await apiFetch<MeData>('/me', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return data
}
