import { formatCurrency } from '@/lib/format'

export function CurrencyDisplay({ amount, className = '' }: { amount: number; className?: string }) {
  return <span className={className}>{formatCurrency(amount)}</span>
}
