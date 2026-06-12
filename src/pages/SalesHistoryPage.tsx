import { useEffect, useState } from 'react'
import { fetchOrders } from '@/api/orders'
import type { OrderSummary } from '@/api/types'
import { CurrencyDisplay } from '@/components/common/CurrencyDisplay'
import { formatDateTime } from '@/lib/format'
import { useNetwork } from '@/app/providers/NetworkProvider'

export function SalesHistoryPage() {
  const { apiReachable } = useNetwork()
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [q, setQ] = useState('')

  useEffect(() => {
    if (!apiReachable) return
    fetchOrders(q ? { q } : undefined)
      .then(({ orders: data }) => setOrders(data))
      .catch(() => setOrders([]))
  }, [apiReachable, q])

  if (!apiReachable) {
    return <p className="text-gray-400">Riwayat penjualan online membutuhkan koneksi internet.</p>
  }

  return (
    <div>
      <h1 className="mb-4 text-lg font-semibold">Riwayat Penjualan</h1>
      <input
        placeholder="Cari no. order / pelanggan..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="mb-4 w-full max-w-md rounded-lg border border-gray-700 bg-gray-900 px-3 py-2"
      />
      <div className="space-y-2">
        {orders.map((order) => (
          <div key={order.id} className="rounded-lg border border-gray-800 bg-gray-900 p-3 text-sm">
            <div className="flex justify-between font-medium">
              <span>{order.orderNumber}</span>
              <CurrencyDisplay amount={order.grandTotal} />
            </div>
            <div className="text-gray-400">
              {order.customerName} · {formatDateTime(order.createdAt)} · {order.orderStatus}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
