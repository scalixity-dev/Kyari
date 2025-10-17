import React, { useState, useEffect, useRef, useCallback } from 'react'
import { FileText, CheckSquare, X, Clock, Package, MapPin, AlertTriangle, Calendar as CalendarIcon } from 'lucide-react'
import DispatchApiService, { type DispatchResponse } from '../../../services/dispatchApi'
import { InvoiceApiService, type VendorInvoiceDetailed, type VendorPurchaseOrderItem } from '../../../services/invoiceApi'
import toast from 'react-hot-toast'
import { format, parseISO } from 'date-fns'
import { CustomDropdown, KPICard } from '../../../components'
import { Pagination } from '../../../components/ui/Pagination'
import { Calendar } from '../../../components/ui/calendar'

interface DispatchOrder {
  id: string
  orderNumber: string
  poNumber: string
  date: string
  items: string
  quantity: number
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

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<DispatchOrder['status'] | ''>('')
  const [verificationFilter, setVerificationFilter] = useState<NonNullable<DispatchOrder['storeVerification']> | ''>('')
  const [dateFrom, setDateFrom] = useState('') // yyyy-mm-dd
  const [dateTo, setDateTo] = useState('')
  const [dateFromDate, setDateFromDate] = useState<Date | undefined>()
  const [dateToDate, setDateToDate] = useState<Date | undefined>()
  const [showFromCalendar, setShowFromCalendar] = useState(false)
  const [showToCalendar, setShowToCalendar] = useState(false)
  const fromCalendarRef = useRef<HTMLDivElement>(null)
  const toCalendarRef = useRef<HTMLDivElement>(null)

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1)
  const itemsPerPage = 10

  // Fetch dispatches on mount
  const fetchDispatchesAndInvoices = useCallback(async () => {
    try {
      setLoading(true)
      const [dispatchResponse, invoiceResponse] = await Promise.all([
        DispatchApiService.getMyDispatches({ limit: 100 }),
        InvoiceApiService.getVendorInvoicesDetailed({ limit: 100 })
      ])

      const existingDispatches = transformDispatchesToUI(dispatchResponse.data.dispatches)
      const readyToDispatch = invoiceResponse.data.invoices
        .filter((invoice) => {
          return invoice.purchaseOrder.items.some((item) => {
            const assignmentStatus = item.assignedOrderItem.status
            return assignmentStatus === 'INVOICED' ||
                   assignmentStatus === 'VENDOR_CONFIRMED_FULL' ||
                   assignmentStatus === 'VENDOR_CONFIRMED_PARTIAL'
          })
        })
        .map((invoice) => transformInvoiceToDispatchOrder(invoice))

      const allOrders = [...readyToDispatch, ...existingDispatches]
      setDispatchOrders(allOrders)
    } catch (error) {
      console.error('Failed to fetch dispatch data:', error)
      toast.error('Failed to load dispatch information')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDispatchesAndInvoices()
  }, [fetchDispatchesAndInvoices])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, verificationFilter, searchQuery, dateFrom, dateTo])

  

  // Transform invoice to dispatch order (for Ready for Dispatch status)
  const transformInvoiceToDispatchOrder = (invoice: VendorInvoiceDetailed): DispatchOrder => {
    const po = invoice.purchaseOrder
    const items = po.items.map((item: VendorPurchaseOrderItem) => item.assignedOrderItem.orderItem.productName).join(', ')
    const quantity = po.items.reduce((sum: number, item: VendorPurchaseOrderItem) => sum + item.quantity, 0)
    const orderNumbers = Array.from(new Set(
      po.items.map((item: VendorPurchaseOrderItem) => item.assignedOrderItem.orderItem.order?.clientOrderId || item.assignedOrderItem.orderItem.order?.orderNumber)
    )).filter(Boolean).join(', ')
    
    // Extract assignment IDs and quantities for dispatch creation
    const assignmentItems = po.items.map((item: VendorPurchaseOrderItem) => ({
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
      
      // Check GRN verification status
      const grn = dispatch.goodsReceiptNote
      let storeVerification: DispatchOrder['storeVerification'] = 'Pending'
      let verificationNotes: string | undefined = undefined
      let uiStatus: DispatchOrder['status'] = 'Dispatch Marked'
      
      if (grn) {
        // Map GRN status to store verification
        if (grn.status === 'VERIFIED_OK') {
          storeVerification = 'OK'
          uiStatus = 'Delivered - Verified'
        } else if (grn.status === 'VERIFIED_MISMATCH' || grn.status === 'PARTIALLY_VERIFIED') {
          storeVerification = 'Mismatch'
          uiStatus = 'Delivered - Mismatch'
          
          // Get mismatch details from GRN items
          const mismatchItems = grn.items.filter(item => 
            item.status !== 'VERIFIED_OK'
          )
          
          if (mismatchItems.length > 0) {
            const details = mismatchItems.map(item => {
              if (item.damageReported) {
                return 'Damage reported'
              } else if (item.discrepancyQuantity < 0) {
                return `Shortage: ${Math.abs(item.discrepancyQuantity)} units`
              } else if (item.discrepancyQuantity > 0) {
                return `Excess: ${item.discrepancyQuantity} units`
              }
              return 'Mismatch detected'
            })
            verificationNotes = details.join(', ')
          }
          
          if (grn.ticket) {
            verificationNotes = `Ticket ${grn.ticket.ticketNumber}: ${verificationNotes || 'Quantity mismatch'}`
          }
        } else if (grn.status === 'PENDING_VERIFICATION') {
          storeVerification = 'Pending'
          uiStatus = 'Received by Store'
        }
        
        if (grn.operatorRemarks && !verificationNotes) {
          verificationNotes = grn.operatorRemarks
        }
      } else {
        // No GRN yet - map dispatch status to UI status
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
        poNumber: dispatch.poNumber || 'N/A',
        date: dispatchDate,
        items: itemsText || 'N/A',
        quantity: totalQuantity,
        status: uiStatus,
        dispatchDate: dispatchDate,
        dispatchProof: firstAttachment?.fileName,
        dispatchProofUrl: firstAttachment?.s3Url,
        estimatedDelivery: estimatedDelivery,
        awbNumber: dispatch.awbNumber,
        logisticsPartner: dispatch.logisticsPartner,
        storeVerification: storeVerification,
        verificationNotes: verificationNotes
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

  // Apply filters and search
  const parseOrderDate = (d: string) => {
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

  const filteredOrders = dispatchOrders.filter(order => {
    const matchesSearch = searchQuery.trim().length === 0 ||
      order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.poNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.items.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = !statusFilter || order.status === statusFilter
    const matchesVerification = !verificationFilter || order.storeVerification === verificationFilter

    // Date range filter (order.date is DD/MM/YYYY)
    const oDate = parseOrderDate(order.date)
    if (dateFrom) {
      const from = new Date(dateFrom + 'T00:00:00')
      if (!oDate || oDate < from) return false
    }
    if (dateTo) {
      const to = new Date(dateTo + 'T23:59:59')
      if (!oDate || oDate > to) return false
    }

    return matchesSearch && matchesStatus && matchesVerification
  })

  // Pagination calculations
  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage))
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(filteredOrders.length, startIndex + itemsPerPage)
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex)

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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-4 mb-6 py-6">
        <KPICard
          title="Ready for Dispatch"
          value={readyForDispatch.length}
          subtitle="Pending"
          icon={<Package size={32} />}
        />
        <KPICard
          title="Dispatched"
          value={dispatched.length}
          subtitle="Marked"
          icon={<Clock size={32} />}
        />
        <KPICard
          title="In Transit"
          value={inTransit.length}
          subtitle="En route"
          icon={<MapPin size={32} />}
        />
        <KPICard
          title="Delivered"
          value={delivered.length}
          subtitle="Completed"
          icon={<CheckSquare size={32} />}
        />
      </div>

      

      {/* Dispatch Orders Heading */}
      <div className="mb-3 sm:mb-4">
        <div className="flex flex-col gap-3">
          <h2 className="text-base sm:text-lg md:text-xl font-semibold text-[var(--color-heading)]">Dispatch Orders</h2>

          {/* Filters */}
          <div className="bg-white rounded-xl shadow-md border border-white/20 p-3 sm:p-4">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 sm:gap-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Search</label>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => { setCurrentPage(1); setSearchQuery(e.target.value) }}
                  placeholder="Search order, PO, or item"
                  className="w-full px-3 py-2.5 sm:py-3 text-sm border border-gray-300 rounded-md hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200 min-h-[44px] sm:min-h-auto"
                />

                <div className="hidden sm:flex sm:flex-row sm:items-center gap-2 mt-2">
                  <button
                    onClick={() => setCurrentPage(1)}
                    className="w-full sm:w-[140px] px-4 py-2.5 sm:py-2 rounded-md text-white font-medium text-sm min-h-[44px] sm:min-h-auto"
                    style={{ backgroundColor: '#C3754C', color: '#F5F3E7' }}
                  >
                    Apply
                  </button>
                  <button
                    onClick={() => {
                      setSearchQuery('')
                      setStatusFilter('')
                      setVerificationFilter('')
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

              {/* Status filter */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Status</label>
                <CustomDropdown
                  value={statusFilter}
                  onChange={(value) => { setCurrentPage(1); setStatusFilter((value as DispatchOrder['status']) || '') }}
                  options={[
                    { value: '', label: 'All Statuses' },
                    { value: 'Ready for Dispatch', label: 'Ready for Dispatch' },
                    { value: 'Dispatch Marked', label: 'Dispatch Marked' },
                    { value: 'In Transit', label: 'In Transit' },
                    { value: 'Delivered - Verified', label: 'Delivered - Verified' },
                    { value: 'Delivered - Mismatch', label: 'Delivered - Mismatch' },
                    { value: 'Received by Store', label: 'Received by Store' },
                  ]}
                  placeholder="All Statuses"
                />
              </div>

              {/* Verification filter */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Store Verification</label>
                <CustomDropdown
                  value={verificationFilter}
                  onChange={(value) => { setCurrentPage(1); setVerificationFilter((value as DispatchOrder['storeVerification']) || '') }}
                  options={[
                    { value: '', label: 'All Verifications' },
                    { value: 'Pending', label: 'Pending' },
                    { value: 'OK', label: 'OK' },
                    { value: 'Mismatch', label: 'Mismatch' },
                  ]}
                  placeholder="All Verifications"
                />
              </div>

              {/* Date Range */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Date Range</label>
                <div className="flex flex-col gap-2">
                  <div className="relative" ref={fromCalendarRef}>
                    <button
                      type="button"
                      onClick={() => { setShowFromCalendar(!showFromCalendar); setShowToCalendar(false) }}
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
                      onClick={() => { setShowToCalendar(!showToCalendar); setShowFromCalendar(false) }}
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
            <div className="flex sm:hidden gap-2 pt-4 mt-2">
              <button
                onClick={() => setCurrentPage(1)}
                className="flex-1 px-4 py-2.5 rounded-md text-white font-medium text-sm min-h-[44px]"
                style={{ backgroundColor: '#C3754C', color: '#F5F3E7' }}
              >
                Apply Filters
              </button>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setStatusFilter('')
                  setVerificationFilter('')
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
        </div>
      </div>

      {/* Dispatch Orders Table */}
      <div className="bg-white rounded-xl shadow-md border border-white/20 overflow-hidden">
        
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-[var(--color-accent)]">
                <th className="text-left px-4 lg:px-6 py-4 font-heading font-normal text-[var(--color-button-text)]">Order</th>
                <th className="text-left px-4 lg:px-6 py-4 font-heading font-normal text-[var(--color-button-text)]">PO Number</th>
                <th className="text-left px-4 lg:px-6 py-4 font-heading font-normal text-[var(--color-button-text)]">Items</th>
                <th className="text-left px-4 lg:px-6 py-4 font-heading font-normal text-[var(--color-button-text)]">Qty</th>
                <th className="text-left px-4 lg:px-6 py-4 font-heading font-normal text-[var(--color-button-text)]">Status</th>
                <th className="text-left px-4 lg:px-6 py-4 font-heading font-normal text-[var(--color-button-text)]">Store Verification</th>
                <th className="text-left px-4 lg:px-6 py-4 font-heading font-normal text-[var(--color-button-text)]">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedOrders.map((order) => (
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
          {paginatedOrders.map((order) => (
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

        {/* Pagination Controls inside card for rounded look */}
        {filteredOrders.length > 0 && (
          <>
            {/* Desktop */}
            <div className="hidden lg:block">
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
            </div>
            {/* Mobile */}
            <div className="lg:hidden">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={filteredOrders.length}
                startIndex={startIndex}
                endIndex={endIndex}
                onPageChange={setCurrentPage}
                itemLabel="orders"
                variant="mobile"
              />
            </div>
          </>
        )}
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