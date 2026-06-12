import { db } from './dexie'

export async function getLastSyncAt(warehouseId: number) {
  const row = await db.syncMeta.get(warehouseId)
  return row?.lastCatalogSyncAt ?? null
}

export async function setLastSyncAt(warehouseId: number, iso: string) {
  await db.syncMeta.put({ warehouseId, lastCatalogSyncAt: iso })
}
