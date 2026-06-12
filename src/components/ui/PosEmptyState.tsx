import { ClipboardList } from 'lucide-react'

type Props = {
  message?: string
}

export function PosEmptyState({ message = 'Tidak ada data.' }: Props) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-gray-400">
      <ClipboardList className="mb-3 h-12 w-12 opacity-50" />
      <p className="text-sm">{message}</p>
    </div>
  )
}
