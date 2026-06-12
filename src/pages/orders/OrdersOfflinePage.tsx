import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useSync } from '@/app/providers/SyncProvider'
import { useNetwork } from '@/app/providers/NetworkProvider'
import { CurrencyDisplay } from '@/components/common/CurrencyDisplay'
import { OrderPreviewPanel } from '@/components/pos/OrderPreviewPanel'
import { PosDataTable } from '@/components/ui/PosDataTable'
import { PosEmptyState } from '@/components/ui/PosEmptyState'
import { listOfflineOrders } from '@/db/offline-orders-repo'
import type { OfflineOrderRecord } from '@/db/dexie'
import { formatDateTime } from '@/lib/format'

export function OrdersOfflinePage() {
  const [orders, setOrders] = useState<OfflineOrderRecord[]>([])
  const [selected, setSelected] = useState<OfflineOrderRecord | null>(null)
  const { syncNow, syncing, pendingCount } = useSync()
  const { apiReachable } = useNetwork()
  const location = useLocation()

  const reload = async () => {
    const data = await listOfflineOrders()
    setOrders(data)
    setSelected((prev) => {
      if (!prev) return null
      return data.find((o) => o.clientReference === prev.clientReference) ?? data[0] ?? null
    })
  }

  useEffect(() => {
    void reload()
  }, [location.pathname, pendingCount])

  useEffect(() => {
    const onFocus = () => void reload()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  if (orders.length === 0) {
    return (
      <div>
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            disabled={!apiReachable || syncing}
            onClick={() => void syncNow().then(reload)}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {syncing ? 'Syncing...' : 'Sync ke Server'}
          </button>
        </div>
        <PosEmptyState
          message={
            pendingCount > 0
              ? 'Memuat pesanan offline...'
              : 'Belum ada pesanan offline. Transaksi saat mode offline akan muncul di sini.'
          }
        />
      </div>
    )
  }

  return (
    <div className="flex h-full gap-4">
      <div className="min-w-0 flex-1">
        <div className="mb-4 flex items-center justify-between gap-2">
          <p className="text-sm text-gray-500">
            {pendingCount > 0
              ? `${pendingCount} menunggu sinkron`
              : orders.some((o) => o.status === 'failed')
                ? `${orders.filter((o) => o.status === 'failed').length} gagal sync — ketuk Sync untuk coba lagi`
                : 'Semua pesanan sudah tersinkron'}
          </p>
          <button
            type="button"
            disabled={!apiReachable || syncing}
            onClick={() => void syncNow().then(reload)}
            className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {syncing ? 'Syncing...' : 'Sync ke Server'}
          </button>
        </div>
        <PosDataTable<OfflineOrderRecord>
          columns={[
            { key: 'ref', header: 'Order ID', render: (o) => o.clientReference.slice(0, 8) },
            { key: 'total', header: 'Total Sales', render: (o) => <CurrencyDisplay amount={o.grandTotal} /> },
            {
              key: 'status',
              header: 'Status',
              render: (o) => (
                <span
                  className={`rounded px-2 py-0.5 text-xs ${
                    o.status === 'synced'
                      ? 'bg-green-100 text-green-800'
                      : o.status === 'failed'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {o.status}
                </span>
              ),
            },
            { key: 'date', header: 'Date', render: (o) => formatDateTime(o.createdAt) },
          ]}
          rows={orders}
          keyFn={(o) => o.clientReference}
          selectedKey={selected?.clientReference ?? null}
          onRowClick={(o) => setSelected(o)}
        />
      </div>
      <div className="w-[380px] shrink-0">
        <OrderPreviewPanel offlineOrder={selected} />
      </div>
    </div>
  )
}
