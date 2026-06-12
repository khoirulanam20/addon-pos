import type { CatalogProduct } from '@/api/types'

export function sortCatalogProducts(products: CatalogProduct[]): CatalogProduct[] {
  return [...products].sort((a, b) => a.name.localeCompare(b.name, 'id'))
}
