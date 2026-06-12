import type { CartPreviewData } from '@/api/types'
import type { CartLine } from '@/stores/cart-store'

export function applyLineDiscounts(preview: CartPreviewData, lines: CartLine[]): CartPreviewData {
  const lineItems = preview.lineItems.map((item, i) => {
    const pct = lines[i]?.discountPercent ?? 0
    const rawSubtotal = item.unitPrice * item.qty
    const discount = Math.round(rawSubtotal * (pct / 100))
    return {
      ...item,
      subtotal: rawSubtotal - discount,
    }
  })

  const subtotal = lineItems.reduce((sum, item) => sum + item.subtotal, 0)
  const lineDiscountTotal = preview.lineItems.reduce((sum, item, i) => {
    const pct = lines[i]?.discountPercent ?? 0
    return sum + Math.round(item.unitPrice * item.qty * (pct / 100))
  }, 0)

  const couponDiscount = preview.discountAmount
  const taxRatio = preview.subtotal > 0 ? preview.taxAmount / preview.subtotal : 0
  const taxAmount = preview.taxIncluded ? 0 : Math.round(subtotal * taxRatio)
  const grandTotal = preview.taxIncluded ? subtotal : subtotal + taxAmount

  return {
    ...preview,
    lineItems,
    subtotal,
    taxAmount,
    discountAmount: couponDiscount + lineDiscountTotal,
    grandTotal,
  }
}
