import { useState, useMemo, useEffect, useRef } from 'react'
import { Bell, X, AlertTriangle, CheckSquare } from 'lucide-react'
import { CustomDropdown } from '../../../components'

type PaymentStatus = 'Pending' | 'Released' | 'Overdue'
type DeliveryVerified = 'Yes' | 'No' | 'Partial'

type PaymentRecord = {
  id: string
  vendor: string
  orderId: string
  invoiceNumber: string
  invoiceAmount: number
  deliveryVerified: DeliveryVerified
  paymentStatus: PaymentStatus
  invoiceDate: string
  dueDate: string
  releaseDate?: string
  referenceId?: string
}

const PAYMENT_STATUS_STYLES: Record<PaymentStatus, { bg: string; color: string; border: string }> = {
  'Pending': { bg: '#FEF9C3', color: '#92400E', border: '#FEF08A' },
  'Released': { bg: '#D1FAE5', color: '#065F46', border: '#A7F3D0' },
  'Overdue': { bg: '#FEE2E2', color: '#DC2626', border: '#FECACA' },
}

const DELIVERY_VERIFIED_STYLES: Record<DeliveryVerified, { bg: string; color: string; border: string }> = {
  'Yes': { bg: '#D1FAE5', color: '#065F46', border: '#A7F3D0' },
  'No': { bg: '#FEE2E2', color: '#DC2626', border: '#FECACA' },
  'Partial': { bg: '#FEF9C3', color: '#92400E', border: '#FEF08A' },
}

const INITIAL_PAYMENTS: PaymentRecord[] = [
  { id: 'PAY-001', vendor: 'GreenLeaf Co', orderId: 'VO-2301', invoiceNumber: 'INV-GLC-2301', invoiceAmount: 45000, deliveryVerified: 'Yes', paymentStatus: 'Released', invoiceDate: '2025-09-18', dueDate: '2025-09-25', releaseDate: '2025-09-24', referenceId: 'UTR-1234567890' },
  { id: 'PAY-002', vendor: 'Clay Works', orderId: 'VO-2304', invoiceNumber: 'INV-CW-2304', invoiceAmount: 19200, deliveryVerified: 'Yes', paymentStatus: 'Pending', invoiceDate: '2025-09-21', dueDate: '2025-09-28' },
  { id: 'PAY-003', vendor: 'Urban Roots', orderId: 'VO-2302', invoiceNumber: 'INV-UR-2302', invoiceAmount: 12500, deliveryVerified: 'Yes', paymentStatus: 'Pending', invoiceDate: '2025-09-19', dueDate: '2025-09-26' },
  { id: 'PAY-004', vendor: 'Plantify', orderId: 'VO-2303', invoiceNumber: 'INV-PLT-2303', invoiceAmount: 8750, deliveryVerified: 'Partial', paymentStatus: 'Pending', invoiceDate: '2025-09-20', dueDate: '2025-09-27' },
  { id: 'PAY-005', vendor: 'EcoGarden Solutions', orderId: 'VO-2305', invoiceNumber: 'INV-EGS-2305', invoiceAmount: 35000, deliveryVerified: 'No', paymentStatus: 'Pending', invoiceDate: '2025-09-22', dueDate: '2025-09-29' },
  { id: 'PAY-006', vendor: 'Flower Garden', orderId: 'VO-2306', invoiceNumber: 'INV-FG-2306', invoiceAmount: 28500, deliveryVerified: 'Yes', paymentStatus: 'Overdue', invoiceDate: '2025-09-15', dueDate: '2025-09-22' },
  { id: 'PAY-007', vendor: 'Urban Roots', orderId: 'VO-2307', invoiceNumber: 'INV-UR-2307', invoiceAmount: 15750, deliveryVerified: 'Yes', paymentStatus: 'Released', invoiceDate: '2025-09-17', dueDate: '2025-09-24', releaseDate: '2025-09-23', referenceId: 'UTR-9876543210' },
  { id: 'PAY-008', vendor: 'Plantify', orderId: 'VO-2308', invoiceNumber: 'INV-PLT-2308', invoiceAmount: 22000, deliveryVerified: 'Yes', paymentStatus: 'Overdue', invoiceDate: '2025-09-14', dueDate: '2025-09-21' },
  { id: 'PAY-009', vendor: 'Clay Works', orderId: 'VO-2309', invoiceNumber: 'INV-CW-2309', invoiceAmount: 16800, deliveryVerified: 'Yes', paymentStatus: 'Pending', invoiceDate: '2025-09-23', dueDate: '2025-09-30' },
  { id: 'PAY-010', vendor: 'GreenLeaf Co', orderId: 'VO-2310', invoiceNumber: 'INV-GLC-2310', invoiceAmount: 52000, deliveryVerified: 'Yes', paymentStatus: 'Released', invoiceDate: '2025-09-16', dueDate: '2025-09-23', releaseDate: '2025-09-22', referenceId: 'UTR-5555666677' },
]

