import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'

export function LoginPage() {
  const { user, loading, login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (!loading && user) return <Navigate to="/" replace />

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    try {
      await login(email, password)
    } catch {
      setError('Login gagal. Periksa email/password dan akses POS.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-950">
      <form onSubmit={submit} className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-6 shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <h1 className="mb-6 text-center text-xl font-bold text-gray-900 dark:text-white">{import.meta.env.VITE_APP_NAME}</h1>
        {error && <p className="mb-3 text-sm text-red-600">{error}</p>}
        <label className="mb-3 block text-sm text-gray-700 dark:text-gray-300">
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
            required
          />
        </label>
        <label className="mb-4 block text-sm text-gray-700 dark:text-gray-300">
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
            required
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-green-600 py-2.5 font-medium text-white hover:bg-green-700 disabled:opacity-50"
        >
          {submitting ? 'Masuk...' : 'Masuk'}
        </button>
      </form>
    </div>
  )
}
