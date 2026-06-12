import { apiFetch } from './client'
import type { CatalogProduct } from './types'

export async function fetchCatalogPage(
  warehouseId: number,
  page = 1,
  updatedSince?: string,
) {
  const params = new URLSearchParams({
    warehouse_id: String(warehouseId),
    page: String(page),
    per_page: '100',
  })
  if (updatedSince) params.set('updated_since', updatedSince)

  const { data, meta } = await apiFetch<{ products: CatalogProduct[] }>(
    `/catalog/sync?${params}`,
  )

  return {
    products: data.products,
    meta: meta as {
      currentPage: number
      lastPage: number
      syncedAt?: string
    },
  }
}
