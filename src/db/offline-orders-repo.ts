import { debugLog } from '@/lib/debug-log'
import type { OfflineOrderRecord } from './dexie'
import { db } from './dexie'

export async function saveOfflineOrder(order: OfflineOrderRecord) {
  await db.offlineOrders.put(order)
  // #region agent log
  debugLog('offline-orders-repo.ts:saveOfflineOrder', 'dexie-put-ok', {
    clientReference: order.clientReference.slice(0, 8),
    grandTotal: order.grandTotal,
  }, 'E')
  // #endregion
}

export async function listOfflineOrders(status?: OfflineOrderRecord['status']) {
  if (status) {
    return db.offlineOrders.where('status').equals(status).reverse().sortBy('createdAt')
  }
  return db.offlineOrders.orderBy('createdAt').reverse().toArray()
}

export async function updateOfflineOrderStatus(
  clientReference: string,
  status: OfflineOrderRecord['status'],
  error?: string,
) {
  await db.offlineOrders.update(clientReference, { status, error })
}

export async function countPendingOfflineOrders() {
  return db.offlineOrders.where('status').equals('pending').count()
}
