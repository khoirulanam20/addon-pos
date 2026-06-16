import { X } from 'lucide-react'
import type { OrderDetail } from '@/api/types'
import type { OfflineOrderRecord } from '@/db/dexie'
import { OrderPreviewPanel } from '@/components/pos/OrderPreviewPanel'

type Props = {
  open: boolean
  onClose: () => void
  order?: OrderDetail | null
  offlineOrder?: OfflineOrderRecord | null
  storeName?: string
}

export function OrderPreviewBottomSheet({
  open,
  onClose,
  order,
  offlineOrder,
  storeName,
}: Props) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Tutup detail order"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 flex max-h-[85vh] flex-col rounded-t-2xl border-t border-gray-200 bg-white pb-safe shadow-2xl dark:border-gray-800 dark:bg-gray-900">
        <div className="flex shrink-0 flex-col items-center pt-2">
          <div className="h-1 w-10 rounded-full bg-gray-300 dark:bg-gray-600" />
          <div className="flex w-full items-center justify-between px-4 py-2">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Detail Order</h2>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Tutup"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-auto px-3 pb-3">
          <OrderPreviewPanel order={order} offlineOrder={offlineOrder} storeName={storeName} />
        </div>
      </div>
    </div>
  )
}
