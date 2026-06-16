import {
  BarChart3,
  Home,
  Package,
  Settings,
  ShoppingBag,
  Users,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

export type NavItem = {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
}

export const sidebarNavItems: NavItem[] = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/customers', label: 'Customers', icon: Users },
  { to: '/cashier/drawer', label: 'Cashier', icon: Wallet },
  { to: '/orders', label: 'Orders', icon: ShoppingBag },
  { to: '/products', label: 'Products', icon: Package },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings/profile', label: 'Settings', icon: Settings },
]

export const bottomNavItems: NavItem[] = [
  { to: '/', label: 'Kasir', icon: Home, end: true },
  { to: '/orders', label: 'Order', icon: ShoppingBag },
  { to: '/products', label: 'Produk', icon: Package },
  { to: '/customers', label: 'Pelanggan', icon: Users },
]

export const moreMenuItems: NavItem[] = [
  { to: '/cashier/drawer', label: 'Cashier', icon: Wallet },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/settings/profile', label: 'Settings', icon: Settings },
]
