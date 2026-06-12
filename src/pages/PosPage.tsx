import { useCallback, useEffect, useMemo, useState } from 'react'
import { previewCart } from '@/api/cart'
import { createOrder } from '@/api/orders'
import { createHeldCart } from '@/api/held-carts'
import { fetchProductBySku, searchProducts } from '@/api/products'
import type { BootstrapData, CatalogProduct, CartPreviewData, CategoryNode } from '@/api/types'
import { useAuth } from '@/app/providers/AuthProvider'
import { useNetwork } from '@/app/providers/NetworkProvider'
import { useSync } from '@/app/providers/SyncProvider'
import { CurrencyDisplay } from '@/components/common/CurrencyDisplay'
import { PaymentModal } from '@/components/pos/PaymentModal'
import { getBootstrap, getCategories } from '@/db/bootstrap-repo'
import { getCatalogProducts, findProductBySku, decrementLocalStock } from '@/db/catalog-repo'
import { saveLocalHeldCart } from '@/db/held-carts-repo'
import { saveOfflineOrder } from '@/db/offline-orders-repo'
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner'
import { uuid } from '@/lib/uuid'
import { calculateOfflineTotal } from '@/services/offline-pricing'
import { printReceipt } from '@/services/receipt-printer'
import { useCartStore } from '@/stores/cart-store'

