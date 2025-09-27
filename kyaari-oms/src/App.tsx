import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
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
import Analytics from './dashboards/admin/pages/Analytics'
import AuditLogs from './dashboards/admin/pages/AuditLogs'
import VendorsLayout from './dashboards/vendors/VendorsLayout'
import AccountsLayout from './dashboards/accounts/AccountsLayout'
import OperationsLayout from './dashboards/operations/OperationsLayout'
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
            <Route path="analytics" element={<Analytics />} />
            <Route path="audit-logs" element={<AuditLogs />} />
          </Route>
          <Route path="/admin/signin" element={<AdminSignIn />} />
          <Route path="/accounts/signin" element={<AccountsSignIn />} />
          <Route path="/operations/signin" element={<OperationsSignIn />} />
          <Route path="/vendors/signin" element={<VendorsSignIn />} />
          <Route path="/vendors/signup" element={<VendorSignUp />} />
          <Route path="/vendors" element={<ProtectedRoute redirectTo={'/vendors/signin'}><VendorsLayout /></ProtectedRoute>} />
          <Route path="/accounts" element={<ProtectedRoute redirectTo={'/accounts/signin'}><AccountsLayout /></ProtectedRoute>} />
          <Route path="/operations" element={<ProtectedRoute redirectTo={'/operations/signin'}><OperationsLayout /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
