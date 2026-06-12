import { Delete } from 'lucide-react'
import { useState } from 'react'

type Props = {
  value: string
  onChange: (value: string) => void
  onCancel?: () => void
}

const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '00', '0', '.']

function isEmptyOrZero(v: string) {
  return v === '' || v === '0'
}

export function NumericKeypad({ value, onChange, onCancel }: Props) {
  const [focused, setFocused] = useState(false)

  const clearIfZero = () => {
    if (value === '0') onChange('')
  }

  const press = (key: string) => {
    if (key === '.' && value.includes('.')) return

    if (isEmptyOrZero(value)) {
      if (key === '.') {
        onChange('0.')
        return
      }
      if (key === '00') {
        onChange('0')
        return
      }
      onChange(key)
      return
    }

    onChange(value + key)
  }

  const backspace = () => {
    const next = value.slice(0, -1)
    onChange(next === '' ? '' : next)
  }

  const showPlaceholder = value === '' && !focused

  return (
    <div className="space-y-2">
      <input
        readOnly
        value={showPlaceholder ? '' : value}
        placeholder="0"
        onFocus={() => {
          setFocused(true)
          clearIfZero()
        }}
        onBlur={() => setFocused(false)}
        onClick={() => {
          setFocused(true)
          clearIfZero()
        }}
        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-right text-2xl font-semibold placeholder:text-gray-300 dark:border-gray-700 dark:bg-gray-800 dark:placeholder:text-gray-600"
      />
      <div className="grid grid-cols-3 gap-2">
        {keys.map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => press(key)}
            className="rounded-lg border border-gray-200 bg-white py-4 text-lg font-medium hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700"
          >
            {key}
          </button>
        ))}
        <button
          type="button"
          onClick={backspace}
          className="rounded-lg border border-gray-200 bg-white py-4 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
        >
          <Delete className="mx-auto h-5 w-5" />
        </button>
      </div>
      {onCancel && (
        <button
          type="button"
          onClick={onCancel}
          className="w-full rounded-lg border border-gray-300 py-3 text-sm font-medium dark:border-gray-600"
        >
          Cancel
        </button>
      )}
    </div>
  )
}
