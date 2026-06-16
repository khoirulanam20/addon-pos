import { Check, ChevronLeft, ChevronRight, Plus, ShoppingCart, UserRound, X } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { createHeldCart } from '@/api/held-carts'
import { listCustomers, quickCreateCustomer } from '@/api/customers'
import type { CustomerListMeta, CustomerResult } from '@/api/customers'
import type { BootstrapData } from '@/api/types'
import { useAuth } from '@/app/providers/AuthProvider'
import { useNetwork } from '@/app/providers/NetworkProvider'
import { CartBottomSheet } from '@/components/pos/CartBottomSheet'
import { CartPanel } from '@/components/pos/CartPanel'
import { CurrencyDisplay } from '@/components/common/CurrencyDisplay'
import { CustomerListSkeleton } from '@/components/ui/Skeleton'
import { getBootstrap } from '@/db/bootstrap-repo'
import { saveLocalHeldCart } from '@/db/held-carts-repo'
import { useCartPreview } from '@/hooks/useCartPreview'
import { uuid } from '@/lib/uuid'
import { useCartStore } from '@/stores/cart-store'

function formatCustomerEmail(email: string | null | undefined): string | null {
  if (!email || email.includes('@walk-in.local')) return null
  return email
}

function formatCustomerDate(value: string | null | undefined): string {
  if (!value) return '-'
  return new Date(value).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function CustomersPage() {
  const navigate = useNavigate()
  const { shift } = useAuth()
  const { apiReachable } = useNetwork()
  const warehouseId = shift?.warehouseId ?? 0
  const [bootstrap, setBootstrap] = useState<BootstrapData | null>(null)
  const preview = useCartPreview(warehouseId, bootstrap)

  const customerId = useCartStore((s) => s.customerId)
  const customerName = useCartStore((s) => s.customerName)
  const customerPhone = useCartStore((s) => s.customerPhone)
  const cart = useCartStore()
  const setCustomer = useCartStore((s) => s.setCustomer)
  const clearCustomer = useCartStore((s) => s.clearCustomer)

  const [q, setQ] = useState('')
  const [customers, setCustomers] = useState<CustomerResult[]>([])
  const [meta, setMeta] = useState<CustomerListMeta | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showQuickAdd, setShowQuickAdd] = useState(false)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [cartSheetOpen, setCartSheetOpen] = useState(false)

  useEffect(() => {
    void getBootstrap().then(setBootstrap)
  }, [])

  const loadCustomers = useCallback(async (searchQ: string, pageNum: number) => {
    if (!apiReachable) {
      setCustomers([])
      setMeta(null)
      return
    }

    setLoading(true)
    try {
      const { customers: rows, meta: listMeta } = await listCustomers({
        q: searchQ.trim() || undefined,
        page: pageNum,
        per_page: 10,
      })
      setCustomers(rows)
      setMeta(listMeta ?? null)
    } finally {
      setLoading(false)
    }
  }, [apiReachable])

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadCustomers(q, page)
    }, 300)

    return () => window.clearTimeout(timer)
  }, [q, page, loadCustomers])

  useEffect(() => {
    setPage(1)
  }, [q])

  const selectCustomer = (c: CustomerResult) => {
    setCustomer(c.name, c.phone ?? '', c.id)
  }

  const createQuick = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const c = await quickCreateCustomer({ name, phone, email: email || undefined })
      setCustomer(c.name, c.phone ?? '', c.id)
      setName('')
      setPhone('')
      setEmail('')
      setShowQuickAdd(false)
      void loadCustomers(q, 1)
      setPage(1)
    } finally {
      setSubmitting(false)
    }
  }

  const handleHold = async () => {
    if (!warehouseId || cart.lines.length === 0) return
    if (apiReachable) {
      await createHeldCart({
        warehouse_id: warehouseId,
        label: `Hold ${new Date().toLocaleTimeString('id-ID')}`,
        customer_name: cart.customerName,
        customer_phone: cart.customerPhone,
        customer_id: cart.customerId,
        items: cart.toInput(),
        coupon_code: cart.couponCode || null,
        notes: cart.notes,
      })
    } else {
      await saveLocalHeldCart({
        id: uuid(),
        label: 'Hold offline',
        warehouseId,
        customerName: cart.customerName,
        customerPhone: cart.customerPhone,
        items: cart.toInput(),
        couponCode: cart.couponCode,
        notes: cart.notes,
        heldAt: new Date().toISOString(),
      })
    }
    cart.clear()
  }

  const isWalkIn = !customerId
  const lineCount = cart.lines.length
  const hasCartItems = lineCount > 0
  const showingFrom = meta && meta.total > 0 ? (meta.currentPage - 1) * meta.perPage + 1 : 0
  const showingTo = meta ? Math.min(meta.currentPage * meta.perPage, meta.total) : 0

  if (!shift) return null

  return (
    <div className={`flex min-h-0 flex-1 gap-4 ${hasCartItems ? 'pb-14 lg:pb-0' : ''}`}>
      <div className="flex min-w-0 flex-1 flex-col gap-4 overflow-hidden">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-semibold">Customers</h1>
          <button
            type="button"
            onClick={() => setShowQuickAdd((v) => !v)}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white dark:bg-gray-700"
          >
            <Plus className="h-4 w-4" />
            Tambah Pelanggan
          </button>
        </div>

        <div
          className={`rounded-xl border p-4 ${
            isWalkIn
              ? 'border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900'
              : 'border-green-200 bg-green-50 dark:border-green-900 dark:bg-green-950/30'
          }`}
        >
          <div className="mb-2 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-gray-500">Pelanggan aktif</span>
            {!isWalkIn && (
              <button
                type="button"
                onClick={() => clearCustomer()}
                className="flex items-center gap-1 text-xs text-gray-500 hover:text-red-600"
              >
                <X className="h-3 w-3" />
                Reset
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <UserRound className={`h-5 w-5 ${isWalkIn ? 'text-gray-400' : 'text-green-600'}`} />
            </div>
            <div>
              <div className="font-medium">{isWalkIn ? 'Walk-in' : customerName}</div>
              {customerPhone && <div className="text-sm text-gray-500">{customerPhone}</div>}
              {isWalkIn && <div className="text-sm text-gray-400">Tanpa pelanggan terdaftar</div>}
            </div>
          </div>
        </div>

        {showQuickAdd && (
          <form
            onSubmit={createQuick}
            className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-800 dark:bg-gray-900"
          >
            <h2 className="mb-4 font-semibold">Tambah Pelanggan Baru</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                Nama
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                />
              </label>
              <label className="block text-sm">
                Telepon
                <input
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                />
              </label>
              <label className="block text-sm sm:col-span-2">
                Email (opsional)
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
                />
              </label>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                Simpan & Pilih
              </button>
              <button
                type="button"
                onClick={() => setShowQuickAdd(false)}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700"
              >
                Batal
              </button>
            </div>
          </form>
        )}

        <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
          <div className="border-b border-gray-200 p-4 dark:border-gray-800">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search Customers..."
              className="w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
            />
          </div>

          <div className="min-h-0 flex-1 overflow-auto">
            {!apiReachable && (
              <p className="p-6 text-center text-sm text-amber-600">
                Daftar pelanggan membutuhkan koneksi internet.
              </p>
            )}
            {apiReachable && loading && customers.length === 0 && <CustomerListSkeleton />}
            {apiReachable && !loading && customers.length === 0 && (
              <p className="p-6 text-center text-sm text-gray-500">Belum ada pelanggan ditemukan.</p>
            )}
            {customers.map((c) => {
              const selected = customerId === c.id
              const displayEmail = formatCustomerEmail(c.email)
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => selectCustomer(c)}
                  className={`flex w-full items-center gap-3 border-b border-gray-100 px-4 py-3 text-left transition last:border-b-0 dark:border-gray-800 ${
                    selected
                      ? 'bg-green-50 dark:bg-green-950/30'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800/50'
                  }`}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
                    <UserRound className="h-5 w-5 text-gray-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate font-medium">{c.name}</span>
                      {selected && <Check className="h-4 w-4 shrink-0 text-green-600" />}
                    </div>
                    <div className="truncate text-sm text-gray-500">
                      {displayEmail ?? c.phone ?? '-'}
                    </div>
                  </div>
                  <div className="shrink-0 text-xs text-gray-400">{formatCustomerDate(c.createdAt)}</div>
                </button>
              )
            })}
          </div>

          {meta && meta.total > 0 && (
            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 text-sm text-gray-500 dark:border-gray-800">
              <span>
                Menampilkan {showingFrom}–{showingTo} dari {meta.total} pelanggan
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={meta.currentPage <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded border border-gray-300 p-1 disabled:opacity-40 dark:border-gray-700"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span>
                  Halaman {meta.currentPage} / {meta.lastPage}
                </span>
                <button
                  type="button"
                  disabled={meta.currentPage >= meta.lastPage}
                  onClick={() => setPage((p) => p + 1)}
                  className="rounded border border-gray-300 p-1 disabled:opacity-40 dark:border-gray-700"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="hidden w-[340px] shrink-0 lg:block">
        <CartPanel
          preview={preview}
          onHold={() => void handleHold()}
          onProceed={() => navigate('/payment')}
        />
      </div>

      {hasCartItems && (
        <div className="bottom-nav-offset fixed inset-x-0 z-30 border-t border-gray-200 bg-white px-4 py-2 shadow-lg dark:border-gray-800 dark:bg-gray-900 lg:hidden">
          <div className="flex items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="text-xs text-gray-500">
                {lineCount} item{lineCount > 1 ? 's' : ''}
              </div>
              <div className="text-base font-bold text-green-600">
                <CurrencyDisplay amount={preview?.grandTotal ?? 0} />
              </div>
            </div>
            <button
              type="button"
              onClick={() => setCartSheetOpen(true)}
              className="flex min-h-[44px] items-center gap-2 rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700"
            >
              <ShoppingCart className="h-5 w-5" />
              Keranjang
            </button>
          </div>
        </div>
      )}

      <CartBottomSheet
        open={cartSheetOpen}
        onClose={() => setCartSheetOpen(false)}
        preview={preview}
        onHold={() => void handleHold()}
        onProceed={() => navigate('/payment')}
      />
    </div>
  )
}
