import type { LocalHeldCart } from './dexie'
import { db } from './dexie'

export async function saveLocalHeldCart(cart: LocalHeldCart) {
  await db.heldCarts.put(cart)
}

export async function listLocalHeldCarts(warehouseId?: number) {
  const all = await db.heldCarts.orderBy('heldAt').reverse().toArray()
  return warehouseId ? all.filter((c) => c.warehouseId === warehouseId) : all
}

export async function deleteLocalHeldCart(id: string) {
  await db.heldCarts.delete(id)
}
