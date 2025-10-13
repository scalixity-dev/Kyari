import { useState, useMemo, useEffect } from 'react'
import { Eye, FileText, ChevronRight, X, ChevronDown } from 'lucide-react'
import { CustomDropdown } from '../../../components'
import { AccountsAssignmentApiService } from '../../../services/accountsAssignmentApi'
import type { VendorOrder, OrderStatus, POStatus, InvoiceStatus } from '../../../services/accountsAssignmentApi'

const STATUS_STYLES: Record<OrderStatus, { label: string; bg: string; color: string; border: string }> = {
  Confirmed: { label: 'Confirmed', bg: '#D1FAE5', color: '#065F46', border: '#A7F3D0' },
  'Awaiting PO': { label: 'Awaiting PO', bg: '#DBEAFE', color: '#1E3A8A', border: '#BFDBFE' },
  'PO Generated': { label: 'PO Generated', bg: '#FFEDD5', color: '#9A3412', border: '#FED7AA' },
  Delivered: { label: 'Delivered', bg: '#E0ECE8', color: '#1D4D43', border: '#B7CEC6' },
  Closed: { label: 'Closed', bg: '#E5E7EB', color: '#111827', border: '#D1D5DB' }
}

const PO_STATUS_STYLES: Record<POStatus, { label: string; bg: string; color: string; border: string }> = {
  Pending: { label: 'Pending', bg: '#FEF3C7', color: '#92400E', border: '#FDE68A' },
  Generated: { label: 'Generated', bg: '#D1FAE5', color: '#065F46', border: '#A7F3D0' }
}

const INVOICE_STATUS_STYLES: Record<InvoiceStatus, { label: string; bg: string; color: string; border: string }> = {
  'Not Created': { label: 'Not Created', bg: '#E5E7EB', color: '#111827', border: '#D1D5DB' },
  'Awaiting Validation': { label: 'Awaiting Validation', bg: '#DBEAFE', color: '#1E3A8A', border: '#BFDBFE' },
  'Approved': { label: 'Approved', bg: '#D1FAE5', color: '#065F46', border: '#A7F3D0' }
}

