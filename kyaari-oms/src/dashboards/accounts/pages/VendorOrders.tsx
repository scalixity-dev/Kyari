import React, { useState, useMemo, useEffect } from 'react'
import { Eye, FileText, CheckSquare, ChevronDown, ChevronRight, X } from 'lucide-react'

type OrderStatus = 'Confirmed' | 'Awaiting PO' | 'PO Generated' | 'Delivered' | 'Closed'
type POStatus = 'Pending' | 'Generated'
type InvoiceStatus = 'Not Created' | 'Awaiting Validation' | 'Approved'

type VendorOrderItem = {
  sku: string
  product: string
  qty: number
  confirmedQty: number
}

type VendorOrder = {
  id: string
  vendorName: string
  items: VendorOrderItem[]
  orderStatus: OrderStatus
  poStatus: POStatus
  invoiceStatus: InvoiceStatus
  orderDate: string
  confirmationDate: string
}

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

const initialVendorOrders: VendorOrder[] = [
  {
    id: 'VO-001',
    vendorName: 'Flower Garden',
    items: [
      { sku: 'KY-ROSE-01', product: 'Red Roses', qty: 100, confirmedQty: 95 },
      { sku: 'KY-SUN-01', product: 'Sunflowers', qty: 50, confirmedQty: 50 }
    ],
    orderStatus: 'Confirmed',
    poStatus: 'Pending',
    invoiceStatus: 'Not Created',
    orderDate: '2025-01-15',
    confirmationDate: '2025-01-16'
  },
  {
    id: 'VO-002',
    vendorName: 'GreenLeaf Co',
    items: [
      { sku: 'KY-PLNT-05', product: 'Snake Plant', qty: 20, confirmedQty: 20 }
    ],
    orderStatus: 'PO Generated',
    poStatus: 'Generated',
    invoiceStatus: 'Awaiting Validation',
    orderDate: '2025-01-18',
    confirmationDate: '2025-01-18'
  },
  {
    id: 'VO-003',
    vendorName: 'Urban Roots',
    items: [
      { sku: 'KY-PLNT-12', product: 'Monstera', qty: 15, confirmedQty: 15 },
      { sku: 'KY-PLNT-15', product: 'Fiddle Leaf Fig', qty: 8, confirmedQty: 8 }
    ],
    orderStatus: 'Delivered',
    poStatus: 'Generated',
    invoiceStatus: 'Approved',
    orderDate: '2025-01-20',
    confirmationDate: '2025-01-20'
  },
  {
    id: 'VO-004',
    vendorName: 'Plantify',
    items: [
      { sku: 'KY-ACC-21', product: 'Watering Can', qty: 30, confirmedQty: 30 }
    ],
    orderStatus: 'Awaiting PO',
    poStatus: 'Pending',
    invoiceStatus: 'Not Created',
    orderDate: '2025-01-22',
    confirmationDate: '2025-01-22'
  }
]

