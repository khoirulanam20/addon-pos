import { apiFetch } from './client'
import type { ShiftPayload } from './types'

export type ShiftSummary = {
  shift: ShiftPayload & {
    closedAt?: string | null
    closingCash?: number | null
    notes?: string | null
    openingNotes?: string | null
  }
  orderCount: number
  totalSales: number
  paymentsByMethod: Record<string, number>
}

export type ShiftHistoryItem = {
  id: number
  openedAt: string
  closedAt: string | null
  openingCash: number
  totalSales: number
  orderCount: number
  notes: string | null
  openingNotes: string | null
  paymentsByMethod: Record<string, number>
}

export async function openShift(warehouseId: number, openingCash = 0, openingNotes?: string) {
  const { data } = await apiFetch<{ shift: NonNullable<ShiftPayload> }>('/shifts/open', {
    method: 'POST',
    body: JSON.stringify({
      warehouse_id: warehouseId,
      opening_cash: openingCash,
      opening_notes: openingNotes,
    }),
  })
  return data.shift
}

export async function closeShift(payload: { closing_cash?: number; notes?: string }) {
  const { data } = await apiFetch<{ shift: NonNullable<ShiftPayload> }>('/shifts/close', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return data.shift
}

export async function fetchShiftSummary(id: number) {
  const { data } = await apiFetch<ShiftSummary>(`/shifts/${id}/summary`)
  return data
}

export async function fetchShiftHistory() {
  const { data } = await apiFetch<ShiftHistoryItem[]>('/shifts/history')
  return data
}
