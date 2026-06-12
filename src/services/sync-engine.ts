import { fetchCatalogPage } from '@/api/catalog'
import { fetchBootstrap, fetchCategories } from '@/api/bootstrap'
import { syncOfflineOrders } from '@/api/sync'
import { debugLog } from '@/lib/debug-log'
import { saveCatalogFromSync } from '@/db/catalog-repo'
import { saveBootstrap, saveCategories } from '@/db/bootstrap-repo'
import { listOfflineOrders, updateOfflineOrderStatus } from '@/db/offline-orders-repo'
import { getLastSyncAt, setLastSyncAt } from '@/db/sync-meta-repo'
import { prepareOfflineOrderPayload } from '@/services/prepare-offline-sync'

export async function pullCatalog(warehouseId: number) {
  const updatedSince = await getLastSyncAt(warehouseId)
  let page = 1
  let lastPage = 1

  do {
    const { products, meta } = await fetchCatalogPage(warehouseId, page, updatedSince ?? undefined)
    await saveCatalogFromSync(warehouseId, products)
    lastPage = meta.lastPage
    page += 1
  } while (page <= lastPage)

  const syncedAt = new Date().toISOString()
  await setLastSyncAt(warehouseId, syncedAt)
  return syncedAt
}

export async function pullBootstrapData() {
  const [bootstrap, categories] = await Promise.all([fetchBootstrap(), fetchCategories()])
  await saveBootstrap(bootstrap)
  await saveCategories(categories)
  return { bootstrap, categories }
}

export async function pushOfflineOrders() {
  const [pending, failed] = await Promise.all([
    listOfflineOrders('pending'),
    listOfflineOrders('failed'),
  ])
  const toSync = [...pending, ...failed]
  if (toSync.length === 0) return []

  const payload = await Promise.all(toSync.map((order) => prepareOfflineOrderPayload(order)))

  const results = await syncOfflineOrders(payload)

  for (const result of results) {
    // #region agent log
    debugLog('sync-engine.ts:pushOfflineOrders', 'sync-result', {
      clientReference: result.client_reference.slice(0, 8),
      status: result.status,
      error: result.error ?? null,
    }, 'F')
    // #endregion

    if (result.status === 'created' || result.status === 'duplicate') {
      await updateOfflineOrderStatus(result.client_reference, 'synced')
    } else {
      await updateOfflineOrderStatus(result.client_reference, 'failed', result.error)
    }
  }

  return results
}

export async function fullSync(warehouseId: number) {
  await pullBootstrapData()
  const orderResults = await pushOfflineOrders()
  // #region agent log
  debugLog('sync-engine.ts:fullSync', 'orders-pushed-before-catalog', {
    warehouseId,
    pushedCount: orderResults.length,
    statuses: orderResults.map((r) => r.status),
  }, 'S')
  // #endregion
  await pullCatalog(warehouseId)
  return orderResults
}
