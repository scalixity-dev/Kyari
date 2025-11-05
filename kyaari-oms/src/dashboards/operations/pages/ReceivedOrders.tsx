import React, { useState, useEffect, useRef } from 'react'
import { CheckSquare, AlertTriangle, X, Calendar as CalendarIcon, ChevronDown, ChevronRight } from 'lucide-react'
import { CustomDropdown, KPICard, CSVPDFExportButton, Loader } from '../../../components'
import { Pagination } from '../../../components/ui/Pagination'
import { Calendar } from '../../../components/ui/calendar'
import { format } from 'date-fns'
import ReceivedOrdersApiService, { type ReceivedOrder } from '../../../services/receivedOrdersApi'

interface TicketData {
  orderId: string
  issueType: 'qty-mismatch' | 'damaged' | 'missing-item'
  comments: string
  proofFile?: File
}

interface ItemQuantityInput {
  itemId: string
  receivedQuantity: number
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border" style={{ backgroundColor: '#FEF3C7', color: '#92400E', borderColor: '#F59E0B' }}>Pending</span>
    case 'verified':
      return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border" style={{ backgroundColor: '#D1FAE5', color: '#065F46', borderColor: '#10B981' }}>Verified</span>
    case 'mismatch':
      return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border" style={{ backgroundColor: '#FEE2E2', color: '#991B1B', borderColor: '#EF4444' }}>Mismatch</span>
    default:
      return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border" style={{ backgroundColor: '#F3F4F6', color: '#374151', borderColor: '#9CA3AF' }}>{status}</span>
  }
}

