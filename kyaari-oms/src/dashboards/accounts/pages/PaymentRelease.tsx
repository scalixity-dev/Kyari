import { useState, useMemo, useEffect } from 'react'
import { Bell, X, AlertTriangle, CheckSquare, Wallet, Clock } from 'lucide-react'
import { CustomDropdown, KPICard } from '../../../components'
import { PaymentsApi, type PaymentListItem } from '../../../services/paymentsApi'
import { Pagination } from '../../../components/ui/Pagination'

type PaymentStatus = 'Pending' | 'Released' | 'Overdue'
type DeliveryVerified = 'Yes' | 'No' | 'Partial'

type PaymentRecord = PaymentListItem

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

const INITIAL_PAYMENTS: PaymentRecord[] = []

function AccountsPaymentRelease() {
  const [payments, setPayments] = useState<PaymentRecord[]>(INITIAL_PAYMENTS)
  const [loading, setLoading] = useState(true)
  const [selectedPayments, setSelectedPayments] = useState<Set<string>>(new Set())
  const [isReleaseModalOpen, setIsReleaseModalOpen] = useState(false)
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState<PaymentRecord | null>(null)
  const [isEditAmountOpen, setIsEditAmountOpen] = useState(false)
  const [amountEditPayment, setAmountEditPayment] = useState<PaymentRecord | null>(null)
  const [invoiceViewerOpen, setInvoiceViewerOpen] = useState(false)
  const [viewerPayment, setViewerPayment] = useState<PaymentRecord | null>(null)

  // Filters
  const [filterOrderId, setFilterOrderId] = useState('')
  const [filterVendor, setFilterVendor] = useState('')
  const [filterStatus, setFilterStatus] = useState<PaymentStatus | ''>('')
  const [filterDeliveryVerified, setFilterDeliveryVerified] = useState<DeliveryVerified | ''>('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Get unique vendors for dropdown
  const uniqueVendors = useMemo(() => {
    const vendors = Array.from(new Set(payments.map(p => p.vendor)))
    return vendors.sort()
  }, [payments])

  const filteredPayments = useMemo(() => {
    return payments.filter(p => {
      if (filterOrderId && !p.orderId.toLowerCase().includes(filterOrderId.toLowerCase())) return false
      if (filterVendor && p.vendor !== filterVendor) return false
      if (filterStatus && p.paymentStatus !== filterStatus) return false
      if (filterDeliveryVerified && p.deliveryVerified !== filterDeliveryVerified) return false
      return true
    })
  }, [payments, filterOrderId, filterVendor, filterStatus, filterDeliveryVerified])

  // Pagination calculations
  const totalPages = Math.ceil(filteredPayments.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, filteredPayments.length)
  const paginatedPayments = filteredPayments.slice(startIndex, endIndex)

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filterOrderId, filterVendor, filterStatus, filterDeliveryVerified])

  // Load payments from API on filter/page change
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true)
        const params: any = {
          vendor: filterVendor,
          status: filterStatus,
          deliveryVerified: filterDeliveryVerified,
          page: currentPage,
          limit: itemsPerPage,
        }
        if (filterOrderId) {
          params.orderId = filterOrderId
        }
        const res = await PaymentsApi.list(params)
        setPayments(res.data.items)
      } catch (e) {
        console.error('Failed to load payments', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [filterOrderId, filterVendor, filterStatus, filterDeliveryVerified, currentPage])

  function resetFilters() {
    setFilterOrderId('')
    setFilterVendor('')
    setFilterStatus('')
    setFilterDeliveryVerified('')
    setCurrentPage(1)
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

  function handleEditAmount(payment: PaymentRecord) {
    setAmountEditPayment(payment)
    setIsEditAmountOpen(true)
  }

  function handleUpdateDeliveryStatus(payment: PaymentRecord) {
    setAmountEditPayment(payment)
    setIsEditAmountOpen(true)
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
    <div className="p-4 sm:p-6 lg:p-9 bg-[color:var(--color-sharktank-bg)] min-h-[calc(100vh-4rem)] font-sans w-full overflow-x-hidden">
      {/* Page Header */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-heading mb-2">Payment Release</h1>
        <p className="text-sm sm:text-base text-gray-600">Review deliveries, verify invoices, and release vendor payments</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 pt-6 sm:pt-8 pb-4 sm:pb-6 gap-10 sm:gap-8 xl:gap-6 mb-6">
        <KPICard
          title="Total Records"
          value={filteredPayments.length}
          icon={<Wallet size={32} />}
        />
        <KPICard
          title="Pending Payments"
          value={summaryStats.pendingCount}
          subtitle={`₹${summaryStats.totalPending.toLocaleString('en-IN')}`}
          icon={<Clock size={32} />}
        />
        <KPICard
          title="Overdue Payments"
          value={summaryStats.overdueCount}
          subtitle={`₹${summaryStats.totalOverdue.toLocaleString('en-IN')}`}
          icon={<AlertTriangle size={32} />}
        />
        <KPICard
          title="Released Payments"
          value={summaryStats.releasedCount}
          icon={<CheckSquare size={32} />}
        />
      </div>

      {/* Filter Bar */}
      <div className="mb-4 bg-white border border-secondary/20 rounded-xl p-3 sm:p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading text-secondary text-base sm:text-lg font-medium">Filters</h3>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-end">
          <div className="flex-1 min-w-0">
            <label className="block text-xs sm:text-sm font-medium mb-2 text-secondary">Order ID</label>
            <input
              type="text"
              value={filterOrderId}
              onChange={(e) => setFilterOrderId(e.target.value)}
              placeholder="Search by Order ID"
              className="w-full px-3 py-2 xl:py-2.5 2xl:py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-accent focus:border-transparent text-xs sm:text-sm"
            />
          </div>

          <div className="flex-1 min-w-0">
            <label className="block text-xs sm:text-sm font-medium mb-2 text-secondary">Vendor</label>
            <CustomDropdown
              value={filterVendor}
              onChange={(value) => setFilterVendor(value)}
              options={[
                { value: '', label: 'All Vendors' },
                ...uniqueVendors.map(vendor => ({ value: vendor, label: vendor }))
              ]}
              placeholder="All Vendors"
              className="[&>button]:py-2 [&>button]:xl:py-2.5 [&>button]:2xl:py-3"
            />
          </div>

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
              className="[&>button]:py-2 [&>button]:xl:py-2.5 [&>button]:2xl:py-3"
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
              className="[&>button]:py-2 [&>button]:xl:py-2.5 [&>button]:2xl:py-3"
            />
          </div>

          <div className="flex justify-end sm:justify-start">
            <button 
              onClick={resetFilters} 
              className="bg-white text-secondary border border-secondary rounded-xl px-3 sm:px-4 py-2 xl:py-2.5 2xl:py-3 text-xs sm:text-sm hover:bg-gray-50 transition-colors duration-200"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedCount > 0 && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="text-xs sm:text-sm text-blue-800">
            <strong>{selectedCount}</strong> payment{selectedCount !== 1 ? 's' : ''} selected
          </div>
          <button
            onClick={handleBulkRelease}
            className="bg-accent text-button-text rounded-xl px-3 sm:px-4 py-2 flex items-center gap-2 hover:opacity-90 text-xs sm:text-sm w-full sm:w-auto justify-center"
          >
            <CheckSquare size={14} className="sm:w-4 sm:h-4" />
            <span>Release Selected Payments</span>
          </button>
        </div>
      )}

      {/* Table - Desktop View */}
      <div className="hidden lg:block overflow-x-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-w-[1000px]">
          {loading ? (
            <div className="bg-white rounded-xl p-12 text-center">
              <div className="w-12 h-12 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading payments...</p>
            </div>
          ) : (
            <>
              <table className="w-full border-separate border-spacing-0">
                <thead>
                  <tr style={{ background: 'var(--color-accent)' }}>
                    <th className="text-center p-3 font-heading font-normal text-xs" style={{ color: 'var(--color-button-text)' }}>
                      <input
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleSelectAll}
                        className="rounded"
                      />
                    </th>
                    <th className="text-left p-3 font-heading font-normal text-xs" style={{ color: 'var(--color-button-text)' }}>Vendor</th>
                    <th className="text-left p-3 font-heading font-normal text-xs" style={{ color: 'var(--color-button-text)' }}>Order ID</th>
                    <th className="text-center p-3 font-heading font-normal text-xs" style={{ color: 'var(--color-button-text)' }}>Invoice Amount</th>
                    <th className="text-center p-3 font-heading font-normal text-xs" style={{ color: 'var(--color-button-text)' }}>Due Date</th>
                    <th className="text-center p-3 font-heading font-normal text-xs" style={{ color: 'var(--color-button-text)' }}>Delivery Verified</th>
                    <th className="text-center p-3 font-heading font-normal text-xs" style={{ color: 'var(--color-button-text)' }}>Payment Status</th>
                    <th className="text-center p-3 font-heading font-normal text-xs" style={{ color: 'var(--color-button-text)' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPayments.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-gray-500">
                        No payment records match current filters.
                      </td>
                    </tr>
                  ) : (
                    paginatedPayments.map((payment) => {
                      const paymentStyle = PAYMENT_STATUS_STYLES[payment.paymentStatus]
                      const deliveryStyle = DELIVERY_VERIFIED_STYLES[payment.deliveryVerified]
                      const isSelected = selectedPayments.has(payment.id)
                      const canRelease = payment.paymentStatus !== 'Released' && payment.deliveryVerified === 'Yes'
                      const isReleased = payment.paymentStatus === 'Released'
                      const canEditAmount = payment.deliveryVerified !== 'Yes'
                      const isPartialDelivery = payment.deliveryVerified === 'Partial'

                      return (
                        <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50 bg-white transition-colors">
                          <td className="p-3 text-center">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => togglePaymentSelection(payment.id)}
                              disabled={isReleased}
                              className="rounded"
                            />
                          </td>
                          <td className="p-3 font-semibold text-secondary text-sm">{payment.vendor}</td>
                          <td className="p-3 text-sm text-gray-700">{payment.orderId}</td>
                          <td className="p-3 text-center text-sm font-medium text-gray-900">
                            ₹{payment.invoiceAmount.toLocaleString('en-IN')}
                          </td>
                          <td className="p-3 text-center text-sm">
                            <div className="text-gray-700">{payment.dueDate}</div>
                            {payment.paymentStatus === 'Overdue' && (
                              <div className="text-xs text-red-600 flex items-center justify-center gap-1 mt-1">
                                <AlertTriangle size={10} />
                                <span>Overdue</span>
                              </div>
                            )}
                          </td>
                          <td className="p-3 text-center">
                            <span 
                              className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border"
                              style={{
                                backgroundColor: deliveryStyle.bg,
                                color: deliveryStyle.color,
                                borderColor: deliveryStyle.border,
                              }}
                            >
                              {payment.deliveryVerified}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex flex-col items-center gap-1">
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
                              {payment.releaseDate && (
                                <div className="text-xs text-gray-500">Released: {payment.releaseDate}</div>
                              )}
                              {payment.referenceId && (
                                <div className="text-xs text-gray-500">Ref: {payment.referenceId}</div>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col gap-1.5 items-center">
                              <button 
                                onClick={() => handleMarkAsReleased(payment)}
                                disabled={!canRelease}
                                className={`rounded-md px-2.5 py-1.5 text-xs flex items-center gap-1 ${
                                  canRelease 
                                    ? 'bg-[var(--color-accent)] text-[var(--color-button-text)] hover:brightness-95' 
                                    : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                }`}
                                title={!canRelease ? 'Payment must be verified and not already released' : 'Mark as Released'}
                              >
                                <CheckSquare size={12} />
                                <span>Release</span>
                              </button>
                              {isPartialDelivery ? (
                                <button 
                                  onClick={() => handleUpdateDeliveryStatus(payment)}
                                  className="bg-orange-500 text-white rounded-md px-2.5 py-1.5 text-xs flex items-center gap-1 hover:bg-orange-600"
                                  title="Review partial delivery and update status"
                                >
                                  <Wallet size={12} />
                                  <span>Review</span>
                                </button>
                              ) : (
                                <button 
                                  onClick={() => handleEditAmount(payment)}
                                  disabled={!canEditAmount}
                                  className={`rounded-md px-2.5 py-1.5 text-xs flex items-center gap-1 ${
                                    canEditAmount 
                                      ? 'bg-purple-500 text-white hover:bg-purple-600' 
                                      : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                  }`}
                                  title={canEditAmount ? 'Edit invoice amount (mismatch/partial)' : 'Amount editable only for mismatch/partial'}
                                >
                                  <Wallet size={12} />
                                  <span>Edit</span>
                                </button>
                              )}
                              <button 
                                onClick={() => handleSendNotification(payment)}
                                className="bg-blue-500 text-white rounded-md px-2.5 py-1.5 text-xs flex items-center gap-1 hover:bg-blue-600"
                                title="Send Notification to Vendor"
                              >
                                <Bell size={12} />
                                <span>Notify</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>

              {filteredPayments.length > 0 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  totalItems={filteredPayments.length}
                  startIndex={startIndex}
                  endIndex={endIndex}
                  onPageChange={setCurrentPage}
                  itemLabel="payments"
                  variant="desktop"
                />
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden">
        {loading ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <div className="w-12 h-12 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading payments...</p>
          </div>
        ) : (
          <>
            {paginatedPayments.length === 0 ? (
              <div className="p-6 text-center text-gray-500">No payment records match current filters.</div>
            ) : (
              <div className="space-y-4 p-3">
                {paginatedPayments.map((payment) => {
                    const paymentStyle = PAYMENT_STATUS_STYLES[payment.paymentStatus]
                    const deliveryStyle = DELIVERY_VERIFIED_STYLES[payment.deliveryVerified]
                    const isSelected = selectedPayments.has(payment.id)
                    const canRelease = payment.paymentStatus !== 'Released' && payment.deliveryVerified === 'Yes'
                    const isReleased = payment.paymentStatus === 'Released'
                    const canEditAmount = payment.deliveryVerified !== 'Yes'
                    const isPartialDelivery = payment.deliveryVerified === 'Partial'

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
                          {isPartialDelivery ? (
                            <button 
                              onClick={() => handleUpdateDeliveryStatus(payment)}
                              className="flex-1 bg-orange-100 text-orange-700 rounded-full px-3 py-2 text-xs flex items-center justify-center gap-1 hover:bg-orange-200"
                              title="Review partial delivery and update status"
                            >
                              <Wallet size={12} />
                              <span>Review</span>
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleEditAmount(payment)}
                              disabled={!canEditAmount}
                              className={`flex-1 bg-purple-100 text-purple-700 rounded-full px-3 py-2 text-xs flex items-center justify-center gap-1 ${
                                canEditAmount ? 'hover:bg-purple-200' : 'cursor-not-allowed opacity-60'
                              }`}
                              title={canEditAmount ? 'Edit invoice amount (mismatch/partial)' : 'Amount editable only for mismatch/partial'}
                            >
                              <Wallet size={12} />
                              <span>Edit</span>
                            </button>
                          )}
                          <button 
                            onClick={() => handleSendNotification(payment)}
                            className="flex-1 bg-blue-100 text-blue-700 rounded-xl px-3 py-2 text-xs flex items-center justify-center gap-1 hover:bg-blue-200"
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

            {filteredPayments.length > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredPayments.length}
                startIndex={startIndex}
                endIndex={endIndex}
                onPageChange={setCurrentPage}
                itemLabel="payments"
                variant="mobile"
              />
            )}
          </>
        )}
      </div>

      {/* Mark as Released Modal */}
      {isReleaseModalOpen && selectedPayment && (
        <MarkAsReleasedModal 
          payment={selectedPayment}
          onClose={() => setIsReleaseModalOpen(false)}
          onConfirm={async (referenceId: string) => {
            await PaymentsApi.release(selectedPayment.id, referenceId)
            // reload list with current filters/page
            const res = await PaymentsApi.list({
              status: filterStatus,
              deliveryVerified: filterDeliveryVerified,
              page: currentPage,
              limit: itemsPerPage,
            })
            setPayments(res.data.items)
            setIsReleaseModalOpen(false)
          }}
          onShowInvoices={() => { setViewerPayment(selectedPayment); setInvoiceViewerOpen(true) }}
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

      {/* Edit Amount Modal */}
      {isEditAmountOpen && amountEditPayment && (
        <EditAmountModal
          payment={amountEditPayment}
          onClose={() => setIsEditAmountOpen(false)}
          onConfirm={async (newAmount: number, reason: string, deliveryStatus?: 'Yes' | 'No' | 'Partial') => {
            await PaymentsApi.editAmount(amountEditPayment.id, newAmount, reason)
            
            // Update delivery status if provided
            if (deliveryStatus) {
              await PaymentsApi.updateDeliveryStatus(amountEditPayment.id, deliveryStatus)
            }
            
            const res = await PaymentsApi.list({
              status: filterStatus,
              deliveryVerified: filterDeliveryVerified,
              page: currentPage,
              limit: itemsPerPage,
            })
            setPayments(res.data.items)
            setIsEditAmountOpen(false)
          }}
          onShowInvoices={() => { setViewerPayment(amountEditPayment); setInvoiceViewerOpen(true) }}
        />
      )}

      {/* Side-by-side Invoices Viewer Modal */}
      {invoiceViewerOpen && viewerPayment && (
        <InvoiceSideBySideModal
          payment={viewerPayment}
          onClose={() => { setInvoiceViewerOpen(false); setViewerPayment(null) }}
        />
      )}
    </div>
  )
}

function MarkAsReleasedModal({ 
  payment, 
  onClose, 
  onConfirm,
  onShowInvoices
}: { 
  payment: PaymentRecord
  onClose: () => void
  onConfirm: (referenceId: string) => void
  onShowInvoices: () => void
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

        {(payment.accountsInvoiceUrl || payment.vendorInvoiceUrl) && (
          <div className="mb-4 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-xs sm:text-sm text-gray-800 font-medium mb-2">Invoices</div>
            <button
              type="button"
              onClick={onShowInvoices}
              className="text-xs sm:text-sm text-accent hover:text-secondary underline"
            >
              Show invoices
            </button>
          </div>
        )}

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
            className="bg-white text-secondary border border-secondary rounded-xl px-4 py-2 hover:bg-gray-50 text-sm order-2 sm:order-1"
          >
            Cancel
          </button>
          <button 
            onClick={handleSend} 
            className="bg-accent text-button-text rounded-xl px-4 py-2 hover:opacity-90 flex items-center justify-center gap-2 text-sm order-1 sm:order-2"
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

function EditAmountModal({
  payment,
  onClose,
  onConfirm,
  onShowInvoices
}: {
  payment: PaymentRecord
  onClose: () => void
  onConfirm: (newAmount: number, reason: string, deliveryStatus?: 'Yes' | 'No' | 'Partial') => void
  onShowInvoices: () => void
}) {
  const [newAmount, setNewAmount] = useState<number>(payment.invoiceAmount)
  const [reason, setReason] = useState('')
  const [deliveryStatus, setDeliveryStatus] = useState<'Yes' | 'No' | 'Partial'>(payment.deliveryVerified)
  const [updateDeliveryStatus, setUpdateDeliveryStatus] = useState(false)

  const isValid = newAmount > 0
  const isPartialDelivery = payment.deliveryVerified === 'Partial'

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white w-full max-w-lg rounded-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-secondary text-lg sm:text-2xl">
            {isPartialDelivery ? 'Review Partial Delivery' : 'Edit Invoice Amount'}
          </h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className={`mb-4 p-3 sm:p-4 rounded-lg border ${isPartialDelivery ? 'bg-orange-50 border-orange-200' : 'bg-yellow-50 border-yellow-200'}`}>
          <div className="text-xs sm:text-sm text-gray-700 mb-2">
            <strong>Vendor:</strong> {payment.vendor}
          </div>
          <div className="text-xs sm:text-sm text-gray-700 mb-2">
            <strong>Invoice:</strong> {payment.invoiceNumber} ({payment.orderId})
          </div>
          <div className="text-xs sm:text-sm text-gray-700 mb-2">
            <strong>Current Amount:</strong> ₹{payment.invoiceAmount.toLocaleString('en-IN')}
          </div>
          <div className="text-xs sm:text-sm text-gray-700">
            <strong>Delivery Status:</strong> <span className={`px-2 py-1 rounded text-xs font-semibold ${isPartialDelivery ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700'}`}>
              {payment.deliveryVerified}
            </span>
          </div>
          {isPartialDelivery && (
            <div className="text-xs sm:text-sm text-orange-700 mt-2 font-medium">
               Vendor delivered partial items and uploaded new invoice. Review and update amount accordingly.
            </div>
          )}
        </div>

        {(payment.accountsInvoiceUrl || payment.vendorInvoiceUrl) && (
          <div className="mb-4 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
            <button
              type="button"
              onClick={onShowInvoices}
              className="text-xs sm:text-sm text-accent hover:text-secondary underline"
            >
              Show invoices
            </button>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">New Amount *</label>
            <input
              type="number"
              min="0"
              value={Number.isNaN(newAmount) ? '' : newAmount}
              onChange={(e) => setNewAmount(parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-sm"
              placeholder="Enter revised invoice amount"
            />
            {!isValid && (
              <p className="text-xs text-red-600 mt-1">Please enter a valid amount greater than 0.</p>
            )}
          </div>

          {isPartialDelivery && (
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                <input
                  type="checkbox"
                  checked={updateDeliveryStatus}
                  onChange={(e) => setUpdateDeliveryStatus(e.target.checked)}
                  className="mr-2"
                />
                Update delivery status to complete
              </label>
              {updateDeliveryStatus && (
                <div className="ml-6">
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">New Delivery Status</label>
                  <select
                    value={deliveryStatus}
                    onChange={(e) => setDeliveryStatus(e.target.value as 'Yes' | 'No' | 'Partial')}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-sm"
                  >
                    <option value="Yes">Yes - Fully Delivered</option>
                    <option value="No">No - Not Delivered</option>
                    <option value="Partial">Partial - Partially Delivered</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Change to "Yes" to enable payment release</p>
                  <p className="text-xs text-blue-600 mt-1">Note: This will update the GRN status to reflect the delivery verification.</p>
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">Reason (optional)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-sm"
              placeholder={isPartialDelivery ? "Add context (e.g., partial delivery confirmed, revised invoice amount)" : "Add context (e.g., quantity mismatch, damaged items, revised invoice)"}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-end gap-2 mt-6">
          <button 
            onClick={onClose} 
            className="bg-white text-secondary border border-secondary rounded-xl px-4 py-2 hover:bg-gray-50 text-sm order-2 sm:order-1"
          >
            Cancel
          </button>
          <button 
            onClick={() => isValid && onConfirm(newAmount, reason, updateDeliveryStatus ? deliveryStatus : undefined)}
            disabled={!isValid}
            className="bg-accent text-button-text rounded-xl px-4 py-2 hover:opacity-90 flex items-center justify-center gap-2 text-sm order-1 sm:order-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <CheckSquare size={16} />
            <span>{isPartialDelivery ? 'Save & Update Status' : 'Save Amount'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

function InvoiceSideBySideModal({
  payment,
  onClose
}: {
  payment: PaymentRecord
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-3 sm:p-4">
      <div className="bg-white rounded-2xl w-full max-w-6xl max-h-[95vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
          <h3 className="text-base sm:text-lg font-semibold text-secondary">Invoices</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-3 sm:p-4 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
              <div className="text-xs font-medium text-gray-700 mb-1">Accounts Invoice</div>
              {payment.accountsInvoiceUrl ? (
                <iframe src={payment.accountsInvoiceUrl} className="w-full h-[70vh] rounded" title="Accounts Invoice" />
              ) : (
                <div className="text-xs text-gray-400">Not uploaded</div>
              )}
            </div>
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-2">
              <div className="text-xs font-medium text-gray-700 mb-1">Vendor Invoice</div>
              {payment.vendorInvoiceUrl ? (
                <iframe src={payment.vendorInvoiceUrl} className="w-full h-[70vh] rounded" title="Vendor Invoice" />
              ) : (
                <div className="text-xs text-gray-400">Not uploaded</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


