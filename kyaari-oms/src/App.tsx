import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom'
import Landing from './pages/Landing'
import AdminSignIn from './pages/AdminSignIn'
import AccountsSignIn from './pages/AccountsSignIn'
import OperationsSignIn from './pages/OperationsSignIn'
import VendorsSignIn from './pages/VendorsSignIn'
import AdminLayout from './dashboards/admin/AdminLayout'
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
          <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>} />
          <Route path="/admin/signin" element={<AdminSignIn />} />
          <Route path="/accounts/signin" element={<AccountsSignIn />} />
          <Route path="/operations/signin" element={<OperationsSignIn />} />
          <Route path="/vendors/signin" element={<VendorsSignIn />} />
          <Route path="/vendors" element={<ProtectedRoute redirectTo={'/vendors/signin'}><VendorsLayout /></ProtectedRoute>} />
          <Route path="/accounts" element={<ProtectedRoute redirectTo={'/accounts/signin'}><AccountsLayout /></ProtectedRoute>} />
          <Route path="/operations" element={<ProtectedRoute redirectTo={'/operations/signin'}><OperationsLayout /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App
