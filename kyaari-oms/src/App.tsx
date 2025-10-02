import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Landing from './pages/Landing'
import AdminSignIn from './pages/AdminSignIn'
import AccountsSignIn from './pages/AccountsSignIn'
import OperationsSignIn from './pages/OperationsSignIn'
import VendorsSignIn from './pages/VendorsSignIn'
import VendorSignUp from './pages/VendorSignUp'
import AdminLayout from './dashboards/admin/AdminLayout'
import Dashboard from './dashboards/admin/pages/Dashboard'
import Orders from './dashboards/admin/pages/Orders'
import UsersRoles from './dashboards/admin/pages/UsersRoles'
import Notifications from './dashboards/admin/pages/Notifications'
import MoneyFlow from './dashboards/admin/pages/MoneyFlow'
// import Tracking from './dashboards/admin/pages/Tracking'
import OrderTracking from './dashboards/admin/pages/OrderTracking'
import OrderDetails from './dashboards/admin/pages/OrderDetails'
import VendorTracking from './dashboards/admin/pages/VendorTracking'
import VendorDetails from './dashboards/admin/pages/VendorDetails'
import Analytics from './dashboards/admin/pages/Analytics'
import AuditLogs from './dashboards/admin/pages/AuditLogs'
import AdminVendorSupport from './dashboards/admin/pages/VendorSupport'
import AdminAccountSupport from './dashboards/admin/pages/AccountSupport'
import OpsSupport from './dashboards/admin/pages/OpsSupport'
import VendorsLayout from './dashboards/vendors/VendorsLayout'
import VendorDashboard from './dashboards/vendors/pages/Dashboard'
import VendorOrders from './dashboards/vendors/pages/Orders'
import VendorInvoices from './dashboards/vendors/pages/Invoices'
import VendorDispatch from './dashboards/vendors/pages/Dispatch'
import VendorPerformance from './dashboards/vendors/pages/Performance'
import VendorProfileSettings from './dashboards/vendors/pages/ProfileSettings'
import VendorSupport from './dashboards/vendors/pages/VendorSupport'
import AccountsLayout from './dashboards/accounts/AccountsLayout'
import AccountsDashboard from './dashboards/accounts/pages/Dashboard'
import AccountsVendorOrders from './dashboards/accounts/pages/VendorOrders'
import AccountsInvoices from './dashboards/accounts/pages/Invoices'
import AccountsPaymentRelease from './dashboards/accounts/pages/PaymentRelease'
import AccountsReports from './dashboards/accounts/pages/Reports'
import AccountsSupport from './dashboards/accounts/pages/Support'
import AccountsProfileSettings from './dashboards/accounts/pages/ProfileSettings'
import OperationsLayout from './dashboards/operations/OperationsLayout'
import OperationsDashboard from './dashboards/operations/pages/Dashboard'
import OperationsReceivedOrders from './dashboards/operations/pages/ReceivedOrders'
import OperationsTicketManagement from './dashboards/operations/pages/TicketManagement'
import OperationsReports from './dashboards/operations/pages/Reports'
import OperationsSupport from './dashboards/operations/pages/Support'
import OperationsProfileSettings from './dashboards/operations/pages/ProfileSettings'
import { AuthProvider } from './auth/AuthProvider'
import ProtectedRoute from './auth/ProtectedRoute'
import { Header } from './components'

function HeaderGuard() {
  const location = useLocation()
  // hide Header on dashboard routes (any top-level path that is a dashboard)
  const hideFor = ['/admin', '/vendors', '/accounts', '/operations']
  const shouldHide = hideFor.some((p) => location.pathname === p || location.pathname.startsWith(p + '/'))
  if (shouldHide) return null
  return <Header />
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Show global Header except when viewing dashboards; dashboards will render their own top-bars */}
        <HeaderGuard />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 3000,
            style: {
              background: '#fff',
              color: '#333',
              borderRadius: '12px',
              padding: '16px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#fff',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="orders" element={<Orders />} />
            <Route path="users" element={<UsersRoles />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="money-flow" element={<MoneyFlow />} />
            {/* <Route path="tracking" element={<Tracking />} /> */}
            <Route path="tracking/orders" element={<OrderTracking />} />
            <Route path="orders/:id" element={<OrderDetails />} />
            <Route path="tracking/vendors" element={<VendorTracking />} />
            <Route path="vendors/:id" element={<VendorDetails />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="audit-logs" element={<AuditLogs />} />
            <Route path="support/vendors" element={<AdminVendorSupport />} />
            <Route path="support/accounts" element={<AdminAccountSupport />} />
            <Route path="support/ops" element={<OpsSupport />} />
          </Route>
          <Route path="/admin/signin" element={<AdminSignIn />} />
          <Route path="/accounts/signin" element={<AccountsSignIn />} />
          <Route path="/operations/signin" element={<OperationsSignIn />} />
          <Route path="/vendors/signin" element={<VendorsSignIn />} />
          <Route path="/vendors/signup" element={<VendorSignUp />} />
          <Route path="/vendors" element={<ProtectedRoute redirectTo={'/vendors/signin'}><VendorsLayout /></ProtectedRoute>}>
            <Route index element={<VendorDashboard />} />
            <Route path="orders" element={<VendorOrders />} />
            <Route path="invoices" element={<VendorInvoices />} />
            <Route path="dispatch" element={<VendorDispatch />} />
            <Route path="performance" element={<VendorPerformance />} />
            <Route path="support" element={<VendorSupport />} />
            <Route path="profile-settings" element={<VendorProfileSettings />} />
          </Route>
          <Route path="/accounts" element={<ProtectedRoute redirectTo={'/accounts/signin'}><AccountsLayout /></ProtectedRoute>}>
            <Route index element={<AccountsDashboard />} />
            <Route path="vendor-orders" element={<AccountsVendorOrders />} />
            <Route path="po-invoices" element={<AccountsInvoices />} />
            <Route path="payment-release" element={<AccountsPaymentRelease />} />
            <Route path="reports" element={<AccountsReports />} />
            <Route path="support" element={<AccountsSupport />} />
            <Route path="profile-settings" element={<AccountsProfileSettings />} />
          </Route>
          <Route path="/operations" element={<ProtectedRoute redirectTo={'/operations/signin'}><OperationsLayout /></ProtectedRoute>}>
            <Route index element={<OperationsDashboard />} />
            <Route path="received-orders" element={<OperationsReceivedOrders />} />
            <Route path="support" element={<OperationsSupport />} />
            <Route path="tickets" element={<OperationsTicketManagement />} />
            <Route path="reports" element={<OperationsReports />} />
            <Route path="profile-settings" element={<OperationsProfileSettings />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
