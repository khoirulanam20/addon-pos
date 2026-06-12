import type { CatalogProduct, CatalogVariant } from '@/api/types'

export function productVariants(product: CatalogProduct): CatalogVariant[] {
  return product.variants ?? []
}

export function productHasVariants(product: CatalogProduct): boolean {
  return productVariants(product).length > 0
}

export function isVariantOutOfStock(variant: CatalogVariant): boolean {
  return variant.stock <= 0
}

/** Produk tidak bisa ditambahkan ke keranjang jika stok tampilan 0. */
export function isOutOfStock(product: CatalogProduct): boolean {
  const variants = productVariants(product)
  if (variants.length > 0) {
    return !variants.some((v) => v.stock > 0)
  }

  return (product.stock ?? 0) <= 0
}

export function displayStock(product: CatalogProduct): number {
  const variants = productVariants(product)
  if (variants.length > 0) {
    return variants.reduce((sum, v) => sum + Math.max(0, v.stock), 0)
  }

  return product.stock ?? 0
}
