import { useAuth } from '@/app/providers/AuthProvider'
import { ProductGrid } from '@/components/pos/ProductGrid'
import { usePosCatalog } from '@/hooks/usePosCatalog'

export function ProductsPage() {
  const { shift } = useAuth()
  const warehouseId = shift?.warehouseId ?? 0
  const { products, categories, categoryId, setCategoryId, search, setSearch, loading } =
    usePosCatalog(warehouseId)

  if (!shift) return null

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold">Products</h1>
      <input
        placeholder="Search products..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md rounded-lg border border-gray-300 px-4 py-2 dark:border-gray-700 dark:bg-gray-900"
      />
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          type="button"
          onClick={() => setCategoryId(null)}
          className={`shrink-0 rounded-lg px-4 py-2 text-sm ${
            categoryId === null ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-white dark:bg-gray-800'
          }`}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategoryId(c.id)}
            className={`shrink-0 rounded-lg px-4 py-2 text-sm ${
              categoryId === c.id ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900' : 'bg-white dark:bg-gray-800'
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>
      <ProductGrid products={products} onSelect={() => {}} loading={loading} />
    </div>
  )
}
