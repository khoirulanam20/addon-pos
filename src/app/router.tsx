import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useAuth } from '@/app/providers/AuthProvider'
import { CashierLayout } from '@/components/layout/CashierLayout'
import { OrdersLayout } from '@/components/layout/OrdersLayout'
import { PosLayout } from '@/components/layout/PosLayout'
import { SettingsLayout } from '@/components/layout/SettingsLayout'
import { CashDrawerPage } from '@/pages/cashier/CashDrawerPage'
import { CashierSaleHistoryPage } from '@/pages/cashier/CashierSaleHistoryPage'
import { TodaySalePage } from '@/pages/cashier/TodaySalePage'
import { CustomersPage } from '@/pages/CustomersPage'
import { HomePage } from '@/pages/HomePage'
import { LoginPage } from '@/pages/LoginPage'
import { OrdersHistoryPage } from '@/pages/orders/OrdersHistoryPage'
import { OrdersHoldPage } from '@/pages/orders/OrdersHoldPage'
import { OrdersOfflinePage } from '@/pages/orders/OrdersOfflinePage'
import { PaymentPage } from '@/pages/PaymentPage'
import { ProductsPage } from '@/pages/ProductsPage'
import { ReportsPage } from '@/pages/ReportsPage'
import { SettingsBankAccountsPage } from '@/pages/settings/SettingsBankAccountsPage'
import { SettingsProfilePage } from '@/pages/settings/SettingsProfilePage'
import { SettingsShortcutsPage } from '@/pages/settings/SettingsShortcutsPage'
import { SettingsSyncPage } from '@/pages/settings/SettingsSyncPage'

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="flex min-h-screen items-center justify-center">Memuat...</div>
  if (!user) return <Navigate to="/login" replace />
  return <>{children}</>
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          element={
            <RequireAuth>
              <PosLayout />
            </RequireAuth>
          }
        >
          <Route path="/" element={<HomePage />} />
          <Route path="/payment" element={<PaymentPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/cashier" element={<CashierLayout />}>
            <Route index element={<Navigate to="/cashier/drawer" replace />} />
            <Route path="drawer" element={<CashDrawerPage />} />
            <Route path="today-sale" element={<TodaySalePage />} />
            <Route path="sale-history" element={<CashierSaleHistoryPage />} />
          </Route>
          <Route path="/orders" element={<OrdersLayout />}>
            <Route index element={<Navigate to="/orders/history" replace />} />
            <Route path="history" element={<OrdersHistoryPage />} />
            <Route path="hold" element={<OrdersHoldPage />} />
            <Route path="offline" element={<OrdersOfflinePage />} />
          </Route>
          <Route path="/settings" element={<SettingsLayout />}>
            <Route index element={<Navigate to="/settings/profile" replace />} />
            <Route path="profile" element={<SettingsProfilePage />} />
            <Route path="bank-accounts" element={<SettingsBankAccountsPage />} />
            <Route path="sync" element={<SettingsSyncPage />} />
            <Route path="shortcuts" element={<SettingsShortcutsPage />} />
          </Route>
          <Route path="/held" element={<Navigate to="/orders/hold" replace />} />
          <Route path="/offline" element={<Navigate to="/orders/offline" replace />} />
          <Route path="/history" element={<Navigate to="/orders/history" replace />} />
          <Route path="/close-shift" element={<Navigate to="/cashier/drawer" replace />} />
          <Route path="/shift" element={<Navigate to="/" replace />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
