import type { ApiResponse } from './types'

const API_BASE = import.meta.env.VITE_API_BASE_URL as string
const TOKEN_KEY = 'pos_token'

export class ApiError extends Error {
  status: number
  errors?: Record<string, string[]>

  constructor(message: string, status: number, errors?: Record<string, string[]>) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors
  }
}

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token)
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY)
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
  auth = true,
): Promise<ApiResponse<T>> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers as Record<string, string>),
  }

  if (auth) {
    const token = getToken()
    if (token) headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (response.status === 204) {
    return { data: undefined as T }
  }

  const json = await response.json().catch(() => ({}))

  if (!response.ok) {
    const message =
      json?.message && typeof json.message === 'string'
        ? json.message
        : 'Permintaan gagal'
    throw new ApiError(message, response.status, json?.errors)
  }

  return json as ApiResponse<T>
}

export { API_BASE }
