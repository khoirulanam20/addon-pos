import { useEffect, useState } from 'react'
import { fetchShiftHistory, type ShiftHistoryItem } from '@/api/shifts'
import { useNetwork } from '@/app/providers/NetworkProvider'
import { CurrencyDisplay } from '@/components/common/CurrencyDisplay'
import { PosCard } from '@/components/ui/PosCard'
import { PosDataTable } from '@/components/ui/PosDataTable'
import { formatDate } from '@/lib/format'

export function CashierSaleHistoryPage() {
  const { apiReachable } = useNetwork()
  const [rows, setRows] = useState<ShiftHistoryItem[]>([])

  useEffect(() => {
    if (!apiReachable) return
    void fetchShiftHistory().then(setRows).catch(() => setRows([]))
  }, [apiReachable])

  if (!apiReachable) {
    return <p className="text-sm text-gray-500">Membutuhkan koneksi internet.</p>
  }

  return (
    <PosCard title="Sale History">
      <PosDataTable
        columns={[
          { key: 'date', header: 'Date', render: (r) => formatDate(r.closedAt ?? r.openedAt) },
          {
            key: 'cash',
            header: 'Cash Payments',
            render: (r) => <CurrencyDisplay amount={r.paymentsByMethod.cash ?? 0} />,
          },
          {
            key: 'transfer',
            header: 'Transfer Payments',
            render: (r) => <CurrencyDisplay amount={r.paymentsByMethod.transfer ?? 0} />,
          },
          {
            key: 'total',
            header: 'Total Sale',
            render: (r) => <CurrencyDisplay amount={r.totalSales} />,
          },
          { key: 'notes', header: 'Drawer Note', render: (r) => r.notes ?? 'N/A' },
        ]}
        rows={rows}
        keyFn={(r) => r.id}
        emptyMessage="Belum ada riwayat shift."
      />
    </PosCard>
  )
}
