import { apiFetch } from './client'
import type { OrderSummary } from './types'

export type ReportSummary = {
  orders: number
  averageOrderValue: number
  averageItemsPerOrder: number
  discountTotal: number
  cashPayments: number
  transferPayments: number
  sparkline: Array<{ date: string; orders: number; revenue: number }>
  period?: 'day' | 'week' | 'month'
}

export type ReportExportData = ReportSummary & {
  from: string
  to: string
  period: 'day' | 'week' | 'month'
  orderList: OrderSummary[]
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

export async function fetchReportExport(params: {
  from: string
  to: string
  period?: 'day' | 'week' | 'month'
}) {
  const search = new URLSearchParams({
    from: params.from,
    to: params.to,
    period: params.period ?? 'day',
  })
  const { data } = await apiFetch<ReportExportData>(`/reports/export?${search}`)
  return data
}
