import { BrowserRouter, Routes, Route } from 'react-router-dom'
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

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Header />
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
