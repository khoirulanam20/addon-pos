import { useEffect, useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { fetchBootstrap } from '@/api/bootstrap'
import type { BootstrapData } from '@/api/types'
import { openShift } from '@/api/shifts'
import { useAuth } from '@/app/providers/AuthProvider'
import { pullBootstrapData } from '@/services/sync-engine'

export function OpenShiftPage() {
  const { user, shift, loading, setShift, refresh } = useAuth()
  const [bootstrap, setBootstrap] = useState<BootstrapData | null>(null)
  const [warehouseId, setWarehouseId] = useState(0)
  const [openingCash, setOpeningCash] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetchBootstrap()
      .then((data) => {
        setBootstrap(data)
        setWarehouseId(data.warehouses[0]?.id ?? 0)
      })
      .catch(() => {})
  }, [])

  if (!loading && !user) return <Navigate to="/login" replace />
  if (!loading && shift) return <Navigate to="/" replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const opened = await openShift(warehouseId, openingCash)
      setShift(opened)
      await pullBootstrapData()
      await refresh()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-950 p-4">
      <form onSubmit={submit} className="w-full max-w-md rounded-xl bg-gray-900 p-6">
        <h1 className="mb-4 text-lg font-semibold">Buka Shift</h1>
        <label className="mb-3 block text-sm">
          Outlet / Gudang
          <select
            value={warehouseId}
            onChange={(e) => setWarehouseId(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2"
          >
            {bootstrap?.warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name} {w.city ? `(${w.city})` : ''}
              </option>
            ))}
          </select>
        </label>
        <label className="mb-4 block text-sm">
          Kas awal (Rp)
          <input
            type="number"
            min={0}
            value={openingCash}
            onChange={(e) => setOpeningCash(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2"
          />
        </label>
        <button
          type="submit"
          disabled={submitting || !warehouseId}
          className="w-full rounded-lg bg-indigo-600 py-2.5 font-medium disabled:opacity-50"
        >
          Mulai Shift
        </button>
      </form>
    </div>
  )
}
