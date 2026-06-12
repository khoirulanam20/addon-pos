import { previewCart } from '@/api/cart'
import type { PaymentInput } from '@/api/types'
import type { OfflineOrderPayload } from '@/api/sync'
import type { OfflineOrderRecord } from '@/db/dexie'

function cleanPayment(payment: PaymentInput): PaymentInput {
  const cleaned: PaymentInput = {
    method: payment.method,
    amount: payment.amount,
  }
  if (payment.payment_bank_id) {
    cleaned.payment_bank_id = payment.payment_bank_id
  }
  if (payment.reference) {
    cleaned.reference = payment.reference
  }
  return cleaned
}

export function alignPaymentsToGrandTotal(payments: PaymentInput[], grandTotal: number): PaymentInput[] {
  const cleaned = payments.map(cleanPayment)
  const currentTotal = cleaned.reduce((sum, payment) => sum + payment.amount, 0)
  if (currentTotal === grandTotal) return cleaned

  if (cleaned.length === 1) {
    return [{ ...cleaned[0], amount: grandTotal }]
  }

  const transfer = cleaned.find((payment) => payment.method === 'transfer')
  const cash = cleaned.find((payment) => payment.method === 'cash')
  if (transfer && cash) {
    return [
      { ...cash, amount: grandTotal - transfer.amount },
      transfer,
    ]
  }

  return [{ method: 'cash', amount: grandTotal }]
}

export async function prepareOfflineOrderPayload(order: OfflineOrderRecord): Promise<OfflineOrderPayload> {
  const preview = await previewCart({
    warehouse_id: order.warehouseId,
    items: order.items,
    coupon_code: null,
    customer_id: null,
  })

  return {
    client_reference: order.clientReference,
    warehouse_id: order.warehouseId,
    created_at: order.createdAt,
    customer_name: order.customerName,
    customer_phone: order.customerPhone,
    items: order.items,
    payments: alignPaymentsToGrandTotal(order.payments, preview.grandTotal),
    notes: order.notes,
  }
}
