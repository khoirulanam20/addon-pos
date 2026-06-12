import { Printer } from 'lucide-react'
import type { OrderDetail } from '@/api/types'
import { CurrencyDisplay } from '@/components/common/CurrencyDisplay'
import { formatDateTime } from '@/lib/format'
import { printReceipt } from '@/services/receipt-printer'
import type { OfflineOrderRecord } from '@/db/dexie'

type Props = {
  order?: OrderDetail | null
  offlineOrder?: OfflineOrderRecord | null
  storeName?: string
}

export function OrderPreviewPanel({ order, offlineOrder, storeName = 'Toko' }: Props) {
  if (!order && !offlineOrder) {
    return (
      <div className="flex h-full items-center justify-center rounded-xl border border-gray-200 bg-white p-6 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900">
        No order selected to preview or print invoice.
      </div>
    )
  }

  if (offlineOrder) {
    return (
      <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
        <div className="border-b border-gray-200 p-4 dark:border-gray-800">
          <h3 className="font-semibold">Order Details (Offline)</h3>
          <p className="text-sm text-gray-500">{offlineOrder.clientReference}</p>
        </div>
        <div className="flex-1 overflow-auto p-4 text-sm">
          <p>{offlineOrder.customerName}</p>
          <p className="text-gray-500">{formatDateTime(offlineOrder.createdAt)}</p>
          <p className="mt-2">Status: {offlineOrder.status}</p>
          <p className="mt-4 font-bold">
            Total: <CurrencyDisplay amount={offlineOrder.grandTotal} />
          </p>
        </div>
      </div>
    )
  }

  if (!order) return null

  const handlePrint = () => {
    printReceipt({
      storeName,
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      customerName: order.customerName,
      items: order.items.map((i) => ({
        productName: i.productName,
        qty: i.qty,
        subtotal: i.subtotal,
      })),
      subtotal: order.subtotal,
      taxAmount: order.taxAmount,
      grandTotal: order.grandTotal,
      payments: order.payments.map((p) => ({ method: p.method, amount: p.amount })),
    })
  }

  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="border-b border-gray-200 p-4 dark:border-gray-800">
        <h3 className="font-semibold">Order Details</h3>
        <div className="mt-2 flex justify-between text-sm">
          <span>{order.customerName}</span>
          <span className="text-gray-500">{order.customerPhone}</span>
        </div>
      </div>
      <div className="flex-1 overflow-auto p-4">
        {order.items.map((item) => (
          <div key={item.id} className="mb-3 border-b border-gray-100 pb-3 text-sm dark:border-gray-800">
            <div className="font-medium">{item.productName}</div>
            <div className="text-gray-500">
              SKU: {item.sku ?? '-'} · Qty: {item.qty}
            </div>
            <div className="text-right font-medium">
              <CurrencyDisplay amount={item.subtotal} />
            </div>
          </div>
        ))}
      </div>
      <div className="space-y-2 border-t border-gray-200 p-4 text-sm dark:border-gray-800">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <CurrencyDisplay amount={order.subtotal} />
        </div>
        <div className="flex justify-between">
          <span>Tax</span>
          <CurrencyDisplay amount={order.taxAmount} />
        </div>
        <div className="flex justify-between text-lg font-bold">
          <span>Grand Total</span>
          <CurrencyDisplay amount={order.grandTotal} />
        </div>
        <button
          type="button"
          onClick={handlePrint}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 py-2.5 text-sm font-medium text-white"
        >
          <Printer className="h-4 w-4" />
          Print Invoice
        </button>
      </div>
    </div>
  )
}
