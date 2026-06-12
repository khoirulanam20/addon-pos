import { Search, UserRound, X } from 'lucide-react'
import { useState } from 'react'
import { searchCustomers, type CustomerResult } from '@/api/customers'
import { useCartStore } from '@/stores/cart-store'

type Props = {
  onClose: () => void
}

export function AssignCustomerModal({ onClose }: Props) {
  const cart = useCartStore()
  const [q, setQ] = useState('')
  const [results, setResults] = useState<CustomerResult[]>([])
  const [searching, setSearching] = useState(false)

  const search = async () => {
    if (!q.trim()) {
      setResults([])
      return
    }
    setSearching(true)
    try {
      setResults(await searchCustomers(q))
    } finally {
      setSearching(false)
    }
  }

  const select = (c: CustomerResult) => {
    cart.setCustomer(c.name, c.phone ?? '', c.id)
    onClose()
  }

  const clearCustomer = () => {
    cart.clearCustomer()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[80vh] w-full max-w-md flex-col rounded-xl bg-white shadow-xl dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-800">
          <h2 className="font-semibold">Assign Customer</h2>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 p-4">
          <div className="flex gap-2">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void search()}
              placeholder="Cari nama, telepon, email..."
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-800"
            />
            <button
              type="button"
              onClick={() => void search()}
              disabled={searching}
              className="rounded-lg bg-gray-900 px-3 text-white dark:bg-gray-700"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            onClick={clearCustomer}
            className="flex w-full items-center gap-2 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <UserRound className="h-4 w-4" />
            Kosongkan (Walk-in)
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-auto px-4 pb-4">
          {results.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => select(c)}
              className="mb-2 w-full rounded-lg border border-gray-200 p-3 text-left hover:border-green-500 hover:bg-green-50 dark:border-gray-700 dark:hover:bg-green-950/20"
            >
              <div className="font-medium">{c.name}</div>
              <div className="text-xs text-gray-500">
                {c.phone}
                {c.email ? ` · ${c.email}` : ''}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
