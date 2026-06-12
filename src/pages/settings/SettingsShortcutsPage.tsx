import { PosCard } from '@/components/ui/PosCard'

const shortcuts = [
  { action: 'Open Barcode Mode', desc: 'Fokus ke field scan barcode di Home', keys: ['Ctrl', 'B'] },
  { action: 'Toggle Fullscreen', desc: 'Masuk/keluar layar penuh', keys: ['F11'] },
  { action: 'Toggle Dark Mode', desc: 'Ganti tema terang/gelap', keys: ['Ctrl', 'D'] },
  { action: 'Hold Orders', desc: 'Buka daftar order ditahan', keys: ['Ctrl', 'H'] },
  { action: 'Manual Sync', desc: 'Sinkronkan katalog & order offline', keys: ['Ctrl', 'S'] },
]

export function SettingsShortcutsPage() {
  return (
    <PosCard title="Shortcuts">
      <div className="space-y-4">
        {shortcuts.map((s) => (
          <div key={s.action} className="flex items-center justify-between border-b border-gray-100 pb-4 last:border-0 dark:border-gray-800">
            <div>
              <div className="font-medium">{s.action}</div>
              <div className="text-sm text-gray-500">{s.desc}</div>
            </div>
            <div className="flex gap-1">
              {s.keys.map((k) => (
                <kbd key={k} className="rounded border border-gray-300 bg-gray-50 px-2 py-1 text-xs dark:border-gray-600 dark:bg-gray-800">
                  {k}
                </kbd>
              ))}
            </div>
          </div>
        ))}
      </div>
    </PosCard>
  )
}
