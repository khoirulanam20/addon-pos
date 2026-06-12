import { ArrowRight, ChevronDown, ChevronRight } from 'lucide-react'
import { useState } from 'react'
import type { CartLine } from '@/stores/cart-store'
import { CurrencyDisplay } from '@/components/common/CurrencyDisplay'
import { useCartStore } from '@/stores/cart-store'

type Props = {
  line: CartLine
  index: number
  lineSubtotal: number
}

export function CartLineItem({ line, index, lineSubtotal }: Props) {
  const cart = useCartStore()
  const [expanded, setExpanded] = useState(false)
  const [discountDraft, setDiscountDraft] = useState(String(line.discountPercent ?? 0))

  const applyDiscount = () => {
    const pct = Math.min(100, Math.max(0, Number(discountDraft) || 0))
    cart.updateLineDiscount(index, pct)
    setDiscountDraft(String(pct))
  }

  return (
    <div
      className={`rounded-lg border text-sm transition-colors ${
        expanded ? 'border-green-500 bg-white dark:bg-gray-900' : 'border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800/50'
      }`}
    >
      <div className="flex items-center gap-2 p-2">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="shrink-0 text-green-600"
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4 text-gray-400" />}
        </button>
        <button type="button" onClick={() => setExpanded((v) => !v)} className="min-w-0 flex-1 text-left">
          <span className="font-medium line-clamp-1">{line.productName}</span>
        </button>
        <span className="shrink-0 rounded-full bg-gray-200 px-2 py-0.5 text-xs dark:bg-gray-700">
          x {line.qty}
        </span>
        <span className="shrink-0 font-semibold">
          <CurrencyDisplay amount={lineSubtotal} />
        </span>
        <button
          type="button"
          onClick={() => cart.removeLine(index)}
          className="shrink-0 rounded bg-red-500 px-1.5 py-0.5 text-xs text-white hover:bg-red-600"
        >
          ×
        </button>
      </div>

      {expanded && (
        <div className="grid grid-cols-2 gap-3 border-t border-gray-200 p-3 dark:border-gray-700">
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-gray-500">
              Quantity
            </label>
            <div className="flex items-center rounded-lg border border-gray-300 dark:border-gray-600">
              <button
                type="button"
                onClick={() => cart.updateQty(index, line.qty - 1)}
                className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                -
              </button>
              <input
                type="number"
                min={1}
                value={line.qty}
                onChange={(e) => cart.updateQty(index, Number(e.target.value) || 1)}
                className="w-full border-x border-gray-300 bg-transparent py-2 text-center dark:border-gray-600"
              />
              <button
                type="button"
                onClick={() => cart.updateQty(index, line.qty + 1)}
                className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                +
              </button>
            </div>
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-medium uppercase tracking-wide text-gray-500">
              Discount
            </label>
            <div className="flex gap-1">
              <div className="flex flex-1 items-center rounded-lg border border-gray-300 dark:border-gray-600">
                <span className="px-2 text-gray-400">%</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={discountDraft}
                  onChange={(e) => setDiscountDraft(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && applyDiscount()}
                  className="w-full bg-transparent py-2 pr-2"
                />
              </div>
              <button
                type="button"
                onClick={applyDiscount}
                className="rounded-lg bg-green-600 px-2.5 text-white hover:bg-green-700"
              >
                <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
