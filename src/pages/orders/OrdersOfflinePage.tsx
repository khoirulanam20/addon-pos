import { FileText } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useSync } from '@/app/providers/SyncProvider'
import { useNetwork } from '@/app/providers/NetworkProvider'
import { CurrencyDisplay } from '@/components/common/CurrencyDisplay'
import { OrderPreviewBottomSheet } from '@/components/pos/OrderPreviewBottomSheet'
import { OrderPreviewPanel } from '@/components/pos/OrderPreviewPanel'
import { PosDataTable } from '@/components/ui/PosDataTable'
import { PosEmptyState } from '@/components/ui/PosEmptyState'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { listOfflineOrders } from '@/db/offline-orders-repo'
import type { OfflineOrderRecord } from '@/db/dexie'
import { formatDateTime } from '@/lib/format'

export function OrdersOfflinePage() {
  const [orders, setOrders] = useState<OfflineOrderRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<OfflineOrderRecord | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const { syncNow, syncing, pendingCount } = useSync()
  const { apiReachable } = useNetwork()
  const location = useLocation()

  const reload = async () => {
    setLoading(true)
    try {
      const data = await listOfflineOrders()
      setOrders(data)
      setSelected((prev) => {
        if (!prev) return null
        return data.find((o) => o.clientReference === prev.clientReference) ?? data[0] ?? null
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void reload()
  }, [location.pathname, pendingCount])

  useEffect(() => {
    const onFocus = () => void reload()
    window.addEventListener('focus', onFocus)
    return () => window.removeEventListener('focus', onFocus)
  }, [])

  if (loading && orders.length === 0) {
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
        <TableSkeleton rows={5} cols={5} />
      </div>
    )
  }

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
        <PosEmptyState message="Belum ada pesanan offline. Transaksi saat mode offline akan muncul di sini." />
      </div>
    )
  }

  return (
    <div className={`flex h-full flex-col gap-4 lg:flex-row ${selected ? 'pb-14 lg:pb-0' : ''}`}>
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
          onRowClick={(o) => {
            setSelected(o)
            setPreviewOpen(true)
          }}
        />
      </div>
      <div className="hidden w-[380px] shrink-0 lg:block">
        <OrderPreviewPanel offlineOrder={selected} />
      </div>

      {selected && (
        <div className="bottom-nav-offset fixed inset-x-0 z-30 border-t border-gray-200 bg-white px-4 py-2 shadow-lg dark:border-gray-800 dark:bg-gray-900 lg:hidden">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-xs text-gray-500">Order {selected.clientReference.slice(0, 8)}</div>
              <div className="text-base font-bold text-green-600">
                <CurrencyDisplay amount={selected.grandTotal} />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setPreviewOpen(true)}
              className="flex min-h-[44px] items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700"
            >
              <FileText className="h-5 w-5" />
              Detail
            </button>
          </div>
        </div>
      )}

      <OrderPreviewBottomSheet
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        offlineOrder={selected}
      />
    </div>
  )
}