export default function ReceivedOrders() {
  const [orders, setOrders] = useState<ReceivedOrder[]>([])
  const [filteredOrders, setFilteredOrders] = useState<ReceivedOrder[]>([])
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())
  const [loading, setLoading] = useState(true)
  const [submitVerify, setSubmitVerify] = useState(false);
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [filters, setFilters] = useState({
    order: '',
    vendor: '',
    fromDate: '',
    toDate: '',
    status: 'all'
  })
  const [fromDateCalendar, setFromDateCalendar] = useState<Date | undefined>()
  const [toDateCalendar, setToDateCalendar] = useState<Date | undefined>()
  const [showFromDateCalendar, setShowFromDateCalendar] = useState(false)
  const [showToDateCalendar, setShowToDateCalendar] = useState(false)
  const fromDateCalendarRef = useRef<HTMLDivElement>(null)
  const toDateCalendarRef = useRef<HTMLDivElement>(null)
  const [ticketModalOpen, setTicketModalOpen] = useState(false)
  const [selectedOrderForTicket, setSelectedOrderForTicket] = useState<ReceivedOrder | null>(null)
  const [ticketData, setTicketData] = useState<TicketData>({
    orderId: '',
    issueType: 'qty-mismatch',
    comments: '',
    proofFile: undefined
  })
  const [itemQuantities, setItemQuantities] = useState<ItemQuantityInput[]>([])
  const [metrics, setMetrics] = useState({
    pending: 0,
    verified: 0,
    mismatch: 0,
    total: 0
  })

  // pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Fetch orders and metrics on mount
  useEffect(() => {
    fetchReceivedOrders()
    fetchMetrics()
  }, [])

  // Fetch received orders
  const fetchReceivedOrders = async () => {
    try {
      setLoading(true)
      const response = await ReceivedOrdersApiService.getReceivedOrders({
        limit: 100
      })
      setOrders(response.data.orders)
      setFilteredOrders(response.data.orders)
      
      // Clean up selection - remove any non-pending orders
      setSelectedOrders(prev => {
        const validSelections = new Set<string>()
        prev.forEach(orderId => {
          const order = response.data.orders.find(o => o.id === orderId)
          if (order && order.status === 'pending') {
            validSelections.add(orderId)
          }
        })
        return validSelections
      })
    } catch (error) {
      console.error('Failed to fetch received orders:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch metrics
  const fetchMetrics = async () => {
    try {
      const response = await ReceivedOrdersApiService.getMetrics()
      setMetrics(response.data)
    } catch (error) {
      console.error('Failed to fetch metrics:', error)
    }
  }

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fromDateCalendarRef.current && !fromDateCalendarRef.current.contains(event.target as Node)) {
        setShowFromDateCalendar(false)
      }
      if (toDateCalendarRef.current && !toDateCalendarRef.current.contains(event.target as Node)) {
        setShowToDateCalendar(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Apply filters
  React.useEffect(() => {
    let filtered = orders

    if (filters.order) {
      filtered = filtered.filter(order => 
        order.orderNumber.toLowerCase().includes(filters.order.toLowerCase())
      )
    }

    if (filters.vendor) {
      filtered = filtered.filter(order => 
        order.vendor.name.toLowerCase().includes(filters.vendor.toLowerCase())
      )
    }

    if (filters.fromDate) {
      filtered = filtered.filter(order => order.submittedAt >= filters.fromDate)
    }

    if (filters.toDate) {
      filtered = filtered.filter(order => order.submittedAt <= filters.toDate + 'T23:59:59.999Z')
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(order => order.status === filters.status)
    }

    setFilteredOrders(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [filters, orders])

  // Pagination calculations
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, filteredOrders.length)
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex)
  

  const handleVerifyOrder = async (orderId: string) => {
    try {
      setSubmitVerify(true);
      await ReceivedOrdersApiService.verifyOrder(orderId, {})
      setSubmitVerify(false);
      // Refresh data
      await fetchReceivedOrders()
      await fetchMetrics()
    } catch (error: unknown) {
      console.error('Failed to verify order:', error)
      // Show user-friendly error message
      const errorMessage = (error as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error || 
                          (error as { response?: { data?: { error?: string } }; message?: string })?.message || 
                          'Failed to verify order. Please try again.'
      alert(`Error: ${errorMessage}`)
    }
  }

  const handleRaiseTicket = (order: ReceivedOrder) => {
    setSelectedOrderForTicket(order)
    setTicketData({
      orderId: order.id,
      issueType: 'qty-mismatch',
      comments: '',
      proofFile: undefined
    })
    // Initialize item quantities with dispatched quantities as default
    if (order.itemDetails && order.itemDetails.length > 0) {
      setItemQuantities(
        order.itemDetails.map(item => ({
          itemId: item.id,
          receivedQuantity: item.quantityDispatched
        }))
      )
    } else {
      setItemQuantities([])
    }
    setTicketModalOpen(true)
  }

  const updateItemReceivedQuantity = (index: number, itemId: string, quantity: number) => {
    const newQuantities = [...itemQuantities]
    newQuantities[index] = {
      itemId: itemId,
      receivedQuantity: quantity
    }
    setItemQuantities(newQuantities)
  }

  const extractErrorMessage = (error: unknown) => {
    const e = error as { response?: { data?: { error?: string; message?: string } }; message?: string }
    return e?.response?.data?.error || e?.response?.data?.message || e?.message || 'Failed to perform action. Please try again.'
  }

  const handleSubmitTicket = async () => {
    if (!selectedOrderForTicket || !selectedOrderForTicket.itemDetails) return

    try {
      setSubmittingTicket(true)
      // Create mismatches array from item quantities
      const mismatches = selectedOrderForTicket.itemDetails.map((item, index) => {
        const receivedQty = itemQuantities[index]?.receivedQuantity ?? item.quantityDispatched
        const discrepancy = receivedQty - item.quantityInvoiced
        
        return {
          grnItemId: item.id, // This is the dispatch item ID, will be mapped to GRN item ID in backend
          assignedOrderItemId: item.assignedOrderItemId,
          assignedQuantity: item.quantityInvoiced,
          confirmedQuantity: item.quantityInvoiced,
          receivedQuantity: receivedQty,
          discrepancyQuantity: discrepancy,
          status: ticketData.issueType === 'damaged' 
            ? 'DAMAGE_REPORTED' as const
            : discrepancy < 0 
              ? 'SHORTAGE_REPORTED' as const 
              : 'QUANTITY_MISMATCH' as const,
          itemRemarks: ticketData.comments,
          damageReported: ticketData.issueType === 'damaged',
          damageDescription: ticketData.issueType === 'damaged' ? ticketData.comments : undefined
        }
      })

      await ReceivedOrdersApiService.raiseTicket(selectedOrderForTicket.id, {
        issueType: ticketData.issueType,
        comments: ticketData.comments,
        mismatches: mismatches,
        operatorRemarks: ticketData.comments
      })
      
      // Refresh data
      await fetchReceivedOrders()
      await fetchMetrics()
      
      setTicketModalOpen(false)
      setSelectedOrderForTicket(null)
      setItemQuantities([])
      setTicketData({
        orderId: '',
        issueType: 'qty-mismatch',
        comments: '',
        proofFile: undefined
      })
    } catch (error: unknown) {
      console.error('Failed to raise ticket:', error)
      alert(`Error: ${extractErrorMessage(error)}`)
    } finally {
        setSubmittingTicket(false)
      }
  }

  const handleBulkVerification = async () => {
    const selectedOrdersList = Array.from(selectedOrders)
    const ordersToVerify = orders.filter(
      order => selectedOrdersList.includes(order.id) && order.status === 'pending'
    )

    try {
      // Verify each selected order
      await Promise.all(
        ordersToVerify.map(order => ReceivedOrdersApiService.verifyOrder(order.id, {}))
      )
      
      // Refresh data
      await fetchReceivedOrders()
      await fetchMetrics()
      setSelectedOrders(new Set())
    } catch (error: unknown) {
      console.error('Failed to bulk verify orders:', error)
      // Show user-friendly error message
      const errorMessage = (error as { response?: { data?: { error?: string } }; message?: string })?.response?.data?.error || 
                          (error as { response?: { data?: { error?: string } }; message?: string })?.message || 
                          'Failed to bulk verify orders. Please try again.'
      alert(`Error: ${errorMessage}`)
    }
  }

  const handleOrderSelection = (orderId: string) => {
    const order = orders.find(o => o.id === orderId)
    // Only allow selection of pending orders
    if (order && order.status !== 'pending') return
    
    setSelectedOrders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(orderId)) {
        newSet.delete(orderId)
      } else {
        newSet.add(orderId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    // Only select pending orders
    const pendingOrders = filteredOrders.filter(order => order.status === 'pending')
    if (selectedOrders.size === pendingOrders.length && pendingOrders.length > 0) {
      setSelectedOrders(new Set())
    } else {
      setSelectedOrders(new Set(pendingOrders.map(order => order.id)))
    }
  }

  const toggleRowExpansion = (orderId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(orderId)) {
        newSet.delete(orderId)
      } else {
        newSet.add(orderId)
      }
      return newSet
    })
  }

  const canBulkVerify = Array.from(selectedOrders).some(orderId => {
    const order = orders.find(o => o.id === orderId)
    return order && order.status === 'pending'
  })

  const handleExportCSV = () => {
    const csvContent = [
      ['Order ID', 'Order Number', 'Vendor Name', 'Vendor Email', 'Status', 'Submitted Date', 'Total Items', 'Quantity Invoiced', 'Quantity Received', 'GRN Number', 'Ticket Number'],
      ...filteredOrders.map(order => [
        order.id,
        order.orderNumber,
        order.vendor?.name || 'N/A',
        order.vendor?.email || 'N/A',
        order.status,
        order.submittedAt ? format(new Date(order.submittedAt), 'yyyy-MM-dd') : 'N/A',
        order.items || 0,
        order.quantityInvoiced || 0,
        order.quantityReceived || 0,
        order.grnNumber || 'N/A',
        order.ticketNumber || 'N/A'
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `received_orders_export_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportPDF = () => {
    // For now, we'll export as CSV since PDF generation would require additional libraries
    // In a real implementation, you might use libraries like jsPDF or html2canvas
    handleExportCSV()
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-[var(--color-sharktank-bg)] min-h-[calc(100vh-4rem)] font-sans w-full overflow-x-hidden">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-heading)] mb-2">
          Received Orders
        </h1>
        <p className="text-sm sm:text-base text-[var(--color-primary)]">
          Verify received orders and manage quantity discrepancies
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8 mt-8 sm:mt-12">
        <KPICard
          title="Pending Verification"
          value={metrics.pending}
          icon={<AlertTriangle size={32} />}
        />
        <KPICard
          title="Verified Orders"
          value={metrics.verified}
          icon={<CheckSquare size={32} />}
        />
        <KPICard
          title="Mismatch Orders"
          value={metrics.mismatch}
          icon={<X size={32} />}
        />
      </div>

      {/* Received Orders Heading */}
      <div className="mb-3 sm:mb-4 flex items-center justify-between">
        <h2 className="text-base sm:text-lg md:text-xl font-semibold text-[var(--color-heading)]">Received Orders</h2>
        <CSVPDFExportButton
          onExportCSV={handleExportCSV}
          onExportPDF={handleExportPDF}
          label="Export"
        />
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-xl p-12 text-center">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading orders...</p>
        </div>
      )}

      {/* Filters */}
      {!loading && (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6 pb-3 sm:pb-4 mb-4 sm:mb-6">
        {/* Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-4">
          {/* Search Order */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Order#</label>
            <input
              type="text"
              value={filters.order}
              onChange={(e) => setFilters({...filters, order: e.target.value})}
              placeholder="Search order number"
              className="w-full px-3 py-2.5 sm:py-3 text-sm border border-gray-300 rounded-md hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200 min-h-[44px] sm:min-h-auto"
            />
          </div>

          {/* Search Vendor */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Vendor#</label>
            <input
              type="text"
              value={filters.vendor}
              onChange={(e) => setFilters({...filters, vendor: e.target.value})}
              placeholder="Search vendor"
              className="w-full px-3 py-2.5 sm:py-3 text-sm border border-gray-300 rounded-md hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200 min-h-[44px] sm:min-h-auto"
            />
          </div>

          {/* From Date */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">From Date</label>
            <div className="relative" ref={fromDateCalendarRef}>
              <button
                type="button"
                onClick={() => setShowFromDateCalendar(!showFromDateCalendar)}
                className="w-full px-3 py-2.5 sm:py-3 text-xs sm:text-sm border border-gray-300 rounded-md hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200 min-h-[44px] sm:min-h-auto flex items-center justify-between text-left"
              >
                <span className={fromDateCalendar ? 'text-gray-900 truncate' : 'text-gray-500'}>
                  {fromDateCalendar ? format(fromDateCalendar, 'dd/MM/yyyy') : 'Select date'}
                </span>
                <CalendarIcon className="h-4 w-4 text-gray-500 flex-shrink-0 ml-2" />
              </button>
              {showFromDateCalendar && (
                <div className="absolute z-50 mt-2 right-0 bg-white border border-gray-200 rounded-md shadow-lg w-full min-w-[280px]">
                  <Calendar
                    mode="single"
                    selected={fromDateCalendar}
                    onSelect={(date) => {
                      setFromDateCalendar(date)
                      setFilters({...filters, fromDate: date ? format(date, 'yyyy-MM-dd') : ''})
                      setShowFromDateCalendar(false)
                    }}
                    initialFocus
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </div>

          {/* To Date */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">To Date</label>
            <div className="relative" ref={toDateCalendarRef}>
              <button
                type="button"
                onClick={() => setShowToDateCalendar(!showToDateCalendar)}
                className="w-full px-3 py-2.5 sm:py-3 text-xs sm:text-sm border border-gray-300 rounded-md hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200 min-h-[44px] sm:min-h-auto flex items-center justify-between text-left"
              >
                <span className={toDateCalendar ? 'text-gray-900 truncate' : 'text-gray-500'}>
                  {toDateCalendar ? format(toDateCalendar, 'dd/MM/yyyy') : 'Select date'}
                </span>
                <CalendarIcon className="h-4 w-4 text-gray-500 flex-shrink-0 ml-2" />
              </button>
              {showToDateCalendar && (
                <div className="absolute z-50 mt-2 right-0 bg-white border border-gray-200 rounded-md shadow-lg w-full min-w-[280px]">
                  <Calendar
                    mode="single"
                    selected={toDateCalendar}
                    onSelect={(date) => {
                      setToDateCalendar(date)
                      setFilters({...filters, toDate: date ? format(date, 'yyyy-MM-dd') : ''})
                      setShowToDateCalendar(false)
                    }}
                    initialFocus
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Status</label>
            <CustomDropdown
              value={filters.status === 'all' ? '' : filters.status}
              onChange={(value) => setFilters({...filters, status: value || 'all'})}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'pending', label: 'Pending' },
                { value: 'verified', label: 'Verified' },
                { value: 'mismatch', label: 'Mismatch' }
              ]}
              placeholder="All Statuses"
            />
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
          <div className="flex flex-row items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                setFilters({order: '', vendor: '', fromDate: '', toDate: '', status: 'all'})
                setFromDateCalendar(undefined)
                setToDateCalendar(undefined)
              }}
              className="w-full sm:w-[140px] px-4 py-2.5 sm:py-2 bg-white text-secondary border border-secondary rounded-2xl font-medium hover:bg-secondary hover:text-white transition-colors duration-200 text-sm min-h-[44px] sm:min-h-auto cursor-pointer"
            >
              Reset
            </button>
          </div>

          {/* Bulk Actions */}
          {selectedOrders.size > 0 && canBulkVerify && (
            <button
              onClick={handleBulkVerification}
              className="w-full sm:w-auto px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2 min-h-[44px]"
            >
              <CheckSquare size={16} />
              Bulk Verify ({selectedOrders.size})
            </button>
          )}
        </div>
      </div>
      )}

      {/* Orders Table */}
      {!loading && (
      <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse">
            <thead>
              <tr style={{ background: 'var(--color-accent)' }}>
                <th className="text-left p-3 font-heading font-normal w-12" style={{ color: 'var(--color-button-text)' }}></th>
                <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>
                  <input
                    type="checkbox"
                    checked={selectedOrders.size > 0 && selectedOrders.size === filteredOrders.filter(o => o.status === 'pending').length && filteredOrders.filter(o => o.status === 'pending').length > 0}
                    onChange={handleSelectAll}
                    title="Select all pending orders"
                    className="rounded border-white text-white focus:ring-white"
                  />
                </th>
                <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Order ID</th>
                <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Items</th>
                <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Vendor</th>
                <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Date</th>
                <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Qty Invoiced</th>
                <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Qty Received</th>
                <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Status</th>
                <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {paginatedOrders.map((order) => (
                <React.Fragment key={order.id}>
                  <tr className="hover:bg-gray-50 transition-colors">
                    <td className="p-3">
                      <button
                        onClick={() => toggleRowExpansion(order.id)}
                        className="text-gray-600 hover:text-[var(--color-accent)] transition-colors"
                      >
                        {expandedRows.has(order.id) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      </button>
                    </td>
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedOrders.has(order.id)}
                        onChange={() => handleOrderSelection(order.id)}
                        disabled={order.status !== 'pending'}
                        title={order.status !== 'pending' ? 'Only pending orders can be selected' : 'Select order'}
                        className="rounded border-gray-300 text-[var(--color-accent)] focus:ring-[var(--color-accent)] disabled:opacity-50 disabled:cursor-not-allowed"
                      />
                    </td>
                    <td className="p-3 font-semibold text-secondary">{order.orderNumber}</td>
                    <td className="p-3 text-sm text-gray-600">
                      {order.items} {order.items === 1 ? 'item' : 'items'}
                    </td>
                    <td className="p-3">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.vendor.name}</div>
                        <div className="text-xs text-gray-500">{order.vendor.email}</div>
                      </div>
                    </td>
                    <td className="p-3">
                      <div className="text-sm text-gray-600">{format(new Date(order.submittedAt), 'dd/MM/yyyy')}</div>
                      <div className="text-xs text-gray-500">{format(new Date(order.submittedAt), 'HH:mm')}</div>
                    </td>
                    <td className="p-3 text-sm text-gray-600">
                      {order.quantityInvoiced}
                    </td>
                    <td className="p-3">
                      <div className="text-sm text-gray-600">
                        {order.status === 'pending' ? (
                          <span className="text-gray-400 italic">-</span>
                        ) : (
                          <>
                            {order.quantityReceived}
                            {order.quantityInvoiced !== order.quantityReceived && (
                              <span className="ml-2 text-red-600 font-medium">
                                (Δ {order.quantityReceived - order.quantityInvoiced})
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </td>
                    <td className="p-3">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="p-3">
                      {order.status === 'pending' && (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleVerifyOrder(order.id)}
                            className="bg-green-500 text-white rounded-md px-2.5 py-1.5 text-xs hover:bg-green-600 flex items-center gap-1 disabled:bg-green-400"
                            disabled={submitVerify}
                          >
                            {submitVerify ? <Loader size="xs" color="white" /> : <CheckSquare size={12} />}
                            Verify OK
                          </button>
                          <button
                            onClick={() => handleRaiseTicket(order)}
                            className="bg-red-500 text-white rounded-md px-2.5 py-1.5 text-xs hover:bg-red-600 flex items-center gap-1 disabled:bg-gray-400 disabled:cursor-not-allowed"
                            disabled={submitVerify}
                          >
                            <AlertTriangle size={12} />
                            Raise Ticket
                          </button>
                        </div>
                      )}
                      {order.status === 'verified' && (
                        <span className="text-xs text-green-600 flex items-center gap-1">
                          <CheckSquare size={12} />
                          Verified
                        </span>
                      )}
                      {order.status === 'mismatch' && (
                        <span className="text-xs text-red-600 flex items-center gap-1">
                          <AlertTriangle size={12} />
                          Ticket Raised
                        </span>
                      )}
                    </td>
                  </tr>
                  {expandedRows.has(order.id) && (
                    <tr className="bg-gray-50">
                      <td colSpan={10} className="p-0">
                        <div className="px-6 py-4 border-t border-gray-200">
                          <div className="bg-white rounded-lg overflow-hidden">
                            <div className="text-sm">
                              <h4 className="font-semibold text-secondary mb-3">Item Details ({order.itemDetails?.length || 0} items):</h4>
                              {order.itemDetails && order.itemDetails.length > 0 ? (
                                <table className="w-full">
                                  <thead>
                                    <tr className="bg-gray-100 border-b border-gray-200">
                                      <th className="text-left p-3 text-sm font-semibold text-secondary">Product Name</th>
                                      <th className="text-left p-3 text-sm font-semibold text-secondary">SKU</th>
                                      <th className="text-left p-3 text-sm font-semibold text-secondary">Order #</th>
                                      <th className="text-right p-3 text-sm font-semibold text-secondary">Qty Invoiced</th>
                                      <th className="text-right p-3 text-sm font-semibold text-secondary">Qty Dispatched</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {order.itemDetails.map((item, idx) => (
                                      <tr key={item.id} className={idx % 2 === 0 ? 'bg-white border-b border-gray-100' : 'bg-gray-50 border-b border-gray-100'}>
                                        <td className="p-3 text-sm font-medium text-secondary">{item.productName}</td>
                                        <td className="p-3 text-sm text-gray-600">{item.sku || '-'}</td>
                                        <td className="p-3 text-sm text-gray-600">{item.orderNumber}</td>
                                        <td className="p-3 text-sm text-gray-900 text-right">{item.quantityInvoiced}</td>
                                        <td className="p-3 text-sm text-gray-900 text-right">{item.quantityDispatched}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              ) : (
                                <p className="text-gray-500 italic">No item details available</p>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View - Visible only on Mobile */}
        <div className="lg:hidden space-y-3 p-4">
          {paginatedOrders.map((order) => (
            <div key={order.id} className="rounded-xl p-4 border border-gray-200 bg-white">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2 flex-1">
                  <button
                    onClick={() => toggleRowExpansion(order.id)}
                    className="text-gray-600 hover:text-[var(--color-accent)] transition-colors min-w-[32px] min-h-[32px] flex items-center justify-center"
                  >
                    {expandedRows.has(order.id) ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </button>
                  <input
                    type="checkbox"
                    checked={selectedOrders.has(order.id)}
                    onChange={() => handleOrderSelection(order.id)}
                    disabled={order.status !== 'pending'}
                    title={order.status !== 'pending' ? 'Only pending orders can be selected' : 'Select order'}
                    className="rounded border-gray-300 text-[var(--color-accent)] focus:ring-[var(--color-accent)] disabled:opacity-50 disabled:cursor-not-allowed mt-0.5"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-secondary text-lg">{order.orderNumber}</h3>
                  </div>
                </div>
                {getStatusBadge(order.status)}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div>
                  <span className="text-gray-500 block">Vendor</span>
                  <span className="font-medium text-right truncate max-w-[60%]">{order.vendor.name}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Date</span>
                  <span className="font-medium">
                    {format(new Date(order.submittedAt), 'dd/MM/yyyy')} at {format(new Date(order.submittedAt), 'HH:mm')}
                  </span>
                </div>
                <div>
                  <span className="text-gray-500 block">Items</span>
                  <span className="font-medium">{order.items} {order.items === 1 ? 'item' : 'items'}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Qty Invoiced</span>
                  <span className="font-medium">{order.quantityInvoiced}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Qty Received</span>
                  <span className="font-medium">
                    {order.status === 'pending' ? (
                      <span className="text-gray-400 italic">-</span>
                    ) : (
                      <>
                        {order.quantityReceived}
                        {order.quantityInvoiced !== order.quantityReceived && (
                          <span className="ml-2 text-red-600 font-semibold">
                            (Δ {order.quantityReceived - order.quantityInvoiced})
                          </span>
                        )}
                      </>
                    )}
                  </span>
                </div>
              </div>

              {expandedRows.has(order.id) && (
                <div className="mb-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm">Item Details ({order.itemDetails?.length || 0} items):</h4>
                  {order.itemDetails && order.itemDetails.length > 0 ? (
                    <div className="space-y-2">
                      {order.itemDetails.map((item) => (
                        <div key={item.id} className="bg-white p-3 rounded border border-gray-200 text-sm">
                          <div className="font-medium text-gray-900 mb-1">{item.productName}</div>
                          <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                            <div>
                              <span className="font-medium">SKU:</span> {item.sku || '-'}
                            </div>
                            <div>
                              <span className="font-medium">Order:</span> {item.orderNumber}
                            </div>
                            <div>
                              <span className="font-medium">Qty Invoiced:</span> {item.quantityInvoiced}
                            </div>
                            <div>
                              <span className="font-medium">Qty Dispatched:</span> {item.quantityDispatched}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 italic text-sm">No item details available</p>
                  )}
                </div>
              )}

              {order.status === 'pending' && (
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleVerifyOrder(order.id)}
                    className="bg-green-500 text-white rounded-md px-2.5 py-1.5 text-xs hover:bg-green-600 flex items-center gap-1"
                  >
                    <CheckSquare size={12} />
                    Verify OK
                  </button>
                  <button
                    onClick={() => handleRaiseTicket(order)}
                    className="bg-red-500 text-white rounded-md px-2.5 py-1.5 text-xs hover:bg-red-600 flex items-center gap-1"
                  >
                    <AlertTriangle size={12} />
                    Raise Ticket
                  </button>
                </div>
              )}
              {order.status === 'verified' && (
                <div className="text-xs text-green-600 flex items-center gap-1">
                  <CheckSquare size={12} />
                  Verified
                </div>
              )}
              {order.status === 'mismatch' && (
                <div className="text-xs text-red-600 flex items-center gap-1">
                  <AlertTriangle size={12} />
                  Ticket Raised
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center">
            <p className="text-gray-500">No orders found matching the current filters.</p>
          </div>
        )}
        
        {/* Pagination */}
        {filteredOrders.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredOrders.length}
            startIndex={startIndex}
            endIndex={endIndex}
            onPageChange={setCurrentPage}
            itemLabel="orders"
            variant="desktop"
          />
        )}
      </div>
      )}

      {/* Raise Ticket Modal */}
      {ticketModalOpen && selectedOrderForTicket && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-[var(--color-heading)]">Raise Ticket</h3>
              <button 
                onClick={() => {
                  setTicketModalOpen(false)
                  setSelectedOrderForTicket(null)
                  setItemQuantities([])
                }}
                className="text-gray-400 hover:text-gray-600 p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
                disabled={submittingTicket}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-600 mb-2">Order: <span className="font-medium">{selectedOrderForTicket.orderNumber}</span></p>
              <p className="text-xs sm:text-sm text-gray-600 mb-2">Vendor: <span className="font-medium">{selectedOrderForTicket.vendor.name}</span></p>
              <p className="text-xs sm:text-sm text-gray-600">Total Qty Invoiced: <span className="font-medium">{selectedOrderForTicket.quantityInvoiced}</span></p>
            </div>

            {/* Items with Received Quantities */}
            {selectedOrderForTicket.itemDetails && selectedOrderForTicket.itemDetails.length > 0 && (
              <div className="mb-4 sm:mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-900">Enter Received Quantities *</h4>
                  <div className="text-xs text-gray-600">
                    <span className="font-medium">Total Expected:</span> {selectedOrderForTicket.quantityInvoiced} | 
                    <span className="font-medium ml-1">Total Received:</span> {itemQuantities.reduce((sum, item) => sum + item.receivedQuantity, 0)}
                  </div>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {selectedOrderForTicket.itemDetails.map((item, index) => (
                    <div key={item.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{item.productName}</p>
                          <p className="text-xs text-gray-600">SKU: {item.sku || 'N/A'} | Order: {item.orderNumber}</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Invoiced Qty</label>
                          <input
                            type="number"
                            value={item.quantityInvoiced}
                            disabled
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md bg-gray-100 text-gray-600"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">Received Qty *</label>
                          <input
                            type="number"
                            min="0"
                            value={itemQuantities[index]?.receivedQuantity ?? item.quantityDispatched}
                            onChange={(e) => updateItemReceivedQuantity(index, item.id, parseInt(e.target.value) || 0)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
                          />
                        </div>
                      </div>
                      {(itemQuantities[index]?.receivedQuantity ?? item.quantityDispatched) !== item.quantityInvoiced && (
                        <div className="mt-2 flex items-center gap-1 text-xs">
                          <AlertTriangle size={12} className="text-orange-600" />
                          <span className="text-orange-600 font-medium">
                            Discrepancy: {((itemQuantities[index]?.receivedQuantity ?? item.quantityDispatched) - item.quantityInvoiced) > 0 ? '+' : ''}
                            {(itemQuantities[index]?.receivedQuantity ?? item.quantityDispatched) - item.quantityInvoiced}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Issue Type *
                </label>
                <CustomDropdown
                  value={ticketData.issueType}
                  onChange={(value) => setTicketData({...ticketData, issueType: value as 'qty-mismatch' | 'damaged' | 'missing-item'})}
                  options={[
                    { value: 'qty-mismatch', label: 'Quantity Mismatch' },
                    { value: 'damaged', label: 'Damaged Items' },
                    { value: 'missing-item', label: 'Missing Item' }
                  ]}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments *
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent min-h-[100px]"
                  rows={4}
                  placeholder="Describe the issue in detail..."
                  value={ticketData.comments}
                  onChange={(e) => setTicketData({...ticketData, comments: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Proof (Photo/PDF)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-gray-400 transition-colors">
                  <div className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mb-3 sm:mb-4 flex items-center justify-center text-2xl sm:text-3xl">
                    📁
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 mb-2">
                    <label htmlFor="file-upload" className="cursor-pointer text-[var(--color-accent)] hover:underline">
                      Click to upload
                    </label>
                    <span> or drag and drop</span>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                  <input
                    id="file-upload"
                    type="file"
                    className="hidden"
                    accept=".png,.jpg,.jpeg,.pdf"
                    onChange={(e) => setTicketData({...ticketData, proofFile: e.target.files?.[0]})}
                  />
                  {ticketData.proofFile && (
                    <p className="mt-2 text-xs sm:text-sm text-green-600 break-all">
                      Selected: {ticketData.proofFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 mt-4 sm:mt-6">
              <button
                onClick={() => {
                  setTicketModalOpen(false)
                  setSelectedOrderForTicket(null)
                  setItemQuantities([])
                  setTicketData({
                    orderId: '',
                    issueType: 'qty-mismatch',
                    comments: '',
                    proofFile: undefined
                  })
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors min-h-[44px] disabled:cursor-not-allowed"
                disabled={submittingTicket}
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitTicket}
                disabled={!ticketData.comments.trim() || submittingTicket}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
              >
                <span className="inline-flex items-center gap-2 justify-center">
                  {submittingTicket && <Loader size="xs" color="white" />}
                  <span>Submit Ticket</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}