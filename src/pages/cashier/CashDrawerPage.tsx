import { Check } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { closeShift, fetchShiftSummary, type ShiftSummary } from '@/api/shifts'
import { useAuth } from '@/app/providers/AuthProvider'
import { CurrencyDisplay } from '@/components/common/CurrencyDisplay'
import { PosCard } from '@/components/ui/PosCard'

export function CashDrawerPage() {
  const { shift, setShift } = useAuth()
  const navigate = useNavigate()
  const [summary, setSummary] = useState<ShiftSummary | null>(null)
  const [expectedCash, setExpectedCash] = useState(0)
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!shift) return
    void fetchShiftSummary(shift.id).then((data) => {
      setSummary(data)
      const cash = data.paymentsByMethod.cash ?? 0
      const expected = shift.openingCash + cash
      setExpectedCash(expected)
    })
  }, [shift])

  if (!shift) return null

  const cashSales = summary?.paymentsByMethod.cash ?? 0
  const transferSales = summary?.paymentsByMethod.transfer ?? 0
  const expectedDrawer = shift.openingCash + cashSales
  const difference = expectedCash - expectedDrawer

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!notes.trim()) return
    setSubmitting(true)
    try {
      await closeShift({ closing_cash: expectedCash, notes: notes.trim() })
      setShift(null)
      navigate('/')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PosCard title="Drawer Amount Summary">
      <div className="mb-6 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-500">Opening Drawer Amount</span>
          <CurrencyDisplay amount={shift.openingCash} />
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Cash Payment Sale</span>
          <span className="font-medium text-green-600">
            <CurrencyDisplay amount={cashSales} />
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Transfer Payment Sale</span>
          <CurrencyDisplay amount={transferSales} />
        </div>
        <div className="flex justify-between border-t border-gray-200 pt-2 font-medium dark:border-gray-800">
          <span>Expected Drawer Amount</span>
          <CurrencyDisplay amount={expectedDrawer} />
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Difference</span>
          <span className={difference === 0 ? 'text-green-600' : 'text-amber-600'}>
            <CurrencyDisplay amount={difference} />
          </span>
        </div>
      </div>

      <form onSubmit={submit} className="space-y-4">
        <label className="block text-sm">
          Expected Drawer Amount<span className="text-red-500">*</span>
          <input
            type="number"
            min={0}
            required
            value={expectedCash}
            onChange={(e) => setExpectedCash(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
          />
        </label>
        <label className="block text-sm">
          Remarks<span className="text-red-500">*</span>
          <textarea
            required
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Enter counter closure remarks."
            rows={4}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="flex items-center justify-center gap-2 rounded-lg bg-green-600 px-6 py-3 font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          <Check className="h-5 w-5" />
          Close Drawer
        </button>
      </form>
    </PosCard>
  )
}
