import { apiFetch } from './client'
import type { CartLineInput, PaymentInput, SyncResult } from './types'

export type OfflineOrderPayload = {
  client_reference: string
  warehouse_id: number
  created_at?: string
  customer_name?: string
  customer_phone?: string
  customer_id?: number | null
  items: CartLineInput[]
  payments: PaymentInput[]
  notes?: string
}

export async function syncOfflineOrders(orders: OfflineOrderPayload[]) {
  const { data } = await apiFetch<{ results: SyncResult[] }>('/orders/sync', {
    method: 'POST',
    body: JSON.stringify({ orders }),
  })
  return data.results
}
