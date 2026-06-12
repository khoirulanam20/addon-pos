import { apiFetch } from './client'
import type { CartLineInput, HeldCart } from './types'

export async function fetchHeldCarts(warehouseId?: number) {
  const params = warehouseId ? `?warehouse_id=${warehouseId}` : ''
  const { data } = await apiFetch<HeldCart[]>(`/held-carts${params}`)
  return data
}

export async function createHeldCart(payload: {
  warehouse_id: number
  label?: string
  customer_name?: string
  customer_phone?: string
  customer_id?: number | null
  items: CartLineInput[]
  coupon_code?: string | null
  notes?: string
}) {
  const { data } = await apiFetch<HeldCart>('/held-carts', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return data
}

export async function resumeHeldCart(id: number) {
  const { data } = await apiFetch<HeldCart>(`/held-carts/${id}/resume`, { method: 'POST' })
  return data
}

export async function deleteHeldCart(id: number) {
  await apiFetch(`/held-carts/${id}`, { method: 'DELETE' })
}
