import type { CatalogProduct, CatalogVariant } from '@/api/types'

export function productVariants(product: CatalogProduct): CatalogVariant[] {
  return product.variants ?? []
}

export function productHasVariants(product: CatalogProduct): boolean {
  return productVariants(product).length > 0
}

/** Default true jika API tidak mengirim field (mis. hasil search lama). */
export function tracksStock(product: CatalogProduct): boolean {
  return product.trackStock !== false
}

export function tracksVariantStock(variant: CatalogVariant, product: CatalogProduct): boolean {
  return variant.trackStock !== false && tracksStock(product)
}

export function isVariantOutOfStock(variant: CatalogVariant, product: CatalogProduct): boolean {
  if (!tracksVariantStock(variant, product)) return false
  return variant.stock <= 0
}

/** Produk tidak bisa ditambahkan ke keranjang jika stok tampilan 0. */
export function isOutOfStock(product: CatalogProduct): boolean {
  if (!tracksStock(product)) return false
  return displayStock(product) <= 0
}

export function displayStock(product: CatalogProduct): number {
  const variants = productVariants(product)
  if (variants.length > 0) {
    const trackedVariants = variants.filter((variant) => tracksVariantStock(variant, product))
    const variantPool = trackedVariants.length > 0 ? trackedVariants : variants
    const variantTotal = variantPool.reduce((sum, variant) => sum + Math.max(0, variant.stock), 0)
    if (variantTotal > 0) return variantTotal
    return Math.max(0, product.stock ?? 0)
  }

  return Math.max(0, product.stock ?? 0)
}

export function stockLabel(product: CatalogProduct): string {
  if (!tracksStock(product)) return 'Tersedia'
  const qty = displayStock(product)
  if (qty <= 0) return 'Habis'
  return `${qty} Qty`
}
