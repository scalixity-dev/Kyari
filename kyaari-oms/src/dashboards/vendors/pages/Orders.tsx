import React, { useState, useEffect, useRef } from 'react'
import { CheckSquare, X, AlertTriangle, Clock, FileText, ChevronDown, ChevronUp, Package, Calendar as CalendarIcon } from 'lucide-react'
import { AssignmentApiService } from '@/services/assignmentApi'
import { KPICard, CustomDropdown } from '../../../components'
import { Pagination } from '../../../components/ui/Pagination'
import type { AssignmentOrder, AssignmentProduct } from '@/services/assignmentApi'
import { Calendar } from '../../../components/ui/calendar'
import { format } from 'date-fns'

type Product = AssignmentProduct
type Order = AssignmentOrder

interface PartialConfirmModalProps {
  isOpen: boolean
  product: Product | null
  orderNumber: string
  onClose: () => void
  onConfirm: (productId: string, availableQty: number) => void
}

interface DeclineReasonModalProps {
  isOpen: boolean
  product: Product | null
  orderNumber: string
  onClose: () => void
  onDecline: (productId: string, reason: string) => void
}

const PartialConfirmModal: React.FC<PartialConfirmModalProps> = ({ isOpen, product, orderNumber, onClose, onConfirm }) => {
  const [availableQty, setAvailableQty] = useState<number>(0)

  if (!isOpen || !product) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (availableQty > 0 && availableQty <= product.requestedQty) {
      onConfirm(product.id, availableQty)
      setAvailableQty(0)
    }
  }

  const backorderQty = product.requestedQty - availableQty

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl p-4 sm:p-6 w-full max-w-md mx-0 sm:mx-4 max-h-[90vh] sm:max-h-[85vh] overflow-y-auto animate-slide-up sm:animate-none">
        <div className="flex items-center justify-between mb-3 sm:mb-4 sticky top-0 bg-white pb-3 sm:pb-0 sm:static z-10">
          <h3 className="text-base sm:text-lg font-semibold text-[var(--color-heading)]">Partial Confirmation</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-4 p-3 sm:p-4 bg-gray-50 rounded-lg space-y-1.5">
          <p className="text-xs sm:text-sm text-gray-600">Order: <span className="font-medium text-gray-900">{orderNumber}</span></p>
          <p className="text-xs sm:text-sm text-gray-600">Product: <span className="font-medium text-gray-900 break-words">{product.name}</span></p>
          <p className="text-xs sm:text-sm text-gray-600">SKU: <span className="font-medium text-gray-900">{product.sku}</span></p>
          <p className="text-xs sm:text-sm text-gray-600">Requested Quantity: <span className="font-medium text-gray-900">{product.requestedQty}</span></p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-[var(--color-heading)] mb-2">
              Available Quantity
            </label>
            <input
              type="number"
              min="1"
              max={product.requestedQty}
              value={availableQty || ''}
              onChange={(e) => setAvailableQty(parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 sm:py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent text-sm"
              placeholder="Enter available quantity"
              required
            />
          </div>

          {availableQty > 0 && (
            <div className="mb-4 p-2.5 sm:p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600 flex-shrink-0" />
                <span className="font-medium text-yellow-800 text-xs sm:text-sm">Backorder will be created</span>
              </div>
              <p className="text-xs sm:text-sm text-yellow-700">
                Available: <span className="font-medium">{availableQty}</span> | 
                Backorder: <span className="font-medium">{backorderQty}</span>
              </p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sticky bottom-0 bg-white pt-2 sm:pt-0 sm:static">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 sm:py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={availableQty <= 0 || availableQty > product.requestedQty}
              className="flex-1 px-4 py-2 sm:py-2.5 bg-[var(--color-accent)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-accent)]/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors order-1 sm:order-2"
            >
              Confirm Partial
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const DeclineReasonModal: React.FC<DeclineReasonModalProps> = ({ isOpen, product, orderNumber, onClose, onDecline }) => {
  const [selectedReason, setSelectedReason] = useState<string>('')

  if (!isOpen || !product) return null

  const declineReasons = [
    'Stock Unavailable',
    'Quality Issue', 
    'Price Mismatch',
    'Late Delivery'
  ]

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedReason) {
      onDecline(product.id, selectedReason)
      setSelectedReason('')
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl p-4 sm:p-6 w-full max-w-md mx-0 sm:mx-4 max-h-[90vh] sm:max-h-[85vh] overflow-y-auto animate-slide-up sm:animate-none">
        <div className="flex items-center justify-between mb-3 sm:mb-4 sticky top-0 bg-white pb-3 sm:pb-0 sm:static z-10">
          <h3 className="text-base sm:text-lg font-semibold text-[var(--color-heading)]">Decline Product</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-4 p-3 sm:p-4 bg-gray-50 rounded-lg space-y-1.5">
          <p className="text-xs sm:text-sm text-gray-600">Order: <span className="font-medium text-gray-900">{orderNumber}</span></p>
          <p className="text-xs sm:text-sm text-gray-600">Product: <span className="font-medium text-gray-900 break-words">{product.name}</span></p>
          <p className="text-xs sm:text-sm text-gray-600">SKU: <span className="font-medium text-gray-900">{product.sku}</span></p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-[var(--color-heading)] mb-3">
              Please select a reason for declining:
            </label>
            <div className="space-y-2.5">
              {declineReasons.map((reason) => (
                <label key={reason} className="flex items-center p-2.5 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer">
                  <input
                    type="radio"
                    name="declineReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="mr-3 text-[var(--color-accent)] focus:ring-[var(--color-accent)] flex-shrink-0"
                  />
                  <span className="text-xs sm:text-sm text-gray-700">{reason}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sticky bottom-0 bg-white pt-2 sm:pt-0 sm:static">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 sm:py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors order-2 sm:order-1"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedReason}
              className="flex-1 px-4 py-2 sm:py-2.5 bg-red-500 text-white text-sm font-medium rounded-lg hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors order-1 sm:order-2"
            >
              Decline Product
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'Pending':
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Pending</span>
    case 'Confirmed':
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Confirmed</span>
    case 'Partially Confirmed':
      return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Partial</span>
    case 'Declined':
      return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Declined</span>
    case 'Waiting for PO':
      return <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">Awaiting PO</span>
    case 'PO Received':
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">PO Received</span>
    case 'Mixed':
      return <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">Mixed</span>
    case 'Not Available':
      return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">Not Available</span>
    default:
      return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">{status}</span>
  }
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [declineModalOpen, setDeclineModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedOrderNumber, setSelectedOrderNumber] = useState<string>('')
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Filters (mirroring Invoices)
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Confirmed' | 'Partially Confirmed' | 'Declined' | 'Waiting for PO' | 'PO Received' | 'Mixed'>('All')
  const [orderSearch, setOrderSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('') // yyyy-mm-dd
  const [dateTo, setDateTo] = useState('')
  const [dateFromDate, setDateFromDate] = useState<Date | undefined>()
  const [dateToDate, setDateToDate] = useState<Date | undefined>()
  const [showFromCalendar, setShowFromCalendar] = useState(false)
  const [showToCalendar, setShowToCalendar] = useState(false)
  const fromCalendarRef = useRef<HTMLDivElement>(null)
  const toCalendarRef = useRef<HTMLDivElement>(null)

  // Fetch assignments on component mount
  useEffect(() => {
    loadAssignments()
  }, [])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, orderSearch, dateFrom, dateTo])

  const loadAssignments = async () => {
    try {
      setLoading(true)
      const fetchedOrders = await AssignmentApiService.getMyAssignments({
        limit: 100 // Fetch all assignments
      })
      setOrders(fetchedOrders)
    } catch (error) {
      console.error('Failed to load assignments:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleProductConfirmFull = async (orderId: string, productId: string) => {
    try {
      const product = orders
        .find(o => o.id === orderId)
        ?.products.find(p => p.id === productId)
      
      if (!product) return

      // Call API to confirm full
      await AssignmentApiService.updateAssignmentStatus(
        product.assignmentId,
        'VENDOR_CONFIRMED_FULL'
      )

      // Reload assignments to get updated data
      await loadAssignments()
    } catch (error) {
      console.error('Failed to confirm order:', error)
    }
  }

  const handleProductConfirmPartial = (orderId: string, productId: string) => {
    const order = orders.find(o => o.id === orderId)
    const product = order?.products.find(p => p.id === productId)
    
    if (order && product) {
      setSelectedProduct(product)
      setSelectedOrderNumber(order.orderNumber)
      setModalOpen(true)
    }
  }

  const handlePartialConfirm = async (_productId: string, availableQty: number) => {
    if (selectedProduct) {
      try {
        // Call API to confirm partial
        await AssignmentApiService.updateAssignmentStatus(
          selectedProduct.assignmentId,
          'VENDOR_CONFIRMED_PARTIAL',
          availableQty
        )

        // Reload assignments to get updated data
        await loadAssignments()
        
        setModalOpen(false)
        setSelectedProduct(null)
        setSelectedOrderNumber('')
      } catch (error) {
        console.error('Failed to partially confirm order:', error)
      }
    }
  }

  const handleProductDecline = (orderId: string, productId: string) => {
    const order = orders.find(o => o.id === orderId)
    const product = order?.products.find(p => p.id === productId)
    
    if (order && product) {
      setSelectedProduct(product)
      setSelectedOrderNumber(order.orderNumber)
      setDeclineModalOpen(true)
    }
  }

  const handleDeclineWithReason = async (_productId: string, reason: string) => {
    if (selectedProduct) {
      try {
        // Call API to decline
        await AssignmentApiService.updateAssignmentStatus(
          selectedProduct.assignmentId,
          'VENDOR_DECLINED',
          undefined,
          reason
        )

        // Reload assignments to get updated data
        await loadAssignments()
        
        setDeclineModalOpen(false)
        setSelectedProduct(null)
        setSelectedOrderNumber('')
      } catch (error) {
        console.error('Failed to decline order:', error)
      }
    }
  }

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(orderId)) {
        newSet.delete(orderId)
      } else {
        newSet.add(orderId)
      }
      return newSet
    })
  }

  const pendingOrders = orders.filter(order => order.overallStatus === 'Pending')
  const waitingForPOOrders = orders.filter(order => order.overallStatus === 'Waiting for PO')
  const confirmedOrders = orders.filter(order => ['Confirmed', 'Partially Confirmed', 'PO Received', 'Mixed'].includes(order.overallStatus))
  const declinedOrders = orders.filter(order => order.overallStatus === 'Declined')

  const parseOrderDate = (d: string) => {
    // date formatted as DD/MM/YYYY
    const parts = d.split('/')
    if (parts.length !== 3) return null
    const [dd, mm, yyyy] = parts.map(Number)
    return new Date(yyyy, mm - 1, dd)
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

  const filteredOrders = orders.filter(order => {
    if (statusFilter !== 'All' && order.overallStatus !== statusFilter) return false

    if (orderSearch.trim() && !order.orderNumber.toLowerCase().includes(orderSearch.trim().toLowerCase())) return false

    const oDate = parseOrderDate(order.date)
    if (dateFrom) {
      const from = new Date(dateFrom + 'T00:00:00')
      if (!oDate || oDate < from) return false
    }
    if (dateTo) {
      const to = new Date(dateTo + 'T23:59:59')
      if (!oDate || oDate > to) return false
    }

    return true
  })

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, filteredOrders.length)
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    setCurrentPage(page)
    // Reset expanded orders when changing pages
    setExpandedOrders(new Set())
  }

  return (
    <div className="py-4 px-4 sm:px-6 md:px-8 lg:px-9 sm:py-6 lg:py-8 min-h-[calc(100vh-4rem)] font-sans w-full overflow-x-hidden" style={{ background: 'var(--color-sharktank-bg)' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-[var(--color-heading)] mb-0 sm:mb-0 font-[var(--font-heading)]">Orders Management</h2>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-accent)]"></div>
        </div>
      )}

      {/* Empty State */}
      {!loading && orders.length === 0 && (
        <div className="bg-white rounded-xl shadow-md border border-white/20 p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Orders Found</h3>
          <p className="text-gray-500">You don't have any assigned orders at the moment.</p>
        </div>
      )}

      {/* Orders Content */}
      {!loading && orders.length > 0 && (
        <>

      {/* Summary KPI Cards (admin-style) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-16 sm:gap-4 mb-6 py-6">
        <KPICard
          title="Pending Orders"
          value={pendingOrders.length}
          subtitle="Awaiting confirmation"
          icon={<Clock size={32} />}
        />
        <KPICard
          title="Awaiting PO"
          value={waitingForPOOrders.length}
          subtitle="Pending purchase orders"
          icon={<FileText size={32} />}
        />
        <KPICard
          title="Confirmed"
          value={confirmedOrders.length}
          subtitle="Ready for dispatch"
          icon={<CheckSquare size={32} />}
        />
        <KPICard
          title="Declined"
          value={declinedOrders.length}
          subtitle="Requires attention"
          icon={<X size={32} />}
        />
      </div>

      {/* Orders Header */}
      <div className="mb-3 sm:mb-4">
        <div>
          <h2 className="text-base sm:text-lg md:text-xl font-semibold text-secondary">All Orders</h2>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6 pb-3 sm:pb-4 mb-4 sm:mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Order#</label>
            <input
              type="text"
              value={orderSearch}
              onChange={(e) => setOrderSearch(e.target.value)}
              placeholder="Search order number"
              className="w-full px-3 py-2.5 sm:py-3 text-sm border border-gray-300 rounded-md hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200 min-h-[44px] sm:min-h-auto mb-2"
            />

            <div className="hidden sm:flex sm:flex-row sm:items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                className="w-full sm:w-[140px] px-4 py-2.5 sm:py-2 rounded-md text-white font-medium text-sm min-h-[44px] sm:min-h-auto"
                style={{ backgroundColor: '#C3754C', color: '#F5F3E7' }}
              >
                Apply
              </button>
              <button
                onClick={() => {
                  setStatusFilter('All')
                  setOrderSearch('')
                  setDateFrom('')
                  setDateTo('')
                  setDateFromDate(undefined)
                  setDateToDate(undefined)
                  setCurrentPage(1)
                }}
                className="w-full sm:w-[140px] px-4 py-2.5 sm:py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 text-sm min-h-[44px] sm:min-h-auto"
                style={{ borderColor: '#1D4D43', color: '#1D4D43' }}
              >
                Reset
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Status</label>
            <CustomDropdown
              value={statusFilter === 'All' ? '' : statusFilter}
              onChange={(value) => { setStatusFilter((value || 'All') as typeof statusFilter); setCurrentPage(1) }}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'Pending', label: 'Pending' },
                { value: 'Confirmed', label: 'Confirmed' },
                { value: 'Partially Confirmed', label: 'Partially Confirmed' },
                { value: 'Declined', label: 'Declined' },
                { value: 'Waiting for PO', label: 'Waiting for PO' },
                { value: 'PO Received', label: 'PO Received' },
                { value: 'Mixed', label: 'Mixed' }
              ]}
              placeholder="All Statuses"
            />
          </div>

          <div className="lg:col-span-2">
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <div className="flex flex-col gap-2 sm:grid sm:grid-cols-2 sm:gap-2">
              <div className="relative" ref={fromCalendarRef}>
                <button
                  type="button"
                  onClick={() => {
                    setShowFromCalendar(!showFromCalendar)
                    setShowToCalendar(false)
                  }}
                  className="w-full px-3 py-2.5 sm:py-3 text-xs sm:text-sm border border-gray-300 rounded-md hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200 min-h-[44px] sm:min-h-auto flex items-center justify-between text-left"
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
                        setDateFrom(date ? format(date, 'yyyy-MM-dd') : '')
                        setShowFromCalendar(false)
                      }}
                      initialFocus
                      className="w-full"
                    />
                  </div>
                )}
              </div>

              <div className="relative" ref={toCalendarRef}>
                <button
                  type="button"
                  onClick={() => {
                    setShowToCalendar(!showToCalendar)
                    setShowFromCalendar(false)
                  }}
                  className="w-full px-3 py-2.5 sm:py-3 text-xs sm:text-sm border border-gray-300 rounded-md hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200 min-h-[44px] sm:min-h-auto flex items-center justify-between text-left"
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
                        setDateTo(date ? format(date, 'yyyy-MM-dd') : '')
                        setShowToCalendar(false)
                      }}
                      initialFocus
                      disabled={(date) => (dateFromDate ? date < dateFromDate : false)}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile-only Filter Actions */}
        <div className="flex sm:hidden gap-2 pt-4 mt-2 border-t border-gray-200">
          <button
            onClick={() => setCurrentPage(1)}
            className="flex-1 px-4 py-2.5 rounded-md text-white font-medium text-sm min-h-[44px]"
            style={{ backgroundColor: '#C3754C', color: '#F5F3E7' }}
          >
            Apply Filters
          </button>
          <button
            onClick={() => {
              setStatusFilter('All')
              setOrderSearch('')
              setDateFrom('')
              setDateTo('')
              setDateFromDate(undefined)
              setDateToDate(undefined)
              setCurrentPage(1)
            }}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 text-sm min-h-[44px]"
            style={{ borderColor: '#1D4D43', color: '#1D4D43' }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Orders Table Container */}
      <div className="bg-header-bg rounded-xl overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-[var(--color-accent)]">
                <th className="text-left px-4 lg:px-6 py-4 font-heading font-normal text-[var(--color-button-text)]">Order Details</th>
                <th className="text-left px-4 lg:px-6 py-4 font-heading font-normal text-[var(--color-button-text)]">Customer</th>
                <th className="text-left px-4 lg:px-6 py-4 font-heading font-normal text-[var(--color-button-text)]">Products</th>
                <th className="text-left px-4 lg:px-6 py-4 font-heading font-normal text-[var(--color-button-text)]">Status</th>
                <th className="text-left px-4 lg:px-6 py-4 font-heading font-normal text-[var(--color-button-text)]">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedOrders.map((order) => (
                <React.Fragment key={order.id}>
                  <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleOrderExpansion(order.id)}>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {expandedOrders.has(order.id) ? <ChevronUp size={16} className="text-secondary" /> : <ChevronDown size={16} className="text-secondary" />}
                        <div>
                          <div className="text-sm font-semibold text-secondary">{order.orderNumber}</div>
                          <div className="text-xs text-gray-500">{order.date}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {order.customerName}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Package size={16} className="text-gray-400" />
                        <span>{order.totalItems} items</span>
                        {order.totalConfirmed > 0 && (
                          <span className="text-green-600">({order.totalConfirmed} confirmed)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.overallStatus)}
                    </td>
                    <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleOrderExpansion(order.id)
                        }}
                        className="text-blue-600 hover:text-blue-800 font-medium transition-colors"
                      >
                        {expandedOrders.has(order.id) ? 'Collapse' : 'Expand'}
                      </button>
                    </td>
                  </tr>
                  
                  {expandedOrders.has(order.id) && order.products.map((product) => (
                    <tr key={product.id} className="bg-gray-50">
                      <td className="pl-10 lg:pl-12 pr-4 lg:pr-6 py-3 text-sm">
                        <div className="text-gray-600">
                          <span className="font-medium">SKU:</span> {product.sku}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-3 text-sm">
                        <div>
                          <div className="font-medium text-secondary">{product.name}</div>
                          {product.backorderQty > 0 && (
                            <div className="text-xs text-yellow-600">
                              Backorder: {product.backorderQty} units
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 lg:px-6 py-3 text-sm text-gray-600">
                        {product.confirmedQty > 0 ? `${product.confirmedQty}/${product.requestedQty}` : product.requestedQty}
                      </td>
                      <td className="px-4 lg:px-6 py-3">
                        {getStatusBadge(product.status)}
                      </td>
                      <td className="px-6 py-3">
                        {product.status === 'Pending' && (
                          <div className="flex gap-1.5">
                            <button
                              onClick={() => handleProductConfirmFull(order.id, product.id)}
                              className="px-2.5 py-1.5 bg-green-500 text-white rounded-md text-xs font-medium flex items-center gap-1 hover:bg-green-600 transition-colors"
                              title="Confirm Full"
                            >
                              <CheckSquare size={12} />
                              <span>Full</span>
                            </button>
                            <button
                              onClick={() => handleProductConfirmPartial(order.id, product.id)}
                              className="px-2.5 py-1.5 bg-blue-500 text-white rounded-md text-xs font-medium flex items-center gap-1 hover:bg-blue-600 transition-colors"
                              title="Confirm Partial"
                            >
                              <FileText size={12} />
                              <span>Partial</span>
                            </button>
                            <button
                              onClick={() => handleProductDecline(order.id, product.id)}
                              className="px-2.5 py-1.5 bg-red-500 text-white rounded-md text-xs font-medium flex items-center gap-1 hover:bg-red-600 transition-colors"
                              title="Decline"
                            >
                              <X size={12} />
                              <span>Decline</span>
                            </button>
                          </div>
                        )}
                        {product.status !== 'Pending' && (
                          <div className="text-xs text-gray-500">
                            {product.status === 'Confirmed' && (
                              <span className="text-green-600 font-medium">✓ Confirmed</span>
                            )}
                            {product.status === 'Partially Confirmed' && (
                              <span className="text-blue-600 font-medium">~ Partial</span>
                            )}
                            {product.status === 'Declined' && (
                              <div>
                                <span className="text-red-600 font-medium">✗ Declined</span>
                                {product.declineReason && (
                                  <div className="text-xs text-red-500 mt-1">
                                    Reason: {product.declineReason}
                                  </div>
                                )}
                              </div>
                            )}
                            {product.status === 'Not Available' && (
                              <span className="text-gray-600 font-medium">− Not Available</span>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
          {orders.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={orders.length}
              startIndex={startIndex}
              endIndex={endIndex}
              onPageChange={handlePageChange}
              itemLabel="orders"
              variant="desktop"
            />
          )}
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-gray-200">
          {paginatedOrders.map((order) => (
            <div key={order.id} className="p-3 sm:p-4 md:p-5 bg-white">
              <div className="flex justify-between items-start mb-3 gap-2">
                <div className="flex items-start gap-2 flex-1 min-w-0">
                  <button
                    aria-label={expandedOrders.has(order.id) ? 'Collapse items' : 'Expand items'}
                    onClick={() => toggleOrderExpansion(order.id)}
                    className="text-secondary hover:text-accent transition-colors mt-1 flex-shrink-0"
                  >
                    {expandedOrders.has(order.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-secondary text-sm sm:text-base truncate">{order.orderNumber}</h3>
                    <p className="text-xs sm:text-sm text-gray-600">{order.date}</p>
                    <p className="text-xs sm:text-sm text-gray-600 truncate">{order.customerName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  {getStatusBadge(order.overallStatus)}
                </div>
              </div>
              
              <div className="mb-3">
                <p className="text-xs sm:text-sm text-gray-600 mb-2">
                  <span className="font-medium text-gray-800">Products:</span> {order.totalItems} items
                  {order.totalConfirmed > 0 && (
                    <span className="text-green-600 ml-2">({order.totalConfirmed} confirmed)</span>
                  )}
                </p>
                
                {expandedOrders.has(order.id) && (
                  <div className="space-y-2.5 sm:space-y-3 mt-3">
                    {order.products.map((product) => (
                      <div key={product.id} className="bg-gray-50 p-2.5 sm:p-3 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-start mb-2 gap-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-secondary text-xs sm:text-sm truncate">{product.name}</p>
                            <p className="text-xs text-gray-500 truncate">SKU: {product.sku}</p>
                            <p className="text-xs text-gray-600">
                              <span className="font-medium">Qty:</span> {product.confirmedQty > 0 ? `${product.confirmedQty}/${product.requestedQty}` : product.requestedQty}
                            </p>
                            {product.backorderQty > 0 && (
                              <p className="text-xs text-yellow-600 mt-0.5">
                                <span className="font-medium">Backorder:</span> {product.backorderQty} units
                              </p>
                            )}
                            {product.status === 'Declined' && product.declineReason && (
                              <p className="text-xs text-red-600 mt-1 p-1.5 bg-red-50 rounded border border-red-100">
                                <span className="font-medium">Reason:</span> {product.declineReason}
                              </p>
                            )}
                          </div>
                          <div className="flex-shrink-0">
                            {getStatusBadge(product.status)}
                          </div>
                        </div>

                        {product.status === 'Pending' && (
                          <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                            <button
                              onClick={() => handleProductConfirmFull(order.id, product.id)}
                              className="flex-1 min-w-[70px] px-2 sm:px-2.5 py-1.5 bg-green-500 text-white rounded-md text-xs font-medium flex items-center justify-center gap-1 hover:bg-green-600 transition-colors"
                            >
                              <CheckSquare size={12} />
                              <span>Full</span>
                            </button>
                            <button
                              onClick={() => handleProductConfirmPartial(order.id, product.id)}
                              className="flex-1 min-w-[70px] px-2 sm:px-2.5 py-1.5 bg-blue-500 text-white rounded-md text-xs font-medium flex items-center justify-center gap-1 hover:bg-blue-600 transition-colors"
                            >
                              <FileText size={12} />
                              <span>Partial</span>
                            </button>
                            <button
                              onClick={() => handleProductDecline(order.id, product.id)}
                              className="flex-1 min-w-[70px] px-2 sm:px-2.5 py-1.5 bg-red-500 text-white rounded-md text-xs font-medium flex items-center justify-center gap-1 hover:bg-red-600 transition-colors"
                            >
                              <X size={12} />
                              <span>Decline</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {orders.length > 0 && (
            <div className="bg-white border-t border-gray-200">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={orders.length}
                startIndex={startIndex}
                endIndex={endIndex}
                onPageChange={handlePageChange}
                itemLabel="orders"
                variant="mobile"
              />
            </div>
          )}
        </div>
      </div>

      {/* Partial Confirmation Modal */}
      <PartialConfirmModal
        isOpen={modalOpen}
        product={selectedProduct}
        orderNumber={selectedOrderNumber}
        onClose={() => {
          setModalOpen(false)
          setSelectedProduct(null)
          setSelectedOrderNumber('')
        }}
        onConfirm={handlePartialConfirm}
      />

      {/* Decline Reason Modal */}
      <DeclineReasonModal
        isOpen={declineModalOpen}
        product={selectedProduct}
        orderNumber={selectedOrderNumber}
        onClose={() => {
          setDeclineModalOpen(false)
          setSelectedProduct(null)
          setSelectedOrderNumber('')
        }}
        onDecline={handleDeclineWithReason}
      />
      </>
      )}
    </div>
  )
}