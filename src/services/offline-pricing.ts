import type { BootstrapData, CatalogProduct, CartLineInput } from '@/api/types'

export function calculateOfflineTotal(
  items: CartLineInput[],
  products: CatalogProduct[],
  tax: BootstrapData['tax'],
): {
  subtotal: number
  taxAmount: number
  grandTotal: number
  discountAmount: number
  lines: Array<{ name: string; unitPrice: number; qty: number; subtotal: number }>
} {
  let discountAmount = 0
  const lines = items.map((item) => {
    const product = products.find((p) => p.id === item.product_id)
    if (!product) throw new Error('Produk tidak ditemukan di cache offline')
    const variant = item.variant_id
      ? (product.variants ?? []).find((v) => v.id === item.variant_id)
      : null
    const unitPrice = variant?.finalPrice ?? product.finalPrice
    const name = variant?.name ?? product.name
    const gross = unitPrice * item.qty
    const pct = Math.min(100, Math.max(0, item.discount_percent ?? 0))
    const lineDiscount = Math.round(gross * (pct / 100))
    discountAmount += lineDiscount
    return { name, unitPrice, qty: item.qty, subtotal: gross - lineDiscount }
  })

  const subtotal = lines.reduce((sum, l) => sum + l.subtotal, 0)
  let taxAmount = 0
  if (tax.enabled && !tax.included) {
    taxAmount = Math.round(subtotal * 0.11)
  }
  const grandTotal = tax.included ? subtotal : subtotal + taxAmount

  return { subtotal, taxAmount, grandTotal, discountAmount, lines }
}
