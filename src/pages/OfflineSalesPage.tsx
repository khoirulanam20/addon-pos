import { useEffect, useState } from 'react'
import { listOfflineOrders } from '@/db/offline-orders-repo'
import type { OfflineOrderRecord } from '@/db/dexie'
import { CurrencyDisplay } from '@/components/common/CurrencyDisplay'
import { formatDateTime } from '@/lib/format'
import { useSync } from '@/app/providers/SyncProvider'
import { useNetwork } from '@/app/providers/NetworkProvider'

export function OfflineSalesPage() {
  const [orders, setOrders] = useState<OfflineOrderRecord[]>([])
  const { syncNow, syncing } = useSync()
  const { apiReachable } = useNetwork()

  const reload = async () => setOrders(await listOfflineOrders())

  useEffect(() => {
    void reload()
  }, [])

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold">Penjualan Offline</h1>
        <button
          type="button"
          disabled={!apiReachable || syncing}
          onClick={() => void syncNow().then(reload)}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm disabled:opacity-50"
        >
          {syncing ? 'Menyinkronkan...' : 'Sync ke Server'}
        </button>
      </div>
      <div className="space-y-2">
        {orders.length === 0 && <p className="text-gray-400">Belum ada transaksi offline.</p>}
        {orders.map((order) => (
          <div key={order.clientReference} className="rounded-lg border border-gray-800 bg-gray-900 p-3 text-sm">
            <div className="flex justify-between font-medium">
              <span>{order.clientReference.slice(0, 8)}...</span>
              <CurrencyDisplay amount={order.grandTotal} />
            </div>
            <div className="text-gray-400">
              {order.customerName} · {formatDateTime(order.createdAt)} · {order.status}
            </div>
            {order.error && <p className="mt-1 text-red-400">{order.error}</p>}
          </div>
        ))}
      </div>
    </div>
  )
}
