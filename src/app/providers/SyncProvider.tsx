import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { countPendingOfflineOrders } from '@/db/offline-orders-repo'
import { fullSync } from '@/services/sync-engine'
import { useAuth } from './AuthProvider'
import { useNetwork } from './NetworkProvider'

type SyncContextValue = {
  syncing: boolean
  pendingCount: number
  syncNow: () => Promise<void>
  refreshPending: () => Promise<void>
}

const SyncContext = createContext<SyncContextValue | null>(null)

export function SyncProvider({ children }: { children: ReactNode }) {
  const { shift } = useAuth()
  const { apiReachable } = useNetwork()
  const [syncing, setSyncing] = useState(false)
  const [pendingCount, setPendingCount] = useState(0)

  const refreshPending = useCallback(async () => {
    setPendingCount(await countPendingOfflineOrders())
  }, [])

  const syncNow = useCallback(async () => {
    if (!shift || !apiReachable) return
    setSyncing(true)
    try {
      await fullSync(shift.warehouseId)
      await refreshPending()
    } finally {
      setSyncing(false)
    }
  }, [shift, apiReachable, refreshPending])

  useEffect(() => {
    void refreshPending()
  }, [refreshPending])

  useEffect(() => {
    if (apiReachable && shift) {
      void syncNow()
    }
  }, [apiReachable, shift?.warehouseId])

  return (
    <SyncContext.Provider value={{ syncing, pendingCount, syncNow, refreshPending }}>
      {children}
    </SyncContext.Provider>
  )
}

export function useSync() {
  const ctx = useContext(SyncContext)
  if (!ctx) throw new Error('useSync must be used within SyncProvider')
  return ctx
}
