import { useState } from 'react'
import type { BootstrapData, PaymentInput } from '@/api/types'
import { CurrencyDisplay } from '@/components/common/CurrencyDisplay'

type Props = {
  grandTotal: number
  banks: BootstrapData['paymentBanks']
  onClose: () => void
  onConfirm: (payments: PaymentInput[]) => void
}

export function PaymentModal({ grandTotal, banks, onClose, onConfirm }: Props) {
  const [method, setMethod] = useState<'cash' | 'transfer' | 'split'>('cash')
  const [cashAmount, setCashAmount] = useState(grandTotal)
  const [bankId, setBankId] = useState(banks[0]?.id ?? 0)
  const [reference, setReference] = useState('')

  const submit = () => {
    if (method === 'cash') {
      onConfirm([{ method: 'cash', amount: grandTotal }])
      return
    }
    if (method === 'transfer') {
      onConfirm([{ method: 'transfer', amount: grandTotal, payment_bank_id: bankId, reference }])
      return
    }
    const transferAmount = grandTotal - cashAmount
    onConfirm([
      { method: 'cash', amount: cashAmount },
      { method: 'transfer', amount: transferAmount, payment_bank_id: bankId, reference },
    ])
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
      <div className="w-full max-w-md rounded-xl bg-gray-900 p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold">Pembayaran</h2>
        <p className="mb-4 text-2xl font-bold">
          Total: <CurrencyDisplay amount={grandTotal} />
        </p>
        <div className="mb-4 flex gap-2">
          {(['cash', 'transfer', 'split'] as const).map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMethod(m)}
              className={`rounded-lg px-3 py-2 text-sm capitalize ${method === m ? 'bg-indigo-600' : 'bg-gray-800'}`}
            >
              {m === 'split' ? 'Split' : m === 'cash' ? 'Tunai' : 'Transfer'}
            </button>
          ))}
        </div>
        {method === 'split' && (
          <label className="mb-3 block text-sm">
            Nominal tunai
            <input
              type="number"
              value={cashAmount}
              onChange={(e) => setCashAmount(Number(e.target.value))}
              className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2"
            />
          </label>
        )}
        {(method === 'transfer' || method === 'split') && (
          <>
            <label className="mb-3 block text-sm">
              Rekening
              <select
                value={bankId}
                onChange={(e) => setBankId(Number(e.target.value))}
                className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2"
              >
                {banks.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.bankName} — {b.accountNumber}
                  </option>
                ))}
              </select>
            </label>
            <label className="mb-3 block text-sm">
              Referensi
              <input
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="mt-1 w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2"
              />
            </label>
          </>
        )}
        {method === 'cash' && cashAmount > grandTotal && (
          <p className="mb-3 text-sm text-green-400">
            Kembalian: <CurrencyDisplay amount={cashAmount - grandTotal} />
          </p>
        )}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={onClose} className="rounded-lg bg-gray-800 px-4 py-2">
            Batal
          </button>
          <button type="button" onClick={submit} className="rounded-lg bg-indigo-600 px-4 py-2 font-medium">
            Selesaikan
          </button>
        </div>
      </div>
    </div>
  )
}
