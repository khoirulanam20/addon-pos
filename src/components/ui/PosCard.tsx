import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
  className?: string
  title?: string
}

export function PosCard({ children, className = '', title }: Props) {
  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 ${className}`}
    >
      {title && <h2 className="mb-4 text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>}
      {children}
    </div>
  )
}
