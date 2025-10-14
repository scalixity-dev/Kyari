import React, { useState, useEffect } from 'react'
import { FileText, CheckSquare, X, Clock, Package, MapPin, AlertTriangle } from 'lucide-react'
import DispatchApiService, { type DispatchResponse } from '../../../services/dispatchApi'
import { InvoiceApiService } from '../../../services/invoiceApi'
import toast from 'react-hot-toast'
import { format, parseISO } from 'date-fns'

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
  dispatchProofUrl?: string
  storeVerification?: 'Pending' | 'OK' | 'Mismatch'
  verificationNotes?: string
  estimatedDelivery?: string
  awbNumber?: string
  logisticsPartner?: string
  assignmentItems?: Array<{ assignmentId: string; quantity: number }> // For creating dispatch
}

interface DispatchModalProps {
  isOpen: boolean
  order: DispatchOrder | null
  onClose: () => void
  onDispatch: (data: { file?: File; awbNumber?: string; logisticsPartner?: string }) => void
}

const DispatchModal: React.FC<DispatchModalProps> = ({ isOpen, order, onClose, onDispatch }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [awbNumber, setAwbNumber] = useState('')
  const [logisticsPartner, setLogisticsPartner] = useState('')

  if (!isOpen || !order) return null
  
  const isReadyForDispatch = order.status === 'Ready for Dispatch'

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
    onDispatch({ 
      file: selectedFile || undefined,
      awbNumber: awbNumber.trim() || undefined,
      logisticsPartner: logisticsPartner.trim() || undefined
    })
    setSelectedFile(null)
    setAwbNumber('')
    setLogisticsPartner('')
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl p-4 sm:p-6 w-full max-w-lg mx-0 sm:mx-4 max-h-[90vh] sm:max-h-[85vh] overflow-y-auto animate-slide-up sm:animate-none">
        <div className="flex items-center justify-between mb-3 sm:mb-4 sticky top-0 bg-white pb-3 sm:pb-0 sm:static">
          <h3 className="text-base sm:text-lg font-semibold text-[var(--color-heading)]">Mark as Dispatched</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-4 p-3 sm:p-4 bg-gray-50 rounded-lg space-y-1.5">
          <p className="text-xs sm:text-sm text-gray-600">Order: <span className="font-medium text-gray-900">{order.orderNumber}</span></p>
          <p className="text-xs sm:text-sm text-gray-600">PO: <span className="font-medium text-gray-900">{order.poNumber}</span></p>
          <p className="text-xs sm:text-sm text-gray-600">Items: <span className="font-medium text-gray-900">{order.items}</span></p>
          <p className="text-xs sm:text-sm text-gray-600">Quantity: <span className="font-medium text-gray-900">{order.quantity}</span></p>
        </div>

        {/* Show AWB and Logistics fields only for Ready for Dispatch */}
        {isReadyForDispatch && (
          <div className="mb-4 space-y-3">
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                AWB/Tracking Number (Optional)
              </label>
              <input
                type="text"
                value={awbNumber}
                onChange={(e) => setAwbNumber(e.target.value)}
                placeholder="Leave empty for local porter"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                Logistics Partner (Optional)
              </label>
              <input
                type="text"
                value={logisticsPartner}
                onChange={(e) => setLogisticsPartner(e.target.value)}
                placeholder="e.g., Local Porter, Delhivery, Blue Dart"
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
              />
            </div>
          </div>
        )}

        <div className="mb-4">
          <h4 className="text-sm font-medium text-[var(--color-heading)] mb-2">
            Upload Dispatch Proof {isReadyForDispatch ? '(Optional)' : ''}
          </h4>
          <p className="text-xs text-gray-500 mb-3">Upload handover note, porter receipt, or delivery photo</p>
          
          <div 
            className={`border-2 border-dashed rounded-lg p-4 sm:p-6 text-center transition-colors ${
              dragOver ? 'border-[var(--color-accent)] bg-blue-50' : 'border-gray-300'
            }`}
            onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
          >
            <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-xs sm:text-sm text-gray-600 mb-2">Drag & drop your proof file here, or</p>
            <label className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-[var(--color-accent)] text-white text-sm rounded-lg cursor-pointer hover:bg-[var(--color-accent)]/90">
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
            <div className="mt-3 p-2.5 sm:p-3 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-green-600 flex-shrink-0" />
                <span className="text-xs sm:text-sm font-medium text-green-800 truncate flex-1">{selectedFile.name}</span>
                <span className="text-xs text-green-600 flex-shrink-0">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
              </div>
            </div>
          )}
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-2.5 sm:p-3 mb-4">
          <div className="flex items-start gap-2">
            <Package className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs sm:text-sm font-medium text-yellow-800">Dispatch Confirmation</p>
              <p className="text-xs text-yellow-700 mt-1 leading-relaxed">
                By marking as dispatched, you confirm that the order has been handed over to porter/delivery partner.
                Store operator will verify receipt upon arrival.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sticky bottom-0 bg-white pt-2 sm:pt-0 sm:static">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 sm:py-2.5 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors order-2 sm:order-1"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 sm:py-2.5 bg-[var(--color-accent)] text-white text-sm font-medium rounded-lg hover:bg-[var(--color-accent)]/90 transition-colors order-1 sm:order-2"
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
      return (
        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium inline-flex items-center gap-1">
          <CheckSquare className="w-3 h-3 text-green-800" />
          <span>Verified</span>
        </span>
      )
    case 'Delivered - Mismatch':
      return (
        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium inline-flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 text-red-800" />
          <span>Mismatch</span>
        </span>
      )
    case 'Received by Store':
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Received</span>
    default:
      return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">{status}</span>
  }
}

