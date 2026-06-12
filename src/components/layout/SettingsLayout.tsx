import { Outlet } from 'react-router-dom'
import { PosTabs } from '@/components/ui/PosTabs'

const tabs = [
  { to: '/settings/profile', label: 'Profile', end: true },
  { to: '/settings/sync', label: 'Sync' },
  { to: '/settings/shortcuts', label: 'Shortcuts' },
]

export function SettingsLayout() {
  return (
    <div className="space-y-4">
      <PosTabs tabs={tabs} />
      <Outlet />
    </div>
  )
}
