import { FileText } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchOrder, fetchOrders } from '@/api/orders'
import type { OrderDetail, OrderSummary } from '@/api/types'
import { useSync } from '@/app/providers/SyncProvider'
import { useNetwork } from '@/app/providers/NetworkProvider'
import { isOfflineMode } from '@/lib/offline-mode'
import { CurrencyDisplay } from '@/components/common/CurrencyDisplay'
import { OrderPreviewBottomSheet } from '@/components/pos/OrderPreviewBottomSheet'
import { OrderPreviewPanel } from '@/components/pos/OrderPreviewPanel'
import { PosDataTable } from '@/components/ui/PosDataTable'
import { TableSkeleton } from '@/components/ui/Skeleton'
import { getBootstrap } from '@/db/bootstrap-repo'
import { formatDateTime } from '@/lib/format'

export function OrdersHistoryPage() {
  const { online, apiReachable } = useNetwork()
  const { pendingCount } = useSync()
  const offline = isOfflineMode(online, apiReachable)
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<OrderDetail | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [storeName, setStoreName] = useState('Toko')

  useEffect(() => {
    void getBootstrap().then((b) => setStoreName(b.store.name))
  }, [])

  useEffect(() => {
    if (!apiReachable) {
      setLoading(false)
      return
    }
    setLoading(true)
    fetchOrders(q ? { q } : undefined)
      .then(({ orders: data }) => setOrders(data))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false))
  }, [apiReachable, q])

  const selectOrder = async (order: OrderSummary) => {
    const detail = await fetchOrder(order.id)
    setSelected(detail)
    setPreviewOpen(true)
  }

  if (offline) {
    return (
      <div className="space-y-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-900 dark:bg-amber-950/30">
        <p className="text-gray-700 dark:text-gray-200">
          Riwayat order server membutuhkan koneksi internet.
        </p>
        <Link
          to="/orders/offline"
          className="inline-flex font-medium text-blue-600 hover:underline dark:text-blue-400"
        >
          Lihat pesanan offline{pendingCount > 0 ? ` (${pendingCount} menunggu sync)` : ''}
        </Link>
      </div>
    )
  }

  return (
    <div className={`flex h-full flex-col gap-4 lg:flex-row ${selected ? 'pb-14 lg:pb-0' : ''}`}>
      <div className="min-w-0 flex-1">
        <input
          placeholder="Search Order Id..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
        />
        {loading && orders.length === 0 ? (
          <TableSkeleton rows={6} cols={5} />
        ) : (
        <PosDataTable<OrderSummary>
          columns={[
            { key: 'id', header: 'Order ID', render: (o) => `#${o.id}` },
            { key: 'qty', header: 'Total Qty', render: (o) => o.totalQty ?? 0 },
            {
              key: 'total',
              header: 'Total Sales',
              render: (o) => <CurrencyDisplay amount={o.grandTotal} />,
            },
            {
              key: 'status',
              header: 'Status',
              render: (o) => (
                <span className="rounded bg-green-100 px-2 py-0.5 text-xs text-green-800 dark:bg-green-900 dark:text-green-200">
                  {o.orderStatus}
                </span>
              ),
            },
            { key: 'date', header: 'Date', render: (o) => formatDateTime(o.createdAt) },
          ]}
          rows={orders}
          keyFn={(o) => o.id}
          selectedKey={selected?.id ?? null}
          onRowClick={(o) => void selectOrder(o)}
        />
        )}
      </div>
      <div className="hidden w-[380px] shrink-0 lg:block">
        <OrderPreviewPanel order={selected} storeName={storeName} />
      </div>

      {selected && (
        <div className="bottom-nav-offset fixed inset-x-0 z-30 border-t border-gray-200 bg-white px-4 py-2 shadow-lg dark:border-gray-800 dark:bg-gray-900 lg:hidden">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-xs text-gray-500">Order #{selected.id}</div>
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
              Detail & Print
            </button>
          </div>
        </div>
      )}

      <OrderPreviewBottomSheet
        open={previewOpen}
        onClose={() => setPreviewOpen(false)}
        order={selected}
        storeName={storeName}
      />
    </div>
  )
}
