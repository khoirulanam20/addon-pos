import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { fetchHeldCarts, resumeHeldCart } from '@/api/held-carts'
import type { HeldCart } from '@/api/types'
import { useAuth } from '@/app/providers/AuthProvider'
import { useNetwork } from '@/app/providers/NetworkProvider'
import { PosEmptyState } from '@/components/ui/PosEmptyState'
import { listLocalHeldCarts, deleteLocalHeldCart } from '@/db/held-carts-repo'
import type { LocalHeldCart } from '@/db/dexie'
import { getCatalogProducts } from '@/db/catalog-repo'
import { formatDateTime } from '@/lib/format'
import { useCartStore } from '@/stores/cart-store'

export function OrdersHoldPage() {
  const { shift } = useAuth()
  const { apiReachable } = useNetwork()
  const navigate = useNavigate()
  const cart = useCartStore()
  const [serverHeld, setServerHeld] = useState<HeldCart[]>([])
  const [localHeld, setLocalHeld] = useState<LocalHeldCart[]>([])

  const reload = async () => {
    if (apiReachable) {
      setServerHeld(await fetchHeldCarts(shift?.warehouseId))
    }
    setLocalHeld(await listLocalHeldCarts(shift?.warehouseId))
  }

  useEffect(() => {
    void reload()
  }, [apiReachable, shift?.warehouseId])

  const resume = async (items: HeldCart | LocalHeldCart, isServer: boolean) => {
    const products = shift ? await getCatalogProducts(shift.warehouseId) : []
    const data = isServer ? await resumeHeldCart((items as HeldCart).id) : (items as LocalHeldCart)
    cart.loadFromHeld({
      items: data.items,
      customerName: data.customerName ?? null,
      customerPhone: data.customerPhone ?? null,
      customerId: 'customerId' in data ? data.customerId : null,
      couponCode: data.couponCode ?? null,
      notes: data.notes ?? null,
      resolveName: (item) => {
        const p = products.find((x) => x.id === item.product_id)
        const v = p?.variants.find((x) => x.id === item.variant_id)
        return v?.name ?? p?.name ?? 'Produk'
      },
      resolvePrice: (item) => {
        const p = products.find((x) => x.id === item.product_id)
        const v = p?.variants.find((x) => x.id === item.variant_id)
        return v?.finalPrice ?? p?.finalPrice ?? 0
      },
    })
    if (!isServer) await deleteLocalHeldCart((items as LocalHeldCart).id)
    navigate('/')
  }

  if (serverHeld.length === 0 && localHeld.length === 0) {
    return <PosEmptyState message="No orders found." />
  }

  return (
    <div className="space-y-2">
      {serverHeld.map((h) => (
        <div
          key={`s-${h.id}`}
          className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
        >
          <div>
            <div className="font-medium">{h.label ?? 'Hold'}</div>
            <div className="text-sm text-gray-500">{formatDateTime(h.heldAt)}</div>
          </div>
          <button
            type="button"
            onClick={() => void resume(h, true)}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white"
          >
            Resume
          </button>
        </div>
      ))}
      {localHeld.map((h) => (
        <div
          key={`l-${h.id}`}
          className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
        >
          <div>
            <div className="font-medium">{h.label ?? 'Hold offline'}</div>
            <div className="text-sm text-gray-500">
              {formatDateTime(h.heldAt)} · Offline
            </div>
          </div>
          <button
            type="button"
            onClick={() => void resume(h, false)}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white"
          >
            Resume
          </button>
        </div>
      ))}
    </div>
  )
}
