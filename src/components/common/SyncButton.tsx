import { useSync } from '@/app/providers/SyncProvider'

export function SyncButton() {
  const { syncing, pendingCount, syncNow } = useSync()
  return (
    <button
      type="button"
      onClick={() => void syncNow()}
      disabled={syncing}
      className="rounded-lg bg-gray-800 px-3 py-1.5 text-sm hover:bg-gray-700 disabled:opacity-50"
    >
      {syncing ? 'Sync...' : `Sync${pendingCount > 0 ? ` (${pendingCount})` : ''}`}
    </button>
  )
}