export default function VendorOrders() {
  const [orders, setOrders] = useState<VendorOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<VendorOrder | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // Filter states
  const [filterVendor, setFilterVendor] = useState('')
  const [filterStatus, setFilterStatus] = useState<OrderStatus | ''>('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const itemsPerPage = 10

  const vendors = useMemo(() => Array.from(new Set(orders.map(o => o.vendorName))).sort(), [orders])

  // Fetch vendor orders from API
  const fetchVendorOrders = async () => {
    try {
      setLoading(true)
      const response = await AccountsAssignmentApiService.getConfirmedVendorOrders({
        page: currentPage,
        limit: itemsPerPage,
        vendorName: filterVendor || undefined,
        orderStatus: filterStatus || undefined,
        startDate: filterDateFrom || undefined,
        endDate: filterDateTo || undefined
      })

      setOrders(response.orders)
      setTotalPages(response.pagination.pages)
      setTotalCount(response.pagination.total)
    } catch (error) {
      console.error('Failed to fetch vendor orders:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch on mount and when filters/pagination change
  useEffect(() => {
    fetchVendorOrders()
  }, [currentPage, filterVendor, filterStatus, filterDateFrom, filterDateTo])

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [filterVendor, filterStatus, filterDateFrom, filterDateTo])

  const paginatedOrders = orders
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalCount)

  const handleSelectOrder = (orderId: string) => {
    const newSelected = new Set(selectedOrders)
    if (newSelected.has(orderId)) {
      newSelected.delete(orderId)
    } else {
      newSelected.add(orderId)
    }
    setSelectedOrders(newSelected)
  }

  const handleSelectAll = () => {
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set())
    } else {
      setSelectedOrders(new Set(orders.map(o => o.id)))
    }
  }

  const handleViewDetails = (order: VendorOrder) => {
    setSelectedOrder(order)
  }

  // Animate panel open/close
  function closeDetailPanel() {
    setIsDetailPanelOpen(false)
    setTimeout(() => setSelectedOrder(null), 300)
  }
  
  useEffect(() => {
    if (selectedOrder) {
      // Reset the panel state first to ensure it starts from hidden position
      setIsDetailPanelOpen(false)
      // Use a small timeout to ensure the DOM has updated with the hidden state
      const timeoutId = setTimeout(() => {
        setIsDetailPanelOpen(true)
      }, 10)
      return () => clearTimeout(timeoutId)
    } else {
      setIsDetailPanelOpen(false)
    }
    return undefined
  }, [selectedOrder])

  const handleGeneratePO = async (vendorOrderId: string) => {
    try {
      const order = orders.find(o => o.id === vendorOrderId)
      if (!order) return

      // Pass actual orderId and vendorId separately
      await AccountsAssignmentApiService.generatePO(order.orderId, order.vendorId)
      
      // Refresh the list
      await fetchVendorOrders()
    } catch (error) {
      console.error('Failed to generate PO:', error)
    }
  }

  const handleBulkGeneratePO = async () => {
    try {
      const orderIds = Array.from(selectedOrders)
        .map(id => orders.find(o => o.id === id)?.orderId)
        .filter(Boolean) as string[]

      await AccountsAssignmentApiService.bulkGeneratePO(orderIds)
      
      // Refresh the list
      await fetchVendorOrders()
      setSelectedOrders(new Set())
    } catch (error) {
      console.error('Failed to bulk generate POs:', error)
    }
  }

  const toggleRowExpansion = (orderId: string) => {
    const newExpanded = new Set(expandedRows)
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId)
    } else {
      newExpanded.add(orderId)
    }
    setExpandedRows(newExpanded)
  }

  const resetFilters = () => {
    setFilterVendor('')
    setFilterStatus('')
    setFilterDateFrom('')
    setFilterDateTo('')
    setCurrentPage(1)
  }

  return (
    <div className="p-4 sm:p-6 lg:pl-9 xl:p-9 2xl:p-9 bg-[color:var(--color-sharktank-bg)] min-h-[calc(100vh-4rem)] font-sans w-full overflow-x-hidden">
      {/* Page Header */}
      <div className="mb-4 sm:mb-6 xl:mb-7 2xl:mb-8">
        <h2 className="text-2xl sm:text-3xl  font-semibold text-[var(--color-heading)] mb-2">Vendor Orders</h2>
        <p className="text-sm xl:text-base 2xl:text-base text-[var(--color-heading)]">Manage vendor orders, generate POs, and track order status</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 xl:p-5 2xl:p-6 mb-4 sm:mb-6 xl:mb-7 2xl:mb-8 border border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 xl:gap-5 2xl:gap-6">
          <div>
            <label className="block text-xs xl:text-sm 2xl:text-base font-medium text-secondary mb-1 xl:mb-1.5 2xl:mb-2">Vendor</label>
            <CustomDropdown
              value={filterVendor}
              onChange={(value) => setFilterVendor(value)}
              options={[
                { value: '', label: 'All Vendors' },
                ...vendors.map(vendor => ({ value: vendor, label: vendor }))
              ]}
              placeholder="All Vendors"
            />
          </div>
          
          <div>
            <label className="block text-xs xl:text-sm 2xl:text-base font-medium text-secondary mb-1 xl:mb-1.5 2xl:mb-2">Status</label>
            <CustomDropdown
              value={filterStatus}
              onChange={(value) => setFilterStatus(value as OrderStatus | '')}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'Confirmed', label: 'Confirmed' },
                { value: 'Awaiting PO', label: 'Awaiting PO' },
                { value: 'PO Generated', label: 'PO Generated' },
                { value: 'Delivered', label: 'Delivered' },
                { value: 'Closed', label: 'Closed' }
              ]}
              placeholder="All Statuses"
            />
          </div>
          
          <div>
            <label className="block text-xs xl:text-sm 2xl:text-base font-medium text-secondary mb-1 xl:mb-1.5 2xl:mb-2">Date From</label>
            <input 
              type="date" 
              value={filterDateFrom} 
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-full px-3 xl:px-3.5 2xl:px-4 py-2 xl:py-2.5 2xl:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-xs xl:text-sm 2xl:text-base hover:border-accent transition-all duration-200"
            />
          </div>
          
          <div>
            <label className="block text-xs xl:text-sm 2xl:text-base font-medium text-secondary mb-1 xl:mb-1.5 2xl:mb-2">Date To</label>
            <input 
              type="date" 
              value={filterDateTo} 
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-full px-3 xl:px-3.5 2xl:px-4 py-2 xl:py-2.5 2xl:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-xs xl:text-sm 2xl:text-base hover:border-accent transition-all duration-200"
            />
          </div>
          
          <div className="sm:col-span-2 lg:col-span-1">
            <label className="block text-xs xl:text-sm 2xl:text-base font-medium text-secondary mb-1 xl:mb-1.5 2xl:mb-2">&nbsp;</label>
            <button 
              onClick={resetFilters}
              className="w-full bg-white text-secondary border border-secondary rounded-lg px-4 xl:px-5 2xl:px-6 py-2 xl:py-2.5 2xl:py-3 hover:bg-secondary hover:text-white text-xs xl:text-sm 2xl:text-base font-medium transition-colors duration-200"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedOrders.size > 0 && (
        <div className="bg-accent text-button-text rounded-xl p-3 sm:p-4 xl:p-5 2xl:p-6 mb-4 sm:mb-6 xl:mb-7 2xl:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4 xl:gap-5 2xl:gap-6">
            <span className="font-medium text-sm sm:text-base xl:text-lg 2xl:text-xl">{selectedOrders.size} orders selected</span>
            <div className="flex flex-col sm:flex-row gap-2 xl:gap-3 2xl:gap-4 w-full sm:w-auto">
              <button
                onClick={handleBulkGeneratePO}
                className="bg-white text-accent rounded-lg px-3 sm:px-4 xl:px-5 2xl:px-6 py-2 xl:py-2.5 2xl:py-3 font-medium hover:bg-gray-50 text-xs xl:text-sm 2xl:text-base w-full sm:w-auto transition-colors"
              >
                Generate POs
              </button>
              <button
                onClick={() => setSelectedOrders(new Set())}
                className="bg-white/20 text-white rounded-lg px-3 sm:px-4 xl:px-5 2xl:px-6 py-2 xl:py-2.5 2xl:py-3 font-medium hover:bg-white/30 text-xs xl:text-sm 2xl:text-base w-full sm:w-auto transition-colors"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-accent)]"></div>
        </div>
      )}

      {/* Empty State */}
      {!loading && orders.length === 0 && (
        <div className="bg-white rounded-xl shadow-md border border-white/20 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Vendor Orders Found</h3>
          <p className="text-gray-500">No confirmed vendor orders match your current filters.</p>
        </div>
      )}

      {/* Orders Table - Desktop View */}
      {!loading && orders.length > 0 && (
      <div className="hidden lg:block rounded-xl shadow-md overflow-hidden border border-white/10 bg-white/70">
        {/* Table head bar */}
        <div className="bg-[#C3754C] text-white">
          <div className="grid grid-cols-[50px_90px_1fr_0.8fr_1fr_0.9fr_1fr_140px] xl:grid-cols-[60px_100px_1.2fr_0.9fr_1.1fr_1fr_1.1fr_160px] 2xl:grid-cols-[70px_120px_1.3fr_1fr_1.2fr_1fr_1.2fr_180px] gap-2 xl:gap-3 2xl:gap-4 px-3 xl:px-4 2xl:px-6 py-3 xl:py-4 2xl:py-5 font-['Quicksand'] font-bold text-sm xl:text-base 2xl:text-lg leading-[100%] tracking-[0] text-center">
            <div className="flex items-center justify-center">
              <input
                type="checkbox"
                checked={selectedOrders.size === orders.length && orders.length > 0}
                onChange={handleSelectAll}
                className="rounded border-white w-4 h-4"
              />
            </div>
            <div className="text-xs xl:text-sm 2xl:text-base">Order ID</div>
            <div className="text-xs xl:text-sm 2xl:text-base">Vendor Name</div>
            <div className="text-xs xl:text-sm 2xl:text-base">Confirmed Qty</div>
            <div className="text-xs xl:text-sm 2xl:text-base">Order Status</div>
            <div className="text-xs xl:text-sm 2xl:text-base">PO Status</div>
            <div className="text-xs xl:text-sm 2xl:text-base">Invoice Status</div>
            <div className="text-xs xl:text-sm 2xl:text-base">Actions</div>
          </div>
        </div>

        {/* Body */}
        <div className="bg-white">
          <div className="py-2">
            {paginatedOrders.length === 0 ? (
              <div className="px-3 xl:px-4 2xl:px-6 py-6 xl:py-8 text-center text-gray-500 text-xs xl:text-sm 2xl:text-base">No orders match current filters.</div>
            ) : (
              paginatedOrders.map((order) => {
                const orderStatusStyle = STATUS_STYLES[order.orderStatus] || STATUS_STYLES.Confirmed
                const poStatusStyle = PO_STATUS_STYLES[order.poStatus] || PO_STATUS_STYLES.Pending
                const invoiceStatusStyle = INVOICE_STATUS_STYLES[order.invoiceStatus] || INVOICE_STATUS_STYLES['Not Created']
                
                return (
                  <div key={order.id}>
                    <div className="grid grid-cols-[50px_90px_1fr_0.8fr_1fr_0.9fr_1fr_140px] xl:grid-cols-[60px_100px_1.2fr_0.9fr_1.1fr_1fr_1.1fr_160px] 2xl:grid-cols-[70px_120px_1.3fr_1fr_1.2fr_1fr_1.2fr_180px] gap-2 xl:gap-3 2xl:gap-4 px-3 xl:px-4 2xl:px-6 py-2 xl:py-3 2xl:py-4 items-center text-center hover:bg-gray-50 font-bold">
                      <div className="flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={selectedOrders.has(order.id)}
                          onChange={() => handleSelectOrder(order.id)}
                          className="rounded border-gray-300 w-4 h-4"
                        />
                      </div>
                      <div className="text-[10px] xl:text-xs 2xl:text-sm font-medium text-gray-800 truncate">{order.id}</div>
                      <div className="flex items-center justify-center min-w-0">
                        <button
                          onClick={() => toggleRowExpansion(order.id)}
                          className="flex items-center gap-0.5 xl:gap-1 hover:text-accent transition-colors text-[10px] xl:text-xs 2xl:text-sm text-gray-700 min-w-0 max-w-full"
                        >
                          {expandedRows.has(order.id) ? <ChevronDown size={12} className="flex-shrink-0" /> : <ChevronRight size={12} className="flex-shrink-0" />}
                          <span className="truncate">{order.vendorName}</span>
                        </button>
                      </div>
                      <div className="text-[10px] xl:text-xs 2xl:text-sm font-semibold text-gray-900">{order.items.reduce((sum, item) => sum + item.confirmedQty, 0)}</div>
                      <div className="flex items-center justify-center">
                        <span 
                          className="inline-block px-1 xl:px-1.5 2xl:px-2 py-0.5 xl:py-1 rounded-md text-[9px] xl:text-[10px] 2xl:text-xs font-semibold whitespace-nowrap"
                          style={{
                            backgroundColor: orderStatusStyle.bg,
                            color: orderStatusStyle.color,
                          }}
                        >
                          {orderStatusStyle.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-center">
                        <span 
                          className="inline-block px-1 xl:px-1.5 2xl:px-2 py-0.5 xl:py-1 rounded-md text-[9px] xl:text-[10px] 2xl:text-xs font-semibold whitespace-nowrap"
                          style={{
                            backgroundColor: poStatusStyle.bg,
                            color: poStatusStyle.color,
                          }}
                        >
                          {poStatusStyle.label}
                        </span>
                      </div>
                      <div className="flex items-center justify-center">
                        <span 
                          className="inline-block px-1 xl:px-1.5 2xl:px-2 py-0.5 xl:py-1 rounded-md text-[9px] xl:text-[10px] 2xl:text-xs font-semibold whitespace-nowrap"
                          style={{
                            backgroundColor: invoiceStatusStyle.bg,
                            color: invoiceStatusStyle.color,
                          }}
                        >
                          {invoiceStatusStyle.label}
                        </span>
                      </div>
                      <div className="flex gap-0.5 xl:gap-1 justify-center items-center">
                        <button
                          onClick={() => handleViewDetails(order)}
                          className="bg-white text-secondary border border-secondary rounded-md px-1 xl:px-1.5 2xl:px-2 py-0.5 xl:py-1 text-[9px] xl:text-[10px] 2xl:text-xs hover:bg-gray-50 flex items-center gap-0.5 whitespace-nowrap flex-shrink-0"
                          title="View Details"
                        >
                          <Eye size={10} className="flex-shrink-0" />
                          <span>View</span>
                        </button>
                        <button
                          onClick={() => handleGeneratePO(order.id)}
                          disabled={order.poStatus === 'Generated'}
                          className="bg-accent text-button-text rounded-md px-1 xl:px-1.5 2xl:px-2 py-0.5 xl:py-1 text-[9px] xl:text-[10px] 2xl:text-xs hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-0.5 whitespace-nowrap flex-shrink-0"
                          title="Generate PO"
                        >
                          <FileText size={10} className="flex-shrink-0" />
                          <span>PO</span>
                        </button>
                      </div>
                    </div>
                    
                    {/* Expanded Item Details */}
                    {expandedRows.has(order.id) && (
                      <div className="px-3 xl:px-4 2xl:px-6 py-2 xl:py-3 bg-gray-50 border-t border-gray-100">
                        <div className="bg-white rounded-lg p-2 xl:p-3 2xl:p-4 max-w-3xl">
                          <div className="text-xs xl:text-sm 2xl:text-base font-medium text-secondary mb-2">Items:</div>
                          <div className="space-y-2">
                            {order.items.map((item, itemIndex) => (
                              <div key={itemIndex} className="text-xs xl:text-sm 2xl:text-base text-gray-700 flex items-center justify-between">
                                <div className="flex items-center gap-2 xl:gap-3">
                                  <span className="font-medium">{item.sku}</span>
                                  <span>{item.product}</span>
                                </div>
                                <div className="flex items-center gap-2 xl:gap-3">
                                  <span className="text-gray-600">Ordered: {item.qty}</span>
                                  <span className="text-green-600 font-medium">Confirmed: {item.confirmedQty}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </div>
        </div>

        {/* Pagination controls (desktop) */}
        <div className="flex items-center justify-between px-3 xl:px-4 2xl:px-6 py-2.5 xl:py-3 bg-white border-t border-gray-100">
          <div className="text-[10px] xl:text-xs 2xl:text-sm text-gray-500">
            Showing {totalCount === 0 ? 0 : startIndex + 1}-{endIndex} of {totalCount}
          </div>
          <div className="flex items-center gap-1 xl:gap-1.5 2xl:gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-7 w-7 xl:h-8 xl:w-8 2xl:h-9 2xl:w-9 flex items-center justify-center rounded-md border border-gray-200 text-gray-700 disabled:opacity-40 hover:bg-gray-50 transition-colors"
              aria-label="Previous page"
            >
              <svg className="w-3.5 h-3.5 xl:w-4 xl:h-4 2xl:w-5 2xl:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setCurrentPage(p)}
                className={`min-w-7 h-7 xl:min-w-8 xl:h-8 2xl:min-w-9 2xl:h-9 px-1.5 xl:px-2 2xl:px-2.5 rounded-md border text-[10px] xl:text-xs 2xl:text-sm transition-colors ${currentPage === p ? 'bg-[var(--color-secondary)] text-white border-[var(--color-secondary)]' : 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50'}`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="h-7 w-7 xl:h-8 xl:w-8 2xl:h-9 2xl:w-9 flex items-center justify-center rounded-md border border-gray-200 text-gray-700 disabled:opacity-40 hover:bg-gray-50 transition-colors"
              aria-label="Next page"
            >
              <svg className="w-3.5 h-3.5 xl:w-4 xl:h-4 2xl:w-5 2xl:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Mobile Card View */}
      {!loading && orders.length > 0 && (
      <div className="lg:hidden space-y-4">
        {/* Mobile Select All */}
        {paginatedOrders.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedOrders.size === orders.length && orders.length > 0}
                onChange={handleSelectAll}
                className="rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">
                Select all ({orders.length} orders)
              </span>
            </div>
          </div>
        )}

        {paginatedOrders.map((order) => {
          const isExpanded = expandedRows.has(order.id)
          const orderStatusStyle = STATUS_STYLES[order.orderStatus] || STATUS_STYLES.Confirmed
          const poStatusStyle = PO_STATUS_STYLES[order.poStatus] || PO_STATUS_STYLES.Pending
          const invoiceStatusStyle = INVOICE_STATUS_STYLES[order.invoiceStatus] || INVOICE_STATUS_STYLES['Not Created']
          
          return (
            <div key={order.id} className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
              {/* Card Header */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <input
                      type="checkbox"
                      checked={selectedOrders.has(order.id)}
                      onChange={() => handleSelectOrder(order.id)}
                      className="rounded border-gray-300 mt-1"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-medium text-secondary truncate">{order.id}</h3>
                        <span 
                          className="inline-block px-2 py-1 rounded-full text-xs font-semibold border flex-shrink-0"
                          style={{
                            backgroundColor: orderStatusStyle.bg,
                            color: orderStatusStyle.color,
                            borderColor: orderStatusStyle.border,
                          }}
                        >
                          {orderStatusStyle.label}
                        </span>
                      </div>
                      <button
                        onClick={() => toggleRowExpansion(order.id)}
                        className="flex items-center gap-1 text-sm text-gray-600 hover:text-accent transition-colors mt-1"
                      >
                        {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        <span>{order.vendorName}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Expanded Items */}
              {isExpanded && (
                <div className="p-4 bg-gray-50 border-t border-gray-100">
                  <div className="text-xs font-medium text-secondary mb-2">Items:</div>
                  <div className="space-y-2">
                    {order.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="bg-white rounded-lg p-3">
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{item.sku}</span>
                            <span className="text-sm text-gray-600">{item.product}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs">
                            <span className="text-gray-600">Ordered: {item.qty}</span>
                            <span className="text-green-600 font-medium">Confirmed: {item.confirmedQty}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Card Body */}
              <div className="p-4">
                <div className="grid grid-cols-1 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Confirmed Qty</p>
                    <p className="text-sm font-medium">{order.items.reduce((sum, item) => sum + item.confirmedQty, 0)}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span 
                    className="inline-block px-2 py-1 rounded-full text-xs font-semibold border"
                    style={{
                      backgroundColor: poStatusStyle.bg,
                      color: poStatusStyle.color,
                      borderColor: poStatusStyle.border,
                    }}
                  >
                    PO: {poStatusStyle.label}
                  </span>
                  <span 
                    className="inline-block px-2 py-1 rounded-full text-xs font-semibold border"
                    style={{
                      backgroundColor: invoiceStatusStyle.bg,
                      color: invoiceStatusStyle.color,
                      borderColor: invoiceStatusStyle.border,
                    }}
                  >
                    Invoice: {invoiceStatusStyle.label}
                  </span>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={() => handleViewDetails(order)}
                    className="flex-1 bg-white text-secondary border border-secondary rounded-lg px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-center gap-2"
                  >
                    <Eye size={16} />
                    View Details
                  </button>
                  <button
                    onClick={() => handleGeneratePO(order.id)}
                    disabled={order.poStatus === 'Generated'}
                    className="flex-1 bg-accent text-button-text rounded-lg px-3 py-2 text-sm hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <FileText size={16} />
                    Generate PO
                  </button>
                </div>
              </div>
            </div>
          )
        })}

        {/* Pagination controls (mobile) */}
        <div className="flex items-center justify-between px-1 py-2">
          <div className="text-xs text-gray-500">
            {totalCount === 0 ? 'No results' : `Showing ${startIndex + 1}-${endIndex} of ${totalCount}`}
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} 
              disabled={currentPage === 1} 
              className="h-8 px-3 rounded-md border border-gray-200 text-gray-700 disabled:opacity-40 text-sm font-medium"
            >
              Prev
            </button>
            <button 
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))} 
              disabled={currentPage === totalPages} 
              className="h-8 px-3 rounded-md border border-gray-200 text-gray-700 disabled:opacity-40 text-sm font-medium"
            >
              Next
            </button>
          </div>
        </div>
      </div>
      )}

      {/* Detail Panel - Responsive */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50">
          <div
            className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ease-out ${isDetailPanelOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={closeDetailPanel}
          />
          <div
            className={`absolute bottom-0 sm:top-0 sm:right-0 h-[90vh] sm:h-full w-full sm:w-96 xl:w-[28rem] 2xl:w-[32rem] bg-white shadow-2xl overflow-y-auto flex flex-col transform transition-transform duration-300 ease-out ${isDetailPanelOpen ? 'translate-y-0 sm:translate-x-0' : 'translate-y-full sm:translate-y-0 sm:translate-x-full'} rounded-t-2xl sm:rounded-t-none`}
          >
            <div className="p-4 sm:p-6 xl:p-7 2xl:p-8 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl xl:text-2xl 2xl:text-3xl font-semibold text-secondary">Order Details</h3>
                <button
                  onClick={closeDetailPanel}
                  className="text-gray-400 hover:text-gray-600 p-1 transition-colors"
                >
                  <X size={20} className="xl:w-6 xl:h-6 2xl:w-7 2xl:h-7" />
                </button>
              </div>
            </div>
            
            <div className="p-4 sm:p-6 xl:p-7 2xl:p-8 space-y-4 sm:space-y-6 xl:space-y-7 2xl:space-y-8">
              <div>
                <h4 className="font-medium text-secondary mb-2 xl:mb-3 2xl:mb-4 text-sm sm:text-base xl:text-lg 2xl:text-xl">Order Information</h4>
                <div className="space-y-2 xl:space-y-3 2xl:space-y-4 text-sm xl:text-base 2xl:text-lg">
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                    <span className="text-gray-600">Order ID:</span>
                    <span className="font-medium">{selectedOrder.id}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                    <span className="text-gray-600">Vendor:</span>
                    <span className="font-medium">{selectedOrder.vendorName}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                    <span className="text-gray-600">Order Date:</span>
                    <span className="font-medium">{selectedOrder.orderDate}</span>
                  </div>
                  <div className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                    <span className="text-gray-600">Confirmation Date:</span>
                    <span className="font-medium">{selectedOrder.confirmationDate}</span>
                  </div>
                </div>
              </div>

              <div>
                <h4 className="font-medium text-secondary mb-3 xl:mb-4 2xl:mb-5 text-sm sm:text-base xl:text-lg 2xl:text-xl">Item List</h4>
                <div className="space-y-3 xl:space-y-4 2xl:space-y-5">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="p-3 xl:p-4 2xl:p-5 bg-gray-50 rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 xl:mb-3 2xl:mb-4 gap-1 sm:gap-0">
                        <div>
                          <div className="font-medium text-sm sm:text-base xl:text-lg 2xl:text-xl">{item.product}</div>
                          <div className="text-xs sm:text-sm xl:text-base 2xl:text-lg text-gray-600">{item.sku}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 xl:gap-3 2xl:gap-4 text-xs sm:text-sm xl:text-base 2xl:text-lg">
                        <div className="flex justify-between sm:flex-col sm:justify-start">
                          <span className="text-gray-600">Ordered Qty:</span>
                          <span className="ml-2 sm:ml-0 font-medium">{item.qty}</span>
                        </div>
                        <div className="flex justify-between sm:flex-col sm:justify-start">
                          <span className="text-gray-600">Confirmed Qty:</span>
                          <span className="ml-2 sm:ml-0 font-medium text-green-600">{item.confirmedQty}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium text-secondary mb-3 xl:mb-4 2xl:mb-5 text-sm sm:text-base xl:text-lg 2xl:text-xl">Status History</h4>
                <div className="space-y-3 xl:space-y-4 2xl:space-y-5">
                  <div className="flex items-center gap-3 xl:gap-4 2xl:gap-5 p-2 xl:p-3 2xl:p-4 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 xl:w-2.5 xl:h-2.5 2xl:w-3 2xl:h-3 bg-blue-500 rounded-full flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs sm:text-sm xl:text-base 2xl:text-lg font-medium">Order Confirmed</div>
                      <div className="text-xs xl:text-sm 2xl:text-base text-gray-600">{selectedOrder.confirmationDate}</div>
                    </div>
                  </div>
                  {selectedOrder.poStatus === 'Generated' && (
                    <div className="flex items-center gap-3 xl:gap-4 2xl:gap-5 p-2 xl:p-3 2xl:p-4 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 xl:w-2.5 xl:h-2.5 2xl:w-3 2xl:h-3 bg-green-500 rounded-full flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm xl:text-base 2xl:text-lg font-medium">PO Generated</div>
                        <div className="text-xs xl:text-sm 2xl:text-base text-gray-600">{selectedOrder.confirmationDate}</div>
                      </div>
                    </div>
                  )}
                  {selectedOrder.orderStatus === 'Delivered' && (
                    <div className="flex items-center gap-3 xl:gap-4 2xl:gap-5 p-2 xl:p-3 2xl:p-4 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 xl:w-2.5 xl:h-2.5 2xl:w-3 2xl:h-3 bg-purple-500 rounded-full flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm xl:text-base 2xl:text-lg font-medium">Delivered</div>
                        <div className="text-xs xl:text-sm 2xl:text-base text-gray-600">{selectedOrder.confirmationDate}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 xl:gap-3 2xl:gap-4 pt-4 xl:pt-5 2xl:pt-6 border-t border-gray-200">
                <button
                  onClick={() => handleGeneratePO(selectedOrder.id)}
                  disabled={selectedOrder.poStatus === 'Generated'}
                  className="w-full bg-accent text-button-text rounded-lg px-4 xl:px-5 2xl:px-6 py-2 xl:py-2.5 2xl:py-3 font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 xl:gap-3 2xl:gap-4 text-sm xl:text-base 2xl:text-lg transition-colors"
                >
                  <FileText size={16} className="xl:w-5 xl:h-5 2xl:w-6 2xl:h-6" />
                  Generate PO
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}