import Dexie, { type EntityTable } from 'dexie'
import type { BootstrapData, CatalogProduct, CategoryNode } from '@/api/types'

export type OfflineOrderRecord = {
  clientReference: string
  warehouseId: number
  status: 'pending' | 'synced' | 'failed'
  customerName: string
  customerPhone: string
  items: Array<{ product_id: number; variant_id?: number | null; qty: number }>
  payments: Array<{ method: 'cash' | 'transfer'; amount: number; payment_bank_id?: number; reference?: string }>
  subtotal: number
  taxAmount: number
  grandTotal: number
  notes?: string
  error?: string
  createdAt: string
}

export type LocalHeldCart = {
  id: string
  label?: string
  warehouseId: number
  customerName?: string
  customerPhone?: string
  items: OfflineOrderRecord['items']
  couponCode?: string | null
  notes?: string
  heldAt: string
}

export type CatalogProductRecord = CatalogProduct & { warehouseId: number }
export type BootstrapRecord = { key: string; value: BootstrapData | CategoryNode[] }

export type SyncMetaRecord = {
  warehouseId: number
  lastCatalogSyncAt: string
}

export const db = new Dexie('yclothes-pos') as Dexie & {
  catalogProducts: EntityTable<CatalogProductRecord, 'id'>
  bootstrap: EntityTable<BootstrapRecord, 'key'>
  offlineOrders: EntityTable<OfflineOrderRecord, 'clientReference'>
  heldCarts: EntityTable<LocalHeldCart, 'id'>
  syncMeta: EntityTable<SyncMetaRecord, 'warehouseId'>
}

db.version(1).stores({
  catalogProducts: 'id, warehouseId, sku, categoryId, name',
  bootstrap: 'key',
  offlineOrders: 'clientReference, status, createdAt',
  heldCarts: 'id, heldAt, warehouseId',
  syncMeta: 'warehouseId',
})
