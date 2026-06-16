import type { CatalogProduct } from '@/api/types'
import { CurrencyDisplay } from '@/components/common/CurrencyDisplay'
import { ProductGridSkeleton } from '@/components/ui/Skeleton'
import { isOutOfStock, stockLabel } from '@/lib/product-stock'

type Props = {
  products: CatalogProduct[]
  onSelect: (product: CatalogProduct) => void
  loading?: boolean
}

export function ProductGrid({ products, onSelect, loading }: Props) {
  if (loading && products.length === 0) {
    return <ProductGridSkeleton />
  }

  if (products.length === 0) {
    return <p className="py-12 text-center text-sm text-gray-500">Produk tidak ditemukan.</p>
  }

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
      {products.map((product) => {
        const outOfStock = isOutOfStock(product)
        return (
          <button
            key={product.id}
            type="button"
            disabled={outOfStock}
            onClick={() => !outOfStock && onSelect(product)}
            className={`rounded-xl border p-3 text-left shadow-sm transition active:scale-[0.98] ${
              outOfStock
                ? 'cursor-not-allowed border-gray-200 bg-gray-50 opacity-60 dark:border-gray-800 dark:bg-gray-900/50'
                : 'border-gray-200 bg-white hover:border-green-500 hover:shadow dark:border-gray-800 dark:bg-gray-900'
            }`}
          >
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt=""
                className={`mb-2 aspect-square w-full rounded-lg object-cover ${outOfStock ? 'grayscale' : ''}`}
              />
            ) : (
              <div className="mb-2 aspect-square w-full rounded-lg bg-gray-100 dark:bg-gray-800" />
            )}
            <div className="line-clamp-2 text-sm font-medium text-gray-900 dark:text-white">{product.name}</div>
            <div className={`mt-1 text-sm font-semibold ${outOfStock ? 'text-gray-400' : 'text-green-600'}`}>
              <CurrencyDisplay amount={product.finalPrice} />
            </div>
            <div className={`mt-1 text-xs ${outOfStock ? 'font-medium text-red-500' : 'text-gray-500'}`}>
              {stockLabel(product)}
            </div>
          </button>
        )
      })}
    </div>
  )
}
