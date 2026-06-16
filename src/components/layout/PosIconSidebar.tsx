import { LogOut } from 'lucide-react'
import { NavLink } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { sidebarNavItems } from './nav-items'

export function PosIconSidebar() {
  const { user, logout } = useAuth()

  return (
    <aside className="hidden w-[72px] shrink-0 flex-col border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 lg:flex">
      <div className="flex h-14 items-center justify-center border-b border-gray-200 dark:border-gray-800">
        <span className="text-xs font-bold text-gray-900 dark:text-white">POS</span>
      </div>
      <nav className="flex flex-1 flex-col items-center gap-1 py-3">
        {sidebarNavItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            title={label}
            className={({ isActive }) =>
              `flex w-full flex-col items-center gap-0.5 px-1 py-2 text-[10px] transition-colors ${
                isActive
                  ? 'border-l-2 border-blue-600 bg-gray-50 text-blue-600 dark:bg-gray-800 dark:text-blue-400'
                  : 'border-l-2 border-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white'
              }`
            }
          >
            <Icon className="h-5 w-5" />
            <span className="text-center leading-tight">{label}</span>
          </NavLink>
        ))}
      </nav>
      <div className="border-t border-gray-200 p-2 dark:border-gray-800">
        <div
          className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-gray-200 text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-200"
          title={user?.name}
        >
          {user?.name?.charAt(0).toUpperCase() ?? '?'}
        </div>
        <button
          type="button"
          onClick={() => void logout()}
          className="flex w-full flex-col items-center gap-0.5 py-2 text-[10px] text-gray-500 hover:text-red-600 dark:text-gray-400"
          title="Logout"
        >
          <LogOut className="h-4 w-4" />
          Logout
        </button>
      </div>
    </aside>
  )
}
