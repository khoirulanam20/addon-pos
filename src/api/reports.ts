import { apiFetch } from './client'

export type ReportSummary = {
  orders: number
  averageOrderValue: number
  averageItemsPerOrder: number
  discountTotal: number
  cashPayments: number
  transferPayments: number
  sparkline: Array<{ date: string; orders: number; revenue: number }>
}

export async function fetchReportSummary(params: {
  from: string
  to: string
  period?: 'day' | 'week' | 'month'
}) {
  const search = new URLSearchParams({
    from: params.from,
    to: params.to,
    period: params.period ?? 'day',
  })
  const { data } = await apiFetch<ReportSummary>(`/reports/summary?${search}`)
  return data
}
