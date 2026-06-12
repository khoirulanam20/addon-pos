import { useCallback, useEffect, useMemo, useState } from 'react'
import { fetchProductBySku, searchProducts } from '@/api/products'
import type { CatalogProduct, CategoryNode } from '@/api/types'
import { useNetwork } from '@/app/providers/NetworkProvider'
import { sortCatalogProducts } from '@/lib/catalog-sort'
import { isOfflineMode } from '@/lib/offline-mode'
import { getCategories } from '@/db/bootstrap-repo'
import { findProductBySku, getCatalogProducts, mergeCatalogFromApi } from '@/db/catalog-repo'

function normalizeCatalogProduct(product: CatalogProduct): CatalogProduct {
  return { ...product, variants: product.variants ?? [] }
}

function filterCatalogProducts(
  products: CatalogProduct[],
  search: string,
  categoryId: number | null,
): CatalogProduct[] {
  let filtered = products
  if (categoryId) {
    filtered = filtered.filter((product) => product.categoryId === categoryId)
  }
  if (search.trim()) {
    const query = search.trim().toLowerCase()
    filtered = filtered.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.sku?.toLowerCase().includes(query) ||
        (product.variants ?? []).some(
          (variant) =>
            variant.sku?.toLowerCase().includes(query) ||
            variant.name?.toLowerCase().includes(query),
        ),
    )
  }
  return sortCatalogProducts(filtered)
}

export function usePosCatalog(warehouseId: number) {
  const { apiReachable, online } = useNetwork()
  const offlineMode = isOfflineMode(online, apiReachable)
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [categories, setCategories] = useState<CategoryNode[]>([])
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  const loadCatalog = useCallback(async () => {
    if (!warehouseId) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      if (!offlineMode) {
        const { products: onlineProducts } = await searchProducts({
          warehouse_id: warehouseId,
          q: search || undefined,
          category_id: categoryId ?? undefined,
        })
        const normalized = onlineProducts.map(normalizeCatalogProduct)
        await mergeCatalogFromApi(warehouseId, normalized)
        setProducts(sortCatalogProducts(normalized))
      } else {
        const cached = await getCatalogProducts(warehouseId)
        const filtered = filterCatalogProducts(cached.map(normalizeCatalogProduct), search, categoryId)
        setProducts(filtered)
      }
    } finally {
      setLoading(false)
    }
  }, [warehouseId, offlineMode, search, categoryId])

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
    if (!offlineMode) {
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
    loading,
    reload: loadCatalog,
    scanSku,
  }
}
