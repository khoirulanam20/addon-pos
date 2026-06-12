import { apiFetch } from './client'
import type { CartLineInput, OrderDetail, OrderSummary, PaymentInput } from './types'

export async function createOrder(payload: {
  warehouse_id: number
  customer_name?: string
  customer_phone?: string
  customer_id?: number | null
  items: CartLineInput[]
  coupon_code?: string | null
  notes?: string
  payments: PaymentInput[]
}) {
  const { data } = await apiFetch<OrderDetail>('/orders', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return data
}

export async function fetchOrders(params?: Record<string, string | number>) {
  const search = new URLSearchParams()
  if (params) {
    Object.entries(params).forEach(([k, v]) => search.set(k, String(v)))
  }
  const { data, meta } = await apiFetch<OrderSummary[]>(`/orders?${search}`)
  return { orders: data, meta }
}

export async function fetchOrder(id: number) {
  const { data } = await apiFetch<OrderDetail>(`/orders/${id}`)
  return data
}

export async function fetchReceipt(id: number) {
  const { data } = await apiFetch<Record<string, unknown>>(`/orders/${id}/receipt`)
  return data
}

export async function voidOrder(id: number, note?: string) {
  const { data } = await apiFetch<OrderDetail>(`/orders/${id}/void`, {
    method: 'POST',
    body: JSON.stringify({ note }),
  })
  return data
}
