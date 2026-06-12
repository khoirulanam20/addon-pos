import type { CatalogProduct } from '@/api/types'
import { listOfflineOrders } from '@/db/offline-orders-repo'
import { db, type CatalogProductRecord } from './dexie'

function stockKey(productId: number, variantId?: number | null) {
  return `${productId}:${variantId ?? 0}`
}

function productHasPendingDeductions(deductions: Map<string, number>, productId: number) {
  for (const key of deductions.keys()) {
    if (key.startsWith(`${productId}:`)) return true
  }
  return false
}

async function pendingStockDeductions(warehouseId: number) {
  const pending = await listOfflineOrders('pending')
  const map = new Map<string, number>()

  for (const order of pending) {
    if (order.warehouseId !== warehouseId) continue
    for (const item of order.items) {
      const key = stockKey(item.product_id, item.variant_id)
      map.set(key, (map.get(key) ?? 0) + item.qty)
    }
  }

  return map
}

function deductVariantStock(
  variants: CatalogProduct['variants'],
  qty: number,
): CatalogProduct['variants'] {
  let remaining = qty
  return (variants ?? []).map((variant) => {
    if (remaining <= 0) return variant
    const take = Math.min(variant.stock, remaining)
    remaining -= take
    return { ...variant, stock: Math.max(0, variant.stock - take) }
  })
}

function minStockRecord(
  incoming: CatalogProductRecord,
  existing: CatalogProductRecord,
): CatalogProductRecord {
  const variants = (incoming.variants ?? []).map((variant) => {
    const previous = (existing.variants ?? []).find((v) => v.id === variant.id)
    if (!previous) return variant
    return { ...variant, stock: Math.min(variant.stock, previous.stock) }
  })

  return {
    ...incoming,
    stock: Math.min(incoming.stock, existing.stock),
    variants,
  }
}

function applyPendingDeductions(
  product: CatalogProductRecord,
  deductions: Map<string, number>,
): CatalogProductRecord {
  const variants = product.variants ?? []
  const parentDeduction = deductions.get(stockKey(product.id, null))

  if (parentDeduction) {
    if (variants.length > 0) {
      product.variants = deductVariantStock(variants, parentDeduction)
    } else {
      product.stock = Math.max(0, product.stock - parentDeduction)
    }
  }

  if (variants.length > 0) {
    product.variants = (product.variants ?? variants).map((variant) => {
      const deduction = deductions.get(stockKey(product.id, variant.id))
      if (!deduction) return variant
      return { ...variant, stock: Math.max(0, variant.stock - deduction) }
    })
  }

  return product
}

function mergeProductFields(
  incoming: CatalogProduct,
  existing: CatalogProductRecord | undefined,
  warehouseId: number,
): CatalogProductRecord {
  if (!existing || existing.warehouseId !== warehouseId) {
    return {
      ...incoming,
      warehouseId,
      variants: incoming.variants ?? [],
      trackStock: incoming.trackStock ?? true,
    }
  }

  return {
    ...existing,
    id: incoming.id,
    name: incoming.name,
    sku: incoming.sku ?? existing.sku,
    type: incoming.type ?? existing.type,
    price: incoming.price,
    salePrice: incoming.salePrice,
    finalPrice: incoming.finalPrice,
    imageUrl: incoming.imageUrl ?? existing.imageUrl,
    stock: incoming.stock ?? existing.stock,
    trackStock: incoming.trackStock ?? existing.trackStock ?? true,
    categoryId: incoming.categoryId ?? existing.categoryId,
    updatedAt: incoming.updatedAt ?? existing.updatedAt,
    variants:
      incoming.variants && incoming.variants.length > 0 ? incoming.variants : (existing.variants ?? []),
    warehouseId,
  }
}

/** Dipakai sync engine setelah pull catalog dari server. */
export async function saveCatalogFromSync(warehouseId: number, products: CatalogProduct[]) {
  const deductions = await pendingStockDeductions(warehouseId)

  await db.transaction('rw', db.catalogProducts, async () => {
    for (const product of products) {
      const record = applyPendingDeductions({ ...product, warehouseId }, deductions)
      await db.catalogProducts.put(record)
    }
  })
}

/** Merge hasil pencarian API — jangan naikkan stok lokal yang sudah dikurangi offline. */
export async function mergeCatalogFromApi(warehouseId: number, products: CatalogProduct[]) {
  const deductions = await pendingStockDeductions(warehouseId)

  await db.transaction('rw', db.catalogProducts, async () => {
    for (const product of products) {
      const existing = await db.catalogProducts.get(product.id)
      let record = applyPendingDeductions(mergeProductFields(product, existing, warehouseId), deductions)

      if (
        existing?.warehouseId === warehouseId &&
        productHasPendingDeductions(deductions, product.id)
      ) {
        record = minStockRecord(record, existing)
      }

      await db.catalogProducts.put(record)
    }
  })
}

/** @deprecated Gunakan saveCatalogFromSync atau mergeCatalogFromApi */
export async function saveCatalogProducts(warehouseId: number, products: CatalogProduct[]) {
  await saveCatalogFromSync(warehouseId, products)
}

export async function getCatalogProducts(warehouseId: number, categoryId?: number | null) {
  const all = await db.catalogProducts.where('warehouseId').equals(warehouseId).toArray()
  if (categoryId) {
    return all.filter((p) => p.categoryId === categoryId)
  }
  return all
}

export async function findProductBySku(warehouseId: number, sku: string) {
  const products = await db.catalogProducts.where('warehouseId').equals(warehouseId).toArray()
  const product = products.find((p) => p.sku === sku)
  if (product) return { product, variant: null as CatalogProduct['variants'][0] | null }

  for (const p of products) {
    const variant = (p.variants ?? []).find((v) => v.sku === sku)
    if (variant) return { product: p, variant }
  }
  return null
}

export async function decrementLocalStock(
  warehouseId: number,
  productId: number,
  variantId: number | null | undefined,
  qty: number,
) {
  const product = await db.catalogProducts.get(productId)
  if (!product || product.warehouseId !== warehouseId) return

  const variants = product.variants ?? []

  if (variantId) {
    product.variants = variants.map((v) =>
      v.id === variantId ? { ...v, stock: Math.max(0, v.stock - qty) } : v,
    )
  } else if (variants.length > 0) {
    const variantTotal = variants.reduce((sum, variant) => sum + Math.max(0, variant.stock), 0)
    if (variantTotal > 0) {
      product.variants = deductVariantStock(variants, qty)
    } else {
      product.stock = Math.max(0, product.stock - qty)
    }
  } else {
    product.stock = Math.max(0, product.stock - qty)
  }

  await db.catalogProducts.put(product)
}