function AccountsPaymentRelease() {
  const [payments, setPayments] = useState<PaymentRecord[]>(INITIAL_PAYMENTS)
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set())
  const [isFilterOpen, setIsFilterOpen] = useState(true)
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false)
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null)

  // Filters
  const [filterStatus, setFilterStatus] = useState<PaymentStatus | ''>('')
  const [filterDeliveryVerified, setFilterDeliveryVerified] = useState<DeliveryVerified | ''>('')

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      if (filterStatus && p.paymentStatus !== filterStatus) return false
      if (filterDeliveryVerified && p.deliveryVerified !== filterDeliveryVerified) return false
      return true
    })
  }, [payments, filterStatus, filterDeliveryVerified])

  function resetFilters() {
    setFilterStatus('')
    setFilterDeliveryVerified('')
  }

  function togglePaymentSelection(paymentId: string) {
    setSelectedPayments(prev => {
      const newSet = new Set(prev)
      if (newSet.has(paymentId)) {
        newSet.delete(paymentId)
      } else {
        newSet.add(paymentId)
      }
      return newSet
    })
  }

  function toggleSelectAll() {
    const eligiblePayments = filteredPayments.filter(p => p.paymentStatus !== 'Released')
    if (selectedPayments.size === eligiblePayments.length && eligiblePayments.length > 0) {
      setSelectedPayments(new Set())
    } else {
      setSelectedPayments(new Set(eligiblePayments.map(p => p.id)))
    }
  }

  function handleMarkAsReleased(payment: PaymentRecord) {
    setSelectedPayment(payment)
    setIsReleaseModalOpen(true)
  }

  function handleSendNotification(payment: PaymentRecord) {
    setSelectedPayment(payment)
    setIsNotifyModalOpen(true)
  }

  function handleBulkRelease() {
    const eligiblePayments = filteredPayments.filter(p => 
      selectedPayments.has(p.id) && p.paymentStatus !== 'Released' && p.deliveryVerified === 'Yes'
    )
    
    if (eligiblePayments.length === 0) {
      alert('No eligible payments selected. Only verified, unreleased payments can be released.')
      return
    }

    alert(`Releasing payments for ${eligiblePayments.length} invoice(s)...`)
    setPayments(prev => prev.map(p => 
      eligiblePayments.find(ep => ep.id === p.id) 
        ? { ...p, paymentStatus: 'Released' as PaymentStatus, releaseDate: new Date().toISOString().split('T')[0] }
        : p
    ))
    setSelectedPayments(new Set())
  }

  const selectedCount = selectedPayments.size
  const allSelected = filteredPayments.filter(p => p.paymentStatus !== 'Released').length > 0 && 
                      selectedPayments.size === filteredPayments.filter(p => p.paymentStatus !== 'Released').length

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const pending = filteredPayments.filter(p => p.paymentStatus === 'Pending')
    const overdue = filteredPayments.filter(p => p.paymentStatus === 'Overdue')
    const released = filteredPayments.filter(p => p.paymentStatus === 'Released')
    const totalPending = pending.reduce((sum, p) => sum + p.invoiceAmount, 0)
    const totalOverdue = overdue.reduce((sum, p) => sum + p.invoiceAmount, 0)

    return {
      pendingCount: pending.length,
      overdueCount: overdue.length,
      releasedCount: released.length,
      totalPending,
      totalOverdue,
    }
  }, [filteredPayments])

  return (
    <div className="p-3 sm:p-6 font-sans text-primary">
      {/* Page Header */}
      <div className="mb-4 sm:mb-6">
        <h2 className="font-heading text-secondary text-xl sm:text-3xl font-semibold mb-2">Payment Release</h2>
        <p className="text-xs sm:text-sm text-gray-600">Release payments to vendors after verification</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 shadow-sm">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Total Records</div>
          <div className="text-xl sm:text-2xl font-bold text-secondary">{filteredPayments.length}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 shadow-sm">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Pending Payments</div>
          <div className="text-xl sm:text-2xl font-bold text-yellow-600">{summaryStats.pendingCount}</div>
          <div className="text-xs sm:text-sm text-gray-600">₹{summaryStats.totalPending.toLocaleString('en-IN')}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 shadow-sm">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Overdue Payments</div>
          <div className="text-xl sm:text-2xl font-bold text-red-600">{summaryStats.overdueCount}</div>
          <div className="text-xs sm:text-sm text-gray-600">₹{summaryStats.totalOverdue.toLocaleString('en-IN')}</div>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-3 sm:p-4 shadow-sm">
          <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">Released Payments</div>
          <div className="text-xl sm:text-2xl font-bold text-green-600">{summaryStats.releasedCount}</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="mb-4 bg-white border border-secondary/20 rounded-xl p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading text-secondary text-base sm:text-lg font-medium">Filters</h3>
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="text-xs sm:text-sm text-secondary underline"
          >
            {isFilterOpen ? 'Hide' : 'Show'} Filters
          </button>
        </div>

        {isFilterOpen && (
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
            <div className="flex-1 min-w-0">
              <label className="block text-xs sm:text-sm font-medium mb-2 text-secondary">Payment Status</label>
              <CustomDropdown
                value={filterStatus}
                onChange={(value) => setFilterStatus(value as PaymentStatus | '')}
                options={[
                  { value: '', label: 'All Statuses' },
                  { value: 'Pending', label: 'Pending' },
                  { value: 'Overdue', label: 'Overdue' },
                  { value: 'Released', label: 'Released' }
                ]}
                placeholder="All Statuses"
              />
            </div>

            <div className="flex-1 min-w-0">
              <label className="block text-xs sm:text-sm font-medium mb-2 text-secondary">Delivery Verified</label>
              <CustomDropdown
                value={filterDeliveryVerified}
                onChange={(value) => setFilterDeliveryVerified(value as DeliveryVerified | '')}
                options={[
                  { value: '', label: 'All' },
                  { value: 'Yes', label: 'Yes' },
                  { value: 'No', label: 'No' },
                  { value: 'Partial', label: 'Partial' }
                ]}
                placeholder="All"
              />
            </div>

            <div className="flex justify-end sm:justify-start">
              <button 
                onClick={resetFilters} 
                className="bg-white text-secondary border border-secondary rounded-full px-3 sm:px-4 py-2 text-xs sm:text-sm hover:bg-gray-50 transition-colors duration-200"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedCount > 0 && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="text-xs sm:text-sm text-blue-800">
            <strong>{selectedCount}</strong> payment{selectedCount !== 1 ? 's' : ''} selected
          </div>
          <button
            onClick={handleBulkRelease}
            className="bg-accent text-button-text rounded-full px-3 sm:px-4 py-2 flex items-center gap-2 hover:opacity-90 text-xs sm:text-sm w-full sm:w-auto justify-center"
          >
            <CheckSquare size={14} className="sm:w-4 sm:h-4" />
            <span>Release Selected Payments</span>
          </button>
        </div>
      )}

      {/* Table - Desktop View */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left p-3 font-heading text-secondary font-medium">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="text-left p-3 font-heading text-secondary font-medium">Vendor</th>
                <th className="text-left p-3 font-heading text-secondary font-medium">Order ID</th>
                <th className="text-left p-3 font-heading text-secondary font-medium">Invoice Amount</th>
                <th className="text-left p-3 font-heading text-secondary font-medium">Due Date</th>
                <th className="text-left p-3 font-heading text-secondary font-medium">Delivery Verified</th>
                <th className="text-left p-3 font-heading text-secondary font-medium">Payment Status</th>
                <th className="text-left p-3 font-heading text-secondary font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPayments.map((payment, idx) => {
                const paymentStyle = PAYMENT_STATUS_STYLES[payment.paymentStatus]
                const deliveryStyle = DELIVERY_VERIFIED_STYLES[payment.deliveryVerified]
                const isSelected = selectedPayments.has(payment.id)
                const canRelease = payment.paymentStatus !== 'Released' && payment.deliveryVerified === 'Yes'
                const isReleased = payment.paymentStatus === 'Released'

                return (
                  <tr key={payment.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-[#F5F3E7] transition-colors'}>
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => togglePaymentSelection(payment.id)}
                        disabled={isReleased}
                        className="rounded"
                      />
                    </td>
                    <td className="p-3 font-medium">{payment.vendor}</td>
                    <td className="p-3">{payment.orderId}</td>
                    <td className="p-3 font-semibold">₹{payment.invoiceAmount.toLocaleString('en-IN')}</td>
                    <td className="p-3 text-sm">
                      <div>{payment.dueDate}</div>
                      {payment.paymentStatus === 'Overdue' && (
                        <div className="text-xs text-red-600 flex items-center gap-1 mt-1">
                          <AlertTriangle size={12} />
                          <span>Overdue</span>
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <span 
                        className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap"
                        style={{
                          backgroundColor: deliveryStyle.bg,
                          color: deliveryStyle.color,
                          borderColor: deliveryStyle.border,
                        }}
                      >
                        {payment.deliveryVerified}
                      </span>
                    </td>
                    <td className="p-3">
                      <div>
                        <span 
                          className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap"
                          style={{
                            backgroundColor: paymentStyle.bg,
                            color: paymentStyle.color,
                            borderColor: paymentStyle.border,
                          }}
                        >
                          {payment.paymentStatus}
                        </span>
                        {payment.releaseDate && (
                          <div className="text-xs text-gray-500 mt-1">Released: {payment.releaseDate}</div>
                        )}
                        {payment.referenceId && (
                          <div className="text-xs text-gray-500">Ref: {payment.referenceId}</div>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleMarkAsReleased(payment)}
                          disabled={!canRelease}
                          className={`rounded-full px-3 py-1.5 text-sm flex items-center gap-1 ${
                            canRelease 
                              ? 'bg-accent text-button-text hover:opacity-90' 
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                          title={!canRelease ? 'Payment must be verified and not already released' : 'Mark as Released'}
                        >
                          <CheckSquare size={14} />
                          <span>Release</span>
                        </button>
                        <button 
                          onClick={() => handleSendNotification(payment)}
                          className="bg-blue-100 text-blue-700 rounded-full px-3 py-1.5 text-sm flex items-center gap-1 hover:bg-blue-200"
                          title="Send Notification to Vendor"
                        >
                          <Bell size={14} />
                          <span>Notify</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filteredPayments.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-gray-500">No payment records match current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden">
          {filteredPayments.length === 0 ? (
            <div className="p-6 text-center text-gray-500">No payment records match current filters.</div>
          ) : (
            <div className="space-y-3 p-3">
              {filteredPayments.map((payment) => {
                const paymentStyle = PAYMENT_STATUS_STYLES[payment.paymentStatus]
                const deliveryStyle = DELIVERY_VERIFIED_STYLES[payment.deliveryVerified]
                const isSelected = selectedPayments.has(payment.id)
                const canRelease = payment.paymentStatus !== 'Released' && payment.deliveryVerified === 'Yes'
                const isReleased = payment.paymentStatus === 'Released'

                return (
                  <div key={payment.id} className={`border rounded-xl p-4 ${isSelected ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => togglePaymentSelection(payment.id)}
                          disabled={isReleased}
                          className="rounded mt-1"
                        />
                        <div>
                          <h4 className="font-medium text-base text-secondary">{payment.vendor}</h4>
                          <p className="text-xs text-gray-500">{payment.orderId}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-lg text-secondary">₹{payment.invoiceAmount.toLocaleString('en-IN')}</div>
                        <div className="text-xs text-gray-500">{payment.dueDate}</div>
                      </div>
                    </div>

                    {/* Status Badges */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span 
                        className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border"
                        style={{
                          backgroundColor: paymentStyle.bg,
                          color: paymentStyle.color,
                          borderColor: paymentStyle.border,
                        }}
                      >
                        {payment.paymentStatus}
                      </span>
                      <span 
                        className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border"
                        style={{
                          backgroundColor: deliveryStyle.bg,
                          color: deliveryStyle.color,
                          borderColor: deliveryStyle.border,
                        }}
                      >
                        Delivery: {payment.deliveryVerified}
                      </span>
                    </div>

                    {/* Additional Info */}
                    {(payment.releaseDate || payment.referenceId) && (
                      <div className="text-xs text-gray-500 mb-3 space-y-1">
                        {payment.releaseDate && <div>Released: {payment.releaseDate}</div>}
                        {payment.referenceId && <div>Ref: {payment.referenceId}</div>}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleMarkAsReleased(payment)}
                        disabled={!canRelease}
                        className={`flex-1 rounded-full px-3 py-2 text-xs flex items-center justify-center gap-1 ${
                          canRelease 
                            ? 'bg-accent text-button-text hover:opacity-90' 
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                        title={!canRelease ? 'Payment must be verified and not already released' : 'Mark as Released'}
                      >
                        <CheckSquare size={12} />
                        <span>Release</span>
                      </button>
                      <button 
                        onClick={() => handleSendNotification(payment)}
                        className="flex-1 bg-blue-100 text-blue-700 rounded-full px-3 py-2 text-xs flex items-center justify-center gap-1 hover:bg-blue-200"
                        title="Send Notification to Vendor"
                      >
                        <Bell size={12} />
                        <span>Notify</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Mark as Released Modal */}
      {isReleaseModalOpen && selectedPayment && (
        <MarkAsReleasedModal 
          payment={selectedPayment}
          onClose={() => setIsReleaseModalOpen(false)}
          onConfirm={(referenceId: string) => {
            setPayments(prev => prev.map(p => 
              p.id === selectedPayment.id 
                ? { ...p, paymentStatus: 'Released' as PaymentStatus, releaseDate: new Date().toISOString().split('T')[0], referenceId }
                : p
            ))
            alert(`Payment released successfully for ${selectedPayment.vendor}!\nReference ID: ${referenceId}`)
            setIsReleaseModalOpen(false)
          }}
        />
      )}

      {/* Send Notification Modal */}
      {isNotifyModalOpen && selectedPayment && (
        <SendNotificationModal 
          payment={selectedPayment}
          onClose={() => setIsNotifyModalOpen(false)}
          onSend={(message: string) => {
            alert(`Notification sent to ${selectedPayment.vendor}!\n\nMessage: ${message}`)
            setIsNotifyModalOpen(false)
          }}
        />
      )}
    </div>
  )
}

function MarkAsReleasedModal({ 
  payment, 
  onClose, 
  onConfirm 
}: { 
  payment: PaymentRecord
  onClose: () => void
  onConfirm: (referenceId: string) => void
}) {
  const [referenceId, setReferenceId] = useState('')
  const [releaseDate, setReleaseDate] = useState(new Date().toISOString().split('T')[0])

  function handleSubmit() {
    if (!referenceId) {
      alert('Please enter a payment reference ID')
      return
    }
    onConfirm(referenceId)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-secondary text-lg sm:text-2xl">Mark Payment as Released</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="mb-4 p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-xs sm:text-sm text-gray-700 mb-2">
            <strong>Vendor:</strong> {payment.vendor}
          </div>
          <div className="text-xs sm:text-sm text-gray-700 mb-2">
            <strong>Invoice:</strong> {payment.invoiceNumber} ({payment.orderId})
          </div>
          <div className="text-xs sm:text-sm text-gray-700">
            <strong>Amount:</strong> ₹{payment.invoiceAmount.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Payment Reference ID *</label>
            <input
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-sm"
              placeholder="e.g. UTR-1234567890, IMPS/REF123"
            />
            <p className="text-xs text-gray-500 mt-1">Enter transaction reference number for tracking</p>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Release Date</label>
            <input
              type="date"
              value={releaseDate}
              onChange={(e) => setReleaseDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-sm"
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6">
          <button 
            onClick={onClose} 
            className="bg-white text-secondary border border-secondary rounded-full px-4 py-2 hover:bg-gray-50 text-sm order-2 sm:order-1"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            className="bg-accent text-button-text rounded-full px-4 py-2 hover:opacity-90 flex items-center justify-center gap-2 text-sm order-1 sm:order-2"
          >
            <CheckSquare size={16} />
            <span>Confirm Release</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function SendNotificationModal({ 
  payment, 
  onClose, 
  onSend 
}: { 
  payment: PaymentRecord
  onClose: () => void
  onSend: (message: string) => void
}) {
  const [message, setMessage] = useState(`Dear ${payment.vendor},\n\nThis is to inform you regarding invoice ${payment.invoiceNumber} for order ${payment.orderId}.\n\n`)
  const [notificationType, setNotificationType] = useState<'email' | 'sms' | 'both'>('email')

  function handleSend() {
    if (!message.trim()) {
      alert('Please enter a message')
      return
    }
    onSend(message)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-secondary text-lg sm:text-2xl">Send Notification to Vendor</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="mb-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
          <div className="text-xs sm:text-sm text-gray-700 mb-1">
            <strong>Vendor:</strong> {payment.vendor}
          </div>
          <div className="text-xs sm:text-sm text-gray-700">
            <strong>Invoice:</strong> {payment.invoiceNumber} • <strong>Amount:</strong> ₹{payment.invoiceAmount.toLocaleString('en-IN')}
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Notification Type</label>
            <div className="flex flex-wrap gap-3 sm:gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="email"
                  checked={notificationType === 'email'}
                  onChange={() => setNotificationType('email')}
                  className="rounded-full"
                />
                <span className="text-xs sm:text-sm">Email</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="sms"
                  checked={notificationType === 'sms'}
                  onChange={() => setNotificationType('sms')}
                  className="rounded-full"
                />
                <span className="text-xs sm:text-sm">SMS</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="both"
                  checked={notificationType === 'both'}
                  onChange={() => setNotificationType('both')}
                  className="rounded-full"
                />
                <span className="text-xs sm:text-sm">Both</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent resize-none text-sm"
              placeholder="Enter notification message..."
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6">
          <button 
            onClick={onClose} 
            className="bg-white text-secondary border border-secondary rounded-full px-4 py-2 hover:bg-gray-50 text-sm order-2 sm:order-1"
          >
            Cancel
          </button>
          <button 
            onClick={handleSend} 
            className="bg-accent text-button-text rounded-full px-4 py-2 hover:opacity-90 flex items-center justify-center gap-2 text-sm order-1 sm:order-2"
          >
            <Bell size={16} />
            <span>Send Notification</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default AccountsPaymentRelease

