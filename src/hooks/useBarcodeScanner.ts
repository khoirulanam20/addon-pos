import { useCallback, useRef } from 'react'

export function useBarcodeScanner(onScan: (code: string) => void) {
  const buffer = useRef('')
  const timeout = useRef<number | null>(null)

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        const code = buffer.current.trim() || event.currentTarget.value.trim()
        if (code) onScan(code)
        buffer.current = ''
        event.currentTarget.value = ''
        return
      }
      if (event.key.length === 1) {
        buffer.current += event.key
        if (timeout.current) window.clearTimeout(timeout.current)
        timeout.current = window.setTimeout(() => {
          buffer.current = ''
        }, 100)
      }
    },
    [onScan],
  )

  return { onKeyDown }
}