export function PosPage() {
  const { shift } = useAuth()
  const { apiReachable } = useNetwork()
  const { refreshPending } = useSync()
  const cart = useCartStore()
  const [products, setProducts] = useState<CatalogProduct[]>([])
  const [categories, setCategories] = useState<CategoryNode[]>([])
  const [bootstrap, setBootstrap] = useState<BootstrapData | null>(null)
  const [categoryId, setCategoryId] = useState<number | null>(null)
  const [search, setSearch] = useState('')
  const [preview, setPreview] = useState<CartPreviewData | null>(null)
  const [showPay, setShowPay] = useState(false)
  const [loading, setLoading] = useState(false)

  const warehouseId = shift?.warehouseId ?? 0

  const loadCatalog = useCallback(async () => {
    if (!warehouseId) return
    if (apiReachable) {
      const { products: online } = await searchProducts({
        warehouse_id: warehouseId,
        q: search || undefined,
        category_id: categoryId ?? undefined,
      })
      setProducts(online)
    } else {
      const cached = await getCatalogProducts(warehouseId, categoryId)
      const filtered = search
        ? cached.filter(
            (p) =>
              p.name.toLowerCase().includes(search.toLowerCase()) ||
              p.sku?.toLowerCase().includes(search.toLowerCase()),
          )
        : cached
      setProducts(filtered)
    }
  }, [warehouseId, apiReachable, search, categoryId])

  useEffect(() => {
    void loadCatalog()
  }, [loadCatalog])

  useEffect(() => {
    void getBootstrap().then(setBootstrap)
    void getCategories().then(setCategories)
  }, [])

  useEffect(() => {
    if (!warehouseId || cart.lines.length === 0) {
      setPreview(null)
      return
    }
    if (apiReachable) {
      previewCart({
        warehouse_id: warehouseId,
        items: cart.toInput(),
        coupon_code: cart.couponCode || null,
        customer_id: cart.customerId,
      })
        .then(setPreview)
        .catch(() => setPreview(null))
    } else if (bootstrap) {
      getCatalogProducts(warehouseId).then((cached) => {
        try {
          const result = calculateOfflineTotal(cart.toInput(), cached, bootstrap.tax)
          setPreview({
            lineItems: result.lines.map((l, i) => ({
              productId: cart.lines[i].product_id,
              variantId: cart.lines[i].variant_id ?? null,
              sku: cart.lines[i].sku ?? null,
              productName: l.name,
              qty: l.qty,
              unitPrice: l.unitPrice,
              subtotal: l.subtotal,
              size: cart.lines[i].size ?? null,
              color: cart.lines[i].color ?? null,
            })),
            subtotal: result.subtotal,
            taxAmount: result.taxAmount,
            discountAmount: 0,
            grandTotal: result.grandTotal,
            couponCode: null,
            taxIncluded: bootstrap.tax.included,
            stockWarnings: [],
          })
        } catch {
          setPreview(null)
        }
      })
    }
  }, [cart.lines, cart.couponCode, warehouseId, apiReachable, bootstrap])

  const flatCategories = useMemo(() => {
    const flat: CategoryNode[] = []
    const walk = (nodes: CategoryNode[]) => {
      nodes.forEach((n) => {
        flat.push(n)
        walk(n.children)
      })
    }
    walk(categories)
    return flat
  }, [categories])

  const addProduct = (product: CatalogProduct, variant?: CatalogProduct['variants'][0]) => {
    cart.addLine({
      product_id: product.id,
      variant_id: variant?.id ?? null,
      qty: 1,
      productName: variant?.name ?? product.name,
      unitPrice: variant?.finalPrice ?? product.finalPrice,
      sku: variant?.sku ?? product.sku,
      size: variant?.size ?? null,
      color: variant?.color ?? null,
    })
  }

  const handleScan = async (code: string) => {
    if (!warehouseId) return
    if (apiReachable) {
      const match = await fetchProductBySku(code, warehouseId)
      if (match.product) {
        if (match.variant) addProduct(match.product, match.variant)
        else addProduct(match.product)
      }
    } else {
      const match = await findProductBySku(warehouseId, code)
      if (match?.product) {
        if (match.variant) addProduct(match.product, match.variant)
        else addProduct(match.product)
      }
    }
  }

  const { onKeyDown } = useBarcodeScanner(handleScan)

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
        label: `Hold offline`,
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

  const completePayment = async (payments: Parameters<typeof createOrder>[0]['payments']) => {
    if (!warehouseId || !preview) return
    setLoading(true)
    try {
      if (apiReachable) {
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
        printReceipt({
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
      } else {
        const clientReference = uuid()
        await saveOfflineOrder({
          clientReference,
          warehouseId,
          status: 'pending',
          customerName: cart.customerName,
          customerPhone: cart.customerPhone,
          items: cart.toInput(),
          payments,
          subtotal: preview.subtotal,
          taxAmount: preview.taxAmount,
          grandTotal: preview.grandTotal,
          notes: cart.notes,
          createdAt: new Date().toISOString(),
        })
        for (const line of cart.lines) {
          await decrementLocalStock(warehouseId, line.product_id, line.variant_id, line.qty)
        }
        await refreshPending()
        printReceipt({
          storeName: bootstrap?.store.name ?? 'Toko',
          orderNumber: `OFF-${clientReference.slice(0, 8)}`,
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
      }
      cart.clear()
      setShowPay(false)
      void loadCatalog()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      <div className="w-40 shrink-0 space-y-1 overflow-auto">
        <button
          type="button"
          onClick={() => setCategoryId(null)}
          className={`w-full rounded-lg px-3 py-2 text-left text-sm ${categoryId === null ? 'bg-indigo-600' : 'bg-gray-800'}`}
        >
          Semua
        </button>
        {flatCategories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategoryId(c.id)}
            className={`w-full rounded-lg px-3 py-2 text-left text-sm ${categoryId === c.id ? 'bg-indigo-600' : 'bg-gray-800'}`}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="flex flex-1 flex-col gap-3 overflow-hidden">
        <div className="flex gap-2">
          <input
            placeholder="Cari produk..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2"
          />
          <input
            placeholder="Scan barcode..."
            onKeyDown={onKeyDown}
            className="w-48 rounded-lg border border-gray-700 bg-gray-900 px-3 py-2"
          />
        </div>
        <div className="grid flex-1 grid-cols-2 gap-3 overflow-auto md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <button
              key={product.id}
              type="button"
              onClick={() => addProduct(product)}
              className="rounded-xl border border-gray-800 bg-gray-900 p-3 text-left hover:border-indigo-500"
            >
              {product.imageUrl && (
                <img src={product.imageUrl} alt="" className="mb-2 h-24 w-full rounded object-cover" />
              )}
              <div className="text-sm font-medium line-clamp-2">{product.name}</div>
              <div className="text-indigo-400">
                <CurrencyDisplay amount={product.finalPrice} />
              </div>
              <div className="text-xs text-gray-500">Stok: {product.stock}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex w-80 shrink-0 flex-col rounded-xl border border-gray-800 bg-gray-900">
        <div className="border-b border-gray-800 p-3 font-semibold">Keranjang</div>
        <div className="flex-1 space-y-2 overflow-auto p-3">
          {cart.lines.map((line, index) => (
            <div key={`${line.product_id}-${line.variant_id}`} className="rounded-lg bg-gray-950 p-2 text-sm">
              <div className="font-medium">{line.productName}</div>
              <div className="mt-1 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button type="button" onClick={() => cart.updateQty(index, line.qty - 1)} className="px-2">-</button>
                  <span>{line.qty}</span>
                  <button type="button" onClick={() => cart.updateQty(index, line.qty + 1)} className="px-2">+</button>
                </div>
                <CurrencyDisplay amount={line.unitPrice * line.qty} />
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-2 border-t border-gray-800 p-3">
          <input
            placeholder="Pelanggan"
            value={cart.customerName}
            onChange={(e) => cart.setCustomer(e.target.value, cart.customerPhone, cart.customerId)}
            className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm"
          />
          <input
            placeholder="Kupon (online saja)"
            value={cart.couponCode}
            disabled={!apiReachable}
            onChange={(e) => cart.setCouponCode(e.target.value)}
            className="w-full rounded-lg border border-gray-700 bg-gray-950 px-3 py-2 text-sm disabled:opacity-50"
          />
          <div className="flex justify-between text-sm">
            <span>Total</span>
            <span className="font-bold">
              <CurrencyDisplay amount={preview?.grandTotal ?? 0} />
            </span>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => void handleHold()}
              disabled={cart.lines.length === 0}
              className="flex-1 rounded-lg bg-gray-800 py-2 text-sm"
            >
              Hold
            </button>
            <button
              type="button"
              onClick={() => setShowPay(true)}
              disabled={!preview || cart.lines.length === 0 || loading}
              className="flex-1 rounded-lg bg-indigo-600 py-2 text-sm font-medium disabled:opacity-50"
            >
              Bayar
            </button>
          </div>
        </div>
      </div>

      {showPay && preview && bootstrap && (
        <PaymentModal
          grandTotal={preview.grandTotal}
          banks={bootstrap.paymentBanks}
          onClose={() => setShowPay(false)}
          onConfirm={(payments) => void completePayment(payments)}
        />
      )}
    </div>
  )
}
