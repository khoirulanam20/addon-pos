import { apiFetch } from './client'
import type { CartLineInput, CartPreviewData } from './types'

export async function previewCart(payload: {
  warehouse_id: number
  items: CartLineInput[]
  coupon_code?: string | null
  customer_id?: number | null
}) {
  const { data } = await apiFetch<CartPreviewData>('/cart/preview', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return data
}
