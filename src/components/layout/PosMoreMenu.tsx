import { LogOut, MoreHorizontal, X } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { moreMenuItems } from './nav-items'

type Props = {
  open: boolean
  onClose: () => void
}

export function PosMoreMenu({ open, onClose }: Props) {
  const { logout } = useAuth()

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Tutup menu"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
      />
      <div className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-gray-200 bg-white pb-safe dark:border-gray-800 dark:bg-gray-900">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3 dark:border-gray-800">
          <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 dark:text-white">
            <MoreHorizontal className="h-5 w-5" />
            Lainnya
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
            aria-label="Tutup"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="space-y-1 p-2">
          {moreMenuItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-400'
                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
                }`
              }
            >
              <Icon className="h-5 w-5 shrink-0" />
              {label}
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => {
              onClose()
              void logout()
            }}
            className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
          >
            <LogOut className="h-5 w-5 shrink-0" />
            Logout
          </button>
        </nav>
      </div>
    </div>
  )
}
