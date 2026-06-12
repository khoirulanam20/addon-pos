import { apiFetch } from './client'

export type CustomerResult = {
  id: number
  name: string
  phone: string | null
  email: string | null
  createdAt?: string | null
}

export type CustomerListMeta = {
  currentPage: number
  lastPage: number
  perPage: number
  total: number
}

export async function listCustomers(params: { q?: string; page?: number; per_page?: number } = {}) {
  const search = new URLSearchParams()
  if (params.q) search.set('q', params.q)
  if (params.page) search.set('page', String(params.page))
  if (params.per_page) search.set('per_page', String(params.per_page))

  const query = search.toString()
  const { data, meta } = await apiFetch<CustomerResult[]>(`/customers${query ? `?${query}` : ''}`)
  return { customers: data, meta: meta as CustomerListMeta | undefined }
}

export async function searchCustomers(q: string) {
  const { data } = await apiFetch<CustomerResult[]>(`/customers/search?q=${encodeURIComponent(q)}`)
  return data
}

export async function quickCreateCustomer(payload: { name: string; phone: string; email?: string }) {
  const { data } = await apiFetch<CustomerResult>('/customers/quick', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return data
}
