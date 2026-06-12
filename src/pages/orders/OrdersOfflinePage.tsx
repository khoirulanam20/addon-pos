import { useEffect, useState } from 'react'
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
  const { syncNow, syncing } = useSync()
  const { apiReachable } = useNetwork()

  const reload = async () => setOrders(await listOfflineOrders())

  useEffect(() => {
    void reload()
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
        <PosEmptyState message="No offline orders found." />
      </div>
    )
  }

  return (
    <div className="flex h-full gap-4">
      <div className="min-w-0 flex-1">
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
        <PosDataTable
          columns={[
            { key: 'ref', header: 'Order ID', render: (o) => o.clientReference.slice(0, 8) },
            { key: 'total', header: 'Total Sales', render: (o) => <CurrencyDisplay amount={o.grandTotal} /> },
            {
              key: 'status',
              header: 'Status',
              render: (o) => (
                <span className="rounded bg-amber-100 px-2 py-0.5 text-xs text-amber-800">{o.status}</span>
              ),
            },
            { key: 'date', header: 'Date', render: (o) => formatDateTime(o.createdAt) },
          ]}
          rows={orders}
          keyFn={(o) => o.clientReference}
          selectedKey={selected?.clientReference ?? null}
          onRowClick={setSelected}
        />
      </div>
      <div className="w-[380px] shrink-0">
        <OrderPreviewPanel offlineOrder={selected} />
      </div>
    </div>
  )
}
