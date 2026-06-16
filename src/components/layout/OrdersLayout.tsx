import { Outlet } from 'react-router-dom'
import { PosTabs } from '@/components/ui/PosTabs'

const tabs = [
  { to: '/orders/history', label: 'History', end: true },
  { to: '/orders/hold', label: 'Orders On Hold' },
  { to: '/orders/offline', label: 'Offline Orders' },
]

export function OrdersLayout() {
  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <PosTabs tabs={tabs} />
      <div className="min-h-0 flex-1">
        <Outlet />
      </div>
    </div>
  )
}
