import React, { useState } from 'react'
import { FileText, CheckSquare, X, Clock, Package, MapPin } from 'lucide-react'

interface DispatchOrder {
  id: string
  orderNumber: string
  poNumber: string
  date: string
  items: string
  quantity: number
  amount: number
  status: 'Ready for Dispatch' | 'Dispatch Marked' | 'In Transit' | 'Delivered - Verified' | 'Delivered - Mismatch' | 'Received by Store'
  dispatchDate?: string
  dispatchProof?: string
  storeVerification?: 'Pending' | 'OK' | 'Mismatch'
  verificationNotes?: string
  estimatedDelivery?: string
}

interface DispatchModalProps {
  isOpen: boolean
  order: DispatchOrder | null
  onClose: () => void
  onDispatch: (file?: File) => void
}

const DispatchModal: React.FC<DispatchModalProps> = ({ isOpen, order, onClose, onDispatch }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)

  if (!isOpen || !order) return null

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      setSelectedFile(file)
    } else {
      alert('Please select an image or PDF file')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && (file.type.startsWith('image/') || file.type === 'application/pdf')) {
      setSelectedFile(file)
    } else {
      alert('Please select an image or PDF file')
    }
  }

  const handleSubmit = () => {
    onDispatch(selectedFile || undefined)
    setSelectedFile(null)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 w-full max-w-lg mx-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--color-heading)]">Mark as Dispatched</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">Order: <span className="font-medium">{order.orderNumber}</span></p>
          <p className="text-sm text-gray-600 mb-2">PO: <span className="font-medium">{order.poNumber}</span></p>
          <p className="text-sm text-gray-600 mb-2">Items: <span className="font-medium">{order.items}</span></p>
          <p className="text-sm text-gray-600">Quantity: <span className="font-medium">{order.quantity}</span></p>
        </div>

        <div className="mb-4">
          <h4 className="text-sm font-medium text-[var(--color-heading)] mb-2">Upload Dispatch Proof (Optional)</h4>
          <p className="text-xs text-gray-500 mb-3">Upload handover note, porter receipt, or delivery photo</p>
          
          <div 
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragOver ? 'border-[var(--color-accent)] bg-blue-50' : 'border-gray-300'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-600 mb-2">Drag & drop your proof file here, or</p>
            <label className="inline-block px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg cursor-pointer hover:bg-[var(--color-accent)]/90">
              Browse Files
              <input
                type="file"
                accept="image/*,.pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
            </label>
            <p className="text-xs text-gray-500 mt-2">Supported: Images (JPG, PNG) or PDF</p>
          </div>

          {selectedFile && (
            <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">{selectedFile.name}</span>
                <span className="text-xs text-green-600">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
          <div className="flex items-start gap-2">
            <Package className="w-4 h-4 text-yellow-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-800">Dispatch Confirmation</p>
              <p className="text-xs text-yellow-700 mt-1">
                By marking as dispatched, you confirm that the order has been handed over for delivery.
                Store operator will verify receipt upon arrival.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-accent)]/90 transition-colors"
          >
            Mark as Dispatched
          </button>
        </div>
      </div>
    </div>
  )
}

const getStatusBadge = (status: DispatchOrder['status']) => {
  switch (status) {
    case 'Ready for Dispatch':
      return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Ready</span>
    case 'Dispatch Marked':
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Dispatched</span>
    case 'In Transit':
      return <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">In Transit</span>
    case 'Delivered - Verified':
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Verified ✓</span>
    case 'Delivered - Mismatch':
      return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Mismatch ⚠️</span>
    case 'Received by Store':
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Received</span>
    default:
      return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">{status}</span>
  }
}

const getVerificationBadge = (verification: DispatchOrder['storeVerification']) => {
  switch (verification) {
    case 'OK':
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">✓ Verified</span>
    case 'Mismatch':
      return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">⚠️ Mismatch</span>
    case 'Pending':
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">⏳ Pending</span>
    default:
      return null
  }
}

