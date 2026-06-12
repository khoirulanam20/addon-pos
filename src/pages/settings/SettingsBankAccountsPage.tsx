import { Building2, Pencil, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { fetchBootstrap } from '@/api/bootstrap'
import {
  createPaymentBank,
  deletePaymentBank,
  listPaymentBanks,
  updatePaymentBank,
  type PaymentBankRecord,
} from '@/api/payment-banks'
import { useAuth } from '@/app/providers/AuthProvider'
import { PosCard } from '@/components/ui/PosCard'
import { BankAccountListSkeleton } from '@/components/ui/Skeleton'
import { saveBootstrap } from '@/db/bootstrap-repo'

type FormState = {
  bank_name: string
  account_number: string
  account_name: string
  is_active: boolean
}

const emptyForm: FormState = {
  bank_name: '',
  account_number: '',
  account_name: '',
  is_active: true,
}

export function SettingsBankAccountsPage() {
  const { user } = useAuth()
  const canManage =
    user?.isSuperAdmin ||
    user?.permissions.includes('pos.manage') ||
    user?.permissions.includes('*')

  const [banks, setBanks] = useState<PaymentBankRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState<FormState>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [message, setMessage] = useState('')

  const refreshBootstrap = async () => {
    const bootstrap = await fetchBootstrap()
    await saveBootstrap(bootstrap)
  }

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setBanks(await listPaymentBanks())
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const openCreate = () => {
    setEditingId(null)
    setForm(emptyForm)
    setShowForm(true)
    setMessage('')
  }

  const openEdit = (bank: PaymentBankRecord) => {
    setEditingId(bank.id)
    setForm({
      bank_name: bank.bankName,
      account_number: bank.accountNumber,
      account_name: bank.accountName,
      is_active: bank.isActive,
    })
    setShowForm(true)
    setMessage('')
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!canManage) return

    setSubmitting(true)
    setMessage('')
    try {
      if (editingId) {
        await updatePaymentBank(editingId, form)
        setMessage('Rekening berhasil diperbarui.')
      } else {
        await createPaymentBank(form)
        setMessage('Rekening berhasil ditambahkan.')
      }
      await refreshBootstrap()
      await load()
      setShowForm(false)
      setForm(emptyForm)
      setEditingId(null)
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal menyimpan rekening.')
    } finally {
      setSubmitting(false)
    }
  }

  const remove = async (bank: PaymentBankRecord) => {
    if (!canManage) return
    if (!window.confirm(`Hapus rekening ${bank.bankName}?`)) return

    try {
      await deletePaymentBank(bank.id)
      await refreshBootstrap()
      await load()
      setMessage('Rekening berhasil dihapus.')
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal menghapus rekening.')
    }
  }

  const toggleActive = async (bank: PaymentBankRecord) => {
    if (!canManage) return
    try {
      await updatePaymentBank(bank.id, { is_active: !bank.isActive })
      await refreshBootstrap()
      await load()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Gagal mengubah status rekening.')
    }
  }

  return (
    <div className="space-y-4">
      <PosCard>
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-semibold">Rekening Pembayaran</h2>
            <p className="text-sm text-gray-500">
              Rekening yang muncul saat pembayaran transfer di kasir.
            </p>
          </div>
          {canManage && (
            <button
              type="button"
              onClick={openCreate}
              className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white dark:bg-gray-700"
            >
              <Plus className="h-4 w-4" />
              Tambah Rekening
            </button>
          )}
        </div>

        {message && <p className="mb-4 text-sm text-gray-600 dark:text-gray-400">{message}</p>}

        {loading && <BankAccountListSkeleton />}

        {!loading && banks.length === 0 && (
          <p className="text-sm text-gray-500">Belum ada rekening terdaftar.</p>
        )}

        <div className="space-y-2">
          {banks.map((bank) => (
            <div
              key={bank.id}
              className={`flex items-center gap-3 rounded-lg border p-3 ${
                bank.isActive
                  ? 'border-gray-200 dark:border-gray-700'
                  : 'border-gray-200 bg-gray-50 opacity-70 dark:border-gray-800 dark:bg-gray-900/50'
              }`}
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800">
                <Building2 className="h-5 w-5 text-gray-500" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium">{bank.bankName}</div>
                <div className="text-sm text-gray-500">{bank.accountNumber}</div>
                <div className="text-xs text-gray-400">{bank.accountName}</div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {canManage && (
                  <label className="flex items-center gap-1 text-xs text-gray-500">
                    <input
                      type="checkbox"
                      checked={bank.isActive}
                      onChange={() => void toggleActive(bank)}
                    />
                    Aktif
                  </label>
                )}
                {canManage && (
                  <>
                    <button
                      type="button"
                      onClick={() => openEdit(bank)}
                      className="rounded p-1.5 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
                      title="Edit"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void remove(bank)}
                      className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30"
                      title="Hapus"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {!canManage && (
          <p className="mt-4 text-xs text-gray-400">
            Hanya pengguna dengan izin kelola POS yang dapat menambah atau mengubah rekening.
          </p>
        )}
      </PosCard>

      {showForm && canManage && (
        <PosCard>
          <h3 className="mb-4 font-semibold">{editingId ? 'Edit Rekening' : 'Tambah Rekening'}</h3>
          <form onSubmit={submit} className="grid max-w-2xl gap-4 md:grid-cols-2">
            <label className="block text-sm">
              Nama Bank
              <input
                required
                value={form.bank_name}
                onChange={(e) => setForm((f) => ({ ...f, bank_name: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
              />
            </label>
            <label className="block text-sm">
              No. Rekening
              <input
                required
                value={form.account_number}
                onChange={(e) => setForm((f) => ({ ...f, account_number: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
              />
            </label>
            <label className="block text-sm md:col-span-2">
              Atas Nama
              <input
                required
                value={form.account_name}
                onChange={(e) => setForm((f) => ({ ...f, account_name: e.target.value }))}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 dark:border-gray-700 dark:bg-gray-800"
              />
            </label>
            <label className="flex items-center gap-2 text-sm md:col-span-2">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => setForm((f) => ({ ...f, is_active: e.target.checked }))}
              />
              Aktif (tampil di pembayaran transfer)
            </label>
            <div className="flex gap-2 md:col-span-2">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                Simpan
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false)
                  setEditingId(null)
                  setForm(emptyForm)
                }}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm dark:border-gray-700"
              >
                Batal
              </button>
            </div>
          </form>
        </PosCard>
      )}
    </div>
  )
}
