import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { isBrowserOnline, pingApi } from '@/services/connectivity'

type NetworkContextValue = {
  online: boolean
  apiReachable: boolean
  refresh: () => Promise<void>
}

const NetworkContext = createContext<NetworkContextValue | null>(null)

export function NetworkProvider({ children }: { children: ReactNode }) {
  const [online, setOnline] = useState(isBrowserOnline())
  const [apiReachable, setApiReachable] = useState(false)

  const refresh = async () => {
    const browser = isBrowserOnline()
    setOnline(browser)
    setApiReachable(browser ? await pingApi() : false)
  }

  useEffect(() => {
    const onOnline = () => void refresh()
    const onOffline = () => {
      setOnline(false)
      setApiReachable(false)
    }
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    void refresh()
    const timer = setInterval(() => void refresh(), 15000)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
      clearInterval(timer)
    }
  }, [])

  return (
    <NetworkContext.Provider value={{ online, apiReachable, refresh }}>
      {children}
    </NetworkContext.Provider>
  )
}

export function useNetwork() {
  const ctx = useContext(NetworkContext)
  if (!ctx) throw new Error('useNetwork must be used within NetworkProvider')
  return ctx
}
