import { useState, useMemo, useEffect, useRef } from 'react'
import { Eye, ChevronRight, X, ChevronDown, Package, Calendar as CalendarIcon } from 'lucide-react'
import { CustomDropdown } from '../../../components'
import { Calendar } from '../../../components/ui/calendar'
import { Pagination } from '../../../components/ui/Pagination'
import { AccountsAssignmentApiService } from '../../../services/accountsAssignmentApi'
import type { VendorOrder, OrderStatus, POStatus, InvoiceStatus } from '../../../services/accountsAssignmentApi'
import { format } from 'date-fns'

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
  const [selectedOrder, setSelectedOrder] = useState<VendorOrder | null>(null)
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // Filter states
  const [filterOrderId, setFilterOrderId] = useState('')
  const [filterVendor, setFilterVendor] = useState('')
  const [filterStatus, setFilterStatus] = useState<OrderStatus | ''>('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [dateFromDate, setDateFromDate] = useState<Date | undefined>()
  const [dateToDate, setDateToDate] = useState<Date | undefined>()
  const [showFromCalendar, setShowFromCalendar] = useState(false)
  const [showToCalendar, setShowToCalendar] = useState(false)
  const fromCalendarRef = useRef<HTMLDivElement>(null)
  const toCalendarRef = useRef<HTMLDivElement>(null)

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
      const params: Record<string, any> = {
        page: currentPage,
        limit: itemsPerPage,
        vendorName: filterVendor || undefined,
        orderStatus: filterStatus || undefined,
        startDate: filterDateFrom || undefined,
        endDate: filterDateTo || undefined
      }
      if (filterOrderId) {
        // add orderId only when present to avoid excess property errors on the literal
        params.orderId = filterOrderId
      }
      const response = await AccountsAssignmentApiService.getConfirmedVendorOrders(params as any)

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
  }, [currentPage, filterOrderId, filterVendor, filterStatus, filterDateFrom, filterDateTo])

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [filterOrderId, filterVendor, filterStatus, filterDateFrom, filterDateTo])

  const paginatedOrders = orders
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, totalCount)

  const handleViewDetails = (order: VendorOrder) => {
    setSelectedOrder(order)
  }

  // Animate panel open/close
  const closeDetailPanel = () => {
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
    setFilterOrderId('')
    setFilterVendor('')
    setFilterStatus('')
    setFilterDateFrom('')
    setFilterDateTo('')
    setDateFromDate(undefined)
    setDateToDate(undefined)
    setCurrentPage(1)
  }

  // Close calendars when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fromCalendarRef.current && !fromCalendarRef.current.contains(event.target as Node)) {
        setShowFromCalendar(false)
      }
      if (toCalendarRef.current && !toCalendarRef.current.contains(event.target as Node)) {
        setShowToCalendar(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <div className="p-4 sm:p-6 lg:pl-9 xl:p-9 2xl:p-9 bg-[color:var(--color-sharktank-bg)] min-h-[calc(100vh-4rem)] font-sans w-full overflow-x-hidden">
      {/* Page Header */}
      <div className="mb-4 sm:mb-6 xl:mb-7 2xl:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-heading mb-2">Vendor Orders</h1>
        <p className="text-sm sm:text-base text-gray-600">Manage vendor orders, generate POs, and track order status</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 xl:p-5 2xl:p-6 mb-4 sm:mb-6 xl:mb-7 2xl:mb-8 border border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 xl:gap-5 2xl:gap-6">
          <div>
            <label className="block text-xs xl:text-sm 2xl:text-base font-medium text-secondary mb-1 xl:mb-1.5 2xl:mb-2">Order ID</label>
            <input
              type="text"
              value={filterOrderId}
              onChange={(e) => setFilterOrderId(e.target.value)}
              placeholder="Search by Order ID"
              className="w-full px-3 xl:px-3.5 2xl:px-4 py-2 xl:py-2.5 2xl:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-xs xl:text-sm 2xl:text-base hover:border-accent transition-all duration-200"
            />
          </div>
          
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
              className="[&>button]:py-2 [&>button]:xl:py-2.5 [&>button]:2xl:py-3 [&>button]:px-3 [&>button]:xl:px-3.5 [&>button]:2xl:px-4 [&>button]:text-xs [&>button]:xl:text-sm [&>button]:2xl:text-base"
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
              className="[&>button]:py-2 [&>button]:xl:py-2.5 [&>button]:2xl:py-3 [&>button]:px-3 [&>button]:xl:px-3.5 [&>button]:2xl:px-4 [&>button]:text-xs [&>button]:xl:text-sm [&>button]:2xl:text-base"
            />
          </div>
          
          <div>
            <label className="block text-xs xl:text-sm 2xl:text-base font-medium text-secondary mb-1 xl:mb-1.5 2xl:mb-2">Date From</label>
            <div className="relative" ref={fromCalendarRef}>
              <button
                type="button"
                onClick={() => {
                  setShowFromCalendar(!showFromCalendar)
                  setShowToCalendar(false)
                }}
                className="w-full px-3 xl:px-3.5 2xl:px-4 py-2 xl:py-2.5 2xl:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-xs xl:text-sm 2xl:text-base hover:border-accent transition-all duration-200 flex items-center justify-between text-left"
              >
                <span className={dateFromDate ? 'text-gray-900 truncate' : 'text-gray-500'}>
                  {dateFromDate ? format(dateFromDate, 'PPP') : 'From date'}
                </span>
                <CalendarIcon className="h-4 w-4 text-gray-500 flex-shrink-0 ml-2" />
              </button>
              {showFromCalendar && (
                <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-md shadow-lg w-full min-w-[280px]">
                  <Calendar
                    mode="single"
                    selected={dateFromDate}
                    onSelect={(date) => {
                      setDateFromDate(date)
                      setFilterDateFrom(date ? format(date, 'yyyy-MM-dd') : '')
                      setShowFromCalendar(false)
                    }}
                    initialFocus
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </div>
          
          <div>
            <label className="block text-xs xl:text-sm 2xl:text-base font-medium text-secondary mb-1 xl:mb-1.5 2xl:mb-2">Date To</label>
            <div className="relative" ref={toCalendarRef}>
              <button
                type="button"
                onClick={() => {
                  setShowToCalendar(!showToCalendar)
                  setShowFromCalendar(false)
                }}
                className="w-full px-3 xl:px-3.5 2xl:px-4 py-2 xl:py-2.5 2xl:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-xs xl:text-sm 2xl:text-base hover:border-accent transition-all duration-200 flex items-center justify-between text-left"
              >
                <span className={dateToDate ? 'text-gray-900 truncate' : 'text-gray-500'}>
                  {dateToDate ? format(dateToDate, 'PPP') : 'To date'}
                </span>
                <CalendarIcon className="h-4 w-4 text-gray-500 flex-shrink-0 ml-2" />
              </button>
              {showToCalendar && (
                <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-md shadow-lg w-full min-w-[280px]">
                  <Calendar
                    mode="single"
                    selected={dateToDate}
                    onSelect={(date) => {
                      setDateToDate(date)
                      setFilterDateTo(date ? format(date, 'yyyy-MM-dd') : '')
                      setShowToCalendar(false)
                    }}
                    initialFocus
                    disabled={(date) => dateFromDate ? date < dateFromDate : false}
                    className="w-full"
                  />
                </div>
              )}
            </div>
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

      {/* Loading State - Orders style card */}
      {loading && (
        <div className="bg-white rounded-xl p-12 text-center">
          <div className="w-12 h-12 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading vendor orders...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && orders.length === 0 && (
        <div className="bg-white rounded-xl shadow-md border border-white/20 p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Vendor Orders Found</h3>
          <p className="text-gray-500">No confirmed vendor orders match your current filters.</p>
        </div>
      )}

      {/* Orders Table - Desktop View */}
      {!loading && orders.length > 0 && (
      <div className="hidden lg:block overflow-x-auto">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden min-w-[800px]">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr style={{ background: 'var(--color-accent)' }}>
                <th className="text-left p-3 font-heading font-normal text-xs" style={{ color: 'var(--color-button-text)' }}>Order ID</th>
                <th className="text-left p-3 font-heading font-normal text-xs" style={{ color: 'var(--color-button-text)' }}>Vendor Name</th>
                <th className="text-center p-3 font-heading font-normal text-xs" style={{ color: 'var(--color-button-text)' }}>Confirmed Qty</th>
                <th className="text-center p-3 font-heading font-normal text-xs" style={{ color: 'var(--color-button-text)' }}>Order Status</th>
                <th className="text-center p-3 font-heading font-normal text-xs" style={{ color: 'var(--color-button-text)' }}>PO Status</th>
                <th className="text-center p-3 font-heading font-normal text-xs" style={{ color: 'var(--color-button-text)' }}>Invoice Status</th>
                <th className="text-center p-3 font-heading font-normal text-xs" style={{ color: 'var(--color-button-text)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.map((order) => {
                const orderStatusStyle = STATUS_STYLES[order.orderStatus] || STATUS_STYLES.Confirmed
                const poStatusStyle = PO_STATUS_STYLES[order.poStatus] || PO_STATUS_STYLES.Pending
                const invoiceStatusStyle = INVOICE_STATUS_STYLES[order.invoiceStatus] || INVOICE_STATUS_STYLES['Not Created']
                
                return (
                  <>
                    <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 bg-white transition-colors">
                      <td className="p-3 font-semibold text-secondary text-sm">{order.id}</td>
                      <td className="p-3">
                        <button
                          onClick={() => toggleRowExpansion(order.id)}
                          className="flex items-center gap-1 hover:text-accent transition-colors text-sm text-gray-700"
                        >
                          {expandedRows.has(order.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          <span>{order.vendorName}</span>
                        </button>
                      </td>
                      <td className="p-3 text-center text-sm font-medium text-gray-900">
                        {order.items.reduce((sum, item) => sum + item.confirmedQty, 0)}
                      </td>
                      <td className="p-3 text-center">
                        <span 
                          className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border"
                          style={{
                            backgroundColor: orderStatusStyle.bg,
                            color: orderStatusStyle.color,
                            borderColor: orderStatusStyle.border,
                          }}
                        >
                          {orderStatusStyle.label}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span 
                          className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border"
                          style={{
                            backgroundColor: poStatusStyle.bg,
                            color: poStatusStyle.color,
                            borderColor: poStatusStyle.border,
                          }}
                        >
                          {poStatusStyle.label}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <span 
                          className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border"
                          style={{
                            backgroundColor: invoiceStatusStyle.bg,
                            color: invoiceStatusStyle.color,
                            borderColor: invoiceStatusStyle.border,
                          }}
                        >
                          {invoiceStatusStyle.label}
                        </span>
                      </td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleViewDetails(order)}
                          className="bg-[var(--color-accent)] text-[var(--color-button-text)] rounded-md px-2.5 py-1.5 text-xs hover:brightness-95 transition-all"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                    
                    {/* Expanded Item Details */}
                    {expandedRows.has(order.id) && (
                      <tr className="bg-gray-50">
                        <td colSpan={7} className="p-0">
                          <div className="px-6 py-4 border-t border-gray-200">
                            <div className="bg-white rounded-lg overflow-hidden">
                              <table className="w-full">
                                <thead>
                                  <tr className="bg-gray-100 border-b border-gray-200">
                                    <th className="text-left p-3 text-sm font-semibold text-secondary">SKU</th>
                                    <th className="text-left p-3 text-sm font-semibold text-secondary">Product</th>
                                    <th className="text-center p-3 text-sm font-semibold text-secondary">Ordered Qty</th>
                                    <th className="text-center p-3 text-sm font-semibold text-secondary">Confirmed Qty</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {order.items.map((item, itemIndex) => (
                                    <tr key={itemIndex} className="bg-white border-b border-gray-100">
                                      <td className="p-3 text-sm font-medium text-secondary">{item.sku}</td>
                                      <td className="p-3 text-sm text-gray-700">{item.product}</td>
                                      <td className="p-3 text-sm text-center text-gray-700">{item.qty}</td>
                                      <td className="p-3 text-sm text-center font-medium text-green-600">{item.confirmedQty}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                )
              })}
            </tbody>
          </table>

          {totalCount > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalCount}
              startIndex={startIndex}
              endIndex={endIndex}
              onPageChange={setCurrentPage}
              itemLabel="orders"
              variant="desktop"
            />
          )}
        </div>
      </div>
      )}

      {/* Mobile Card View */}
      {!loading && orders.length > 0 && (
      <div className="lg:hidden space-y-4">

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
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
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
                      className="flex items-center gap-1 text-sm text-gray-600 hover:text-accent transition-colors"
                    >
                      {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                      <span>{order.vendorName}</span>
                    </button>
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
                    className="w-full bg-white text-secondary border border-secondary rounded-lg px-3 py-2 text-sm hover:bg-gray-50 flex items-center justify-center gap-2"
                  >
                    <Eye size={16} />
                    View Details
                  </button>
                </div>
              </div>
            </div>
          )
        })}

        {totalCount > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalCount}
            startIndex={startIndex}
            endIndex={endIndex}
            onPageChange={setCurrentPage}
            itemLabel="orders"
            variant="mobile"
          />
        )}
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

            </div>
          </div>
        </div>
      )}
    </div>
  )
}