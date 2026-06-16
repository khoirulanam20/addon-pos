import { ShoppingCart } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { createHeldCart } from '@/api/held-carts'
import type { BootstrapData, CatalogProduct } from '@/api/types'
import { useAuth } from '@/app/providers/AuthProvider'
import { useNetwork } from '@/app/providers/NetworkProvider'
import { CartBottomSheet } from '@/components/pos/CartBottomSheet'
import { CartPanel } from '@/components/pos/CartPanel'
import { ProductGrid } from '@/components/pos/ProductGrid'
import { CurrencyDisplay } from '@/components/common/CurrencyDisplay'
import { getBootstrap } from '@/db/bootstrap-repo'
import { saveLocalHeldCart } from '@/db/held-carts-repo'
import { useBarcodeScanner } from '@/hooks/useBarcodeScanner'
import { useCartPreview } from '@/hooks/useCartPreview'
import { usePosCatalog } from '@/hooks/usePosCatalog'
import { uuid } from '@/lib/uuid'
import { isOutOfStock, isVariantOutOfStock } from '@/lib/product-stock'
import { useCartStore } from '@/stores/cart-store'

export function HomePage() {
  const { shift } = useAuth()
  const { apiReachable } = useNetwork()
  const navigate = useNavigate()
  const location = useLocation()
  const cart = useCartStore()
  const warehouseId = shift?.warehouseId ?? 0
  const [bootstrap, setBootstrap] = useState<BootstrapData | null>(null)
  const [cartSheetOpen, setCartSheetOpen] = useState(false)

  const { products, categories, categoryId, setCategoryId, search, setSearch, loading, scanSku, reload } =
    usePosCatalog(warehouseId)
  const preview = useCartPreview(warehouseId, bootstrap)

  useEffect(() => {
    void getBootstrap().then(setBootstrap)
  }, [])

  useEffect(() => {
    if (warehouseId && location.pathname === '/') {
      void reload()
    }
  }, [location.pathname, warehouseId, reload])

  const addProduct = (product: CatalogProduct, variant?: CatalogProduct['variants'][0]) => {
    if (variant) {
      if (isVariantOutOfStock(variant, product)) return
    } else if (isOutOfStock(product)) {
      return
    }

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
    const match = await scanSku(code)
    if (match?.product) {
      if (match.variant) addProduct(match.product, match.variant)
      else addProduct(match.product)
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

  if (!shift) return null

  const lineCount = cart.lines.length
  const hasCartItems = lineCount > 0

  return (
    <div
      className={`flex min-h-0 flex-1 flex-col gap-3 ${hasCartItems ? 'pb-14 lg:pb-0' : ''}`}
    >
      <div className="flex flex-col gap-2 lg:flex-row">
        <input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 dark:border-gray-700 dark:bg-gray-900"
        />
        <input
          placeholder="Scan barcode..."
          onKeyDown={onKeyDown}
          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 dark:border-gray-700 dark:bg-gray-900 lg:w-48"
        />
      </div>

      <div className="flex min-h-0 flex-1 gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-3 overflow-hidden">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setCategoryId(null)}
              className={`shrink-0 rounded-lg px-4 py-2.5 text-sm font-medium min-h-[44px] ${
                categoryId === null
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300'
              }`}
            >
              All
            </button>
            {categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
                className={`shrink-0 rounded-lg px-4 py-2.5 text-sm font-medium min-h-[44px] ${
                  categoryId === c.id
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                    : 'bg-white text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-auto">
            <ProductGrid products={products} onSelect={addProduct} loading={loading} />
          </div>
        </div>

        <div className="hidden w-[340px] shrink-0 lg:block">
          <CartPanel
            preview={preview}
            onHold={() => void handleHold()}
            onProceed={() => navigate('/payment')}
          />
        </div>
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
