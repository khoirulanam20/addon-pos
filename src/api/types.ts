export type ApiResponse<T> = {
  data: T
  meta?: Record<string, unknown>
}

export type UserPayload = {
  id: number
  name: string
  email: string
  isSuperAdmin: boolean
  permissions: string[]
}

export type ShiftPayload = {
  id: number
  warehouseId: number
  warehouseName?: string
  openedAt: string
  openingCash: number
  status: string
} | null

export type LoginData = {
  token: string
  user: UserPayload
  currentShift: ShiftPayload
}

export type MeData = {
  user: UserPayload
  currentShift: ShiftPayload
}

export type BootstrapData = {
  store: { name: string; address?: string; phone?: string; email?: string }
  tax: { included: boolean; enabled: boolean }
  warehouses: Array<{ id: number; name: string; address?: string; city?: string }>
  paymentBanks: Array<{
    id: number
    bankName: string
    accountNumber: string
    accountName: string
  }>
}

export type CategoryNode = {
  id: number
  name: string
  slug: string
  imageUrl?: string
  children: CategoryNode[]
}

export type CatalogProduct = {
  id: number
  categoryId: number | null
  type: string
  sku: string | null
  name: string
  price: number
  salePrice: number | null
  finalPrice: number
  imageUrl: string
  trackStock: boolean
  stock: number
  updatedAt?: string
  variants: CatalogVariant[]
}

export type CatalogVariant = {
  id: number
  parentProductId: number
  sku: string
  name: string
  price: number | null
  finalPrice: number
  size: string | null
  color: string | null
  imageUrl: string
  trackStock: boolean
  stock: number
}

export type CartLineInput = {
  product_id: number
  variant_id?: number | null
  qty: number
  discount_percent?: number
}

export type CartPreviewData = {
  lineItems: Array<{
    productId: number
    variantId: number | null
    sku: string | null
    productName: string
    qty: number
    unitPrice: number
    subtotal: number
    size: string | null
    color: string | null
  }>
  subtotal: number
  taxAmount: number
  discountAmount: number
  grandTotal: number
  couponCode: string | null
  taxIncluded: boolean
  stockWarnings: Array<{ product_id: number; variant_id: number | null; message: string }>
}

export type PaymentInput = {
  method: 'cash' | 'transfer'
  amount: number
  payment_bank_id?: number
  reference?: string
}

export type OrderSummary = {
  id: number
  orderNumber: string
  customerName: string
  customerPhone: string
  grandTotal: number
  totalQty: number
  paymentMethod: string
  paymentStatus: string
  orderStatus: string
  warehouseId: number
  posShiftId: number | null
  createdAt: string
}

export type OrderDetail = OrderSummary & {
  subtotal: number
  taxAmount: number
  discountAmount: number
  items: Array<{
    id: number
    productId: number
    variantId: number | null
    sku: string | null
    productName: string
    productPrice: number
    qty: number
    subtotal: number
  }>
  payments: Array<{
    id: number
    method: string
    amount: number
    paymentBankId: number | null
    reference: string | null
  }>
}

export type HeldCart = {
  id: number
  label: string | null
  warehouseId: number
  warehouseName?: string
  customerId: number | null
  customerName: string | null
  customerPhone: string | null
  items: CartLineInput[]
  couponCode: string | null
  notes: string | null
  heldAt: string
}

export type SyncResult = {
  client_reference: string
  status: 'created' | 'duplicate' | 'failed'
  order_id?: number
  order_number?: string
  error?: string
}
