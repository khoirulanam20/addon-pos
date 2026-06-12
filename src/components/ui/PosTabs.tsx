import { NavLink } from 'react-router-dom'

export type PosTabItem = {
  to: string
  label: string
  end?: boolean
}

type Props = {
  tabs: PosTabItem[]
  className?: string
}

export function PosTabs({ tabs, className = '' }: Props) {
  return (
    <div className={`flex flex-wrap gap-2 border-b border-gray-200 pb-3 dark:border-gray-800 ${className}`}>
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          end={tab.end}
          className={({ isActive }) =>
            `rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? 'border-gray-900 bg-white text-gray-900 shadow-sm dark:border-gray-100 dark:bg-gray-900 dark:text-white'
                : 'border-transparent text-gray-600 hover:bg-white hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-white'
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  )
}
