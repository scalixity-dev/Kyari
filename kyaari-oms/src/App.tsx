import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Landing from './pages/Landing'
import AdminLayout from './dashboards/admin/AdminLayout'
import VendorsLayout from './dashboards/vendors/VendorsLayout'
import AccountsLayout from './dashboards/accounts/AccountsLayout'
import OperationsLayout from './dashboards/operations/OperationsLayout'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/admin" element={<AdminLayout />} />
        <Route path="/vendors" element={<VendorsLayout />} />
        <Route path="/accounts" element={<AccountsLayout />} />
        <Route path="/operations" element={<OperationsLayout />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
