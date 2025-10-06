import { useMemo, useState, type ReactElement } from 'react'
import { FileText, AlertTriangle, Wallet, MapPin, Bell, X } from 'lucide-react'
import Button from '../../../components/Button/Button'

type KPI = {
  title: string
  value: string
  subtitle?: string
  color: 'blue' | 'orange' | 'green' | 'red'
  icon: ReactElement
}

type NotificationItem = {
  id: string
  title: string
  description: string
}

function KPICard({ title, value, subtitle, color, icon }: KPI) {
  const borderTopClass =
    color === 'blue'
      ? 'border-t-4 border-blue-600'
      : color === 'orange'
      ? 'border-t-4 border-orange-600'
      : color === 'green'
      ? 'border-t-4 border-green-600'
      : 'border-t-4 border-red-600'

  return (
    <div className={`bg-white p-4 sm:p-6 rounded-xl shadow-md flex items-center gap-3 sm:gap-4 border border-white/20 relative overflow-hidden ${borderTopClass}`}>
      <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-lg text-2xl sm:text-3xl text-[var(--color-heading)] flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-xs font-semibold text-[var(--color-primary)] uppercase tracking-wide mb-1 leading-tight" style={{ fontFamily: 'var(--font-heading)' }}>{title}</h3>
        <div className="text-xl sm:text-2xl font-bold text-[var(--color-heading)] mb-1">{value}</div>
        {subtitle && <div className="text-xs sm:text-sm text-gray-500 leading-tight">{subtitle}</div>}
      </div>
    </div>
  )
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
  const today = useMemo(() => new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), [])

  const kpis: KPI[] = [
    { title: 'Total Orders Pending Invoicing', value: '128', subtitle: 'Requires invoice generation', color: 'blue', icon: <FileText size={32} color="var(--color-heading)" /> },
    { title: 'Orders Awaiting Delivery Verification', value: '73', subtitle: 'Await ops confirmation', color: 'orange', icon: <MapPin size={32} color="var(--color-heading)" /> },
    { title: 'Payments Pending Release', value: '56', subtitle: 'Finance approval queued', color: 'green', icon: <Wallet size={32} color="var(--color-heading)" /> },
    { title: 'Overdue Payments / SLA Breaches', value: '9', subtitle: 'Action required', color: 'red', icon: <AlertTriangle size={32} color="var(--color-heading)" /> }
  ]

  const notifications: NotificationItem[] = [
    { id: 'n1', title: 'Vendor uploaded invoice', description: 'Invoice INV-9012 uploaded for PO PO-2231.' },
    { id: 'n2', title: 'Payment approval pending', description: 'Payment for INV-8893 awaiting approval.' },
    { id: 'n3', title: 'Discrepancy reported', description: 'Qty mismatch on PO PO-2207. Review needed.' }
  ]

  const [showInvoiceModal, setShowInvoiceModal] = useState<boolean>(false)
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false)

  return (
    <div className="p-3 sm:p-4 lg:p-6 bg-[var(--color-happyplant-bg)] min-h-[calc(100vh-4rem)] font-sans w-full overflow-x-hidden">
      {/* Header Section */}
      <div className="bg-white p-4 sm:p-6 lg:p-8 rounded-xl shadow-lg mb-6 sm:mb-8 border border-gray-200">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl text-[var(--color-heading)] mb-2 font-[var(--font-heading)]">Welcome, Accounts Team!</h1>
        <p className="text-base sm:text-lg text-[var(--color-primary)] font-medium">{today}</p>
      </div>

      {/* KPI Cards */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl text-[var(--color-heading)] mb-4 sm:mb-6 font-[var(--font-heading)]">Today's Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {kpis.map((kpi) => (
            <KPICard key={kpi.title} {...kpi} />
          ))}
        </div>
      </div>

      {/* Notifications Panel */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
          <h3 className="text-lg sm:text-xl text-[var(--color-heading)] font-[var(--font-heading)]">Recent Notifications</h3>
          <span className="text-sm text-gray-500">{notifications.length} new</span>
        </div>
        <div className="divide-y divide-gray-100">
          {notifications.map((n) => (
            <div key={n.id} className="py-3 flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--color-sharktank-bg)] flex items-center justify-center text-[var(--color-accent)] flex-shrink-0">
                <Bell size={18} className="text-[var(--color-accent)]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-[var(--color-secondary)]" style={{ fontFamily: 'var(--font-heading)' }}>{n.title}</div>
                <div className="text-sm text-[var(--color-primary)] break-words">{n.description}</div>
              </div>
              <button className="text-xs px-2 py-1 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 flex-shrink-0">Mark read</button>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <h3 className="text-lg sm:text-xl text-[var(--color-heading)] mb-4 font-[var(--font-heading)]">Quick Actions</h3>
        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          <Button onClick={() => setShowInvoiceModal(true)} className="inline-flex items-center justify-center gap-2 rounded-xl w-full sm:w-auto">
            <span>➕</span>
            <span>Generate Invoice</span>
          </Button>
          <Button onClick={() => setShowPaymentModal(true)} className="inline-flex items-center justify-center gap-2 rounded-xl w-full sm:w-auto">
            <span>✔️</span>
            <span>Mark Payment Released</span>
          </Button>
        </div>
      </div>

      <GenerateInvoiceModal open={showInvoiceModal} onClose={() => setShowInvoiceModal(false)} />
      <MarkPaymentReleasedModal open={showPaymentModal} onClose={() => setShowPaymentModal(false)} />
    </div>
  )
}

export default AccountsDashboard


