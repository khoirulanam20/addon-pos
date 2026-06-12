import { useEffect, useState } from 'react'
import { useSync } from '@/app/providers/SyncProvider'
import { useNetwork } from '@/app/providers/NetworkProvider'
import { PosCard } from '@/components/ui/PosCard'
import { getCatalogProducts } from '@/db/catalog-repo'
import { useAuth } from '@/app/providers/AuthProvider'

type SyncCard = {
  label: string
  current: number
  total: number
  status: 'ready' | 'fetching' | 'completed'
}

export function SettingsSyncPage() {
  const { shift } = useAuth()
  const { syncing, pendingCount, syncNow } = useSync()
  const { apiReachable } = useNetwork()
  const [products, setProducts] = useState(0)

  useEffect(() => {
    if (!shift) return
    void getCatalogProducts(shift.warehouseId).then((p) => setProducts(p.length))
  }, [shift])

  const cards: SyncCard[] = [
    {
      label: 'Products',
      current: products,
      total: products,
      status: syncing ? 'fetching' : products > 0 ? 'completed' : 'ready',
    },
    {
      label: 'Customers',
      current: 0,
      total: 0,
      status: 'ready',
    },
    {
      label: 'Orders',
      current: pendingCount,
      total: pendingCount,
      status: pendingCount > 0 ? 'fetching' : 'ready',
    },
  ]

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          type="button"
          disabled={!apiReachable || syncing}
          onClick={() => void syncNow()}
          className="rounded-lg bg-green-600 px-4 py-2 text-sm text-white disabled:opacity-50"
        >
          {syncing ? 'Fetching...' : 'Sync Now'}
        </button>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {cards.map((card) => {
          const pct = card.total > 0 ? Math.round((card.current / card.total) * 100) : card.status === 'completed' ? 100 : 0
          return (
            <PosCard key={card.label}>
              <div className="mb-2 flex items-center justify-between">
                <span className="font-medium">{card.label}</span>
                <span
                  className={`rounded px-2 py-0.5 text-xs ${
                    card.status === 'completed'
                      ? 'bg-green-100 text-green-700'
                      : card.status === 'fetching'
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {card.status === 'completed' ? 'Completed' : card.status === 'fetching' ? 'Fetching...' : 'Ready'}
                </span>
              </div>
              <div className="mb-2 h-2 overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-sm text-gray-500">
                {card.current} / {card.total} Records
              </p>
            </PosCard>
          )
        })}
      </div>
    </div>
  )
}