const getVerificationBadge = (verification: DispatchOrder['storeVerification']) => {
  switch (verification) {
    case 'OK':
      return (
        <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium inline-flex items-center gap-1">
          <CheckSquare className="w-3 h-3 text-green-800" />
          <span>Verified</span>
        </span>
      )
    case 'Mismatch':
      return (
        <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium inline-flex items-center gap-1">
          <AlertTriangle className="w-3 h-3 text-red-800" />
          <span>Mismatch</span>
        </span>
      )
    case 'Pending':
      return (
        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium inline-flex items-center gap-1">
          <Clock className="w-3 h-3 text-yellow-800" />
          <span>Pending</span>
        </span>
      )
    default:
      return null
  }
}

export default function Dispatch() {
  const [dispatchOrders, setDispatchOrders] = useState<DispatchOrder[]>([])
  const [loading, setLoading] = useState(true)

  const [dispatchModalOpen, setDispatchModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<DispatchOrder | null>(null)

  // Fetch dispatches on mount
  useEffect(() => {
    fetchDispatchesAndInvoices()
  }, [])

  const fetchDispatchesAndInvoices = async () => {
    try {
      setLoading(true)
      
      // Fetch both dispatches and invoices in parallel
      const [dispatchResponse, invoiceResponse] = await Promise.all([
        DispatchApiService.getMyDispatches({ limit: 100 }),
        InvoiceApiService.getVendorInvoicesDetailed({ limit: 100 })
      ])

      // Transform existing dispatches
      const existingDispatches = transformDispatchesToUI(dispatchResponse.data.dispatches)
      
      // Create "Ready for Dispatch" orders from invoices created by accounts team
      // These are orders where accounts has created invoice/PO, ready for vendor to dispatch
      const readyToDispatch = invoiceResponse.data.invoices
        .filter(invoice => {
          // Check if any assignment item is NOT yet dispatched
          const hasUndispatchedItems = invoice.purchaseOrder.items.some((item: any) => {
            const assignmentStatus = item.assignedOrderItem.status
            // Include if status is INVOICED or VENDOR_CONFIRMED (not DISPATCHED yet)
            return assignmentStatus === 'INVOICED' || 
                   assignmentStatus === 'VENDOR_CONFIRMED_FULL' || 
                   assignmentStatus === 'VENDOR_CONFIRMED_PARTIAL'
          })
          
          return hasUndispatchedItems
        })
        .map(invoice => transformInvoiceToDispatchOrder(invoice))

      // Combine both lists
      const allOrders = [...readyToDispatch, ...existingDispatches]
      setDispatchOrders(allOrders)
    } catch (error) {
      console.error('Failed to fetch dispatch data:', error)
      toast.error('Failed to load dispatch information')
    } finally {
      setLoading(false)
    }
  }

  // Transform invoice to dispatch order (for Ready for Dispatch status)
  const transformInvoiceToDispatchOrder = (invoice: any): DispatchOrder => {
    const po = invoice.purchaseOrder
    const items = po.items.map((item: any) => item.assignedOrderItem.orderItem.productName).join(', ')
    const quantity = po.items.reduce((sum: number, item: any) => sum + item.quantity, 0)
    const orderNumbers = Array.from(new Set(
      po.items.map((item: any) => item.assignedOrderItem.orderItem.order?.clientOrderId || item.assignedOrderItem.orderItem.order?.orderNumber)
    )).filter(Boolean).join(', ')
    
    // Extract assignment IDs and quantities for dispatch creation
    const assignmentItems = po.items.map((item: any) => ({
      assignmentId: item.assignedOrderItem.id,
      quantity: item.quantity
    }))
    
    return {
      id: invoice.id,
      orderNumber: orderNumbers || 'N/A',
      poNumber: po.poNumber,
      date: format(parseISO(po.createdAt), 'dd/MM/yyyy'),
      items: items || 'N/A',
      quantity: quantity,
      amount: Number(po.totalAmount),
      status: 'Ready for Dispatch',
      estimatedDelivery: undefined,
      assignmentItems: assignmentItems
    }
  }

  // Transform backend dispatch data to UI format
  const transformDispatchesToUI = (dispatches: DispatchResponse[]): DispatchOrder[] => {
    return dispatches.map(dispatch => {
      // Get items summary
      const itemsText = dispatch.items.map(item => item.productName).join(', ')
      const totalQuantity = dispatch.items.reduce((sum, item) => sum + item.dispatchedQuantity, 0)
      
      // Get unique order numbers
      const orderNumbers = Array.from(new Set(dispatch.items.map(item => item.orderNumber)))
      const orderNumber = orderNumbers.join(', ')
      
      // Map backend status to UI status
      let uiStatus: DispatchOrder['status'] = 'Dispatch Marked'
      switch (dispatch.status) {
        case 'DISPATCHED':
          uiStatus = 'Dispatch Marked'
          break
        case 'IN_TRANSIT':
          uiStatus = 'In Transit'
          break
        case 'DELIVERED':
          uiStatus = 'Received by Store'
          break
        default:
          uiStatus = 'Dispatch Marked'
      }

      // Get attachment info
      const firstAttachment = dispatch.attachments && dispatch.attachments.length > 0 
        ? dispatch.attachments[0] 
        : null

      // Format dates
      const dispatchDate = format(parseISO(dispatch.dispatchDate), 'dd/MM/yyyy')
      const estimatedDelivery = dispatch.estimatedDeliveryDate 
        ? format(parseISO(dispatch.estimatedDeliveryDate), 'dd/MM/yyyy')
        : undefined

      return {
        id: dispatch.id,
        orderNumber: orderNumber,
        poNumber: dispatch.awbNumber, // Using AWB as reference since PO might not be directly available
        date: dispatchDate,
        items: itemsText || 'N/A',
        quantity: totalQuantity,
        amount: 0, // Amount not available in dispatch data
        status: uiStatus,
        dispatchDate: dispatchDate,
        dispatchProof: firstAttachment?.fileName,
        dispatchProofUrl: firstAttachment?.s3Url,
        estimatedDelivery: estimatedDelivery,
        awbNumber: dispatch.awbNumber,
        logisticsPartner: dispatch.logisticsPartner,
        storeVerification: 'Pending' // Default, would need GRN data for actual verification
      }
    })
  }

  const handleMarkDispatch = (orderId: string) => {
    const order = dispatchOrders.find(o => o.id === orderId)
    if (order) {
      setSelectedOrder(order)
      setDispatchModalOpen(true)
    }
  }

  const handleDispatchConfirm = async (data: { file?: File; awbNumber?: string; logisticsPartner?: string }) => {
    if (!selectedOrder) return

    try {
      // For Ready for Dispatch orders, create the dispatch first
      if (selectedOrder.status === 'Ready for Dispatch') {
        if (!selectedOrder.assignmentItems || selectedOrder.assignmentItems.length === 0) {
          toast.error('No assignment items found for this order')
          return
        }

        // Create dispatch
        const dispatchItems = selectedOrder.assignmentItems.map(item => ({
          assignmentId: item.assignmentId,
          dispatchedQuantity: item.quantity
        }))

        const newDispatch = await DispatchApiService.createDispatch({
          items: dispatchItems,
          awbNumber: data.awbNumber || 'LOCAL-PORTER',
          logisticsPartner: data.logisticsPartner || 'Local Porter',
          dispatchDate: new Date().toISOString(),
          estimatedDeliveryDate: undefined,
          remarks: undefined
        })

        // If file provided, upload proof
        if (data.file) {
          await DispatchApiService.uploadDispatchProof(newDispatch.id, data.file)
        }
      } else {
        // For existing dispatches, just upload proof
        if (data.file) {
          await DispatchApiService.uploadDispatchProof(selectedOrder.id, data.file)
        }
      }

      // Refresh data
      await fetchDispatchesAndInvoices()
      
      setDispatchModalOpen(false)
      setSelectedOrder(null)
    } catch (error) {
      console.error('Failed to process dispatch:', error)
    }
  }

  const readyForDispatch = dispatchOrders.filter(order => order.status === 'Ready for Dispatch')
  const dispatched = dispatchOrders.filter(order => order.status === 'Dispatch Marked')
  const inTransit = dispatchOrders.filter(order => order.status === 'In Transit')
  const delivered = dispatchOrders.filter(order => ['Delivered - Verified', 'Delivered - Mismatch', 'Received by Store'].includes(order.status))

  return (
    <div className="py-4 px-4 sm:px-6 md:px-8 lg:px-9 sm:py-6 lg:py-8 min-h-[calc(100vh-4rem)] font-sans w-full overflow-x-hidden bg-[var(--color-sharktank-bg)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-[var(--color-heading)] mb-0 sm:mb-0">Dispatch Management</h1>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-accent)]"></div>
        </div>
      )}

      {/* Empty State */}
      {!loading && dispatchOrders.length === 0 && (
        <div className="bg-white rounded-xl shadow-md border border-white/20 p-12 text-center">
          <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Dispatches Found</h3>
          <p className="text-gray-500">You haven't dispatched any orders yet.</p>
        </div>
      )}

      {!loading && dispatchOrders.length > 0 && (
        <>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-4 mb-6">
        <div className={`bg-[var(--color-happyplant-bg)] p-4 sm:p-6 pt-8 sm:pt-10 rounded-xl shadow-sm flex flex-col items-center text-center relative`}>
          <div className="absolute -top-5 sm:-top-6 left-1/2 -translate-x-1/2 w-12 h-12 sm:w-16 sm:h-16 bg-[var(--color-accent)] rounded-full p-2 sm:p-3 flex items-center justify-center text-white shadow-md">
            <Package size={24} color="white" className="sm:w-8 sm:h-8" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1 px-2">Ready for Dispatch</h3>
          <div className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{readyForDispatch.length}</div>
          <div className="text-xs sm:text-sm text-gray-600 mt-1">Pending</div>
        </div>

        <div className={`bg-[var(--color-happyplant-bg)] p-4 sm:p-6 pt-8 sm:pt-10 rounded-xl shadow-sm flex flex-col items-center text-center relative`}>
          <div className="absolute -top-5 sm:-top-6 left-1/2 -translate-x-1/2 w-12 h-12 sm:w-16 sm:h-16 bg-[var(--color-accent)] rounded-full p-2 sm:p-3 flex items-center justify-center text-white shadow-md">
            <Clock size={24} color="white" className="sm:w-8 sm:h-8" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1 px-2">Dispatched</h3>
          <div className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{dispatched.length}</div>
          <div className="text-xs sm:text-sm text-gray-600 mt-1">Marked</div>
        </div>

        <div className={`bg-[var(--color-happyplant-bg)] p-4 sm:p-6 pt-8 sm:pt-10 rounded-xl shadow-sm flex flex-col items-center text-center relative`}>
          <div className="absolute -top-5 sm:-top-6 left-1/2 -translate-x-1/2 w-12 h-12 sm:w-16 sm:h-16 bg-[var(--color-accent)] rounded-full p-2 sm:p-3 flex items-center justify-center text-white shadow-md">
            <MapPin size={24} color="white" className="sm:w-8 sm:h-8" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1 px-2">In Transit</h3>
          <div className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{inTransit.length}</div>
          <div className="text-xs sm:text-sm text-gray-600 mt-1">En route</div>
        </div>

        <div className={`bg-[var(--color-happyplant-bg)] p-4 sm:p-6 pt-8 sm:pt-10 rounded-xl shadow-sm flex flex-col items-center text-center relative`}>
          <div className="absolute -top-5 sm:-top-6 left-1/2 -translate-x-1/2 w-12 h-12 sm:w-16 sm:h-16 bg-[var(--color-accent)] rounded-full p-2 sm:p-3 flex items-center justify-center text-white shadow-md">
            <CheckSquare size={24} color="white" className="sm:w-8 sm:h-8" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1 px-2">Delivered</h3>
          <div className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{delivered.length}</div>
          <div className="text-xs sm:text-sm text-gray-600 mt-1">Completed</div>
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

      {/* Dispatch Orders Heading */}
      <div className="mb-3 sm:mb-4">
        <h2 className="text-base sm:text-lg md:text-xl font-semibold text-[var(--color-heading)]">Dispatch Orders</h2>
      </div>

      {/* Dispatch Orders Table */}
      <div className="bg-white rounded-xl shadow-md border border-white/20 overflow-hidden">
        
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--color-accent)]">
              <tr>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Order</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">PO Number</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Items</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Qty</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Amount</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Status</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Store Verification</th>
                <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Actions</th>
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
                  <td className="px-4 lg:px-6 py-4 max-w-[14rem] break-words align-top">
                    {getVerificationBadge(order.storeVerification)}
                    {order.verificationNotes && (
                      <div className="text-xs text-gray-500 mt-1 max-w-[14rem] break-words">
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
            <div key={order.id} className="p-3 sm:p-4 md:p-5">
              <div className="flex justify-between items-start mb-3 gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm sm:text-base text-[var(--color-heading)] truncate">{order.orderNumber}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">{order.date}</p>
                  <p className="text-xs text-gray-500 truncate">PO: {order.poNumber}</p>
                </div>
                <div className="flex-shrink-0">
                  {getStatusBadge(order.status)}
                </div>
              </div>
              
              <div className="mb-3 space-y-1.5">
                <p className="text-xs sm:text-sm text-gray-600">
                  <span className="font-medium text-gray-800">Item:</span> {order.items}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">
                  <span className="font-medium text-gray-800">Quantity:</span> {order.quantity}
                </p>
                <p className="text-xs sm:text-sm text-gray-900">
                  <span className="font-medium text-gray-800">Amount:</span> <span className="font-semibold">₹{order.amount.toLocaleString()}</span>
                </p>
                {order.dispatchDate && (
                  <p className="text-xs text-gray-500">
                    <span className="font-medium">Dispatched:</span> {order.dispatchDate}
                  </p>
                )}
                {order.estimatedDelivery && order.status !== 'Received by Store' && (
                  <p className="text-xs text-gray-500">
                    <span className="font-medium">ETA:</span> {order.estimatedDelivery}
                  </p>
                )}
              </div>

              {order.storeVerification && (
                <div className="mb-3">
                  {getVerificationBadge(order.storeVerification)}
                  {order.verificationNotes && (
                    <p className="text-xs text-gray-600 mt-2 p-2 bg-gray-50 rounded border border-gray-100 break-words leading-relaxed">{order.verificationNotes}</p>
                  )}
                </div>
              )}

              {order.status === 'Ready for Dispatch' && (
                <button
                  onClick={() => handleMarkDispatch(order.id)}
                  className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-accent)]/90 transition-colors text-sm font-medium flex items-center justify-center gap-2"
                >
                  <Package size={16} />
                  <span>Mark as Dispatched</span>
                </button>
              )}
              
              {order.dispatchProof && (
                <div className="flex items-center gap-2 mt-2 p-2 bg-blue-50 border border-blue-100 rounded text-left">
                  <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-blue-800 truncate">{order.dispatchProof}</span>
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
      </>
      )}
    </div>
  )
}