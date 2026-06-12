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
      const normalized = online.map(normalizeCatalogProduct)
      // #region agent log
      fetch('http://127.0.0.1:7854/ingest/4daf1b18-d0c4-465c-b5a4-479f15c14527',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'16bc84'},body:JSON.stringify({sessionId:'16bc84',hypothesisId:'A-B',location:'usePosCatalog.ts:online',message:'catalog loaded online',data:{warehouseId,count:normalized.length,inStock:normalized.filter(p=>p.stock>0).length,sample:normalized.slice(0,3).map(p=>({id:p.id,name:p.name,stock:p.stock,variants:(p.variants??[]).length}))},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      setProducts(normalized)
    } else {
      const cached = await getCatalogProducts(warehouseId, categoryId)
      const filtered = search
        ? cached.filter(
            (p) =>
              p.name.toLowerCase().includes(search.toLowerCase()) ||
              p.sku?.toLowerCase().includes(search.toLowerCase()),
          )
        : cached
      const normalized = filtered.map(normalizeCatalogProduct)
      // #region agent log
      fetch('http://127.0.0.1:7854/ingest/4daf1b18-d0c4-465c-b5a4-479f15c14527',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'16bc84'},body:JSON.stringify({sessionId:'16bc84',hypothesisId:'A-B',location:'usePosCatalog.ts:offline',message:'catalog loaded offline cache',data:{warehouseId,count:normalized.length,inStock:normalized.filter(p=>p.stock>0).length,sample:normalized.slice(0,3).map(p=>({id:p.id,name:p.name,stock:p.stock,variants:(p.variants??[]).map(v=>({id:v.id,stock:v.stock}))}))},timestamp:Date.now()})}).catch(()=>{});
      // #endregion
      setProducts(normalized)
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
