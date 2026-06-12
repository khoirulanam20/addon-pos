import { Outlet } from 'react-router-dom'
import { OfflineBanner } from '@/components/common/OfflineBanner'
import { CashDrawerModal } from '@/components/pos/CashDrawerModal'
import { useAuth } from '@/app/providers/AuthProvider'
import { PosIconSidebar } from './PosIconSidebar'
import { PosTopBar } from './PosTopBar'

export function PosAppShell() {
  const { shift } = useAuth()

  return (
    <div className="flex h-screen flex-col overflow-hidden">
      <OfflineBanner />
      {!shift && <CashDrawerModal />}
      <div className="flex min-h-0 flex-1">
        <PosIconSidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <PosTopBar />
          <main className="min-h-0 flex-1 overflow-auto bg-gray-50 p-4 dark:bg-gray-950">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  )
}
