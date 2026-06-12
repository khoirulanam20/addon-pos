import type { BootstrapData, CategoryNode } from '@/api/types'
import { db } from './dexie'

export async function saveBootstrap(data: BootstrapData) {
  await db.bootstrap.put({ key: 'bootstrap', value: data })
}

export async function getBootstrap() {
  const row = await db.bootstrap.get('bootstrap')
  return (row?.value as BootstrapData) ?? null
}

export async function saveCategories(categories: CategoryNode[]) {
  await db.bootstrap.put({ key: 'categories', value: categories })
}

export async function getCategories() {
  const row = await db.bootstrap.get('categories')
  return (row?.value as CategoryNode[]) ?? []
}
