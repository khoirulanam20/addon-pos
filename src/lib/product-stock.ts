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
let _stockLogCount = 0
export function isOutOfStock(product: CatalogProduct): boolean {
  const variants = productVariants(product)
  if (variants.length > 0) {
    const variantInStock = variants.some((v) => v.stock > 0)
    const out = !variantInStock
    // #region agent log
    if (_stockLogCount < 5 && (product.stock ?? 0) > 0 && !variantInStock) { _stockLogCount++; fetch('http://127.0.0.1:7854/ingest/4daf1b18-d0c4-465c-b5a4-479f15c14527',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'16bc84'},body:JSON.stringify({sessionId:'16bc84',hypothesisId:'F',location:'product-stock.ts:isOutOfStock',message:'parent has stock but variants empty',data:{id:product.id,name:product.name,parentStock:product.stock,variantStocks:variants.map(v=>v.stock),markedOut:out},timestamp:Date.now()})}).catch(()=>{}); }
    // #endregion
    return out
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
