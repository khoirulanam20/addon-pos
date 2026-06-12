import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchOrder, fetchOrders } from '@/api/orders'
import type { OrderDetail, OrderSummary } from '@/api/types'
import { useSync } from '@/app/providers/SyncProvider'
import { useNetwork } from '@/app/providers/NetworkProvider'
import { isOfflineMode } from '@/lib/offline-mode'
import { CurrencyDisplay } from '@/components/common/CurrencyDisplay'
import { OrderPreviewPanel } from '@/components/pos/OrderPreviewPanel'
import { PosDataTable } from '@/components/ui/PosDataTable'
import { getBootstrap } from '@/db/bootstrap-repo'
import { formatDateTime } from '@/lib/format'

export function OrdersHistoryPage() {
  const { online, apiReachable } = useNetwork()
  const { pendingCount } = useSync()
  const offline = isOfflineMode(online, apiReachable)
  const [orders, setOrders] = useState<OrderSummary[]>([])
  const [q, setQ] = useState('')
  const [selected, setSelected] = useState<OrderDetail | null>(null)
  const [storeName, setStoreName] = useState('Toko')

  useEffect(() => {
    void getBootstrap().then((b) => setStoreName(b.store.name))
  }, [])

  useEffect(() => {
    if (!apiReachable) return
    fetchOrders(q ? { q } : undefined)
      .then(({ orders: data }) => setOrders(data))
      .catch(() => setOrders([]))
  }, [apiReachable, q])

  const selectOrder = async (order: OrderSummary) => {
    const detail = await fetchOrder(order.id)
    setSelected(detail)
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
    <div className="flex h-full gap-4">
      <div className="min-w-0 flex-1">
        <input
          placeholder="Search Order Id..."
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="mb-4 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
        />
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
      </div>
      <div className="w-[380px] shrink-0">
        <OrderPreviewPanel order={selected} storeName={storeName} />
      </div>
    </div>
  )
}
