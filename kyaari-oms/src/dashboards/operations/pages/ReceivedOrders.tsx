import React, { useState, useEffect, useRef } from 'react'
import { CheckSquare, AlertTriangle, X, Calendar as CalendarIcon } from 'lucide-react'
import { CustomDropdown, KPICard } from '../../../components'
import { Calendar } from '../../../components/ui/calendar'
import { format } from 'date-fns'

interface ReceivedOrder {
  id: string
  orderNumber: string
  vendor: {
    name: string
    id: string
    email: string
  }
  submittedAt: string
  items: number
  quantityInvoiced: number
  quantityReceived: number
  status: 'pending' | 'verified' | 'mismatch'
}

interface TicketData {
  orderId: string
  issueType: 'qty-mismatch' | 'damaged' | 'missing-item'
  comments: string
  proofFile?: File
}

const sampleOrders: ReceivedOrder[] = [
  {
    id: '1',
    orderNumber: 'ORD-001',
    vendor: {
      name: 'Fresh Farms Pvt Ltd',
      id: 'VEN-001',
      email: 'orders@freshfarms.in'
    },
    submittedAt: '2025-09-29',
    items: 5,
    quantityInvoiced: 150,
    quantityReceived: 150,
    status: 'pending'
  },
  {
    id: '2',
    orderNumber: 'ORD-002',
    vendor: {
      name: 'Green Valley Suppliers',
      id: 'VEN-002',
      email: 'supply@greenvalley.com'
    },
    submittedAt: '2025-09-29',
    items: 3,
    quantityInvoiced: 100,
    quantityReceived: 95,
    status: 'mismatch'
  },
  {
    id: '3',
    orderNumber: 'ORD-003',
    vendor: {
      name: 'Organic Harvest Co',
      id: 'VEN-003',
      email: 'info@organicharvest.com'
    },
    submittedAt: '2025-09-28',
    items: 8,
    quantityInvoiced: 200,
    quantityReceived: 200,
    status: 'verified'
  },
  {
    id: '4',
    orderNumber: 'ORD-004',
    vendor: {
      name: 'Farm Direct Ltd',
      id: 'VEN-004',
      email: 'orders@farmdirect.in'
    },
    submittedAt: '2025-09-28',
    items: 2,
    quantityInvoiced: 75,
    quantityReceived: 70,
    status: 'pending'
  },
  {
    id: '5',
    orderNumber: 'ORD-005',
    vendor: {
      name: 'Metro Vegetables',
      id: 'VEN-005',
      email: 'supply@metroveg.com'
    },
    submittedAt: '2025-09-27',
    items: 12,
    quantityInvoiced: 300,
    quantityReceived: 300,
    status: 'verified'
  }
]

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Pending</span>
    case 'verified':
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Verified</span>
    case 'mismatch':
      return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Mismatch</span>
    default:
      return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">{status}</span>
  }
}

