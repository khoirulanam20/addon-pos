import { useEffect, useState } from 'react'
import { previewCart } from '@/api/cart'
import type { BootstrapData, CartPreviewData } from '@/api/types'
import { useNetwork } from '@/app/providers/NetworkProvider'
import { isOfflineMode } from '@/lib/offline-mode'
import { buildOfflineCartPreview } from '@/services/offline-checkout'
import { useCartStore } from '@/stores/cart-store'

export function useCartPreview(warehouseId: number, bootstrap: BootstrapData | null) {
  const { apiReachable, online } = useNetwork()
  const cart = useCartStore()
  const [preview, setPreview] = useState<CartPreviewData | null>(null)
  const offlineMode = isOfflineMode(online, apiReachable)

  useEffect(() => {
    if (!warehouseId || cart.lines.length === 0) {
      setPreview(null)
      return
    }

    const loadOffline = () =>
      buildOfflineCartPreview(warehouseId, cart.lines, () => cart.toInput(), bootstrap)
        .then(setPreview)
        .catch(() => setPreview(null))

    if (offlineMode) {
      void loadOffline()
      return
    }

    previewCart({
      warehouse_id: warehouseId,
      items: cart.toInput(),
      coupon_code: cart.couponCode || null,
      customer_id: cart.customerId,
    })
      .then(setPreview)
      .catch(() => void loadOffline())
  }, [
    cart.lines,
    cart.couponCode,
    cart.customerId,
    warehouseId,
    offlineMode,
    bootstrap,
    cart.lines.map((l) => l.discountPercent).join(','),
  ])

  return preview
}
