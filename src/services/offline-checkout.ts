import type { BootstrapData, CartLineInput, CartPreviewData, PaymentInput } from '@/api/types'
import type { CartLine } from '@/stores/cart-store'
import { getBootstrap } from '@/db/bootstrap-repo'
import { decrementLocalStock, getCatalogProducts } from '@/db/catalog-repo'
import { saveOfflineOrder } from '@/db/offline-orders-repo'
import { uuid } from '@/lib/uuid'
import { calculateOfflineTotal } from '@/services/offline-pricing'

export async function buildOfflineCartPreview(
  warehouseId: number,
  lines: CartLine[],
  toInput: () => CartLineInput[],
  bootstrap: BootstrapData | null,
): Promise<CartPreviewData | null> {
  const taxConfig = bootstrap?.tax ?? (await getBootstrap())?.tax
  if (!taxConfig || !warehouseId) return null

  const cached = await getCatalogProducts(warehouseId)
  const result = calculateOfflineTotal(toInput(), cached, taxConfig)

  return {
    lineItems: result.lines.map((l, i) => ({
      productId: lines[i].product_id,
      variantId: lines[i].variant_id ?? null,
      sku: lines[i].sku ?? null,
      productName: l.name,
      qty: l.qty,
      unitPrice: l.unitPrice,
      subtotal: l.subtotal,
      size: lines[i].size ?? null,
      color: lines[i].color ?? null,
    })),
    subtotal: result.subtotal,
    taxAmount: result.taxAmount,
    discountAmount: result.discountAmount,
    grandTotal: result.grandTotal,
    couponCode: null,
    taxIncluded: taxConfig.included,
    stockWarnings: [],
  }
}

export async function persistOfflineOrder(params: {
  warehouseId: number
  customerName: string
  customerPhone: string
  items: CartLineInput[]
  payments: PaymentInput[]
  preview: CartPreviewData
  notes?: string
  lines: CartLine[]
}): Promise<string> {
  const clientReference = uuid()
  await saveOfflineOrder({
    clientReference,
    warehouseId: params.warehouseId,
    status: 'pending',
    customerName: params.customerName,
    customerPhone: params.customerPhone,
    items: params.items,
    payments: params.payments,
    subtotal: params.preview.subtotal,
    taxAmount: params.preview.taxAmount,
    grandTotal: params.preview.grandTotal,
    notes: params.notes,
    createdAt: new Date().toISOString(),
  })

  for (const line of params.lines) {
    await decrementLocalStock(params.warehouseId, line.product_id, line.variant_id, line.qty)
  }

  return `OFF-${clientReference.slice(0, 8)}`
}
