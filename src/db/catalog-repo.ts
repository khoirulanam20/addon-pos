import type { CatalogProduct } from '@/api/types'
import { db } from './dexie'

export async function saveCatalogProducts(warehouseId: number, products: CatalogProduct[]) {
  await db.transaction('rw', db.catalogProducts, async () => {
    for (const product of products) {
      await db.catalogProducts.put({ ...product, warehouseId })
    }
  })
}

export async function getCatalogProducts(warehouseId: number, categoryId?: number | null) {
  let collection = db.catalogProducts.where('warehouseId').equals(warehouseId)
  const all = await collection.toArray()
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

  if (variantId) {
    product.variants = (product.variants ?? []).map((v) =>
      v.id === variantId ? { ...v, stock: Math.max(0, v.stock - qty) } : v,
    )
  } else {
    product.stock = Math.max(0, product.stock - qty)
  }
  await db.catalogProducts.put(product)
}
