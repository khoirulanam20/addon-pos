import { useEffect, useState } from 'react'
import { fetchHeldCarts, resumeHeldCart } from '@/api/held-carts'
import type { HeldCart } from '@/api/types'
import { useAuth } from '@/app/providers/AuthProvider'
import { useNetwork } from '@/app/providers/NetworkProvider'
import { listLocalHeldCarts, deleteLocalHeldCart } from '@/db/held-carts-repo'
import type { LocalHeldCart } from '@/db/dexie'
import { getCatalogProducts } from '@/db/catalog-repo'
import { useCartStore } from '@/stores/cart-store'
import { formatDateTime } from '@/lib/format'

export function HeldSalesPage() {
  const { shift } = useAuth()
  const { apiReachable } = useNetwork()
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

  const resumeServer = async (id: number) => {
    const data = await resumeHeldCart(id)
    const products = shift ? await getCatalogProducts(shift.warehouseId) : []
    cart.loadFromHeld({
      items: data.items,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      customerId: data.customerId,
      couponCode: data.couponCode,
      notes: data.notes,
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
    await reload()
  }

  const resumeLocal = async (held: LocalHeldCart) => {
    const products = shift ? await getCatalogProducts(shift.warehouseId) : []
    cart.loadFromHeld({
      items: held.items,
      customerName: held.customerName,
      customerPhone: held.customerPhone,
      couponCode: held.couponCode,
      notes: held.notes,
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
    await deleteLocalHeldCart(held.id)
    await reload()
  }

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold">Hold Sales</h1>
      <div className="space-y-4">
        <section>
          <h2 className="mb-2 text-sm font-medium text-gray-400">Server</h2>
          {serverHeld.map((h) => (
            <div key={h.id} className="mb-2 flex items-center justify-between rounded-lg bg-gray-900 p-3 text-sm">
              <div>
                <div>{h.label ?? 'Hold'}</div>
                <div className="text-gray-500">{formatDateTime(h.heldAt)}</div>
              </div>
              <button type="button" onClick={() => void resumeServer(h.id)} className="rounded bg-indigo-600 px-3 py-1">
                Resume
              </button>
            </div>
          ))}
        </section>
        <section>
          <h2 className="mb-2 text-sm font-medium text-gray-400">Lokal (offline)</h2>
          {localHeld.map((h) => (
            <div key={h.id} className="mb-2 flex items-center justify-between rounded-lg bg-gray-900 p-3 text-sm">
              <div>
                <div>{h.label ?? 'Hold offline'}</div>
                <div className="text-gray-500">{formatDateTime(h.heldAt)}</div>
              </div>
              <button type="button" onClick={() => void resumeLocal(h)} className="rounded bg-indigo-600 px-3 py-1">
                Resume
              </button>
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}
