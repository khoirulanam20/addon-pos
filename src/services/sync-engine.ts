import { fetchCatalogPage } from '@/api/catalog'
import { fetchBootstrap, fetchCategories } from '@/api/bootstrap'
import { syncOfflineOrders } from '@/api/sync'
import { saveCatalogProducts } from '@/db/catalog-repo'
import { saveBootstrap, saveCategories } from '@/db/bootstrap-repo'
import { listOfflineOrders, updateOfflineOrderStatus } from '@/db/offline-orders-repo'
import { getLastSyncAt, setLastSyncAt } from '@/db/sync-meta-repo'

export async function pullCatalog(warehouseId: number) {
  const updatedSince = await getLastSyncAt(warehouseId)
  let page = 1
  let lastPage = 1

  do {
    const { products, meta } = await fetchCatalogPage(warehouseId, page, updatedSince ?? undefined)
    // #region agent log
    fetch('http://127.0.0.1:7854/ingest/4daf1b18-d0c4-465c-b5a4-479f15c14527',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'16bc84'},body:JSON.stringify({sessionId:'16bc84',hypothesisId:'A',location:'sync-engine.ts:pullCatalog',message:'catalog sync page',data:{warehouseId,page,updatedSince,inStock:products.filter(p=>p.stock>0).length,total:products.length,sample:products.slice(0,2).map(p=>({id:p.id,stock:p.stock}))},timestamp:Date.now()})}).catch(()=>{});
    // #endregion
    await saveCatalogProducts(warehouseId, products)
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
  const pending = await listOfflineOrders('pending')
  if (pending.length === 0) return []

  const payload = pending.map((order) => ({
    client_reference: order.clientReference,
    warehouse_id: order.warehouseId,
    created_at: order.createdAt,
    customer_name: order.customerName,
    customer_phone: order.customerPhone,
    items: order.items,
    payments: order.payments,
    notes: order.notes,
  }))

  const results = await syncOfflineOrders(payload)

  for (const result of results) {
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
  await pullCatalog(warehouseId)
  const orderResults = await pushOfflineOrders()
  return orderResults
}