export default function ReceivedOrders() {
  const [orders, setOrders] = useState<ReceivedOrder[]>(sampleOrders)
  const [filteredOrders, setFilteredOrders] = useState<ReceivedOrder[]>(sampleOrders)
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState({
    vendor: '',
    date: '',
    status: 'all'
  })
  const [dateCalendar, setDateCalendar] = useState<Date | undefined>()
  const [showDateCalendar, setShowDateCalendar] = useState(false)
  const dateCalendarRef = useRef<HTMLDivElement>(null)
  const [ticketModalOpen, setTicketModalOpen] = useState(false)
  const [selectedOrderForTicket, setSelectedOrderForTicket] = useState<ReceivedOrder | null>(null)
  const [ticketData, setTicketData] = useState<TicketData>({
    orderId: '',
    issueType: 'qty-mismatch',
    comments: '',
    proofFile: undefined
  })

  // Close calendar when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dateCalendarRef.current && !dateCalendarRef.current.contains(event.target as Node)) {
        setShowDateCalendar(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Apply filters
  React.useEffect(() => {
    let filtered = orders

    if (filters.vendor) {
      filtered = filtered.filter(order => 
        order.vendor.name.toLowerCase().includes(filters.vendor.toLowerCase())
      )
    }

    if (filters.date) {
      filtered = filtered.filter(order => order.submittedAt === filters.date)
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter(order => order.status === filters.status)
    }

    setFilteredOrders(filtered)
  }, [filters, orders])

  const handleVerifyOrder = (orderId: string) => {
    setOrders(orders.map(order => 
      order.id === orderId 
        ? { ...order, status: 'verified' as const }
        : order
    ))
  }

  const handleRaiseTicket = (order: ReceivedOrder) => {
    setSelectedOrderForTicket(order)
    setTicketData({
      orderId: order.id,
      issueType: 'qty-mismatch',
      comments: '',
      proofFile: undefined
    })
    setTicketModalOpen(true)
  }

  const handleSubmitTicket = () => {
    // In a real app, this would submit to an API
    console.log('Submitting ticket:', ticketData)
    
    // Update order status to mismatch
    setOrders(orders.map(order => 
      order.id === ticketData.orderId 
        ? { ...order, status: 'mismatch' as const }
        : order
    ))
    
    setTicketModalOpen(false)
    setSelectedOrderForTicket(null)
    setTicketData({
      orderId: '',
      issueType: 'qty-mismatch',
      comments: '',
      proofFile: undefined
    })
  }

  const handleBulkVerification = () => {
    const selectedOrdersList = Array.from(selectedOrders)
    setOrders(orders.map(order => 
      selectedOrdersList.includes(order.id) && order.quantityInvoiced === order.quantityReceived
        ? { ...order, status: 'verified' as const }
        : order
    ))
    setSelectedOrders(new Set())
  }

  const handleOrderSelection = (orderId: string) => {
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
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set())
    } else {
      setSelectedOrders(new Set(filteredOrders.map(order => order.id)))
    }
  }

  const canBulkVerify = Array.from(selectedOrders).some(orderId => {
    const order = orders.find(o => o.id === orderId)
    return order && order.quantityInvoiced === order.quantityReceived && order.status === 'pending'
  })

  const pendingOrders = orders.filter(order => order.status === 'pending').length
  const verifiedOrders = orders.filter(order => order.status === 'verified').length
  const mismatchOrders = orders.filter(order => order.status === 'mismatch').length

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-[var(--color-sharktank-bg)] min-h-[calc(100vh-4rem)] font-sans w-full overflow-x-hidden">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-heading)] mb-2 font-[var(--font-heading)]">
          Received Orders
        </h1>
        <p className="text-sm sm:text-base text-[var(--color-primary)]">
          Verify received orders and manage quantity discrepancies
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8 mt-8">
        <KPICard
          title="Pending Verification"
          value={pendingOrders}
          icon={<AlertTriangle size={32} />}
        />
        <KPICard
          title="Verified Orders"
          value={verifiedOrders}
          icon={<CheckSquare size={32} />}
        />
        <KPICard
          title="Mismatch Orders"
          value={mismatchOrders}
          icon={<X size={32} />}
        />
      </div>

      {/* Received Orders Heading */}
      <div className="mb-3 sm:mb-4">
        <h2 className="text-base sm:text-lg md:text-xl font-semibold text-[var(--color-heading)]">Received Orders</h2>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6 pb-3 sm:pb-4 mb-4 sm:mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Order#</label>
            <input
              type="text"
              value={filters.vendor}
              onChange={(e) => setFilters({...filters, vendor: e.target.value})}
              placeholder="Search order number"
              className="w-full px-3 py-2.5 sm:py-3 text-sm border border-gray-300 rounded-md hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200 min-h-[44px] sm:min-h-auto mb-2"
            />

            <div className="hidden sm:flex sm:flex-row sm:items-center gap-2">
              <button
                onClick={() => {/* Apply filters */}}
                className="w-full sm:w-[140px] px-4 py-2.5 sm:py-2 rounded-md text-white font-medium text-sm min-h-[44px] sm:min-h-auto"
                style={{ backgroundColor: '#C3754C', color: '#F5F3E7' }}
              >
                Apply
              </button>
              <button
                onClick={() => {
                  setFilters({vendor: '', date: '', status: 'all'})
                  setDateCalendar(undefined)
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

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Vendor</label>
            <input
              type="text"
              value={filters.vendor}
              onChange={(e) => setFilters({...filters, vendor: e.target.value})}
              placeholder="Search vendor"
              className="w-full px-3 py-2.5 sm:py-3 text-sm border border-gray-300 rounded-md hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200 min-h-[44px] sm:min-h-auto"
            />
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Date</label>
            <div className="relative" ref={dateCalendarRef}>
              <button
                type="button"
                onClick={() => setShowDateCalendar(!showDateCalendar)}
                className="w-full px-3 py-2.5 sm:py-3 text-xs sm:text-sm border border-gray-300 rounded-md hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200 min-h-[44px] sm:min-h-auto flex items-center justify-between text-left"
              >
                <span className={dateCalendar ? 'text-gray-900 truncate' : 'text-gray-500'}>
                  {dateCalendar ? format(dateCalendar, 'PPP') : 'Select date'}
                </span>
                <CalendarIcon className="h-4 w-4 text-gray-500 flex-shrink-0 ml-2" />
              </button>
              {showDateCalendar && (
                <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-md shadow-lg w-full min-w-[280px]">
                  <Calendar
                    mode="single"
                    selected={dateCalendar}
                    onSelect={(date) => {
                      setDateCalendar(date)
                      setFilters({...filters, date: date ? format(date, 'yyyy-MM-dd') : ''})
                      setShowDateCalendar(false)
                    }}
                    initialFocus
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Apply/Reset Buttons */}
        <div className="flex sm:hidden flex-row items-center gap-2 mt-4">
          <button
            onClick={() => {/* Apply filters */}}
            className="flex-1 px-4 py-2.5 rounded-md text-white font-medium text-sm min-h-[44px]"
            style={{ backgroundColor: '#C3754C', color: '#F5F3E7' }}
          >
            Apply
          </button>
          <button
            onClick={() => {
              setFilters({vendor: '', date: '', status: 'all'})
              setDateCalendar(undefined)
            }}
            className="flex-1 px-4 py-2.5 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 text-sm min-h-[44px]"
            style={{ borderColor: '#1D4D43', color: '#1D4D43' }}
          >
            Reset
          </button>
        </div>

        {/* Bulk Actions */}
        {selectedOrders.size > 0 && canBulkVerify && (
          <div className="mt-4 pt-4 border-t border-gray-200">
            <button
              onClick={handleBulkVerification}
              className="w-full sm:w-auto px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center justify-center gap-2 min-h-[44px]"
            >
              <CheckSquare size={16} />
              Bulk Verify ({selectedOrders.size})
            </button>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-md border border-white/20 overflow-hidden mb-6">
        {/* Desktop Table View - Hidden on Mobile */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--color-accent)]">
              <tr>
                <th className="px-4 xl:px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-white text-white focus:ring-white"
                  />
                </th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Order ID</th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Vendor</th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Items</th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Qty Invoiced</th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Qty Received</th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Status</th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedOrders.has(order.id)}
                      onChange={() => handleOrderSelection(order.id)}
                      className="rounded border-gray-300 text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                    />
                  </td>
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-[var(--color-heading)]">{order.orderNumber}</div>
                    <div className="text-xs text-gray-500">{order.submittedAt}</div>
                  </td>
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.vendor.name}</div>
                        <div className="text-xs text-gray-500">{order.vendor.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {order.items}
                  </td>
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {order.quantityInvoiced}
                  </td>
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {order.quantityReceived}
                      {order.quantityInvoiced !== order.quantityReceived && (
                        <span className="ml-2 text-red-600 font-medium">
                          (Δ {order.quantityReceived - order.quantityInvoiced})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm">
                    {order.status === 'pending' && (
                      <div className="flex flex-col items-start gap-2">
                        {order.quantityInvoiced === order.quantityReceived ? (
                          <button
                            onClick={() => handleVerifyOrder(order.id)}
                            className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-xs font-medium flex items-center gap-1"
                          >
                            <CheckSquare size={14} />
                            Verified OK
                          </button>
                        ) : (
                          <>
                            <button
                              onClick={() => handleVerifyOrder(order.id)}
                              className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-xs font-medium flex items-center gap-1"
                            >
                              <CheckSquare size={14} />
                              Verified OK
                            </button>
                            <button
                              onClick={() => handleRaiseTicket(order)}
                              className="px-3 py-1 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-xs font-medium flex items-center gap-1"
                            >
                              <AlertTriangle size={14} />
                              Raise Ticket
                            </button>
                          </>
                        )}
                      </div>
                    )}
                    {order.status === 'verified' && (
                      <span className="text-xs text-green-600 flex items-center gap-1">
                        <CheckSquare size={14} />
                        Verified
                      </span>
                    )}
                    {order.status === 'mismatch' && (
                      <span className="text-xs text-red-600 flex items-center gap-1">
                        <AlertTriangle size={14} />
                        Ticket Raised
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View - Visible only on Mobile */}
        <div className="md:hidden space-y-4 p-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedOrders.has(order.id)}
                    onChange={() => handleOrderSelection(order.id)}
                    className="rounded border-gray-300 text-[var(--color-accent)] focus:ring-[var(--color-accent)] mt-0.5"
                  />
                  <div>
                    <div className="text-sm font-semibold text-[var(--color-heading)]">{order.orderNumber}</div>
                    <div className="text-xs text-gray-500">{order.submittedAt}</div>
                  </div>
                </div>
                {getStatusBadge(order.status)}
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Vendor:</span>
                  <span className="font-medium text-gray-900 text-right">{order.vendor.name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Items:</span>
                  <span className="font-medium text-gray-900">{order.items}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Qty Invoiced:</span>
                  <span className="font-medium text-gray-900">{order.quantityInvoiced}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Qty Received:</span>
                  <span className="font-medium text-gray-900">
                    {order.quantityReceived}
                    {order.quantityInvoiced !== order.quantityReceived && (
                      <span className="ml-2 text-red-600 font-semibold">
                        (Δ {order.quantityReceived - order.quantityInvoiced})
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {order.status === 'pending' && (
                <div className="flex flex-col gap-2">
                  {order.quantityInvoiced === order.quantityReceived ? (
                    <button
                      onClick={() => handleVerifyOrder(order.id)}
                      className="w-full px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm font-medium flex items-center justify-center gap-2 min-h-[44px]"
                    >
                      <CheckSquare size={16} />
                      Verified OK
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleVerifyOrder(order.id)}
                        className="w-full px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm font-medium flex items-center justify-center gap-2 min-h-[44px]"
                      >
                        <CheckSquare size={16} />
                        Verified OK
                      </button>
                      <button
                        onClick={() => handleRaiseTicket(order)}
                        className="w-full px-3 py-2 bg-red-500 text-white rounded-md hover:bg-red-600 transition-colors text-sm font-medium flex items-center justify-center gap-2 min-h-[44px]"
                      >
                        <AlertTriangle size={16} />
                        Raise Ticket
                      </button>
                    </>
                  )}
                </div>
              )}
              {order.status === 'verified' && (
                <div className="text-sm text-green-600 flex items-center justify-center gap-1 py-2">
                  <CheckSquare size={16} />
                  Verified
                </div>
              )}
              {order.status === 'mismatch' && (
                <div className="text-sm text-red-600 flex items-center justify-center gap-1 py-2">
                  <AlertTriangle size={16} />
                  Ticket Raised
                </div>
              )}
            </div>
          ))}
        </div>

        {filteredOrders.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No orders found matching the current filters.
          </div>
        )}
      </div>

      {/* Raise Ticket Modal */}
      {ticketModalOpen && selectedOrderForTicket && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-[var(--color-heading)]">Raise Ticket</h3>
              <button 
                onClick={() => setTicketModalOpen(false)} 
                className="text-gray-400 hover:text-gray-600 p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-600 mb-2">Order: <span className="font-medium">{selectedOrderForTicket.orderNumber}</span></p>
              <p className="text-xs sm:text-sm text-gray-600 mb-2">Vendor: <span className="font-medium">{selectedOrderForTicket.vendor.name}</span></p>
              <p className="text-xs sm:text-sm text-gray-600 mb-2">Invoiced: <span className="font-medium">{selectedOrderForTicket.quantityInvoiced}</span></p>
              <p className="text-xs sm:text-sm text-gray-600">Received: <span className="font-medium">{selectedOrderForTicket.quantityReceived}</span></p>
            </div>

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
                onClick={() => setTicketModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors min-h-[44px]"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitTicket}
                disabled={!ticketData.comments.trim()}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
              >
                Submit Ticket
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}