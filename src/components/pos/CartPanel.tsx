import { Trash2, UserRound, Users } from 'lucide-react'
import { useState } from 'react'
import type { CartPreviewData } from '@/api/types'
import { CurrencyDisplay } from '@/components/common/CurrencyDisplay'
import { AssignCustomerModal } from '@/components/pos/AssignCustomerModal'
import { CartLineItem } from '@/components/pos/CartLineItem'
import { useNetwork } from '@/app/providers/NetworkProvider'
import { useCartStore } from '@/stores/cart-store'

type Props = {
  preview: CartPreviewData | null
  onHold: () => void
  onProceed: () => void
  loading?: boolean
}

export function CartPanel({ preview, onHold, onProceed, loading }: Props) {
  const lines = useCartStore((s) => s.lines)
  const customerId = useCartStore((s) => s.customerId)
  const customerName = useCartStore((s) => s.customerName)
  const customerPhone = useCartStore((s) => s.customerPhone)
  const couponCode = useCartStore((s) => s.couponCode)
  const setCouponCode = useCartStore((s) => s.setCouponCode)
  const clearLines = useCartStore((s) => s.clearLines)
  const { apiReachable } = useNetwork()
  const [showCustomer, setShowCustomer] = useState(false)

  const isWalkIn = !customerId
  const displayName = isWalkIn ? 'Walk-in' : customerName

  return (
    <>
      <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-200 p-3 dark:border-gray-800">
          <div className="flex min-w-0 items-center gap-2">
            <UserRound className={`h-4 w-4 shrink-0 ${isWalkIn ? 'text-gray-500' : 'text-green-600'}`} />
            <div className="min-w-0">
              <div className="truncate text-sm font-medium">{displayName}</div>
              {customerPhone && <div className="truncate text-xs text-gray-500">{customerPhone}</div>}
              {isWalkIn && !customerPhone && (
                <div className="text-xs text-gray-400">Tanpa pelanggan</div>
              )}
            </div>
          </div>
          <div className="flex shrink-0 gap-1">
            <button
              type="button"
              onClick={() => setShowCustomer(true)}
              className="rounded border border-gray-200 p-1.5 text-gray-600 hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-800"
              title="Pilih pelanggan"
            >
              <Users className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => clearLines()}
              className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-800"
              title="Kosongkan keranjang"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-2 overflow-auto p-3">
          {lines.length === 0 && (
            <p className="py-8 text-center text-sm text-gray-400">Keranjang kosong</p>
          )}
          {lines.map((line, index) => (
            <CartLineItem
              key={`${line.product_id}-${line.variant_id}-${index}`}
              line={line}
              index={index}
              lineSubtotal={preview?.lineItems[index]?.subtotal ?? line.unitPrice * line.qty}
            />
          ))}
        </div>

        <div className="space-y-2 border-t border-gray-200 p-3 dark:border-gray-800">
          <input
            placeholder="Kupon (online saja)"
            value={couponCode}
            disabled={!apiReachable}
            onChange={(e) => setCouponCode(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:opacity-50 dark:border-gray-700 dark:bg-gray-800"
          />
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-gray-500">
              <span>Subtotal</span>
              <CurrencyDisplay amount={preview?.subtotal ?? 0} />
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Tax</span>
              <CurrencyDisplay amount={preview?.taxAmount ?? 0} />
            </div>
            <div className="flex justify-between text-gray-500">
              <span>Discount</span>
              <CurrencyDisplay amount={preview?.discountAmount ?? 0} />
            </div>
            <div className="flex justify-between text-base font-bold">
              <span>Payable Amount</span>
              <CurrencyDisplay amount={preview?.grandTotal ?? 0} />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onHold}
              disabled={lines.length === 0}
              className="flex-1 rounded-lg bg-gray-800 py-2.5 text-sm font-medium text-white hover:bg-gray-900 disabled:opacity-50 dark:bg-gray-700"
            >
              Hold Order
            </button>
            <button
              type="button"
              onClick={onProceed}
              disabled={!preview || lines.length === 0 || loading}
              className="flex-1 rounded-lg bg-green-600 py-2.5 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              Proceed
            </button>
          </div>
        </div>
      </div>

      {showCustomer && <AssignCustomerModal onClose={() => setShowCustomer(false)} />}
    </>
  )
}
