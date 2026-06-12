import { apiFetch } from './client'
import type { CatalogProduct } from './types'

export async function searchProducts(params: {
  q?: string
  sku?: string
  category_id?: number
  warehouse_id?: number
  page?: number
}) {
  const search = new URLSearchParams()
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== '') search.set(key, String(value))
  })
  const { data, meta } = await apiFetch<CatalogProduct[]>(`/products?${search}`)
  return { products: data, meta }
}

export async function fetchProductBySku(sku: string, warehouseId?: number) {
  const params = warehouseId ? `?warehouse_id=${warehouseId}` : ''
  const { data } = await apiFetch<{
    matchType: 'product' | 'variant'
    product: CatalogProduct | null
    variant: CatalogProduct['variants'][0] | null
  }>(`/products/by-sku/${encodeURIComponent(sku)}${params}`)
  return data
}
