import { create } from 'zustand'
import type { CartLineInput } from '@/api/types'

export type CartLine = CartLineInput & {
  productName: string
  unitPrice: number
  sku?: string | null
  size?: string | null
  color?: string | null
  discountPercent?: number
}

type CartState = {
  lines: CartLine[]
  customerName: string
  customerPhone: string
  customerId: number | null
  couponCode: string
  notes: string
  addLine: (line: CartLine) => void
  updateQty: (index: number, qty: number) => void
  updateLineDiscount: (index: number, discountPercent: number) => void
  removeLine: (index: number) => void
  setCustomer: (name: string, phone: string, id?: number | null) => void
  clearCustomer: () => void
  setCouponCode: (code: string) => void
  setNotes: (notes: string) => void
  loadFromHeld: (payload: {
    items: CartLineInput[]
    customerName?: string | null
    customerPhone?: string | null
    customerId?: number | null
    couponCode?: string | null
    notes?: string | null
    resolveName: (item: CartLineInput) => string
    resolvePrice: (item: CartLineInput) => number
  }) => void
  clear: () => void
  clearLines: () => void
  toInput: () => CartLineInput[]
}

export const useCartStore = create<CartState>((set, get) => ({
  lines: [],
  customerName: 'Walk-in',
  customerPhone: '',
  customerId: null,
  couponCode: '',
  notes: '',
  addLine: (line) => {
    const lines = [...get().lines]
    const key = `${line.product_id}-${line.variant_id ?? 0}`
    const idx = lines.findIndex((l) => `${l.product_id}-${l.variant_id ?? 0}` === key)
    if (idx >= 0) {
      lines[idx] = { ...lines[idx], qty: lines[idx].qty + line.qty }
    } else {
      lines.push(line)
    }
    set({ lines })
  },
  updateQty: (index, qty) => {
    const lines = [...get().lines]
    if (qty <= 0) lines.splice(index, 1)
    else lines[index] = { ...lines[index], qty }
    set({ lines })
  },
  removeLine: (index) => set({ lines: get().lines.filter((_, i) => i !== index) }),
  updateLineDiscount: (index, discountPercent) => {
    const lines = [...get().lines]
    if (!lines[index]) return
    lines[index] = { ...lines[index], discountPercent: Math.min(100, Math.max(0, discountPercent)) }
    set({ lines })
  },
  setCustomer: (customerName, customerPhone, customerId = null) =>
    set({ customerName, customerPhone, customerId }),
  clearCustomer: () => set({ customerName: 'Walk-in', customerPhone: '', customerId: null }),
  setCouponCode: (couponCode) => set({ couponCode }),
  setNotes: (notes) => set({ notes }),
  loadFromHeld: ({ items, customerName, customerPhone, customerId, couponCode, notes, resolveName, resolvePrice }) => {
    set({
      lines: items.map((item) => ({
        ...item,
        productName: resolveName(item),
        unitPrice: resolvePrice(item),
      })),
      customerName: customerName ?? 'Walk-in',
      customerPhone: customerPhone ?? '',
      customerId: customerId ?? null,
      couponCode: couponCode ?? '',
      notes: notes ?? '',
    })
  },
  clearLines: () => set({ lines: [], couponCode: '', notes: '' }),
  clear: () =>
    set({
      lines: [],
      customerName: 'Walk-in',
      customerPhone: '',
      customerId: null,
      couponCode: '',
      notes: '',
    }),
  toInput: () =>
    get().lines.map(({ product_id, variant_id, qty, discountPercent }) => ({
      product_id,
      variant_id,
      qty,
      ...(discountPercent ? { discount_percent: discountPercent } : {}),
    })),
}))
