import { apiFetch } from './client'

export type PaymentBankRecord = {
  id: number
  bankName: string
  accountNumber: string
  accountName: string
  isActive: boolean
}

export type PaymentBankInput = {
  bank_name: string
  account_number: string
  account_name: string
  is_active?: boolean
}

export async function listPaymentBanks() {
  const { data } = await apiFetch<PaymentBankRecord[]>('/payment-banks')
  return data
}

export async function createPaymentBank(payload: PaymentBankInput) {
  const { data } = await apiFetch<PaymentBankRecord>('/payment-banks', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return data
}

export async function updatePaymentBank(id: number, payload: Partial<PaymentBankInput>) {
  const { data } = await apiFetch<PaymentBankRecord>(`/payment-banks/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  })
  return data
}

export async function deletePaymentBank(id: number) {
  await apiFetch(`/payment-banks/${id}`, { method: 'DELETE' })
}
