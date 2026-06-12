import { Wallet } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { fetchBootstrap } from '@/api/bootstrap'
import type { BootstrapData } from '@/api/types'
import { openShift } from '@/api/shifts'
import { useAuth } from '@/app/providers/AuthProvider'
import { pullBootstrapData } from '@/services/sync-engine'

export function CashDrawerModal() {
  const { setShift, refresh } = useAuth()
  const [bootstrap, setBootstrap] = useState<BootstrapData | null>(null)
  const [warehouseId, setWarehouseId] = useState(0)
  const [openingCash, setOpeningCash] = useState(100000)
  const [openingNotes, setOpeningNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchBootstrap()
      .then((data) => {
        setBootstrap(data)
        setWarehouseId(data.warehouses[0]?.id ?? 0)
      })
      .catch(() => {})
  }, [])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!openingNotes.trim()) {
      setError('Catatan wajib diisi.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      const opened = await openShift(warehouseId, openingCash, openingNotes.trim())
      setShift(opened)
      await pullBootstrapData()
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuka laci.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl dark:bg-gray-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Cash Drawer</h2>
        </div>
        <form onSubmit={submit} className="space-y-4">
          {bootstrap && bootstrap.warehouses.length > 1 && (
            <label className="block text-sm text-gray-700 dark:text-gray-300">
              Outlet / Gudang
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-gray-300 bg-blue-50/50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
              >
                {bootstrap.warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name} {w.city ? `(${w.city})` : ''}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="block text-sm text-gray-700 dark:text-gray-300">
            Opening Drawer Amount<span className="text-red-500">*</span>
            <input
              type="number"
              min={0}
              required
              value={openingCash}
              onChange={(e) => setOpeningCash(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-gray-300 bg-blue-50/50 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
            />
          </label>
          <label className="block text-sm text-gray-700 dark:text-gray-300">
            Remarks<span className="text-red-500">*</span>
            <textarea
              required
              value={openingNotes}
              onChange={(e) => setOpeningNotes(e.target.value)}
              rows={3}
              placeholder="Catatan pembukaan laci..."
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
            />
          </label>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting || !warehouseId}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 py-3 font-medium text-white hover:bg-green-700 disabled:opacity-50"
          >
            <Wallet className="h-5 w-5" />
            Open Drawer
          </button>
        </form>
      </div>
    </div>
  )
}
