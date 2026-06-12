import { Check } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { updateProfile } from '@/api/auth'
import { useAuth } from '@/app/providers/AuthProvider'
import { PosCard } from '@/components/ui/PosCard'

export function SettingsProfilePage() {
  const { user, refresh } = useAuth()
  const [name, setName] = useState(user?.name ?? '')
  const [email, setEmail] = useState(user?.email ?? '')
  const [currentPassword, setCurrentPassword] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    setName(user?.name ?? '')
    setEmail(user?.email ?? '')
  }, [user])

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setMessage('')
    try {
      await updateProfile({
        name,
        email,
        current_password: currentPassword || undefined,
        password: password || undefined,
        password_confirmation: passwordConfirmation || undefined,
      })
      await refresh()
      setMessage('Profil berhasil diperbarui.')
      setCurrentPassword('')
      setPassword('')
      setPasswordConfirmation('')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal memperbarui profil.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <PosCard>
      <form onSubmit={submit} className="grid max-w-2xl gap-4 md:grid-cols-2">
        <label className="block text-sm">
          First Name
          <input value={name} onChange={(e) => setName(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
        </label>
        <label className="block text-sm">
          Email
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
        </label>
        <label className="block text-sm md:col-span-2">
          Old Password
          <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
        </label>
        <label className="block text-sm">
          New Password
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
        </label>
        <label className="block text-sm">
          Confirm Password
          <input type="password" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800" />
        </label>
        {message && <p className="text-sm text-gray-600 md:col-span-2">{message}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="flex w-fit items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-50 dark:bg-gray-700"
        >
          <Check className="h-4 w-4" />
          Update Profile
        </button>
      </form>
    </PosCard>
  )
}
