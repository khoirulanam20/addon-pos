import { apiFetch } from './client'
import type { BootstrapData, CategoryNode } from './types'

export async function fetchBootstrap() {
  const { data } = await apiFetch<BootstrapData>('/bootstrap')
  return data
}

export async function fetchCategories() {
  const { data } = await apiFetch<CategoryNode[]>('/categories')
  return data
}
