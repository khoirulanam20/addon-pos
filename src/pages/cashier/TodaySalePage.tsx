import { useEffect, useState } from 'react'
import { fetchOrders } from '@/api/orders'
import { fetchShiftSummary, type ShiftSummary } from '@/api/shifts'
import type { OrderSummary } from '@/api/types'
import { useAuth } from '@/app/providers/AuthProvider'
import { useNetwork } from '@/app/providers/NetworkProvider'
import { CurrencyDisplay } from '@/components/common/CurrencyDisplay'
import { PosCard } from '@/components/ui/PosCard'
import { PosDataTable } from '@/components/ui/PosDataTable'
import { formatDateTime } from '@/lib/format'

export function TodaySalePage() {
  const { shift } = useAuth()
  const { apiReachable } = useNetwork()
  const [summary, setSummary] = useState<ShiftSummary | null>(null)
  const [orders, setOrders] = useState<OrderSummary[]>([])

  useEffect(() => {
    if (!shift || !apiReachable) return
    void fetchShiftSummary(shift.id).then(setSummary)
    void fetchOrders({ shift_id: shift.id }).then(({ orders: data }) => setOrders(data))
  }, [shift, apiReachable])

  if (!apiReachable) {
    return <p className="text-sm text-gray-500">Membutuhkan koneksi internet.</p>
  }

  if (!shift) return null

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-3">
        <PosCard>
          <div className="text-sm text-gray-500">Opening Drawer Amount</div>
          <div className="text-xl font-bold">
            <CurrencyDisplay amount={shift.openingCash} />
          </div>
        </PosCard>
        <PosCard>
          <div className="text-sm text-gray-500">Cash Payment Sale</div>
          <div className="text-xl font-bold text-green-600">
            <CurrencyDisplay amount={summary?.paymentsByMethod.cash ?? 0} />
          </div>
        </PosCard>
        <PosCard>
          <div className="text-sm text-gray-500">Transfer Payment Sale</div>
          <div className="text-xl font-bold">
            <CurrencyDisplay amount={summary?.paymentsByMethod.transfer ?? 0} />
          </div>
        </PosCard>
      </div>

      <PosCard title="Sale History">
        <PosDataTable
          columns={[
            { key: 'id', header: 'Order ID', render: (o) => `# ${o.id}` },
            { key: 'time', header: 'Time', render: (o) => formatDateTime(o.createdAt) },
            { key: 'total', header: 'Order Total', render: (o) => <CurrencyDisplay amount={o.grandTotal} /> },
            { key: 'payment', header: 'Payment Mode', render: (o) => o.paymentMethod },
          ]}
          rows={orders}
          keyFn={(o) => o.id}
          emptyMessage="Belum ada penjualan hari ini."
        />
      </PosCard>
    </div>
  )
}
