import { useEffect, useState } from 'react'
import { fetchReportSummary, type ReportSummary } from '@/api/reports'
import { useNetwork } from '@/app/providers/NetworkProvider'
import { CurrencyDisplay } from '@/components/common/CurrencyDisplay'
import { PosMetricCard } from '@/components/ui/PosMetricCard'

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export function ReportsPage() {
  const { apiReachable } = useNetwork()
  const [period, setPeriod] = useState<'day' | 'week' | 'month'>('day')
  const [from, setFrom] = useState(todayIso())
  const [to, setTo] = useState(todayIso())
  const [report, setReport] = useState<ReportSummary | null>(null)

  useEffect(() => {
    if (!apiReachable) return
    void fetchReportSummary({ from, to, period }).then(setReport).catch(() => setReport(null))
  }, [apiReachable, from, to, period])

  if (!apiReachable) {
    return <p className="text-sm text-gray-500">Laporan membutuhkan koneksi internet.</p>
  }

  const sparkOrders = report?.sparkline.map((s) => s.orders) ?? []
  const sparkRevenue = report?.sparkline.map((s) => s.revenue) ?? []

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex rounded-lg border border-gray-200 dark:border-gray-800">
          {(['day', 'week', 'month'] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`px-4 py-2 text-sm capitalize ${
                period === p ? 'bg-white font-medium shadow dark:bg-gray-800' : 'text-gray-500'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
        <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900" />
        <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-900" />
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <PosMetricCard label="Orders" value={report?.orders ?? 0} trend={{ value: '—', up: true }} sparkline={sparkOrders} />
        <PosMetricCard
          label="Average Order Value"
          value={<CurrencyDisplay amount={report?.averageOrderValue ?? 0} />}
          trend={{ value: '—', up: true }}
          sparkline={sparkRevenue}
        />
        <PosMetricCard label="Average Items Per Order" value={report?.averageItemsPerOrder ?? 0} trend={{ value: '—', up: true }} />
        <PosMetricCard
          label="Discounted Offers"
          value={<CurrencyDisplay amount={report?.discountTotal ?? 0} />}
          trend={{ value: '—', up: false }}
        />
        <PosMetricCard
          label="Cash Payments"
          value={<CurrencyDisplay amount={report?.cashPayments ?? 0} />}
          trend={{ value: '—', up: true }}
        />
        <PosMetricCard
          label="Transfer Payment"
          value={<CurrencyDisplay amount={report?.transferPayments ?? 0} />}
          trend={{ value: '—', up: false }}
        />
      </div>
    </div>
  )
}
