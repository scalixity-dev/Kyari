import React, { useState } from 'react'
import { CheckSquare, AlertTriangle, Filter, X, Search } from 'lucide-react'

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
  const [ticketModalOpen, setTicketModalOpen] = useState(false)
  const [selectedOrderForTicket, setSelectedOrderForTicket] = useState<ReceivedOrder | null>(null)
  const [ticketData, setTicketData] = useState<TicketData>({
    orderId: '',
    issueType: 'qty-mismatch',
    comments: '',
    proofFile: undefined
  })
  const [showFilters, setShowFilters] = useState(false)

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
    <div className="p-8 bg-[var(--color-happyplant-bg)] min-h-[calc(100vh-4rem)] font-sans w-full overflow-x-hidden">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-heading)] mb-2 font-[var(--font-heading)]">
          Received Orders
        </h1>
        <p className="text-[var(--color-primary)]">
          Verify received orders and manage quantity discrepancies
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-md border border-white/20">
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-5 h-5 text-yellow-500" />
            <span className="text-sm font-medium text-gray-600">Pending Verification</span>
          </div>
          <div className="text-2xl font-bold text-[var(--color-primary)]">{pendingOrders}</div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md border border-white/20">
          <div className="flex items-center gap-3 mb-2">
            <CheckSquare className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-gray-600">Verified Orders</span>
          </div>
          <div className="text-2xl font-bold text-[var(--color-primary)]">{verifiedOrders}</div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md border border-white/20">
          <div className="flex items-center gap-3 mb-2">
            <X className="w-5 h-5 text-red-500" />
            <span className="text-sm font-medium text-gray-600">Mismatch Orders</span>
          </div>
          <div className="text-2xl font-bold text-[var(--color-primary)]">{mismatchOrders}</div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-xl shadow-md border border-white/20 mb-6">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-[var(--color-heading)]">Orders Management</h2>
            <div className="flex items-center gap-3">
              {selectedOrders.size > 0 && canBulkVerify && (
                <button
                  onClick={handleBulkVerification}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
                >
                  <CheckSquare size={16} />
                  Bulk Verify ({selectedOrders.size})
                </button>
              )}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
              >
                <Filter size={16} />
                Filters
              </button>
            </div>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search vendor..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
                    value={filters.vendor}
                    onChange={(e) => setFilters({...filters, vendor: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <div className="relative">
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
                    value={filters.date}
                    onChange={(e) => setFilters({...filters, date: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="verified">Verified</option>
                  <option value="mismatch">Mismatch</option>
                </select>
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={() => setFilters({vendor: '', date: '', status: 'all'})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300 text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity Invoiced</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity Received</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <input
                      type="checkbox"
                      checked={selectedOrders.has(order.id)}
                      onChange={() => handleOrderSelection(order.id)}
                      className="rounded border-gray-300 text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                    />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-[var(--color-heading)]">{order.orderNumber}</div>
                    <div className="text-xs text-gray-500">{order.submittedAt}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{order.vendor.name}</div>
                        <div className="text-xs text-gray-500">{order.vendor.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {order.items}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {order.quantityInvoiced}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-600">
                      {order.quantityReceived}
                      {order.quantityInvoiced !== order.quantityReceived && (
                        <span className="ml-2 text-red-600 font-medium">
                          (Δ {order.quantityReceived - order.quantityInvoiced})
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(order.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {order.status === 'pending' && (
                      <div className="flex gap-2">
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

        {filteredOrders.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No orders found matching the current filters.
          </div>
        )}
      </div>

      {/* Raise Ticket Modal */}
      {ticketModalOpen && selectedOrderForTicket && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-[var(--color-heading)]">Raise Ticket</h3>
              <button 
                onClick={() => setTicketModalOpen(false)} 
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600 mb-2">Order: <span className="font-medium">{selectedOrderForTicket.orderNumber}</span></p>
              <p className="text-sm text-gray-600 mb-2">Vendor: <span className="font-medium">{selectedOrderForTicket.vendor.name}</span></p>
              <p className="text-sm text-gray-600 mb-2">Invoiced: <span className="font-medium">{selectedOrderForTicket.quantityInvoiced}</span></p>
              <p className="text-sm text-gray-600">Received: <span className="font-medium">{selectedOrderForTicket.quantityReceived}</span></p>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Issue Type *
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
                  value={ticketData.issueType}
                  onChange={(e) => setTicketData({...ticketData, issueType: e.target.value as any})}
                >
                  <option value="qty-mismatch">Quantity Mismatch</option>
                  <option value="damaged">Damaged Items</option>
                  <option value="missing-item">Missing Item</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Comments *
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
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
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
                  <div className="mx-auto h-12 w-12 text-gray-400 mb-4 flex items-center justify-center">
                    📁
                  </div>
                  <div className="text-sm text-gray-600 mb-2">
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
                    <p className="mt-2 text-sm text-green-600">
                      Selected: {ticketData.proofFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setTicketModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmitTicket}
                disabled={!ticketData.comments.trim()}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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