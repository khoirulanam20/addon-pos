import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { createHeldCart } from '@/api/held-carts'
import type { BootstrapData, CatalogProduct } from '@/api/types'
import { useAuth } from '@/app/providers/AuthProvider'
import { useNetwork } from '@/app/providers/NetworkProvider'
import { CartPanel } from '@/components/pos/CartPanel'
import { ProductGrid } from '@/components/pos/ProductGrid'
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

  const { products, categories, categoryId, setCategoryId, search, setSearch, scanSku, reload } =
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
      if (isVariantOutOfStock(variant)) return
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

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-3">
      <div className="flex gap-2">
        <input
          placeholder="Search products..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2 dark:border-gray-700 dark:bg-gray-900"
        />
        <input
          placeholder="Scan barcode..."
          onKeyDown={onKeyDown}
          className="w-48 rounded-lg border border-gray-300 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900"
        />
      </div>

      <div className="flex min-h-0 flex-1 gap-4">
        <div className="flex min-w-0 flex-1 flex-col gap-3 overflow-hidden">
          <div className="flex gap-2 overflow-x-auto pb-1">
            <button
              type="button"
              onClick={() => setCategoryId(null)}
              className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium ${
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
                className={`shrink-0 rounded-lg px-4 py-2 text-sm font-medium ${
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
            <ProductGrid products={products} onSelect={addProduct} />
          </div>
        </div>

        <div className="w-[340px] shrink-0">
          <CartPanel
            preview={preview}
            onHold={() => void handleHold()}
            onProceed={() => navigate('/payment')}
          />
        </div>
      </div>
    </div>
  )
}
