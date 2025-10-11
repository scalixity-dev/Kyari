import React, { useState, type ReactElement } from 'react'
import { FileText, AlertTriangle, Wallet, MapPin, Bell, X } from 'lucide-react'
import Button from '../../../components/Button/Button'

type KPI = {
  title: string
  value: string
  subtitle?: string
  icon: ReactElement
}

type NotificationItem = {
  id: string
  title: string
  description: string
}

function KPICard({ title, value, subtitle, icon }: KPI) {
  return (
    <div
      className="bg-[var(--color-happyplant-bg)] p-6 pt-10 rounded-xl shadow-sm flex flex-col items-center text-center relative"
    >
      {/* Circular icon at top center, overlapping the card edge */}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-16 h-16 bg-[var(--color-accent)] rounded-full p-3 flex items-center justify-center text-white shadow-md">
        {React.isValidElement(icon) ? React.cloneElement(icon, { color: 'white', size: 32, strokeWidth: 2 } as React.SVGProps<SVGSVGElement>) : icon}
      </div>
      
      {/* Card content */}
      <h3 className="text-lg font-semibold text-gray-800 mb-1">{title}</h3>
      <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
      {subtitle && <div className="text-sm text-gray-600 mt-1">{subtitle}</div>}
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
  const kpis: KPI[] = [
    { title: 'Total Orders Pending Invoicing', value: '128', subtitle: 'Requires invoice generation', icon: <FileText /> },
    { title: 'Orders Awaiting Delivery Verification', value: '73', subtitle: 'Await ops confirmation', icon: <MapPin /> },
    { title: 'Payments Pending Release', value: '56', subtitle: 'Finance approval queued', icon: <Wallet /> },
    { title: 'Overdue Payments / SLA Breaches', value: '9', subtitle: 'Action required', icon: <AlertTriangle /> }
  ]

  const notifications: NotificationItem[] = [
    { id: 'n1', title: 'Vendor uploaded invoice', description: 'Invoice INV-9012 uploaded for PO PO-2231.' },
    { id: 'n2', title: 'Payment approval pending', description: 'Payment for INV-8893 awaiting approval.' },
    { id: 'n3', title: 'Discrepancy reported', description: 'Qty mismatch on PO PO-2207. Review needed.' }
  ]

  const [showInvoiceModal, setShowInvoiceModal] = useState<boolean>(false)
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false)

  return (
    <div className="py-4 px-9 sm:py-6 lg:py-8 min-h-[calc(100vh-4rem)] font-sans w-full overflow-x-hidden" style={{ background: 'var(--color-sharktank-bg)' }}>
      {/* Header Section */}

      {/* KPI Cards */}
      <div className="mb-6 lg:mb-8">
        <h2 className="text-xl sm:text-2xl font-semibold text-[var(--color-heading)] mb-4 sm:mb-6">Today's Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 sm:gap-4 mt-12 sm:mt-8">
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


