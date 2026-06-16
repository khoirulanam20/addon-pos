import { Maximize, Moon, Pause, RefreshCw, Sun, Wifi, WifiOff } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useNetwork } from '@/app/providers/NetworkProvider'
import { useSync } from '@/app/providers/SyncProvider'
import { useTheme } from '@/hooks/useTheme'

export function PosTopBar() {
  const { online, apiReachable } = useNetwork()
  const { syncing, syncNow } = useSync()
  const { dark, toggle } = useTheme()
  const appName = import.meta.env.VITE_APP_NAME ?? 'YClothes POS'

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      void document.documentElement.requestFullscreen()
    } else {
      void document.exitFullscreen()
    }
  }

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-gray-200 bg-white px-3 dark:border-gray-800 dark:bg-gray-900 lg:px-4">
      <h1 className="max-w-[40vw] truncate text-base font-semibold text-gray-900 dark:text-white lg:max-w-none">
        {appName}
      </h1>
      <div className="flex items-center gap-1 lg:gap-2">
        <button
          type="button"
          onClick={() => void syncNow()}
          disabled={syncing || !apiReachable}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 disabled:opacity-50 dark:text-gray-300 dark:hover:bg-gray-800"
          title="Sync"
        >
          <RefreshCw className={`h-5 w-5 ${syncing ? 'animate-spin' : ''}`} />
        </button>
        <button
          type="button"
          onClick={toggleFullscreen}
          className="hidden rounded-lg p-2 text-gray-600 hover:bg-gray-100 lg:block dark:text-gray-300 dark:hover:bg-gray-800"
          title="Fullscreen"
        >
          <Maximize className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={toggle}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          title="Toggle theme"
        >
          {dark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
        </button>
        <span
          className={`rounded-lg p-2 ${online && apiReachable ? 'text-green-600' : 'text-red-500'}`}
          title={online && apiReachable ? 'Online' : 'Offline'}
        >
          {online && apiReachable ? <Wifi className="h-5 w-5" /> : <WifiOff className="h-5 w-5" />}
        </span>
        <Link
          to="/orders/hold"
          className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-2 py-1.5 text-sm font-medium text-gray-900 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:hover:bg-gray-700 lg:px-3"
          title="Hold Orders"
        >
          <Pause className="h-4 w-4" />
          <span className="hidden lg:inline">Hold Orders</span>
        </Link>
      </div>
    </header>
  )
}
