import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchProductBySku, searchProducts } from '@/api/products'
import type { CatalogProduct, CategoryNode } from '@/api/types'
import { getCategories } from '@/db/bootstrap-repo'
import { findProductBySku, getCatalogProducts } from '@/db/catalog-repo'
import { useNetwork } from '@/app/providers/NetworkProvider'

function normalizeCatalogProduct(product: CatalogProduct): CatalogProduct {
  return { ...product, variants: product.variants ?? [] }
}

export function usePosCatalog(warehouseId: number) {
  const { apiReachable } = useNetwork()
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [categories, setCategories] = useState<CategoryNode[]>([])
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [search, setSearch] = useState('')

  const loadCatalog = useCallback(async () => {
    if (!warehouseId) return
    if (apiReachable) {
      const { products: online } = await searchProducts({
        warehouse_id: warehouseId,
        q: search || undefined,
        category_id: categoryId ?? undefined,
      })
      setProducts(online.map(normalizeCatalogProduct))
    } else {
      const cached = await getCatalogProducts(warehouseId, categoryId)
      const filtered = search
        ? cached.filter(
            (p) =>
              p.name.toLowerCase().includes(search.toLowerCase()) ||
              p.sku?.toLowerCase().includes(search.toLowerCase()),
          )
        : cached
      setProducts(filtered.map(normalizeCatalogProduct))
    }
  }, [warehouseId, apiReachable, search, categoryId])

  useEffect(() => {
    void loadCatalog()
  }, [loadCatalog])

  useEffect(() => {
    void getCategories().then(setCategories)
  }, [])

  const flatCategories = useMemo(() => {
    const flat: CategoryNode[] = []
    const walk = (nodes: CategoryNode[]) => {
      nodes.forEach((n) => {
        flat.push(n)
        walk(n.children)
      })
    }
    walk(categories)
    return flat
  }, [categories])

  const scanSku = async (code: string) => {
    if (!warehouseId) return null
    if (apiReachable) {
      return fetchProductBySku(code, warehouseId)
    }
    const match = await findProductBySku(warehouseId, code)
    if (!match) return null
    return { product: match.product, variant: match.variant ?? null }
  }

  return {
    products,
    categories: flatCategories,
    categoryId,
    setCategoryId,
    search,
    setSearch,
    reload: loadCatalog,
    scanSku,
  }
}
