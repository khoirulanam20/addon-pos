import { Navigate } from 'react-router-dom'
import { useNetwork } from '@/app/providers/NetworkProvider'
import { isOfflineMode } from '@/lib/offline-mode'

export function OrdersIndexRedirect() {
  const { online, apiReachable } = useNetwork()
  const offline = isOfflineMode(online, apiReachable)
  return <Navigate to={offline ? '/orders/offline' : '/orders/history'} replace />
}
