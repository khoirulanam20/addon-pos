import { useNetwork } from '@/app/providers/NetworkProvider'

export function OfflineBanner() {
  const { online, apiReachable } = useNetwork()
  if (online && apiReachable) return null
  return (
    <div className="bg-amber-500 text-black px-4 py-2 text-center text-sm font-medium">
      Mode offline — transaksi disimpan lokal. Kupon tidak tersedia. Sinkronkan saat online.
    </div>
  )
}
