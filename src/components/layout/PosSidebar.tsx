import { NavLink } from 'react-router-dom'

const links = [
  { to: '/', label: 'Jual' },
  { to: '/held', label: 'Hold' },
  { to: '/offline', label: 'Offline' },
  { to: '/history', label: 'Riwayat' },
  { to: '/close-shift', label: 'Tutup Shift' },
]

export function PosSidebar() {
  return (
    <aside className="flex w-44 shrink-0 flex-col gap-1 border-r border-gray-800 bg-gray-900 p-3">
      {links.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.to === '/'}
          className={({ isActive }) =>
            `rounded-lg px-3 py-2 text-sm ${isActive ? 'bg-indigo-600 text-white' : 'text-gray-300 hover:bg-gray-800'}`
          }
        >
          {link.label}
        </NavLink>
      ))}
    </aside>
  )
}
