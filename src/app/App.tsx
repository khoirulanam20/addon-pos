import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppRouter } from '@/app/router'
import { AuthProvider } from '@/app/providers/AuthProvider'
import { NetworkProvider } from '@/app/providers/NetworkProvider'
import { SyncProvider } from '@/app/providers/SyncProvider'

const queryClient = new QueryClient()

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NetworkProvider>
          <SyncProvider>
            <AppRouter />
          </SyncProvider>
        </NetworkProvider>
      </AuthProvider>
    </QueryClientProvider>
  )
}
