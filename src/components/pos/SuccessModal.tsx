import { CheckCircle, Home, Printer } from 'lucide-react'

type Props = {
  orderNumber: string
  onHome: () => void
  onPrint: () => void
}

export function SuccessModal({ orderNumber, onHome, onPrint }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 text-center shadow-xl dark:bg-gray-900">
        <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-600" />
        <h2 className="mb-2 text-xl font-semibold text-gray-900 dark:text-white">Order placed successfully</h2>
        <p className="mb-6 text-sm text-gray-500">#{orderNumber}</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={onHome}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-300 py-2.5 text-sm font-medium dark:border-gray-600"
          >
            <Home className="h-4 w-4" />
            Home
          </button>
          <button
            type="button"
            onClick={onPrint}
            className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-green-600 py-2.5 text-sm font-medium text-white hover:bg-green-700"
          >
            <Printer className="h-4 w-4" />
            Print Invoice
          </button>
        </div>
      </div>
    </div>
  )
}
