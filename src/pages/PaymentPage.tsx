import { Building2, ChevronRight, CreditCard } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { createOrder } from '@/api/orders'
import type { BootstrapData, CartPreviewData, PaymentInput } from '@/api/types'
import { useAuth } from '@/app/providers/AuthProvider'
import { useNetwork } from '@/app/providers/NetworkProvider'
import { useSync } from '@/app/providers/SyncProvider'
import { CurrencyDisplay } from '@/components/common/CurrencyDisplay'
import { NumericKeypad } from '@/components/pos/NumericKeypad'
import { SelectBankModal } from '@/components/pos/SelectBankModal'
import { SuccessModal } from '@/components/pos/SuccessModal'
import { PaymentPageSkeleton } from '@/components/ui/Skeleton'
import { getBootstrap } from '@/db/bootstrap-repo'
import { useCartPreview } from '@/hooks/useCartPreview'
import { isOfflineMode } from '@/lib/offline-mode'
import { persistOfflineOrder } from '@/services/offline-checkout'
import { printReceipt } from '@/services/receipt-printer'
import { useCartStore } from '@/stores/cart-store'

type PaymentSnapshot = {
  customerName: string
  customerPhone: string
  preview: CartPreviewData
}

export function PaymentPage() {
  const { shift } = useAuth()
  const { apiReachable, online } = useNetwork()
  const { refreshPending } = useSync()
  const navigate = useNavigate()
  const cart = useCartStore()
  const warehouseId = shift?.warehouseId ?? 0
  const [bootstrap, setBootstrap] = useState<BootstrapData | null>(null)
  const livePreview = useCartPreview(warehouseId, bootstrap)
  const [method, setMethod] = useState<'cash' | 'transfer' | 'split'>('cash')
  const [received, setReceived] = useState('0')
  const [cashAmount, setCashAmount] = useState('0')
  const [transferAmount, setTransferAmount] = useState('0')
  const [activeSplitField, setActiveSplitField] = useState<'cash' | 'transfer'>('cash')
  const [bankId, setBankId] = useState(0)
  const [reference, setReference] = useState('')
  const [showBankModal, setShowBankModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [successOrder, setSuccessOrder] = useState<string | null>(null)
  const [receiptData, setReceiptData] = useState<Parameters<typeof printReceipt>[0] | null>(null)
  const [snapshot, setSnapshot] = useState<PaymentSnapshot | null>(null)
  const snapshotTaken = useRef(false)

  useEffect(() => {
    void getBootstrap().then((data) => {
      setBootstrap(data)
      setBankId(data.paymentBanks[0]?.id ?? 0)
    })
  }, [])

  useEffect(() => {
    if (cart.lines.length === 0 && !successOrder) {
      navigate('/', { replace: true })
    }
  }, [cart.lines.length, successOrder, navigate])

  useEffect(() => {
    if (livePreview && !snapshotTaken.current && cart.lines.length > 0) {
      setSnapshot({
        customerName: cart.customerName,
        customerPhone: cart.customerPhone,
        preview: livePreview,
      })
      snapshotTaken.current = true
    }
  }, [livePreview, cart.customerName, cart.customerPhone, cart.lines.length])

  const preview = successOrder ? snapshot?.preview ?? livePreview : livePreview ?? snapshot?.preview
  const displayCustomer = successOrder
    ? { name: snapshot?.customerName ?? 'Walk-in', phone: snapshot?.customerPhone ?? '' }
    : { name: cart.customerName, phone: cart.customerPhone }

  const grandTotal = preview?.grandTotal ?? 0

  useEffect(() => {
    if (!grandTotal) return
    if (method === 'cash' || method === 'transfer') {
      setReceived(String(grandTotal))
    }
    if (method === 'split') {
      const half = Math.floor(grandTotal / 2)
      setCashAmount(String(half))
      setTransferAmount(String(grandTotal - half))
    }
  }, [method, grandTotal])

  const receivedNum = parseFloat(received) || 0
  const cashNum = parseFloat(cashAmount) || 0
  const transferNum = parseFloat(transferAmount) || 0

  const { totalReceived, remaining, canConfirm } = useMemo(() => {
    if (method === 'cash') {
      const total = receivedNum
      return {
        totalReceived: total,
        remaining: grandTotal - total,
        canConfirm: total >= grandTotal && grandTotal > 0,
      }
    }
    if (method === 'transfer') {
      return {
        totalReceived: receivedNum,
        remaining: grandTotal - receivedNum,
        canConfirm: receivedNum === grandTotal && grandTotal > 0,
      }
    }
    const total = cashNum + transferNum
    return {
      totalReceived: total,
      remaining: grandTotal - total,
      canConfirm: total === grandTotal && grandTotal > 0 && cashNum > 0 && transferNum > 0,
    }
  }, [method, receivedNum, cashNum, transferNum, grandTotal])

  const payments = useMemo((): PaymentInput[] => {
    if (method === 'cash') {
      return [{ method: 'cash', amount: grandTotal }]
    }
    if (method === 'transfer') {
      return [{ method: 'transfer', amount: grandTotal, payment_bank_id: bankId, reference }]
    }
    return [
      { method: 'cash', amount: cashNum },
      { method: 'transfer', amount: transferNum, payment_bank_id: bankId, reference },
    ]
  }, [method, grandTotal, cashNum, transferNum, bankId, reference])

  const completePayment = async () => {
    const useOfflineCheckout = isOfflineMode(online, apiReachable)
    if (!warehouseId || !preview || !canConfirm) return
    setLoading(true)

    const finishOffline = async () => {
      const orderNumber = await persistOfflineOrder({
        warehouseId,
        customerName: cart.customerName,
        customerPhone: cart.customerPhone,
        items: cart.toInput(),
        payments,
        preview,
        notes: cart.notes,
        lines: cart.lines,
      })
      await refreshPending()
      setReceiptData({
        storeName: bootstrap?.store.name ?? 'Toko',
        orderNumber,
        createdAt: new Date().toISOString(),
        customerName: cart.customerName,
        items: preview.lineItems.map((i) => ({
          productName: i.productName,
          qty: i.qty,
          subtotal: i.subtotal,
        })),
        subtotal: preview.subtotal,
        taxAmount: preview.taxAmount,
        grandTotal: preview.grandTotal,
        payments: payments.map((p) => ({ method: p.method, amount: p.amount })),
      })
      setSuccessOrder(orderNumber)
    }

    try {
      if (!useOfflineCheckout) {
        try {
          const order = await createOrder({
            warehouse_id: warehouseId,
            customer_name: cart.customerName,
            customer_phone: cart.customerPhone,
            customer_id: cart.customerId,
            items: cart.toInput(),
            coupon_code: cart.couponCode || null,
            notes: cart.notes,
            payments,
          })
          setReceiptData({
            storeName: bootstrap?.store.name ?? 'Toko',
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
          setSuccessOrder(order.orderNumber)
        } catch {
          await finishOffline()
        }
      } else {
        await finishOffline()
      }
    } finally {
      setLoading(false)
    }
  }

  const handleHome = () => {
    cart.clear()
    setSuccessOrder(null)
    snapshotTaken.current = false
    navigate('/')
  }

  if (!preview && cart.lines.length > 0) {
    return <PaymentPageSkeleton />
  }

  if (!preview) return null

  const selectedBank = bootstrap?.paymentBanks.find((b) => b.id === bankId)

  const keypadValue = method === 'split' ? (activeSplitField === 'cash' ? cashAmount : transferAmount) : received
  const setKeypadValue = (v: string) => {
    if (method === 'split') {
      if (activeSplitField === 'cash') setCashAmount(v)
      else setTransferAmount(v)
    } else {
      setReceived(v)
    }
  }

  return (
    <div className="-m-4 flex min-h-0 flex-1 flex-col overflow-hidden">
      <div className="flex shrink-0 items-center border-b border-gray-200 bg-white px-4 py-2 dark:border-gray-800 dark:bg-gray-900">
        <Link to="/" className="text-sm text-gray-500 hover:text-gray-900 dark:hover:text-white">
          ← Back
        </Link>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-0 md:grid-cols-2">
        <div className="flex min-h-0 flex-col gap-2 overflow-hidden border-r border-gray-200 bg-gray-50 p-3 dark:border-gray-800 dark:bg-gray-950 md:gap-3 md:p-4">
          <div className="grid shrink-0 grid-cols-3 gap-2">
            <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
              <div className="text-xs text-gray-500">Payable Amount</div>
              <div className="text-base font-bold text-green-600">
                <CurrencyDisplay amount={grandTotal} />
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
              <div className="text-xs text-gray-500">Received</div>
              <div className="text-base font-bold text-green-600">
                <CurrencyDisplay amount={totalReceived} />
              </div>
            </div>
            <div className="rounded-xl border border-gray-200 bg-white p-3 dark:border-gray-800 dark:bg-gray-900">
              <div className="text-xs text-gray-500">Remaining</div>
              <div className={`text-base font-bold ${remaining !== 0 ? 'text-red-600' : 'text-green-600'}`}>
                <CurrencyDisplay amount={remaining} />
              </div>
            </div>
          </div>

          <div className="flex shrink-0 gap-2">
            {(['cash', 'transfer', 'split'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMethod(m)}
                className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium ${
                  method === m
                    ? 'border-gray-900 bg-white dark:border-white dark:bg-gray-800'
                    : 'border-gray-200 bg-white/80 dark:border-gray-700 dark:bg-gray-900'
                }`}
              >
                {m === 'cash' ? 'Tunai' : m === 'transfer' ? 'Transfer' : 'Split'}
              </button>
            ))}
          </div>

          {method === 'split' && (
            <div className="grid shrink-0 grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveSplitField('cash')
                  if (cashAmount === '0') setCashAmount('')
                }}
                className={`rounded-lg border p-3 text-left ${
                  activeSplitField === 'cash' ? 'border-green-500 bg-white dark:bg-gray-900' : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900'
                }`}
              >
                <div className="text-xs text-gray-500">Tunai</div>
                <div className="font-semibold">
                  <CurrencyDisplay amount={cashNum} />
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveSplitField('transfer')
                  if (transferAmount === '0') setTransferAmount('')
                }}
                className={`rounded-lg border p-3 text-left ${
                  activeSplitField === 'transfer' ? 'border-green-500 bg-white dark:bg-gray-900' : 'border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="text-xs text-gray-500">Transfer</div>
                  <span
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation()
                      setShowBankModal(true)
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        e.stopPropagation()
                        setShowBankModal(true)
                      }
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
                    title="Pilih rekening"
                  >
                    <Building2 className="h-3.5 w-3.5 text-gray-600 dark:text-gray-300" />
                  </span>
                </div>
                <div className="font-semibold">
                  <CurrencyDisplay amount={transferNum} />
                </div>
              </button>
            </div>
          )}

          {method === 'transfer' && (
            <button
              type="button"
              onClick={() => setShowBankModal(true)}
              className="flex shrink-0 items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-left text-sm dark:border-gray-700 dark:bg-gray-900"
            >
              <Building2 className="h-4 w-4 shrink-0 text-gray-500" />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">
                  {selectedBank ? selectedBank.bankName : 'Pilih rekening transfer'}
                </div>
                <div className="truncate text-xs text-gray-500">
                  {selectedBank
                    ? `${selectedBank.accountNumber} · ${reference || 'Tambah referensi'}`
                    : 'Ketuk untuk atur rekening & referensi'}
                </div>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-gray-400" />
            </button>
          )}

          {(method === 'cash' || method === 'transfer' || method === 'split') && (
            <div className="min-h-0 flex-1">
              <NumericKeypad value={keypadValue} onChange={setKeypadValue} onCancel={() => navigate('/')} />
            </div>
          )}
        </div>

        <div className="flex min-h-0 flex-col overflow-hidden bg-white dark:bg-gray-900">
          <div className="shrink-0 border-b border-gray-200 px-3 py-2 dark:border-gray-800">
            <div className="font-semibold">Order Details</div>
            <div className="mt-1 flex justify-between text-sm">
              <span>{displayCustomer.name}</span>
              <span className="text-gray-500">{displayCustomer.phone}</span>
            </div>
          </div>
          <div className="min-h-0 shrink overflow-y-auto px-3 py-2">
            {preview.lineItems.map((item, i) => (
              <div key={i} className="mb-2 border-b border-gray-100 pb-2 text-sm last:mb-0 last:border-0 last:pb-0 dark:border-gray-800">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium">{item.productName}</div>
                    <div className="text-gray-500">
                      SKU: {item.sku ?? '-'} · Qty: {item.qty}
                    </div>
                  </div>
                  <div className="shrink-0 font-medium">
                    <CurrencyDisplay amount={item.subtotal} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="shrink-0 space-y-1 border-t border-gray-200 px-3 py-2 text-sm dark:border-gray-800">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <CurrencyDisplay amount={preview.subtotal} />
            </div>
            <div className="flex justify-between">
              <span>Tax</span>
              <CurrencyDisplay amount={preview.taxAmount} />
            </div>
            <div className="flex justify-between">
              <span>Discount</span>
              <CurrencyDisplay amount={preview.discountAmount} />
            </div>
            <div className="flex justify-between text-base font-bold">
              <span>Grand Total</span>
              <CurrencyDisplay amount={preview.grandTotal} />
            </div>
            {method === 'split' && remaining !== 0 && (
              <p className="text-xs text-red-600">
                Tunai + Transfer harus sama dengan total pembayaran.
              </p>
            )}
            <button
              type="button"
              onClick={() => void completePayment()}
              disabled={loading || !canConfirm}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-green-600 py-2.5 font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              <CreditCard className="h-4 w-4" />
              Confirm Payment
            </button>
          </div>
        </div>
      </div>

      {successOrder && (
        <SuccessModal
          orderNumber={successOrder}
          onHome={handleHome}
          onPrint={() => {
            if (receiptData) printReceipt(receiptData)
          }}
        />
      )}

      {showBankModal && bootstrap && (
        <SelectBankModal
          banks={bootstrap.paymentBanks}
          selectedId={bankId}
          reference={reference}
          onSelect={setBankId}
          onReferenceChange={setReference}
          onClose={() => setShowBankModal(false)}
        />
      )}
    </div>
  )
}
