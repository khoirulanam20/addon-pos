import { MoreHorizontal } from 'lucide-react'
import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { useCartStore } from '@/stores/cart-store'
import { bottomNavItems } from './nav-items'
import { PosMoreMenu } from './PosMoreMenu'

export function PosBottomNav() {
  const [moreOpen, setMoreOpen] = useState(false)
  const lineCount = useCartStore((s) => s.lines.length)

  return (
    <>
      <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white pb-safe dark:border-gray-800 dark:bg-gray-900 lg:hidden">
        <div className="flex h-14 items-stretch">
          {bottomNavItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `relative flex flex-1 flex-col items-center justify-center gap-0.5 border-t-2 px-1 text-[10px] font-medium transition-colors ${
                  isActive
                    ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                }`
              }
            >
              <span className="relative">
                <Icon className="h-5 w-5" />
                {to === '/' && lineCount > 0 && (
                  <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-green-600 px-1 text-[9px] font-bold text-white">
                    {lineCount > 99 ? '99+' : lineCount}
                  </span>
                )}
              </span>
              <span>{label}</span>
            </NavLink>
          ))}
          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={`flex flex-1 flex-col items-center justify-center gap-0.5 border-t-2 px-1 text-[10px] font-medium transition-colors ${
              moreOpen
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
            }`}
          >
            <MoreHorizontal className="h-5 w-5" />
            <span>Lainnya</span>
          </button>
        </div>
      </nav>
      <PosMoreMenu open={moreOpen} onClose={() => setMoreOpen(false)} />
    </>
  )
}
