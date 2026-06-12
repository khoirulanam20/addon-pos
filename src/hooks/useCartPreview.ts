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
    // #region agent log
    fetch('http://127.0.0.1:7854/ingest/4daf1b18-d0c4-465c-b5a4-479f15c14527',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'16bc84'},body:JSON.stringify({sessionId:'16bc84',hypothesisId:'C',location:'useCartPreview.ts:effect',message:'preview effect',data:{apiReachable,hasBootstrap:!!bootstrap,lineCount:cart.lines.length},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
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
          // #region agent log
          fetch('http://127.0.0.1:7854/ingest/4daf1b18-d0c4-465c-b5a4-479f15c14527',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'16bc84'},body:JSON.stringify({sessionId:'16bc84',hypothesisId:'C',location:'useCartPreview.ts:offline-ok',message:'offline preview ok',data:{grandTotal:base.grandTotal,cachedCount:cached.length},timestamp:Date.now()})}).catch(()=>{});
          // #endregion
          setPreview(base)
        } catch (err) {
          // #region agent log
          fetch('http://127.0.0.1:7854/ingest/4daf1b18-d0c4-465c-b5a4-479f15c14527',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'16bc84'},body:JSON.stringify({sessionId:'16bc84',hypothesisId:'C',location:'useCartPreview.ts:offline-err',message:'offline preview failed',data:{error:err instanceof Error?err.message:'unknown'},timestamp:Date.now()})}).catch(()=>{});
          // #endregion
          setPreview(null)
        }
      })
    }
  }, [cart.lines, cart.couponCode, cart.customerId, warehouseId, apiReachable, bootstrap, cart.lines.map((l) => l.discountPercent).join(',')])

  return preview
}
