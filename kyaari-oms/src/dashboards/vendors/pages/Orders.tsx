import React, { useState } from 'react'
import { CheckSquare, X, AlertTriangle, Clock, FileText, ChevronDown, ChevronUp, Package } from 'lucide-react'

interface Product {
  id: string
  sku: string
  name: string
  requestedQty: number
  confirmedQty: number
  availableQty: number
  status: 'Pending' | 'Confirmed' | 'Partially Confirmed' | 'Declined' | 'Not Available'
  backorderQty: number
  declineReason?: string
}

interface Order {
  id: string
  orderNumber: string
  date: string
  customerName: string
  products: Product[]
  overallStatus: 'Pending' | 'Confirmed' | 'Partially Confirmed' | 'Declined' | 'Waiting for PO' | 'PO Received' | 'Mixed'
  totalItems: number
  totalConfirmed: number
}

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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--color-heading)]">Partial Confirmation</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">Order: <span className="font-medium">{orderNumber}</span></p>
          <p className="text-sm text-gray-600 mb-2">Product: <span className="font-medium">{product.name}</span></p>
          <p className="text-sm text-gray-600 mb-2">SKU: <span className="font-medium">{product.sku}</span></p>
          <p className="text-sm text-gray-600">Requested Quantity: <span className="font-medium">{product.requestedQty}</span></p>
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
              placeholder="Enter available quantity"
              required
            />
          </div>

          {availableQty > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                <span className="font-medium text-yellow-800">Backorder will be created</span>
              </div>
              <p className="text-sm text-yellow-700">
                Available: <span className="font-medium">{availableQty}</span> | 
                Backorder: <span className="font-medium">{backorderQty}</span>
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={availableQty <= 0 || availableQty > product.requestedQty}
              className="flex-1 px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-accent)]/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--color-heading)]">Decline Product</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">Order: <span className="font-medium">{orderNumber}</span></p>
          <p className="text-sm text-gray-600 mb-2">Product: <span className="font-medium">{product.name}</span></p>
          <p className="text-sm text-gray-600">SKU: <span className="font-medium">{product.sku}</span></p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-[var(--color-heading)] mb-3">
              Please select a reason for declining:
            </label>
            <div className="space-y-2">
              {declineReasons.map((reason) => (
                <label key={reason} className="flex items-center">
                  <input
                    type="radio"
                    name="declineReason"
                    value={reason}
                    checked={selectedReason === reason}
                    onChange={(e) => setSelectedReason(e.target.value)}
                    className="mr-3 text-[var(--color-accent)] focus:ring-[var(--color-accent)]"
                  />
                  <span className="text-sm text-gray-700">{reason}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!selectedReason}
              className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
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
  const [orders, setOrders] = useState<Order[]>([
    {
      id: '1',
      orderNumber: 'ORD-001',
      date: '28/09/2025',
      customerName: 'Mumbai Wholesale Market',
      overallStatus: 'Pending',
      totalItems: 2,
      totalConfirmed: 0,
      products: [
        {
          id: 'p1',
          sku: 'VEG-TOM-001',
          name: 'Organic Tomatoes',
          requestedQty: 50,
          confirmedQty: 0,
          availableQty: 0,
          status: 'Pending',
          backorderQty: 0
        },
        {
          id: 'p2',
          sku: 'VEG-ONI-001',
          name: 'Red Onions',
          requestedQty: 30,
          confirmedQty: 0,
          availableQty: 0,
          status: 'Pending',
          backorderQty: 0
        }
      ]
    },
    {
      id: '2',
      orderNumber: 'ORD-002',
      date: '28/09/2025',
      customerName: 'Delhi Food Corp',
      overallStatus: 'Mixed',
      totalItems: 3,
      totalConfirmed: 1,
      products: [
        {
          id: 'p3',
          sku: 'VEG-SPI-001',
          name: 'Fresh Spinach',
          requestedQty: 25,
          confirmedQty: 25,
          availableQty: 25,
          status: 'Confirmed',
          backorderQty: 0
        },
        {
          id: 'p4',
          sku: 'VEG-CAR-001',
          name: 'Organic Carrots',
          requestedQty: 40,
          confirmedQty: 30,
          availableQty: 30,
          status: 'Partially Confirmed',
          backorderQty: 10
        },
        {
          id: 'p5',
          sku: 'VEG-BEA-001',
          name: 'Green Beans',
          requestedQty: 20,
          confirmedQty: 0,
          availableQty: 0,
          status: 'Declined',
          backorderQty: 0
        }
      ]
    }
  ])

  const [modalOpen, setModalOpen] = useState(false)
  const [declineModalOpen, setDeclineModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null)
  const [selectedOrderNumber, setSelectedOrderNumber] = useState<string>('')
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set())

  const calculateOrderStatus = (products: Product[]): Order['overallStatus'] => {
    const statuses = products.map(p => p.status)
    const uniqueStatuses = [...new Set(statuses)]
    
    if (uniqueStatuses.length === 1) {
      return uniqueStatuses[0] as Order['overallStatus']
    }
    return 'Mixed'
  }

  const handleProductConfirmFull = (orderId: string, productId: string) => {
    setOrders(orders.map(order => {
      if (order.id === orderId) {
        const updatedProducts = order.products.map(product => 
          product.id === productId 
            ? { 
                ...product, 
                status: 'Confirmed' as const,
                confirmedQty: product.requestedQty,
                availableQty: product.requestedQty,
                backorderQty: 0
              }
            : product
        )
        return {
          ...order,
          products: updatedProducts,
          overallStatus: calculateOrderStatus(updatedProducts),
          totalConfirmed: updatedProducts.filter(p => p.status === 'Confirmed').length
        }
      }
      return order
    }))
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

  const handlePartialConfirm = (productId: string, availableQty: number) => {
    if (selectedProduct) {
      setOrders(orders.map(order => {
        const updatedProducts = order.products.map(product => 
          product.id === productId 
            ? { 
                ...product, 
                status: 'Partially Confirmed' as const,
                confirmedQty: availableQty,
                availableQty: availableQty,
                backorderQty: product.requestedQty - availableQty
              }
            : product
        )
        return {
          ...order,
          products: updatedProducts,
          overallStatus: calculateOrderStatus(updatedProducts),
          totalConfirmed: updatedProducts.filter(p => ['Confirmed', 'Partially Confirmed'].includes(p.status)).length
        }
      }))
      setModalOpen(false)
      setSelectedProduct(null)
      setSelectedOrderNumber('')
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

  const handleDeclineWithReason = (productId: string, reason: string) => {
    setOrders(orders.map(order => {
      const updatedProducts = order.products.map(product => 
        product.id === productId 
          ? { ...product, status: 'Declined' as const, declineReason: reason }
          : product
      )
      return {
        ...order,
        products: updatedProducts,
        overallStatus: calculateOrderStatus(updatedProducts)
      }
    }))
    setDeclineModalOpen(false)
    setSelectedProduct(null)
    setSelectedOrderNumber('')
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

  return (
    <div className="p-8 bg-[var(--color-happyplant-bg)] min-h-[calc(100vh-4rem)] font-sans w-full overflow-x-hidden">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-heading)] mb-2 font-[var(--font-heading)]">Orders Management</h1>
        <p className="text-[var(--color-primary)]">Manage and respond to incoming orders</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-xl shadow-md border border-white/20">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            <span className="text-sm font-medium text-gray-600">Pending Orders</span>
          </div>
          <div className="text-2xl font-bold text-[var(--color-primary)]">{pendingOrders.length}</div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md border border-white/20">
          <div className="flex items-center gap-3 mb-2">
            <FileText className="w-5 h-5 text-purple-500" />
            <span className="text-sm font-medium text-gray-600">Awaiting PO</span>
          </div>
          <div className="text-2xl font-bold text-[var(--color-primary)]">{waitingForPOOrders.length}</div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md border border-white/20">
          <div className="flex items-center gap-3 mb-2">
            <CheckSquare className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-gray-600">Confirmed</span>
          </div>
          <div className="text-2xl font-bold text-[var(--color-primary)]">{confirmedOrders.length}</div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md border border-white/20">
          <div className="flex items-center gap-3 mb-2">
            <X className="w-5 h-5 text-red-500" />
            <span className="text-sm font-medium text-gray-600">Declined</span>
          </div>
          <div className="text-2xl font-bold text-[var(--color-primary)]">{declinedOrders.length}</div>
        </div>
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-xl shadow-md border border-white/20 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-[var(--color-heading)]">All Orders</h2>
        </div>
        
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order Details</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Products</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.map((order) => (
                <React.Fragment key={order.id}>
                  <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => toggleOrderExpansion(order.id)}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {expandedOrders.has(order.id) ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        <div>
                          <div className="text-sm font-medium text-[var(--color-heading)]">{order.orderNumber}</div>
                          <div className="text-xs text-gray-500">{order.date}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {order.customerName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      <div className="flex items-center gap-2">
                        <Package size={16} className="text-gray-400" />
                        <span>{order.totalItems} items</span>
                        {order.totalConfirmed > 0 && (
                          <span className="text-green-600">({order.totalConfirmed} confirmed)</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(order.overallStatus)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          toggleOrderExpansion(order.id)
                        }}
                        className="text-blue-600 hover:text-blue-800 font-medium"
                      >
                        {expandedOrders.has(order.id) ? 'Collapse' : 'Expand'}
                      </button>
                    </td>
                  </tr>
                  
                  {expandedOrders.has(order.id) && order.products.map((product) => (
                    <tr key={product.id} className="bg-gray-50">
                      <td className="px-12 py-3 text-sm">
                        <div className="text-gray-600">
                          <span className="font-medium">SKU:</span> {product.sku}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <div>
                          <div className="font-medium text-gray-900">{product.name}</div>
                          {product.backorderQty > 0 && (
                            <div className="text-xs text-yellow-600">
                              Backorder: {product.backorderQty} units
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {product.confirmedQty > 0 ? `${product.confirmedQty}/${product.requestedQty}` : product.requestedQty}
                      </td>
                      <td className="px-6 py-3">
                        {getStatusBadge(product.status)}
                      </td>
                      <td className="px-6 py-3">
                        {product.status === 'Pending' && (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleProductConfirmFull(order.id, product.id)}
                              className="px-2 py-1 bg-green-500 text-white rounded text-xs font-medium flex items-center gap-1"
                              title="Confirm Full"
                            >
                              <CheckSquare size={12} />
                              <span>Full</span>
                            </button>
                            <button
                              onClick={() => handleProductConfirmPartial(order.id, product.id)}
                              className="px-2 py-1 bg-blue-500 text-white rounded text-xs font-medium flex items-center gap-1"
                              title="Confirm Partial"
                            >
                              <FileText size={12} />
                              <span>Partial</span>
                            </button>
                            <button
                              onClick={() => handleProductDecline(order.id, product.id)}
                              className="px-2 py-1 bg-red-500 text-white rounded text-xs font-medium flex items-center gap-1"
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
                              <span className="text-green-600">✓ Confirmed</span>
                            )}
                            {product.status === 'Partially Confirmed' && (
                              <span className="text-blue-600">~ Partial</span>
                            )}
                            {product.status === 'Declined' && (
                              <div>
                                <span className="text-red-600">✗ Declined</span>
                                {product.declineReason && (
                                  <div className="text-xs text-red-500 mt-1">
                                    Reason: {product.declineReason}
                                  </div>
                                )}
                              </div>
                            )}
                            {product.status === 'Not Available' && (
                              <span className="text-gray-600">− Not Available</span>
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
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden divide-y divide-gray-200">
          {orders.map((order) => (
            <div key={order.id} className="p-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium text-[var(--color-heading)]">{order.orderNumber}</h3>
                  <p className="text-sm text-gray-600">{order.date}</p>
                  <p className="text-sm text-gray-600">{order.customerName}</p>
                </div>
                {getStatusBadge(order.overallStatus)}
              </div>
              
              <div className="mb-4">
                <p className="text-sm text-gray-600 mb-2">
                  <span className="font-medium">Products:</span> {order.totalItems} items
                  {order.totalConfirmed > 0 && (
                    <span className="text-green-600 ml-2">({order.totalConfirmed} confirmed)</span>
                  )}
                </p>
                
                <div className="space-y-3 mt-3">
                  {order.products.map((product) => (
                    <div key={product.id} className="bg-gray-50 p-3 rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium text-gray-900">{product.name}</p>
                          <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                          <p className="text-xs text-gray-600">
                            Qty: {product.confirmedQty > 0 ? `${product.confirmedQty}/${product.requestedQty}` : product.requestedQty}
                          </p>
                          {product.backorderQty > 0 && (
                            <p className="text-xs text-yellow-600">
                              Backorder: {product.backorderQty} units
                            </p>
                          )}
                          {product.status === 'Declined' && product.declineReason && (
                            <p className="text-xs text-red-500">
                              Decline Reason: {product.declineReason}
                            </p>
                          )}
                        </div>
                        {getStatusBadge(product.status)}
                      </div>

                      {product.status === 'Pending' && (
                        <div className="flex gap-2 flex-wrap">
                          <button
                            onClick={() => handleProductConfirmFull(order.id, product.id)}
                            className="px-2 py-1 bg-green-500 text-white rounded text-xs font-medium flex items-center gap-1"
                          >
                            <CheckSquare size={14} />
                            <span>Full</span>
                          </button>
                          <button
                            onClick={() => handleProductConfirmPartial(order.id, product.id)}
                            className="px-2 py-1 bg-blue-500 text-white rounded text-xs font-medium flex items-center gap-1"
                          >
                            <FileText size={14} />
                            <span>Partial</span>
                          </button>
                          <button
                            onClick={() => handleProductDecline(order.id, product.id)}
                            className="px-2 py-1 bg-red-500 text-white rounded text-xs font-medium flex items-center gap-1"
                          >
                            <X size={14} />
                            <span>Decline</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
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
    </div>
  )
}