export default function Dispatch() {
  const [dispatchOrders, setDispatchOrders] = useState<DispatchOrder[]>([
    {
      id: '1',
      orderNumber: 'ORD-003',
      poNumber: 'PO-2025-001',
      date: '29/09/2025',
      items: 'Green Beans',
      quantity: 25,
      amount: 2000,
      status: 'Ready for Dispatch',
      estimatedDelivery: '30/09/2025'
    },
    {
      id: '2',
      orderNumber: 'ORD-001',
      poNumber: 'PO-2025-002',
      date: '28/09/2025',
      items: 'Organic Tomatoes',
      quantity: 50,
      amount: 6000,
      status: 'Dispatch Marked',
      dispatchDate: '29/09/2025',
      dispatchProof: 'handover_receipt_001.pdf',
      storeVerification: 'Pending',
      estimatedDelivery: '30/09/2025'
    },
    {
      id: '3',
      orderNumber: 'ORD-004',
      poNumber: 'PO-2025-003',
      date: '28/09/2025',
      items: 'Organic Carrots',
      quantity: 30,
      amount: 1800,
      status: 'In Transit',
      dispatchDate: '28/09/2025',
      dispatchProof: 'delivery_photo_002.jpg',
      storeVerification: 'Pending',
      estimatedDelivery: '29/09/2025'
    },
    {
      id: '4',
      orderNumber: 'ORD-005',
      poNumber: 'PO-2025-004',
      date: '27/09/2025',
      items: 'Bell Peppers',
      quantity: 15,
      amount: 2250,
      status: 'Delivered - Verified',
      dispatchDate: '27/09/2025',
      dispatchProof: 'porter_receipt_003.pdf',
      storeVerification: 'OK',
      verificationNotes: 'All items received in good condition'
    },
    {
      id: '5',
      orderNumber: 'ORD-006',
      poNumber: 'PO-2025-005',
      date: '26/09/2025',
      items: 'Fresh Spinach',
      quantity: 20,
      amount: 1800,
      status: 'Delivered - Mismatch',
      dispatchDate: '26/09/2025',
      dispatchProof: 'handover_note_004.pdf',
      storeVerification: 'Mismatch',
      verificationNotes: 'Received 18 units instead of 20. 2 units damaged during transit.'
    },
    {
      id: '6',
      orderNumber: 'ORD-007',
      poNumber: 'PO-2025-006',
      date: '25/09/2025',
      items: 'Cucumber',
      quantity: 40,
      amount: 1800,
      status: 'Received by Store',
      dispatchDate: '25/09/2025',
      dispatchProof: 'delivery_confirmation_005.jpg',
      storeVerification: 'OK'
    }
  ])

  const [dispatchModalOpen, setDispatchModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<DispatchOrder | null>(null)

  const handleMarkDispatch = (orderId: string) => {
    const order = dispatchOrders.find(o => o.id === orderId)
    if (order) {
      setSelectedOrder(order)
      setDispatchModalOpen(true)
    }
  }

  const handleDispatchConfirm = (file?: File) => {
    if (selectedOrder) {
      const today = new Date().toLocaleDateString('en-GB')
      setDispatchOrders(orders => 
        orders.map(order => 
          order.id === selectedOrder.id 
            ? { 
                ...order, 
                status: 'Dispatch Marked' as const,
                dispatchDate: today,
                dispatchProof: file ? file.name : undefined,
                storeVerification: 'Pending' as const
              }
            : order
        )
      )
      setDispatchModalOpen(false)
      setSelectedOrder(null)
    }
  }

  const readyForDispatch = dispatchOrders.filter(order => order.status === 'Ready for Dispatch')
  const dispatched = dispatchOrders.filter(order => order.status === 'Dispatch Marked')
  const inTransit = dispatchOrders.filter(order => order.status === 'In Transit')
  const delivered = dispatchOrders.filter(order => ['Delivered - Verified', 'Delivered - Mismatch', 'Received by Store'].includes(order.status))

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-[var(--color-happyplant-bg)] min-h-[calc(100vh-4rem)] font-sans w-full overflow-x-hidden">
      {/* Header */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--color-heading)] mb-1 sm:mb-2">Dispatch Management</h1>
        <p className="text-sm sm:text-base text-[var(--color-primary)]">Manage order dispatch and track delivery status</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white p-6 rounded-xl shadow-md border border-white/20">
          <div className="flex items-center gap-3 mb-2">
            <Package className="w-5 h-5 text-blue-500" />
            <span className="text-sm font-medium text-gray-600">Ready for Dispatch</span>
          </div>
          <div className="text-2xl font-bold text-[var(--color-primary)]">{readyForDispatch.length}</div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md border border-white/20">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-yellow-500" />
            <span className="text-sm font-medium text-gray-600">Dispatched</span>
          </div>
          <div className="text-2xl font-bold text-[var(--color-primary)]">{dispatched.length}</div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md border border-white/20">
          <div className="flex items-center gap-3 mb-2">
            <MapPin className="w-5 h-5 text-orange-500" />
            <span className="text-sm font-medium text-gray-600">In Transit</span>
          </div>
          <div className="text-2xl font-bold text-[var(--color-primary)]">{inTransit.length}</div>
        </div>
        
        <div className="bg-white p-6 rounded-xl shadow-md border border-white/20">
          <div className="flex items-center gap-3 mb-2">
            <CheckSquare className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-gray-600">Delivered</span>
          </div>
          <div className="text-2xl font-bold text-[var(--color-primary)]">{delivered.length}</div>
        </div>
      </div>

      {/* Status Flow Indicator */}
      <div className="bg-white rounded-xl shadow-md border border-white/20 p-4 sm:p-6 mb-6 sm:mb-8">
        <h3 className="text-base sm:text-lg font-semibold text-[var(--color-heading)] mb-3 sm:mb-4">Order Status Flow</h3>
        
        {/* Mobile & Tablet View (Vertical) */}
        <div className="md:hidden flex flex-col gap-2 items-center max-w-xs  mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs sm:text-sm font-medium flex-shrink-0">1</div>
            <span className="text-xs sm:text-sm font-medium">Confirmed</span>
          </div>
          <div className="w-px h-6 bg-gray-300 ml-4 sm:ml-5"></div>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs sm:text-sm font-medium flex-shrink-0">2</div>
            <span className="text-xs sm:text-sm font-medium">PO Generated</span>
          </div>
          <div className="w-px h-6 bg-gray-300 ml-4 sm:ml-5"></div>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs sm:text-sm font-medium flex-shrink-0">3</div>
            <span className="text-xs sm:text-sm font-medium">Invoice Uploaded</span>
          </div>
          <div className="w-px h-6 bg-gray-300 ml-4 sm:ml-5"></div>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-500 text-white flex items-center justify-center text-xs sm:text-sm font-medium flex-shrink-0">4</div>
            <span className="text-xs sm:text-sm font-medium">Dispatch Marked</span>
          </div>
          <div className="w-px h-6 bg-gray-300 ml-4 sm:ml-5"></div>
          
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-green-500 text-white flex items-center justify-center text-xs sm:text-sm font-medium flex-shrink-0">5</div>
            <span className="text-xs sm:text-sm font-medium">Store Verified</span>
          </div>
        </div>

        {/* Desktop View (Horizontal) */}
        <div className="hidden md:flex items-center justify-between gap-2 lg:gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium flex-shrink-0">1</div>
            <span className="text-xs lg:text-sm font-medium whitespace-nowrap">Confirmed</span>
          </div>
          <div className="flex-1 h-px bg-gray-300 min-w-[20px]"></div>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium flex-shrink-0">2</div>
            <span className="text-xs lg:text-sm font-medium whitespace-nowrap">PO Generated</span>
          </div>
          <div className="flex-1 h-px bg-gray-300 min-w-[20px]"></div>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium flex-shrink-0">3</div>
            <span className="text-xs lg:text-sm font-medium whitespace-nowrap">Invoice Uploaded</span>
          </div>
          <div className="flex-1 h-px bg-gray-300 min-w-[20px]"></div>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-medium flex-shrink-0">4</div>
            <span className="text-xs lg:text-sm font-medium whitespace-nowrap">Dispatch Marked</span>
          </div>
          <div className="flex-1 h-px bg-gray-300 min-w-[20px]"></div>
          
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-green-500 text-white flex items-center justify-center text-sm font-medium flex-shrink-0">5</div>
            <span className="text-xs lg:text-sm font-medium whitespace-nowrap">Store Verified</span>
          </div>
        </div>
      </div>

      {/* Dispatch Orders Table */}
      <div className="bg-white rounded-xl shadow-md border border-white/20 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-[var(--color-heading)]">Dispatch Orders</h2>
        </div>
        
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO Number</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Store Verification</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {dispatchOrders.map((order) => (
                <tr key={order.id} className="hover:bg-gray-50">
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-[var(--color-heading)]">{order.orderNumber}</div>
                      <div className="text-xs text-gray-500">{order.date}</div>
                    </div>
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {order.poNumber}
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {order.items}
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {order.quantity}
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    ₹{order.amount.toLocaleString()}
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(order.status)}
                    {order.dispatchDate && (
                      <div className="text-xs text-gray-500 mt-1">
                        Dispatched: {order.dispatchDate}
                      </div>
                    )}
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                    {getVerificationBadge(order.storeVerification)}
                    {order.verificationNotes && (
                      <div className="text-xs text-gray-500 mt-1 max-w-40">
                        {order.verificationNotes}
                      </div>
                    )}
                  </td>
                  <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm">
                    {order.status === 'Ready for Dispatch' && (
                      <button
                        onClick={() => handleMarkDispatch(order.id)}
                        className="px-3 py-1 bg-[var(--color-accent)] text-white rounded-md hover:bg-[var(--color-accent)]/90 transition-colors text-xs font-medium flex items-center gap-1"
                      >
                        <Package size={12} />
                        Mark Dispatched
                      </button>
                    )}
                    {order.dispatchProof && (
                      <div className="flex items-center gap-2 mt-1">
                        <FileText className="w-4 h-4 text-gray-500" />
                        <span className="text-xs text-gray-600">{order.dispatchProof}</span>
                      </div>
                    )}
                    {order.estimatedDelivery && order.status !== 'Received by Store' && (
                      <div className="text-xs text-gray-500 mt-1">
                        ETA: {order.estimatedDelivery}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden divide-y divide-gray-200">
          {dispatchOrders.map((order) => (
            <div key={order.id} className="p-4 sm:p-6">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="font-medium text-[var(--color-heading)]">{order.orderNumber}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">{order.date}</p>
                  <p className="text-[10px] sm:text-xs text-gray-500">PO: {order.poNumber}</p>
                </div>
                {getStatusBadge(order.status)}
              </div>
              
              <div className="mb-4">
                <p className="text-xs sm:text-sm text-gray-600 mb-1">
                  <span className="font-medium">Item:</span> {order.items}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">
                  <span className="font-medium">Quantity:</span> {order.quantity}
                </p>
                <p className="text-xs sm:text-sm font-medium text-gray-900">
                  <span className="font-medium">Amount:</span> ₹{order.amount.toLocaleString()}
                </p>
                {order.dispatchDate && (
                  <p className="text-[10px] sm:text-xs text-gray-500 mt-1">
                    Dispatched: {order.dispatchDate}
                  </p>
                )}
                {order.estimatedDelivery && order.status !== 'Received by Store' && (
                  <p className="text-[10px] sm:text-xs text-gray-500">
                    ETA: {order.estimatedDelivery}
                  </p>
                )}
              </div>

              {order.storeVerification && (
                <div className="mb-3">
                  {getVerificationBadge(order.storeVerification)}
                  {order.verificationNotes && (
                    <p className="text-xs text-gray-500 mt-1">{order.verificationNotes}</p>
                  )}
                </div>
              )}

              {order.status === 'Ready for Dispatch' && (
                <button
                  onClick={() => handleMarkDispatch(order.id)}
                  className="w-full px-4 py-2 bg-[var(--color-accent)] text-white rounded-md hover:bg-[var(--color-accent)]/90 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Package size={16} />
                  Mark as Dispatched
                </button>
              )}
              
              {order.dispatchProof && (
                <div className="flex items-center gap-2 mt-2 p-2 bg-gray-50 rounded">
                  <FileText className="w-4 h-4 text-gray-500" />
                  <span className="text-xs sm:text-sm text-gray-600">{order.dispatchProof}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Dispatch Modal */}
      <DispatchModal
        isOpen={dispatchModalOpen}
        order={selectedOrder}
        onClose={() => {
          setDispatchModalOpen(false)
          setSelectedOrder(null)
        }}
        onDispatch={handleDispatchConfirm}
      />
    </div>
  )
}