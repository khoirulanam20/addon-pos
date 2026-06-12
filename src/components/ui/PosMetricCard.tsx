import type { ReactNode } from 'react'

type Props = {
  label: string
  value: ReactNode
  trend?: { value: string; up: boolean }
  sparkline?: number[]
}

export function PosMetricCard({ label, value, trend, sparkline }: Props) {
  const max = sparkline?.length ? Math.max(...sparkline, 1) : 1

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="mb-2 flex items-start justify-between gap-2">
        <span className="text-sm text-gray-500 dark:text-gray-400">{label}</span>
        {trend && (
          <span
            className={`rounded px-1.5 py-0.5 text-xs font-medium ${
              trend.up ? 'bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300' : 'bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-300'
            }`}
          >
            {trend.value}
          </span>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white">{value}</div>
      {sparkline && sparkline.length > 0 && (
        <div className="mt-3 flex h-8 items-end gap-0.5">
          {sparkline.map((v, i) => (
            <div
              key={i}
              className="flex-1 rounded-t bg-blue-200 dark:bg-blue-800"
              style={{ height: `${Math.max(8, (v / max) * 100)}%` }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
