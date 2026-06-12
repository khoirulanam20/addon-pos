import type { ReactNode } from 'react'

export type PosColumn<T> = {
  key: string
  header: string
  render: (row: T) => ReactNode
  className?: string
}

type Props<T> = {
  columns: PosColumn<T>[]
  rows: T[]
  keyFn: (row: T) => string | number
  onRowClick?: (row: T) => void
  selectedKey?: string | number | null
  emptyMessage?: string
}

export function PosDataTable<T>({
  columns,
  rows,
  keyFn,
  onRowClick,
  selectedKey,
  emptyMessage = 'Tidak ada data.',
}: Props<T>) {
  if (rows.length === 0) {
    return <p className="py-8 text-center text-sm text-gray-500">{emptyMessage}</p>
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-gray-200 text-gray-500 dark:border-gray-800 dark:text-gray-400">
            {columns.map((col) => (
              <th key={col.key} className={`px-3 py-2 font-medium ${col.className ?? ''}`}>
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const key = keyFn(row)
            const selected = selectedKey != null && selectedKey === key
            return (
              <tr
                key={key}
                onClick={() => onRowClick?.(row)}
                className={`border-b border-gray-100 dark:border-gray-800 ${
                  onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50' : ''
                } ${selected ? 'bg-blue-50 dark:bg-blue-950/30' : ''}`}
              >
                {columns.map((col) => (
                  <td key={col.key} className={`px-3 py-3 ${col.className ?? ''}`}>
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
