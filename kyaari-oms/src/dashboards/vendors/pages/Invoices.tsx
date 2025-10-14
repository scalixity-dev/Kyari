import React, { useState, useEffect, useRef } from 'react'
import { FileText, CheckSquare, X, Clock, Calendar as CalendarIcon } from 'lucide-react'
import { CustomDropdown } from '../../../components'
import { Calendar } from '../../../components/ui/calendar'
import { format, parseISO } from 'date-fns'
import { InvoiceApiService, type VendorInvoiceDetailed } from '../../../services/invoiceApi'
import toast from 'react-hot-toast'

interface PurchaseOrder {
  id: string
  poNumber: string
  date: string
  linkedOrders: string[]
  items: string
  quantity: number
  rate: number
  amount: number
  status: 'Received' | 'Dispatched' | 'Validating' | 'Validated' | 'Approved' | 'Rejected' | 'Payment Received'
  invoiceFile?: string
  invoiceUrl?: string
  validationIssues?: string[]
  rejectionReason?: string
  invoiceId?: string
  dispatchStatus?: string
}

interface InvoiceUploadModalProps {
  isOpen: boolean
  po: PurchaseOrder | null
  onClose: () => void
  onUpload: (file: File) => void
}

const InvoiceUploadModal: React.FC<InvoiceUploadModalProps> = ({ isOpen, po, onClose, onUpload }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)

  if (!isOpen || !po) return null

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && (file.type === 'application/pdf' || file.type === 'application/json')) {
      setSelectedFile(file)
    } else {
      alert('Please select a PDF or JSON file')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file && (file.type === 'application/pdf' || file.type === 'application/json')) {
      setSelectedFile(file)
    } else {
      alert('Please select a PDF or JSON file')
    }
  }

  const handleSubmit = () => {
    if (selectedFile) {
      onUpload(selectedFile)
      setSelectedFile(null)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
      <div className="bg-white rounded-t-2xl sm:rounded-xl p-4 sm:p-6 w-full max-w-lg mx-0 sm:mx-4 max-h-[90vh] sm:max-h-[85vh] overflow-y-auto animate-slide-up sm:animate-none">
        <div className="flex items-center justify-between mb-3 sm:mb-4 sticky top-0 bg-white pb-3 sm:pb-0 sm:static z-10">
          <h3 className="text-base sm:text-lg md:text-xl font-semibold text-[var(--color-heading)]">Upload Invoice</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 flex-shrink-0">
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <p className="text-xs sm:text-sm text-gray-600">PO Number: <span className="font-medium text-gray-900">{po.poNumber}</span></p>
            <p className="text-xs sm:text-sm text-gray-600">Amount: <span className="font-medium text-gray-900">₹{po.amount.toLocaleString()}</span></p>
            <p className="text-xs sm:text-sm text-gray-600 sm:col-span-2">Items: <span className="font-medium text-gray-900">{po.items}</span></p>
            <p className="text-xs sm:text-sm text-gray-600 sm:col-span-2">Quantity: <span className="font-medium text-gray-900">{po.quantity}</span></p>
          </div>
        </div>

        <div 
          className={`border-2 border-dashed rounded-lg p-4 sm:p-6 text-center transition-colors ${
            dragOver ? 'border-[var(--color-accent)] bg-blue-50' : 'border-gray-300'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 mx-auto mb-2" />
          <p className="text-xs sm:text-sm text-gray-600 mb-2">Drag & drop your invoice file here, or</p>
          <label className="inline-block px-3 sm:px-4 py-1.5 sm:py-2 bg-[var(--color-accent)] text-white rounded-lg cursor-pointer hover:bg-[var(--color-accent)]/90 text-sm">
            Browse Files
            <input
              type="file"
              accept=".pdf,.json"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
          <p className="text-xs text-gray-500 mt-2">Supported formats: PDF, JSON</p>
        </div>

        {selectedFile && (
          <div className="mt-4 p-2.5 sm:p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-green-600 flex-shrink-0" />
              <span className="text-xs sm:text-sm font-medium text-green-800 truncate flex-1">{selectedFile.name}</span>
              <span className="text-xs text-green-600 flex-shrink-0">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mt-4 sm:mt-6 sticky bottom-0 bg-white pt-2 sm:pt-0 sm:static">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 sm:py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium order-2 sm:order-1"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedFile}
            className="flex-1 px-4 py-2 sm:py-2.5 bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-accent)]/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm font-medium order-1 sm:order-2"
          >
            Upload Invoice
          </button>
        </div>
      </div>
    </div>
  )
}

const getStatusBadge = (status: PurchaseOrder['status']) => {
  switch (status) {
    case 'Received':
      return <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">Received</span>
    case 'Dispatched':
      return <span className="px-2 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">Dispatched</span>
    case 'Validating':
      return <span className="px-2 py-1 bg-orange-100 text-orange-800 rounded-full text-xs font-medium">Validating</span>
    case 'Validated':
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Validated</span>
    case 'Approved':
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Approved</span>
    case 'Rejected':
      return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Rejected</span>
    case 'Payment Received':
      return <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">Payment Received</span>
    default:
      return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">{status}</span>
  }
}

const getValidationDisplay = (po: PurchaseOrder) => {
  if (po.status === 'Validating' || po.status === 'Validated') {
    return (
      <div className="mt-2 text-xs">
        <div className="flex items-center gap-1 text-green-600">
          <CheckSquare size={12} />
          <span>Qty: {po.quantity} ✓</span>
        </div>
        <div className="flex items-center gap-1 text-green-600">
          <CheckSquare size={12} />
          <span>Rate: ₹{po.rate} ✓</span>
        </div>
        <div className="flex items-center gap-1 text-green-600">
          <CheckSquare size={12} />
          <span>Amount: ₹{po.amount.toLocaleString()} ✓</span>
        </div>
      </div>
    )
  }
  
  if (po.status === 'Rejected' && po.validationIssues) {
    return (
      <div className="mt-2 text-xs">
        {po.validationIssues.map((issue, index) => (
          <div key={index} className="flex items-center gap-1 text-red-600">
            <X size={12} />
            <span>{issue}</span>
          </div>
        ))}
      </div>
    )
  }
  
  return null
}

export default function Invoices() {
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([])
  const [loading, setLoading] = useState(true)

  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null)
  const [statusFilter, setStatusFilter] = useState<'All' | PurchaseOrder['status']>('All')
  const [poSearch, setPoSearch] = useState('')
  const [linkedOrderSearch, setLinkedOrderSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('') // yyyy-mm-dd
  const [dateTo, setDateTo] = useState('')
  const [dateFromDate, setDateFromDate] = useState<Date | undefined>()
  const [dateToDate, setDateToDate] = useState<Date | undefined>()
  const [showFromCalendar, setShowFromCalendar] = useState(false)
  const [showToCalendar, setShowToCalendar] = useState(false)
  const fromCalendarRef = useRef<HTMLDivElement>(null)
  const toCalendarRef = useRef<HTMLDivElement>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10) // fixed to 10 rows per page

  // Invoice viewer state
  const [viewingInvoice, setViewingInvoice] = useState<{ url: string; type: string } | null>(null)
  const [imageLoadError, setImageLoadError] = useState(false)

  // Fetch invoices from API
  useEffect(() => {
    fetchInvoices()
  }, [])

  const fetchInvoices = async () => {
    try {
      setLoading(true)
      const response = await InvoiceApiService.getVendorInvoicesDetailed({
        limit: 100 // Get all invoices
      })

      // Transform backend data to UI format
      const transformed = transformInvoicesToPOs(response.data.invoices)
      setPurchaseOrders(transformed)
    } catch (error) {
      console.error('Failed to fetch invoices:', error)
      toast.error('Failed to load invoices')
    } finally {
      setLoading(false)
    }
  }

  // Transform backend invoice data to UI PurchaseOrder format
  const transformInvoicesToPOs = (invoices: VendorInvoiceDetailed[]): PurchaseOrder[] => {
    return invoices.map(invoice => {
      const po = invoice.purchaseOrder
      
      // Calculate totals from items
      const totalQuantity = po.items.reduce((sum, item) => sum + item.quantity, 0)
      const avgRate = po.items.length > 0 
        ? po.items.reduce((sum, item) => sum + Number(item.pricePerUnit), 0) / po.items.length 
        : 0

      // Get item names
      const itemNames = po.items.map(item => item.assignedOrderItem.orderItem.productName).join(', ')
      
      // Get linked orders (unique client order IDs from items)
      const linkedOrders = Array.from(new Set(
        po.items
          .map(item => item.assignedOrderItem.orderItem.order?.clientOrderId || item.assignedOrderItem.orderItem.order?.orderNumber)
          .filter(Boolean)
      )) as string[]

      // Map invoice status to UI status
      let uiStatus: PurchaseOrder['status'] = 'Received'
      if (invoice.status === 'PENDING_VERIFICATION') {
        uiStatus = invoice.vendorAttachment ? 'Validating' : 'Received'
      } else if (invoice.status === 'APPROVED') {
        uiStatus = 'Approved'
      } else if (invoice.status === 'REJECTED') {
        uiStatus = 'Rejected'
      } else if (invoice.status === 'PAID') {
        uiStatus = 'Payment Received'
      }

      // Dispatch status mirrors invoice status
      const dispatchStatus = uiStatus

      // Format date
      const dateObj = parseISO(po.createdAt)
      const formattedDate = format(dateObj, 'dd/MM/yyyy')

      return {
        id: invoice.id,
        poNumber: po.poNumber,
        date: formattedDate,
        linkedOrders: linkedOrders,
        items: itemNames || 'N/A',
        quantity: totalQuantity,
        rate: avgRate,
        amount: Number(po.totalAmount),
        status: uiStatus,
        invoiceFile: invoice.vendorAttachment?.fileName || invoice.accountsAttachment?.fileName,
        invoiceUrl: invoice.vendorAttachment?.s3Url || invoice.accountsAttachment?.s3Url,
        invoiceId: invoice.id,
        dispatchStatus: dispatchStatus,
        rejectionReason: invoice.status === 'REJECTED' ? 'Invoice rejected by accounts team' : undefined
      }
    })
  }

  const handleUploadInvoice = (poId: string) => {
    const po = purchaseOrders.find(p => p.id === poId)
    if (po) {
      setSelectedPO(po)
      setUploadModalOpen(true)
    }
  }

  const handleFileUpload = async (file: File) => {
    if (selectedPO && selectedPO.invoiceId) {
      try {
        // Upload file to backend
        await InvoiceApiService.uploadVendorInvoice({
          file,
          invoiceId: selectedPO.invoiceId
        })

        // Refresh invoices
        await fetchInvoices()
        
        setUploadModalOpen(false)
        setSelectedPO(null)
      } catch (error) {
        console.error('Failed to upload invoice:', error)
      }
    }
  }

  const handleViewInvoice = (invoiceUrl: string, type: string) => {
    setViewingInvoice({ url: invoiceUrl, type })
    setImageLoadError(false)
  }

  const handleCloseInvoice = () => {
    setViewingInvoice(null)
    setImageLoadError(false)
  }

  // Detect file type from URL
  const getFileType = (url: string): 'pdf' | 'image' | 'unknown' => {
    const lowerUrl = url.toLowerCase()
    if (lowerUrl.includes('.pdf') || lowerUrl.includes('application/pdf')) {
      return 'pdf'
    }
    if (lowerUrl.match(/\.(jpg|jpeg|png|gif|webp|bmp)/)) {
      return 'image'
    }
    return 'unknown'
  }

  const receivedPOs = purchaseOrders.filter(po => po.status === 'Received')
  const pendingValidation = purchaseOrders.filter(po => ['Validating', 'Validated'].includes(po.status))
  const approvedPOs = purchaseOrders.filter(po => po.status === 'Approved')
  const rejectedPOs = purchaseOrders.filter(po => po.status === 'Rejected')
  // const paidPOs = purchaseOrders.filter(po => po.status === 'Payment Received')

  const parsePoDate = (d: string) => {
    // PO date stored as DD/MM/YYYY
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

  const filteredPurchaseOrders = purchaseOrders.filter(po => {
    // status filter
    if (statusFilter !== 'All' && po.status !== statusFilter) return false

    // PO number search
    if (poSearch.trim() && !po.poNumber.toLowerCase().includes(poSearch.trim().toLowerCase())) return false

    // linked order search
    if (linkedOrderSearch.trim()) {
      const q = linkedOrderSearch.trim().toLowerCase()
      if (!po.linkedOrders.some(lo => lo.toLowerCase().includes(q))) return false
    }

    // date range filter
    const poDate = parsePoDate(po.date)
    if (dateFrom) {
      const from = new Date(dateFrom + 'T00:00:00')
      if (!poDate || poDate < from) return false
    }
    if (dateTo) {
      const to = new Date(dateTo + 'T23:59:59')
      if (!poDate || poDate > to) return false
    }

    return true
  })

  const totalPages = Math.max(1, Math.ceil(filteredPurchaseOrders.length / pageSize))
  const paginatedPurchaseOrders = filteredPurchaseOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  return (
    <div className="py-4 px-4 sm:px-6 md:px-8 lg:px-9 sm:py-6 lg:py-8 min-h-[calc(100vh-4rem)] font-sans w-full overflow-x-hidden bg-[var(--color-sharktank-bg)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-[var(--color-heading)] mb-0 sm:mb-0">Invoice Management</h1>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[var(--color-accent)]"></div>
        </div>
      )}

      {/* Empty State */}
      {!loading && purchaseOrders.length === 0 && (
        <div className="bg-white rounded-xl shadow-md border border-white/20 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Invoices Found</h3>
          <p className="text-gray-500">You don't have any purchase orders with invoices yet.</p>
        </div>
      )}

      {!loading && purchaseOrders.length > 0 && (
        <>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-4 mb-6">
        <div className={`bg-[var(--color-happyplant-bg)] p-4 sm:p-6 pt-8 sm:pt-10 rounded-xl shadow-sm flex flex-col items-center text-center relative`}>
          <div className="absolute -top-5 sm:-top-6 left-1/2 -translate-x-1/2 w-12 h-12 sm:w-16 sm:h-16 bg-[var(--color-accent)] rounded-full p-2 sm:p-3 flex items-center justify-center text-white shadow-md">
            <FileText size={24} color="white" className="sm:w-8 sm:h-8" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1 px-2">New POs</h3>
          <div className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{receivedPOs.length}</div>
          <div className="text-xs sm:text-sm text-gray-600 mt-1">Pending invoices</div>
        </div>

        <div className={`bg-[var(--color-happyplant-bg)] p-4 sm:p-6 pt-8 sm:pt-10 rounded-xl shadow-sm flex flex-col items-center text-center relative`}>
          <div className="absolute -top-5 sm:-top-6 left-1/2 -translate-x-1/2 w-12 h-12 sm:w-16 sm:h-16 bg-[var(--color-accent)] rounded-full p-2 sm:p-3 flex items-center justify-center text-white shadow-md">
            <Clock size={24} color="white" className="sm:w-8 sm:h-8" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1 px-2">Validating</h3>
          <div className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{pendingValidation.length}</div>
          <div className="text-xs sm:text-sm text-gray-600 mt-1">Under review</div>
        </div>

        <div className={`bg-[var(--color-happyplant-bg)] p-4 sm:p-6 pt-8 sm:pt-10 rounded-xl shadow-sm flex flex-col items-center text-center relative`}>
          <div className="absolute -top-5 sm:-top-6 left-1/2 -translate-x-1/2 w-12 h-12 sm:w-16 sm:h-16 bg-[var(--color-accent)] rounded-full p-2 sm:p-3 flex items-center justify-center text-white shadow-md">
            <CheckSquare size={24} color="white" className="sm:w-8 sm:h-8" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1 px-2">Approved</h3>
          <div className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{approvedPOs.length}</div>
          <div className="text-xs sm:text-sm text-gray-600 mt-1">Ready for payment</div>
        </div>

        <div className={`bg-[var(--color-happyplant-bg)] p-4 sm:p-6 pt-8 sm:pt-10 rounded-xl shadow-sm flex flex-col items-center text-center relative`}>
          <div className="absolute -top-5 sm:-top-6 left-1/2 -translate-x-1/2 w-12 h-12 sm:w-16 sm:h-16 bg-[var(--color-accent)] rounded-full p-2 sm:p-3 flex items-center justify-center text-white shadow-md">
            <X size={24} color="white" className="sm:w-8 sm:h-8" />
          </div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-1 px-2">Rejected</h3>
          <div className="text-xl sm:text-2xl font-bold text-gray-900 mt-1">{rejectedPOs.length}</div>
          <div className="text-xs sm:text-sm text-gray-600 mt-1">Needs attention</div>
        </div>
      </div>

      {/* Purchase Orders Heading */}
      <div className="mb-3 sm:mb-4">
        <h2 className="text-base sm:text-lg md:text-xl font-semibold text-[var(--color-heading)]">Purchase Orders</h2>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6 pb-3 sm:pb-4 mb-4 sm:mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">PO#</label>
            <input
              type="text"
              value={poSearch}
              onChange={(e) => setPoSearch(e.target.value)}
              placeholder="Search PO number"
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
                  setPoSearch('')
                  setLinkedOrderSearch('')
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
              onChange={(value) => { setStatusFilter((value || 'All') as any); setCurrentPage(1) }}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'Received', label: 'Received' },
                { value: 'Dispatched', label: 'Dispatched' },
                { value: 'Validating', label: 'Validating' },
                { value: 'Validated', label: 'Validated' },
                { value: 'Approved', label: 'Approved' },
                { value: 'Rejected', label: 'Rejected' },
                { value: 'Payment Received', label: 'Payment Received' }
              ]}
              placeholder="All Statuses"
            />
          </div>

           <div>
             <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Client Order</label>
             <input
               type="text"
               value={linkedOrderSearch}
               onChange={(e) => setLinkedOrderSearch(e.target.value)}
               placeholder="Search client order"
               className="w-full px-3 py-2.5 sm:py-3 text-sm border border-gray-300 rounded-md hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200 min-h-[44px] sm:min-h-auto"
             />
           </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <div className="flex flex-col gap-2">
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
                      disabled={(date) => dateFromDate ? date < dateFromDate : false}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile-only Filter Actions - At bottom of filters section */}
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
              setPoSearch('')
              setLinkedOrderSearch('')
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

      {/* Table */}
      <div className="bg-white rounded-xl shadow-md border border-white/20 overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-[var(--color-accent)]">
              <tr>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">PO Number</th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Date</th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Linked Orders</th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Items</th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Qty</th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Rate</th>
                
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Dispatch Status</th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-white uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedPurchaseOrders.map((po) => (
                <tr key={po.id} className="hover:bg-gray-50">
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--color-heading)]">
                    {po.poNumber}
                  </td>
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {po.date}
                  </td>
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {po.linkedOrders.join(', ')}
                  </td>
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {po.items}
                    {getValidationDisplay(po)}
                  </td>
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {po.quantity}
                  </td>
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    ₹{po.rate.toFixed(2)}
                  </td>
                  
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(po.dispatchStatus as PurchaseOrder['status'] || po.status)}
                  </td>
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex flex-col items-start gap-2">
                      {/* Only show upload button for Rejected invoices */}
                      {po.status === 'Rejected' && (
                        <button
                          onClick={() => handleUploadInvoice(po.id)}
                          className="px-3 py-1 bg-[var(--color-accent)] text-white rounded-md hover:bg-[var(--color-accent)]/90 transition-colors text-xs font-medium flex items-center gap-1"
                        >
                          <FileText size={12} />
                          Re-upload Invoice
                        </button>
                      )}

                      {/* Show view button if invoice exists */}
                      {po.invoiceFile && po.invoiceUrl && (
                        <button
                          onClick={() => handleViewInvoice(po.invoiceUrl!, 'Vendor')}
                          className="px-3 py-1 border border-[var(--color-accent)] text-[var(--color-accent)] rounded-md hover:bg-[var(--color-accent)] hover:text-white transition-colors text-xs font-medium flex items-center gap-1"
                        >
                          <FileText size={12} />
                          View Invoice
                        </button>
                      )}

                      {/* Show rejection reason */}
                      {po.status === 'Rejected' && po.rejectionReason && (
                        <div className="text-xs text-red-600 max-w-[12rem]">
                          {po.rejectionReason}
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden divide-y divide-gray-200">
          {paginatedPurchaseOrders.map((po) => (
            <div key={po.id} className="p-3 sm:p-4 md:p-5">
              <div className="flex justify-between items-start mb-3 gap-2">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-[var(--color-heading)] text-sm sm:text-base truncate">{po.poNumber}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">{po.date}</p>
                  <p className="text-xs text-gray-500 truncate">Orders: {po.linkedOrders.join(', ')}</p>
                </div>
                <div className="ml-2 flex-shrink-0">
                  {getStatusBadge(po.status)}
                </div>
              </div>
              
              <div className="mb-3 space-y-1.5">
                <p className="text-xs sm:text-sm text-gray-600">
                  <span className="font-medium text-gray-800">Item:</span> {po.items}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">
                  <span className="font-medium text-gray-800">Quantity:</span> {po.quantity} @ ₹{po.rate.toFixed(2)}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 flex items-center gap-2">
                  <span className="font-medium text-gray-800">Dispatch Status:</span>
                  {getStatusBadge(po.dispatchStatus as PurchaseOrder['status'] || po.status)}
                </p>
                
                {getValidationDisplay(po)}
              </div>

              <div className="flex flex-col gap-2">
                {/* Only show upload button for Rejected invoices */}
                {po.status === 'Rejected' && (
                  <button
                    onClick={() => handleUploadInvoice(po.id)}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 bg-[var(--color-accent)] text-white rounded-md hover:bg-[var(--color-accent)]/90 transition-colors text-xs sm:text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <FileText size={14} />
                    <span>Re-upload Invoice</span>
                  </button>
                )}

                {/* Show view button if invoice exists */}
                {po.invoiceFile && po.invoiceUrl && (
                  <button
                    onClick={() => handleViewInvoice(po.invoiceUrl!, 'Vendor')}
                    className="w-full px-3 sm:px-4 py-2 sm:py-2.5 border border-[var(--color-accent)] text-[var(--color-accent)] rounded-md hover:bg-[var(--color-accent)] hover:text-white transition-colors text-xs sm:text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <FileText size={14} />
                    <span>View Invoice</span>
                  </button>
                )}

                {/* Show rejection reason */}
                {po.status === 'Rejected' && po.rejectionReason && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600 leading-relaxed">
                    <p className="font-medium mb-0.5">Rejection Reason:</p>
                    <p>{po.rejectionReason}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        {/* Pagination controls (below table/cards) */}
        <div className="px-3 sm:px-4 md:px-6 py-3 sm:py-2 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-0 text-xs sm:text-sm text-gray-600 border-t border-gray-200">
          <div className="text-center sm:text-left">
            Showing {Math.min((currentPage - 1) * pageSize + 1, Math.max(1, filteredPurchaseOrders.length))} - {Math.min(currentPage * pageSize, filteredPurchaseOrders.length)} of {filteredPurchaseOrders.length}
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))} 
              disabled={currentPage === 1} 
              className="px-3 py-1.5 sm:px-2 sm:py-1 border rounded bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors min-w-[60px] sm:min-w-0"
            >
              Prev
            </button>
            <span className="whitespace-nowrap">Page {currentPage} / {totalPages}</span>
            <button 
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} 
              disabled={currentPage >= totalPages} 
              className="px-3 py-1.5 sm:px-2 sm:py-1 border rounded bg-white disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors min-w-[60px] sm:min-w-0"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* Invoice Upload Modal */}
      <InvoiceUploadModal
        isOpen={uploadModalOpen}
        po={selectedPO}
        onClose={() => {
          setUploadModalOpen(false)
          setSelectedPO(null)
        }}
        onUpload={handleFileUpload}
      />

      {/* Invoice Viewer Modal */}
      {viewingInvoice && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4 xl:p-6 2xl:p-8"
          role="dialog"
          aria-modal="true"
          aria-labelledby="invoice-modal-title"
        >
          <div className="bg-white rounded-2xl w-full max-w-[95vw] sm:max-w-5xl xl:max-w-6xl 2xl:max-w-7xl max-h-[95vh] flex flex-col shadow-2xl">
            {/* Header - Fixed */}
            <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 xl:px-7 xl:py-5 2xl:px-8 2xl:py-6 border-b border-gray-200 flex-shrink-0">
              <h3 id="invoice-modal-title" className="text-lg sm:text-xl xl:text-2xl 2xl:text-3xl font-semibold text-[var(--color-heading)]">
                {viewingInvoice.type} Invoice
              </h3>
              <button
                onClick={handleCloseInvoice}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 xl:p-1.5 2xl:p-2 rounded-lg hover:bg-gray-100"
                aria-label="Close invoice viewer"
              >
                <X size={24} className="xl:w-7 xl:h-7 2xl:w-8 2xl:h-8" />
              </button>
            </div>
            
            {/* Content - Scrollable */}
            <div className="flex-1 overflow-auto p-4 sm:p-6 xl:p-7 2xl:p-8 bg-gray-50">
              <div className="flex items-start justify-center min-h-full">
                {(() => {
                  const fileType = getFileType(viewingInvoice.url)
                  
                  if (fileType === 'pdf') {
                    return (
                      <div className="w-full h-full min-h-[600px] bg-white rounded-lg shadow-lg overflow-hidden">
                        <iframe
                          src={viewingInvoice.url}
                          className="w-full h-full min-h-[600px]"
                          title={`${viewingInvoice.type} Invoice PDF`}
                        />
                      </div>
                    )
                  }
                  
                  if (fileType === 'image') {
                    return imageLoadError ? (
                      <div className="text-center p-8 xl:p-10 2xl:p-12 text-gray-500 text-sm xl:text-base 2xl:text-lg">
                        Unable to load invoice preview.{' '}
                        <a 
                          href={viewingInvoice.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[var(--color-accent)] hover:underline"
                        >
                          Click here to download
                        </a>
                      </div>
                    ) : (
                      <img 
                        src={viewingInvoice.url} 
                        alt={`${viewingInvoice.type} Invoice`}
                        className="max-w-full h-auto rounded-lg shadow-lg bg-white"
                        onError={() => setImageLoadError(true)}
                      />
                    )
                  }
                  
                  // Unknown file type - provide download link
                  return (
                    <div className="text-center p-8 xl:p-10 2xl:p-12">
                      <div className="text-gray-700 text-sm xl:text-base 2xl:text-lg mb-4">
                        Preview not available for this file type.
                      </div>
                      <a 
                        href={viewingInvoice.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--color-accent)] text-white rounded-full hover:opacity-90 transition-opacity"
                      >
                        <FileText size={20} />
                        <span>Download Invoice</span>
                      </a>
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>
        </div>
      )}
      </>
      )}
    </div>
  )
}