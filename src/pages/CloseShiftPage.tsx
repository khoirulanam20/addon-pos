import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { closeShift, fetchShiftSummary } from '@/api/shifts'
import { useAuth } from '@/app/providers/AuthProvider'
import { CurrencyDisplay } from '@/components/common/CurrencyDisplay'

export function CloseShiftPage() {
  const { shift, setShift } = useAuth()
  const navigate = useNavigate()
  const [closingCash, setClosingCash] = useState(0)
  const [notes, setNotes] = useState('')
  const [summary, setSummary] = useState<Record<string, unknown> | null>(null)
  const [submitting, setSubmitting] = useState(false)

  if (!shift) return <Navigate to="/shift" replace />

  const loadSummary = async () => {
    const data = await fetchShiftSummary(shift.id)
    setSummary(data)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      await closeShift({ closing_cash: closingCash, notes })
      setShift(null)
      navigate('/shift')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-lg">
      <h1 className="mb-4 text-lg font-semibold">Tutup Shift — {shift.warehouseName}</h1>
      <button
        type="button"
        onClick={() => void loadSummary()}
        className="mb-4 rounded-lg bg-gray-800 px-4 py-2 text-sm"
      >
        Lihat Ringkasan
      </button>
      {summary && (
        <div className="mb-4 rounded-lg bg-gray-900 p-4 text-sm">
          <div>Order: {String(summary.orderCount ?? 0)}</div>
          <div>
            Total penjualan:{' '}
            <CurrencyDisplay amount={Number((summary.totalSales as number) ?? 0)} />
          </div>
        </div>
      )}
      <form onSubmit={submit} className="space-y-3">
        <label className="block text-sm">
          Kas akhir (Rp)
          <input
            type="number"
            min={0}
            value={closingCash}
            onChange={(e) => setClosingCash(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2"
          />
        </label>
        <label className="block text-sm">
          Catatan
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2"
            rows={3}
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="rounded-lg bg-red-600 px-4 py-2 font-medium disabled:opacity-50"
        >
          Tutup Shift
        </button>
      </form>
    </div>
  )
}
