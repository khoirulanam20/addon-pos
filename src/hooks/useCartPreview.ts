import { useEffect, useState } from 'react'
import { previewCart } from '@/api/cart'
import type { BootstrapData, CartPreviewData } from '@/api/types'
import { getCatalogProducts } from '@/db/catalog-repo'
import { useNetwork } from '@/app/providers/NetworkProvider'
import { calculateOfflineTotal } from '@/services/offline-pricing'
import { useCartStore } from '@/stores/cart-store'

export function useCartPreview(warehouseId: number, bootstrap: BootstrapData | null) {
  const { apiReachable } = useNetwork()
  const cart = useCartStore()
  const [preview, setPreview] = useState<CartPreviewData | null>(null)

  useEffect(() => {
    if (!warehouseId || cart.lines.length === 0) {
      setPreview(null)
      return
    }
    if (apiReachable) {
      previewCart({
        warehouse_id: warehouseId,
        items: cart.toInput(),
        coupon_code: cart.couponCode || null,
        customer_id: cart.customerId,
      })
        .then(setPreview)
        .catch(() => setPreview(null))
    } else if (bootstrap) {
      getCatalogProducts(warehouseId).then((cached) => {
        try {
          const result = calculateOfflineTotal(cart.toInput(), cached, bootstrap.tax)
          const base: CartPreviewData = {
            lineItems: result.lines.map((l, i) => ({
              productId: cart.lines[i].product_id,
              variantId: cart.lines[i].variant_id ?? null,
              sku: cart.lines[i].sku ?? null,
              productName: l.name,
              qty: l.qty,
              unitPrice: l.unitPrice,
              subtotal: l.subtotal,
              size: cart.lines[i].size ?? null,
              color: cart.lines[i].color ?? null,
            })),
            subtotal: result.subtotal,
            taxAmount: result.taxAmount,
            discountAmount: result.discountAmount,
            grandTotal: result.grandTotal,
            couponCode: null,
            taxIncluded: bootstrap.tax.included,
            stockWarnings: [],
          }
          setPreview(base)
        } catch {
          setPreview(null)
        }
      })
    }
  }, [cart.lines, cart.couponCode, cart.customerId, warehouseId, apiReachable, bootstrap, cart.lines.map((l) => l.discountPercent).join(',')])

  return preview
}