export default function VendorOrders() {
  const [orders, setOrders] = useState<VendorOrder[]>(initialVendorOrders)
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [isDetailPanelOpen, setIsDetailPanelOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<VendorOrder | null>(null)
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // Filter states
  const [filterVendor, setFilterVendor] = useState('')
  const [filterStatus, setFilterStatus] = useState<OrderStatus | ''>('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')

  const vendors = useMemo(() => Array.from(new Set(orders.map(o => o.vendorName))).sort(), [orders])

  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (filterVendor && order.vendorName !== filterVendor) return false
      if (filterStatus && order.orderStatus !== filterStatus) return false
      if (filterDateFrom && order.orderDate < filterDateFrom) return false
      if (filterDateTo && order.orderDate > filterDateTo) return false
      return true
    })
  }, [orders, filterVendor, filterStatus, filterDateFrom, filterDateTo])

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
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set())
    } else {
      setSelectedOrders(new Set(filteredOrders.map(o => o.id)))
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

  const handleGeneratePO = (orderId: string) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { ...order, poStatus: 'Generated' as POStatus, orderStatus: 'PO Generated' as OrderStatus }
        : order
    ))
    // In a real app, this would generate and download the PO
    alert(`PO generated for order ${orderId}. Download started.`)
  }

  const handleMarkDelivered = (orderId: string) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { ...order, orderStatus: 'Delivered' as OrderStatus }
        : order
    ))
  }

  const handleBulkGeneratePO = () => {
    const ordersToUpdate = Array.from(selectedOrders)
    setOrders(prev => prev.map(order => 
      ordersToUpdate.includes(order.id)
        ? { ...order, poStatus: 'Generated' as POStatus, orderStatus: 'PO Generated' as OrderStatus }
        : order
    ))
    alert(`POs generated for ${ordersToUpdate.length} orders. Downloads started.`)
    setSelectedOrders(new Set())
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
  }

  return (
    <div className="p-3 sm:p-4 lg:p-6 font-sans text-primary">
      {/* Page Header */}
      <div className="mb-4 sm:mb-6">
        <h2 className="font-heading text-secondary text-2xl sm:text-3xl font-semibold mb-2">Vendor Orders</h2>
        <p className="text-sm text-gray-600">Manage vendor orders, generate POs, and track order status</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 mb-4 sm:mb-6 border border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
            <select 
              value={filterVendor} 
              onChange={(e) => setFilterVendor(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-sm"
            >
              <option value="">All Vendors</option>
              {vendors.map(vendor => (
                <option key={vendor} value={vendor}>{vendor}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select 
              value={filterStatus} 
              onChange={(e) => setFilterStatus(e.target.value as OrderStatus | '')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-sm"
            >
              <option value="">All Statuses</option>
              {Object.keys(STATUS_STYLES).map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date From</label>
            <input 
              type="date" 
              value={filterDateFrom} 
              onChange={(e) => setFilterDateFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-sm"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date To</label>
            <input 
              type="date" 
              value={filterDateTo} 
              onChange={(e) => setFilterDateTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent text-sm"
            />
          </div>
          
          <div className="flex items-end sm:col-span-2 lg:col-span-1">
            <button 
              onClick={resetFilters}
              className="w-full bg-white text-secondary border border-secondary rounded-lg px-4 py-2 hover:bg-gray-50 text-sm font-medium"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedOrders.size > 0 && (
        <div className="bg-accent text-button-text rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <span className="font-medium text-sm sm:text-base">{selectedOrders.size} orders selected</span>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <button
                onClick={handleBulkGeneratePO}
                className="bg-white text-accent rounded-lg px-3 sm:px-4 py-2 font-medium hover:bg-gray-50 text-sm w-full sm:w-auto"
              >
                Generate POs
              </button>
              <button
                onClick={() => setSelectedOrders(new Set())}
                className="bg-white/20 text-white rounded-lg px-3 sm:px-4 py-2 font-medium hover:bg-white/30 text-sm w-full sm:w-auto"
              >
                Clear Selection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Orders Table - Desktop View */}
      <div className="hidden lg:block bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-gray-50">
                <th className="text-left p-4 font-heading text-secondary font-medium">
                  <input
                    type="checkbox"
                    checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                    onChange={handleSelectAll}
                    className="rounded border-gray-300"
                  />
                </th>
                {['Order ID', 'Vendor Name', 'Items', 'Confirmed Qty', 'Order Status', 'PO Status', 'Invoice Status', 'Actions'].map(header => (
                  <th key={header} className="text-left p-4 font-heading text-secondary font-medium">{header}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order, index) => {
                const isExpanded = expandedRows.has(order.id)
                const orderStatusStyle = STATUS_STYLES[order.orderStatus]
                const poStatusStyle = PO_STATUS_STYLES[order.poStatus]
                const invoiceStatusStyle = INVOICE_STATUS_STYLES[order.invoiceStatus]
                
                return (
                  <React.Fragment key={order.id}>
                    <tr className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                      <td className="p-4">
                        <input
                          type="checkbox"
                          checked={selectedOrders.has(order.id)}
                          onChange={() => handleSelectOrder(order.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td className="p-4 font-medium">{order.id}</td>
                      <td className="p-4">{order.vendorName}</td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <span>{order.items.length} item{order.items.length !== 1 ? 's' : ''}</span>
                          <button
                            onClick={() => toggleRowExpansion(order.id)}
                            className="text-accent hover:text-accent/80"
                          >
                            {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                          </button>
                        </div>
                      </td>
                      <td className="p-4">
                        {order.items.reduce((sum, item) => sum + item.confirmedQty, 0)}
                      </td>
                      <td className="p-4">
                        <span 
                          className="inline-block px-3 py-1 rounded-full text-xs font-semibold border"
                          style={{
                            backgroundColor: orderStatusStyle.bg,
                            color: orderStatusStyle.color,
                            borderColor: orderStatusStyle.border,
                          }}
                        >
                          {orderStatusStyle.label}
                        </span>
                      </td>
                      <td className="p-4">
                        <span 
                          className="inline-block px-3 py-1 rounded-full text-xs font-semibold border"
                          style={{
                            backgroundColor: poStatusStyle.bg,
                            color: poStatusStyle.color,
                            borderColor: poStatusStyle.border,
                          }}
                        >
                          {poStatusStyle.label}
                        </span>
                      </td>
                      <td className="p-4">
                        <span 
                          className="inline-block px-3 py-1 rounded-full text-xs font-semibold border"
                          style={{
                            backgroundColor: invoiceStatusStyle.bg,
                            color: invoiceStatusStyle.color,
                            borderColor: invoiceStatusStyle.border,
                          }}
                        >
                          {invoiceStatusStyle.label}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleViewDetails(order)}
                            className="bg-white text-secondary border border-secondary rounded-lg px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-1"
                            title="View Details"
                          >
                            <Eye size={14} />
                            View
                          </button>
                          <button
                            onClick={() => handleGeneratePO(order.id)}
                            disabled={order.poStatus === 'Generated'}
                            className="bg-accent text-button-text rounded-lg px-3 py-1.5 text-sm hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            title="Generate PO"
                          >
                            <FileText size={14} />
                            Generate PO
                          </button>
                          <button
                            onClick={() => handleMarkDelivered(order.id)}
                            disabled={order.poStatus !== 'Generated' || order.orderStatus === 'Delivered'}
                            className="bg-green-600 text-white rounded-lg px-3 py-1.5 text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                            title="Mark Delivered"
                          >
                            <CheckSquare size={14} />
                            Mark Delivered
                          </button>
                        </div>
                      </td>
                    </tr>
                    
                    {/* Expanded Item Details */}
                    {isExpanded && (
                      <tr className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                        <td colSpan={9} className="p-4 border-t border-gray-200">
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <h4 className="font-medium text-secondary mb-3">Order Items</h4>
                            <div className="space-y-2">
                              {order.items.map((item, itemIndex) => (
                                <div key={itemIndex} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <div className="flex items-center gap-4">
                                    <span className="font-medium">{item.sku}</span>
                                    <span>{item.product}</span>
                                  </div>
                                  <div className="flex items-center gap-4">
                                    <span className="text-sm text-gray-600">Ordered: {item.qty}</span>
                                    <span className="text-sm text-green-600 font-medium">Confirmed: {item.confirmedQty}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                )
              })}
              
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-gray-500">
                    No orders match current filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="lg:hidden space-y-4">
        {/* Mobile Select All */}
        {filteredOrders.length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedOrders.size === filteredOrders.length && filteredOrders.length > 0}
                onChange={handleSelectAll}
                className="rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-700">
                Select all ({filteredOrders.length} orders)
              </span>
            </div>
          </div>
        )}

        {filteredOrders.map((order) => {
          const isExpanded = expandedRows.has(order.id)
          const orderStatusStyle = STATUS_STYLES[order.orderStatus]
          const poStatusStyle = PO_STATUS_STYLES[order.poStatus]
          const invoiceStatusStyle = INVOICE_STATUS_STYLES[order.invoiceStatus]
          
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
                      <p className="text-sm text-gray-600 truncate">{order.vendorName}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleRowExpansion(order.id)}
                    className="text-accent hover:text-accent/80 p-1"
                  >
                    {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                  </button>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-4">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 mb-1">Items</p>
                    <p className="text-sm font-medium">{order.items.length} item{order.items.length !== 1 ? 's' : ''}</p>
                  </div>
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
                  <button
                    onClick={() => handleMarkDelivered(order.id)}
                    disabled={order.poStatus !== 'Generated' || order.orderStatus === 'Delivered'}
                    className="flex-1 bg-green-600 text-white rounded-lg px-3 py-2 text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <CheckSquare size={16} />
                    Mark Delivered
                  </button>
                </div>
              </div>

              {/* Expanded Item Details */}
              {isExpanded && (
                <div className="border-t border-gray-100 p-4 bg-gray-50">
                  <h4 className="font-medium text-secondary mb-3 text-sm">Order Items</h4>
                  <div className="space-y-2">
                    {order.items.map((item, itemIndex) => (
                      <div key={itemIndex} className="bg-white rounded-lg p-3">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <span className="font-medium text-sm">{item.sku}</span>
                            <span className="text-sm text-gray-600">{item.product}</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs">
                            <span className="text-gray-600">Ordered: {item.qty}</span>
                            <span className="text-green-600 font-medium">Confirmed: {item.confirmedQty}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}

        {filteredOrders.length === 0 && (
          <div className="bg-white rounded-xl shadow-md p-8 text-center text-gray-500 border border-gray-200">
            No orders match current filters.
          </div>
        )}
      </div>

      {/* Detail Panel - Responsive */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50">
          <div
            className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ease-out ${isDetailPanelOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={closeDetailPanel}
          />
          <div
            className={`absolute bottom-0 sm:top-0 sm:right-0 h-[90vh] sm:h-full w-full sm:w-96 lg:w-96 bg-white shadow-2xl overflow-y-auto flex flex-col transform transition-transform duration-300 ease-out ${isDetailPanelOpen ? 'translate-y-0 sm:translate-x-0' : 'translate-y-full sm:translate-y-0 sm:translate-x-full'} rounded-t-2xl sm:rounded-t-none`}
          >
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg sm:text-xl font-semibold text-secondary">Order Details</h3>
                <button
                  onClick={closeDetailPanel}
                  className="text-gray-400 hover:text-gray-600 p-1"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              <div>
                <h4 className="font-medium text-secondary mb-2 text-sm sm:text-base">Order Information</h4>
                <div className="space-y-2 text-sm">
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
                <h4 className="font-medium text-secondary mb-3 text-sm sm:text-base">Item List</h4>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start mb-2 gap-1 sm:gap-0">
                        <div>
                          <div className="font-medium text-sm sm:text-base">{item.product}</div>
                          <div className="text-xs sm:text-sm text-gray-600">{item.sku}</div>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
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
                <h4 className="font-medium text-secondary mb-3 text-sm sm:text-base">Status History</h4>
                <div className="space-y-3">
                  <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0"></div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs sm:text-sm font-medium">Order Confirmed</div>
                      <div className="text-xs text-gray-600">{selectedOrder.confirmationDate}</div>
                    </div>
                  </div>
                  {selectedOrder.poStatus === 'Generated' && (
                    <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-green-500 rounded-full flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm font-medium">PO Generated</div>
                        <div className="text-xs text-gray-600">{selectedOrder.confirmationDate}</div>
                      </div>
                    </div>
                  )}
                  {selectedOrder.orderStatus === 'Delivered' && (
                    <div className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                      <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0"></div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs sm:text-sm font-medium">Marked Delivered</div>
                        <div className="text-xs text-gray-600">{selectedOrder.confirmationDate}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleGeneratePO(selectedOrder.id)}
                  disabled={selectedOrder.poStatus === 'Generated'}
                  className="flex-1 bg-accent text-button-text rounded-lg px-4 py-2 font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                >
                  <FileText size={16} />
                  Generate PO
                </button>
                <button
                  onClick={() => handleMarkDelivered(selectedOrder.id)}
                  disabled={selectedOrder.poStatus !== 'Generated' || selectedOrder.orderStatus === 'Delivered'}
                  className="flex-1 bg-green-600 text-white rounded-lg px-4 py-2 font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                >
                  <CheckSquare size={16} />
                  Mark Delivered
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}