const STORAGE_KEY = 'pos_debug_logs'

export function debugLog(
  location: string,
  message: string,
  data: Record<string, unknown>,
  hypothesisId: string,
) {
  const entry = {
    sessionId: '16bc84',
    location,
    message,
    data,
    hypothesisId,
    timestamp: Date.now(),
  }

  try {
    const prev = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]') as unknown[]
    prev.push(entry)
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(prev.slice(-80)))
  } catch {
    // ignore quota errors
  }

  if (typeof navigator !== 'undefined' && navigator.onLine) {
    void sendToIngest(entry)
  }
}

function sendToIngest(entry: Record<string, unknown>) {
  return fetch('http://127.0.0.1:7854/ingest/4daf1b18-d0c4-465c-b5a4-479f15c14527', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '16bc84' },
    body: JSON.stringify(entry),
  }).catch(() => {})
}

export function flushDebugLogs() {
  if (typeof navigator === 'undefined' || !navigator.onLine) return
  try {
    const prev = JSON.parse(sessionStorage.getItem(STORAGE_KEY) || '[]') as Record<string, unknown>[]
    for (const entry of prev) {
      void sendToIngest(entry)
    }
  } catch {
    // ignore
  }
}
