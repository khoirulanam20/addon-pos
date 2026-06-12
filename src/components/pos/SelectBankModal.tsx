import { Building2, Check, X } from 'lucide-react'
import type { BootstrapData } from '@/api/types'

type Bank = BootstrapData['paymentBanks'][number]

type Props = {
  banks: Bank[]
  selectedId: number
  onSelect: (id: number) => void
  onClose: () => void
}

export function SelectBankModal({ banks, selectedId, onSelect, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="flex max-h-[80vh] w-full max-w-md flex-col rounded-xl bg-white shadow-xl dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-800">
          <h2 className="font-semibold">Pilih Rekening</h2>
          <button type="button" onClick={onClose} className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="overflow-auto p-2">
          {banks.length === 0 && (
            <p className="p-4 text-center text-sm text-gray-500">Tidak ada rekening tersedia.</p>
          )}
          {banks.map((bank) => {
            const selected = bank.id === selectedId
            return (
              <button
                key={bank.id}
                type="button"
                onClick={() => {
                  onSelect(bank.id)
                  onClose()
                }}
                className={`mb-1 flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors ${
                  selected
                    ? 'border-green-500 bg-green-50 dark:bg-green-950/20'
                    : 'border-gray-200 hover:border-gray-300 dark:border-gray-700 dark:hover:border-gray-600'
                }`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                  <Building2 className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-medium">{bank.bankName}</div>
                  <div className="text-sm text-gray-500">{bank.accountNumber}</div>
                  <div className="text-xs text-gray-400">{bank.accountName}</div>
                </div>
                {selected && <Check className="h-5 w-5 shrink-0 text-green-600" />}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
