import { Outlet } from 'react-router-dom'
import { PosTabs } from '@/components/ui/PosTabs'

const tabs = [
  { to: '/cashier/drawer', label: 'Cash Drawer', end: true },
  { to: '/cashier/today-sale', label: "Today's Sale" },
  { to: '/cashier/sale-history', label: 'Sale History' },
]

export function CashierLayout() {
  return (
    <div className="space-y-4">
      <PosTabs tabs={tabs} />
      <Outlet />
    </div>
  )
}
