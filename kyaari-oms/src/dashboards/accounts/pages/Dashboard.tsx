import { useState } from 'react'
import { FileText, AlertTriangle, Wallet, MapPin, Bell, X, Plus, Package } from 'lucide-react'
import Button from '../../../components/Button/Button'
import { KPICard } from '../../../components'

type KPI = {
  title: string
  value: string
  subtitle?: string
  icon: React.ReactElement
}

type NotificationItem = {
  id: string
  type: 'invoice' | 'payment' | 'delivery' | 'order' | 'system'
  title: string
  description: string
  read: boolean
}

function GenerateInvoiceModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [poNumber, setPoNumber] = useState<string>('')
  const [amount, setAmount] = useState<string>('')

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-[520px] rounded-xl shadow-2xl">
        <div className="p-4 sm:p-5 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-heading text-secondary text-lg sm:text-xl">Generate Invoice</h3>
          <button aria-label="Close" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X size={18} className="text-gray-500" /></button>
        </div>
        <div className="p-4 sm:p-5">
          <div className="mb-4">
            <label className="block text-sm text-gray-700 mb-1">PO Number</label>
            <input
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
              placeholder="Enter PO number"
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm text-gray-700 mb-1">Amount (₹)</label>
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              type="number"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
              placeholder="Enter amount"
            />
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 w-full sm:w-auto">Cancel</button>
            <Button onClick={onClose} className="w-full sm:w-auto">Create Invoice</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function MarkPaymentReleasedModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [referenceId, setReferenceId] = useState<string>('')

  if (!open) return null

  return (
    <div className="fixed inset-0 bg-black/35 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-[480px] rounded-xl shadow-2xl">
        <div className="p-4 sm:p-5 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-heading text-secondary text-lg sm:text-xl">Confirm Payment Release</h3>
          <button aria-label="Close" onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100"><X size={18} className="text-gray-500" /></button>
        </div>
        <div className="p-4 sm:p-5">
          <p className="text-sm text-gray-600 mb-4">Please confirm that payment has been released. Add a payment reference ID for tracking.</p>
          <div className="mb-6">
            <label className="block text-sm text-gray-700 mb-1">Reference ID</label>
            <input
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
              placeholder="e.g. UTR/IMPS/Ref. No."
            />
          </div>
          <div className="flex flex-col sm:flex-row justify-end gap-3">
            <button onClick={onClose} className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 w-full sm:w-auto">Cancel</button>
            <Button onClick={onClose} className="w-full sm:w-auto">Mark Released</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

function AccountsDashboard() {
  const kpis: KPI[] = [
    { title: 'Total Orders Pending Invoicing', value: '128', subtitle: 'Requires invoice generation', icon: <FileText /> },
    { title: 'Orders Awaiting Delivery Verification', value: '73', subtitle: 'Await ops confirmation', icon: <MapPin /> },
    { title: 'Payments Pending Release', value: '56', subtitle: 'Finance approval queued', icon: <Wallet /> },
    { title: 'Overdue Payments / SLA Breaches', value: '9', subtitle: 'Action required', icon: <AlertTriangle /> }
  ]

  const notifications: NotificationItem[] = [
    { id: 'n1', type: 'invoice', title: 'Vendor uploaded invoice', description: 'Invoice INV-9012 uploaded for PO PO-2231.', read: false },
    { id: 'n2', type: 'payment', title: 'Payment approval pending', description: 'Payment for INV-8893 awaiting approval.', read: false },
    { id: 'n3', type: 'delivery', title: 'Discrepancy reported', description: 'Qty mismatch on PO PO-2207. Review needed.', read: true }
  ]

  const getNotificationIcon = (type: NotificationItem['type']) => {
    switch (type) {
      case 'invoice': return <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-purple-500" />
      case 'payment': return <Wallet className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
      case 'delivery': return <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-orange-500" />
      case 'order': return <Package className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
      case 'system': return <AlertTriangle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500" />
      default: return <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-gray-500" />
    }
  }

  const [showInvoiceModal, setShowInvoiceModal] = useState<boolean>(false)
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false)

  return (
    <div className="py-4 px-9 sm:py-6 lg:py-8 min-h-[calc(100vh-4rem)] font-sans w-full overflow-x-hidden" style={{ background: 'var(--color-sharktank-bg)' }}>
      {/* Header Section */}

      {/* KPI Cards */}
      <div className="mb-6 lg:mb-8">
        <h2 className="text-xl sm:text-2xl font-semibold text-[var(--color-heading)] mb-4 sm:mb-10">Today's Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-4 mt-12 sm:mt-8">
          {kpis.map((kpi) => (
            <KPICard key={kpi.title} {...kpi} />
          ))}
        </div>
      </div>

      {/* Notifications & Quick Actions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-stretch">
        {/* Notifications Heading (outside the card) */}
        <div className="lg:col-span-4 mb-0 flex flex-col">
          <h3 className="text-lg sm:text-xl font-semibold text-[var(--color-heading)] font-[var(--font-heading)] mb-3">Recent Notification</h3>

          <div className="bg-white rounded-xl shadow-md border border-white/20 p-3 sm:p-4 md:p-5 flex-1 flex flex-col overflow-hidden">
            <div className="space-y-1 sm:space-y-2 overflow-y-auto max-h-[400px] sm:max-h-none">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`flex items-start gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-gray-50 rounded-lg transition-colors ${
                    !n.read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex-shrink-0 mt-1">
                    {getNotificationIcon(n.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-3">
                      <p className={`text-sm sm:text-base font-medium leading-tight ${
                        !n.read ? 'text-[var(--color-heading)]' : 'text-gray-700'
                      }`}>
                        {n.title}
                      </p>
                      {!n.read && (
                        <div className="w-2.5 h-2.5 bg-blue-500 rounded-full flex-shrink-0 mt-1"></div>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{n.description}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-gray-100">
              <button 
                className="text-sm sm:text-base text-[var(--color-accent)] hover:text-[var(--color-accent)]/80 font-medium cursor-pointer"
              >
                View all notifications →
              </button>
            </div>
          </div>
        </div>

        {/* Quick Actions Heading (outside the card) */}
        <div className="flex flex-col justify-between">
          <h3 className="text-lg sm:text-xl font-semibold text-[var(--color-heading)] font-[var(--font-heading)] mb-3">Quick Action</h3>

          <div className="h-full flex flex-col justify-start gap-3 flex-1">
            <div className="flex flex-row lg:flex-col items-stretch gap-3 flex-1">
              <button
                onClick={() => setShowInvoiceModal(true)}
                className="bg-green-500 hover:bg-green-600 text-white p-3 sm:p-4 rounded-xl shadow-md flex flex-col sm:flex-row lg:flex-col items-center justify-center gap-2 sm:gap-3 hover:shadow-lg hover:-translate-y-0.5 transition-all w-full flex-1 cursor-pointer"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-lg bg-white/20 flex-shrink-0">
                  <Plus size={20} />
                </div>
                <span className="font-semibold text-xs sm:text-sm text-center leading-tight">Generate Invoice</span>
              </button>

              <button
                onClick={() => setShowPaymentModal(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white p-3 sm:p-4 rounded-xl shadow-md flex flex-col sm:flex-row lg:flex-col items-center justify-center gap-2 sm:gap-3 hover:shadow-lg hover:-translate-y-0.5 transition-all w-full flex-1 cursor-pointer"
              >
                <div className="w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-lg bg-white/20 flex-shrink-0">
                  <Wallet size={20} />
                </div>
                <span className="font-semibold text-xs sm:text-sm text-center leading-tight">Mark Payment Released</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <GenerateInvoiceModal open={showInvoiceModal} onClose={() => setShowInvoiceModal(false)} />
      <MarkPaymentReleasedModal open={showPaymentModal} onClose={() => setShowPaymentModal(false)} />
    </div>
  )
}

export default AccountsDashboard


