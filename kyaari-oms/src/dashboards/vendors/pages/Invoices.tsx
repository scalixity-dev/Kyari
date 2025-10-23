import React, { useState, useEffect, useRef, useCallback } from 'react'
import { FileText, CheckSquare, X, Clock, Calendar as CalendarIcon, ChevronDown, ChevronUp } from 'lucide-react'
import { CustomDropdown, KPICard } from '../../../components'
import { Calendar } from '../../../components/ui/calendar'
import { Pagination } from '../../../components/ui/Pagination'
import { CSVPDFExportButton } from '../../../components/ui/export-button'
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
  vendorInvoiceFile?: string
  vendorInvoiceUrl?: string
  accountsInvoiceFile?: string
  accountsInvoiceUrl?: string
}

interface InvoiceUploadModalProps {
  isOpen: boolean
  po: PurchaseOrder | null
  onClose: () => void
  onUpload: (file: File) => void
}

// Expandable Rejection Reason Component (Desktop)
const RejectionReasonBox: React.FC<{ reason: string }> = ({ reason }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const needsExpansion = reason.length > 80

  return (
    <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600 leading-relaxed max-w-[14rem]">
      <p className="font-medium mb-0.5 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <span>⚠️</span>
          <span>Issue:</span>
        </span>
        {needsExpansion && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-red-600 hover:text-red-800 transition-colors ml-1"
            aria-label={isExpanded ? 'Show less' : 'Show more'}
          >
            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
        )}
      </p>
      <p className={`whitespace-pre-wrap break-words ${!isExpanded && needsExpansion ? 'line-clamp-2' : ''}`}>
        {reason}
      </p>
      {needsExpansion && !isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="text-red-700 hover:text-red-900 font-medium mt-1 text-xs underline"
        >
          Read more
        </button>
      )}
    </div>
  )
}

// Expandable Rejection Reason Component (Mobile)
const MobileRejectionReasonBox: React.FC<{ reason: string }> = ({ reason }) => {
  const [isExpanded, setIsExpanded] = useState(false)
  const needsExpansion = reason.length > 100

  return (
    <div className="p-3 bg-red-50 border border-red-200 rounded text-xs sm:text-sm text-red-600 leading-relaxed">
      <p className="font-semibold mb-1 flex items-center justify-between">
        <span className="flex items-center gap-1">
          <span>⚠️</span>
          <span>Issue Reported:</span>
        </span>
        {needsExpansion && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-red-600 hover:text-red-800 transition-colors"
            aria-label={isExpanded ? 'Show less' : 'Show more'}
          >
            {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </p>
      <p className={`whitespace-pre-wrap break-words ${!isExpanded && needsExpansion ? 'line-clamp-3' : ''}`}>
        {reason}
      </p>
      {needsExpansion && !isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="text-red-700 hover:text-red-900 font-semibold mt-1 text-xs underline"
        >
          Read more
        </button>
      )}
    </div>
  )
}

const InvoiceUploadModal: React.FC<InvoiceUploadModalProps> = ({ isOpen, po, onClose, onUpload }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)

  if (!isOpen || !po) return null

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
    if (file && allowedTypes.includes(file.type)) {
      setSelectedFile(file)
    } else {
      alert('Please select a PDF, PNG, or JPEG file')
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg']
    if (file && allowedTypes.includes(file.type)) {
      setSelectedFile(file)
    } else {
      alert('Please select a PDF, PNG, or JPEG file')
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
              accept=".pdf,.png,.jpg,.jpeg"
              onChange={handleFileSelect}
              className="hidden"
            />
          </label>
          <p className="text-xs text-gray-500 mt-2">Supported formats: PDF, PNG, JPEG</p>
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
      return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border bg-blue-100 text-blue-800 border-blue-300">Received</span>
    case 'Dispatched':
      return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border bg-indigo-100 text-indigo-800 border-indigo-300">Dispatched</span>
    case 'Validating':
      return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border bg-orange-100 text-orange-800 border-orange-300">Validating</span>
    case 'Validated':
      return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border bg-emerald-100 text-emerald-800 border-emerald-300">Verified</span>
    case 'Approved':
      return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border bg-green-100 text-green-800 border-green-300">Approved</span>
    case 'Rejected':
      return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border bg-red-100 text-red-800 border-red-300">Ticket Raised</span>
    case 'Payment Received':
      return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border bg-purple-100 text-purple-800 border-purple-300">Payment Received</span>
    default:
      return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border bg-gray-100 text-gray-800 border-gray-300">{status}</span>
  }
}

const getValidationDisplay = (po: PurchaseOrder) => {
  // For verified/validated dispatch - show quantity as correct
  if (po.dispatchStatus === 'Validated') {
    return (
      <div className="mt-2 text-xs">
        <div className="flex items-center gap-1 text-green-600">
          <CheckSquare size={12} />
          <span>Qty: {po.quantity} ✓</span>
        </div>
      </div>
    )
  }
  
  // For rejected dispatch (ticket raised) - show mismatch
  if (po.dispatchStatus === 'Rejected' || (po.status === 'Rejected' && po.validationIssues)) {
    return (
      <div className="mt-2 text-xs">
        <div className="flex items-center gap-1 text-red-600">
          <X size={12} />
          <span>Mismatch</span>
        </div>
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
  const fetchInvoices = useCallback(async () => {
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
  }, [])

  useEffect(() => {
    fetchInvoices()
  }, [fetchInvoices])

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [statusFilter, poSearch, linkedOrderSearch, dateFrom, dateTo])

  // moved into useCallback above

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

      // Check if there's any dispatch first
      let hasDispatch = false
      let grnStatus: 'pending' | 'verified' | 'mismatch' | null = null
      let grnRejectionReason: string | undefined = undefined
      
      for (const item of po.items) {
        const dispatchItems = item.assignedOrderItem.dispatchItems
        if (dispatchItems && dispatchItems.length > 0) {
          hasDispatch = true
          for (const dispatchItem of dispatchItems) {
            const grn = dispatchItem.dispatch?.goodsReceiptNote
            if (grn) {
              // Check GRN status (VERIFIED_OK, VERIFIED_MISMATCH, PENDING_VERIFICATION, PARTIALLY_VERIFIED)
              if (grn.status === 'VERIFIED_OK') {
                grnStatus = 'verified'
              } else if (grn.status === 'VERIFIED_MISMATCH' || grn.status === 'PARTIALLY_VERIFIED') {
                grnStatus = 'mismatch'
                // Get the specific item mismatch details (check item statuses)
                const grnItem = grn.items.find(gi => 
                  gi.status === 'SHORTAGE_REPORTED' || 
                  gi.status === 'DAMAGE_REPORTED' || 
                  gi.status === 'QUANTITY_MISMATCH' ||
                  gi.status === 'EXCESS_RECEIVED'
                )
                if (grnItem) {
                  if (grnItem.damageReported) {
                    grnRejectionReason = 'Items damaged during delivery'
                  } else if (grnItem.discrepancyQuantity < 0) {
                    grnRejectionReason = `Quantity shortage detected: ${Math.abs(grnItem.discrepancyQuantity)} units missing`
                  } else if (grnItem.discrepancyQuantity > 0) {
                    grnRejectionReason = `Excess quantity received: ${grnItem.discrepancyQuantity} units extra`
                  } else {
                    grnRejectionReason = 'Quantity mismatch detected'
                  }
                }
                break
              } else if (grn.status === 'PENDING_VERIFICATION') {
                grnStatus = 'pending'
              }
            }
          }
          if (grnStatus === 'mismatch') break
        }
      }

      // Map invoice status to UI status with GRN consideration
      let uiStatus: PurchaseOrder['status'] = 'Received'
      let dispatchStatus: PurchaseOrder['status'] = 'Received'
      let finalRejectionReason = invoice.status === 'REJECTED' ? 'Invoice rejected by accounts team' : undefined
      
      if (invoice.status === 'PENDING_VERIFICATION') {
        uiStatus = invoice.vendorAttachment ? 'Validating' : 'Received'
        
        // Only update dispatch status based on GRN if there's actually a dispatch
        if (hasDispatch) {
          if (grnStatus === 'verified') {
            dispatchStatus = 'Validated'
          } else if (grnStatus === 'mismatch') {
            dispatchStatus = 'Rejected'
            finalRejectionReason = grnRejectionReason || 'Dispatch verification failed'
          } else if (grnStatus === 'pending') {
            dispatchStatus = 'Dispatched'
          } else {
            dispatchStatus = 'Dispatched' // Default to dispatched if no GRN status
          }
        } else {
          // No dispatch yet, keep as Received
          dispatchStatus = 'Received'
        }
      } else if (invoice.status === 'APPROVED') {
        uiStatus = 'Approved'
        dispatchStatus = hasDispatch ? 'Validated' : 'Received'
      } else if (invoice.status === 'REJECTED') {
        uiStatus = 'Rejected'
        dispatchStatus = hasDispatch ? 'Rejected' : 'Received'
      } else if (invoice.status === 'PAID') {
        uiStatus = 'Payment Received'
        dispatchStatus = hasDispatch ? 'Validated' : 'Received'
      }

      // Format date
      const dateObj = parseISO(po.createdAt)
      const formattedDate = format(dateObj, 'dd/MM/yyyy')

      // Ensure we have BOTH file and URL for vendor invoice (strict validation)
      const hasVendorInvoice = !!(invoice.vendorAttachment?.fileName && invoice.vendorAttachment?.s3Url)
      const hasAccountsInvoice = !!(invoice.accountsAttachment?.fileName && invoice.accountsAttachment?.s3Url)

      // Debug logging (remove in production)
      console.log(`PO ${po.poNumber}:`, {
        hasVendorInvoice,
        hasAccountsInvoice,
        vendorFileName: invoice.vendorAttachment?.fileName,
        accountsFileName: invoice.accountsAttachment?.fileName
      })

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
        rejectionReason: finalRejectionReason,
        // Separate vendor and accounts invoices - ONLY set if both file and URL exist
        vendorInvoiceFile: hasVendorInvoice ? invoice.vendorAttachment!.fileName : undefined,
        vendorInvoiceUrl: hasVendorInvoice ? invoice.vendorAttachment!.s3Url : undefined,
        accountsInvoiceFile: hasAccountsInvoice ? invoice.accountsAttachment!.fileName : undefined,
        accountsInvoiceUrl: hasAccountsInvoice ? invoice.accountsAttachment!.s3Url : undefined
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
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, filteredPurchaseOrders.length)
  const paginatedPurchaseOrders = filteredPurchaseOrders.slice(startIndex, endIndex)

  // Export functions
  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const toCSV = (rows: Array<Record<string, unknown>>, headerOrder?: string[]) => {
    if (!rows || rows.length === 0) return ''
    const headers = headerOrder && headerOrder.length > 0 ? headerOrder : Array.from(new Set(rows.flatMap((r) => Object.keys(r))))
    const escapeCell = (val: unknown) => {
      const s = val === undefined || val === null ? '' : String(val)
      return s.includes(',') || s.includes('"') || s.includes('\n') ? '"' + s.replace(/"/g, '""') + '"' : s
    }
    const lines = [headers.join(',')]
    for (const row of rows) {
      lines.push(headers.map((h) => escapeCell((row as Record<string, unknown>)[h])).join(','))
    }
    return lines.join('\n')
  }

  const handleExportCSV = () => {
    const rows = filteredPurchaseOrders.map(po => ({
      poNumber: po.poNumber,
      date: po.date,
      linkedOrders: po.linkedOrders.join(', '),
      items: po.items,
      quantity: po.quantity,
      amount: po.amount,
      status: po.status,
      dispatchStatus: po.dispatchStatus,
      hasVendorInvoice: !!po.vendorInvoiceFile,
      hasAccountsInvoice: !!po.accountsInvoiceFile,
      rejectionReason: po.rejectionReason || ''
    }))
    
    const csv = toCSV(rows, ['poNumber', 'date', 'linkedOrders', 'items', 'quantity', 'amount', 'status', 'dispatchStatus', 'hasVendorInvoice', 'hasAccountsInvoice', 'rejectionReason'])
    const filename = `vendor_invoices_${new Date().toISOString().slice(0, 10)}.csv`
    downloadFile(csv, filename, 'text/csv;charset=utf-8;')
  }

  const handleExportPDF = () => {
    const content = [
      'VENDOR INVOICES REPORT',
      `Generated: ${new Date().toLocaleString()}`,
      `Total Purchase Orders: ${filteredPurchaseOrders.length}`,
      '',
      '=== PURCHASE ORDER SUMMARY ===',
      ...filteredPurchaseOrders.map(po => [
        `PO Number: ${po.poNumber}`,
        `Date: ${po.date}`,
        `Linked Orders: ${po.linkedOrders.join(', ')}`,
        `Items: ${po.items}`,
        `Quantity: ${po.quantity}`,
        `Amount: ₹${po.amount.toLocaleString()}`,
        `Status: ${po.status}`,
        `Dispatch Status: ${po.dispatchStatus}`,
        `Vendor Invoice: ${po.vendorInvoiceFile ? 'Uploaded' : 'Not uploaded'}`,
        `Accounts Invoice: ${po.accountsInvoiceFile ? 'Available' : 'Not available'}`,
        ...(po.rejectionReason ? [`Rejection Reason: ${po.rejectionReason}`] : []),
        '---'
      ]).flat()
    ].join('\n')
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vendor_invoices_${new Date().toISOString().slice(0, 10)}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="py-4 px-4 sm:px-6 md:px-8 lg:px-9 sm:py-6 lg:py-8 min-h-[calc(100vh-4rem)] font-sans w-full overflow-x-hidden bg-[var(--color-sharktank-bg)]">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-heading)] mb-2">
          Invoice Management
        </h1>
        <p className="text-sm sm:text-base text-[var(--color-primary)]">
          Upload and manage your purchase order invoices
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="bg-white rounded-xl p-12 text-center">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading invoices...</p>
        </div>
      )}

      {/* Empty State */}
      {!loading && purchaseOrders.length === 0 && (
        <div className="bg-white rounded-xl p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Invoices Found</h3>
          <p className="text-gray-500">You don't have any purchase orders with invoices yet.</p>
        </div>
      )}

      {!loading && purchaseOrders.length > 0 && (
        <>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-4 mb-6 py-6">
        <KPICard
          title="New POs"
          value={receivedPOs.length}
          subtitle="Pending invoices"
          icon={<FileText size={32} />}
        />
        <KPICard
          title="Validating"
          value={pendingValidation.length}
          subtitle="Under review"
          icon={<Clock size={32} />}
        />
        <KPICard
          title="Approved"
          value={approvedPOs.length}
          subtitle="Ready for payment"
          icon={<CheckSquare size={32} />}
        />
        <KPICard
          title="Rejected"
          value={rejectedPOs.length}
          subtitle="Needs attention"
          icon={<X size={32} />}
        />
      </div>

      {/* Purchase Orders Heading */}
      <div className="mb-3 sm:mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-base sm:text-lg md:text-xl font-semibold text-[var(--color-heading)]">Purchase Orders</h2>
          <CSVPDFExportButton
            onExportCSV={handleExportCSV}
            onExportPDF={handleExportPDF}
            label="Export"
            className="w-full sm:w-auto"
          />
        </div>
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
                className="w-full sm:w-[140px] px-4 py-2.5 sm:py-2 rounded-md text-white font-medium text-sm min-h-[44px] sm:min-h-auto cursor-pointer"
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
                className="w-full sm:w-[140px] px-4 py-2 sm:py-2 bg-white text-secondary border border-secondary rounded-2xl font-medium hover:bg-secondary hover:text-white transition-colors duration-200 text-sm min-h-[44px] sm:min-h-auto cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Status</label>
            <CustomDropdown
              value={statusFilter === 'All' ? '' : statusFilter}
              onChange={(value) => { setStatusFilter((value as PurchaseOrder['status']) || 'All'); setCurrentPage(1) }}
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
                  <div className="absolute z-50 mt-2 right-0 bg-white border border-gray-200 rounded-md shadow-lg w-full min-w-[280px]">
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
                  <div className="absolute z-50 mt-2 right-0 bg-white border border-gray-200 rounded-md shadow-lg w-full min-w-[280px]">
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
            className="flex-1 px-4 py-2.5 rounded-md text-white font-medium text-sm min-h-[44px] cursor-pointer"
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
            className="flex-1 px-4 py-2 bg-white text-secondary border border-secondary rounded-2xl font-medium hover:bg-secondary hover:text-white transition-colors duration-200 text-sm min-h-[44px] cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="hidden lg:block bg-header-bg rounded-xl overflow-hidden">
        {/* Desktop Table */}
        <div className="overflow-x-auto">
          <div className="bg-white rounded-t-lg shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr className="bg-[var(--color-accent)]">
                  <th className="text-left p-3 font-heading font-normal text-[var(--color-button-text)]">PO Number</th>
                  <th className="text-left p-3 font-heading font-normal text-[var(--color-button-text)]">Date</th>
                  <th className="text-left p-3 font-heading font-normal text-[var(--color-button-text)]">Linked Orders</th>
                  <th className="text-left p-3 font-heading font-normal text-[var(--color-button-text)]">Items</th>
                  <th className="text-left p-3 font-heading font-normal text-[var(--color-button-text)]">Qty</th>
                  <th className="text-left p-3 font-heading font-normal text-[var(--color-button-text)]">Dispatch Status</th>
                  <th className="text-left p-3 font-heading font-normal text-[var(--color-button-text)]">Actions</th>
                </tr>
              </thead>
              <tbody>
              {paginatedPurchaseOrders.map((po) => (
                <tr key={po.id} className="border-b border-gray-100 hover:bg-gray-50 bg-white">
                  <td className="p-3">
                    <div className="font-semibold text-secondary">{po.poNumber}</div>
                  </td>
                  <td className="p-3 text-sm text-gray-900">
                    {po.date}
                  </td>
                  <td className="p-3 text-sm text-gray-900">
                    {po.linkedOrders.join(', ')}
                  </td>
                  <td className="p-3 text-sm text-gray-900">
                    {po.items}
                    {getValidationDisplay(po)}
                  </td>
                  <td className="p-3 text-sm text-gray-900">
                    {po.quantity}
                  </td>
                  <td className="p-3">
                    {getStatusBadge(po.dispatchStatus as PurchaseOrder['status'] || po.status)}
                  </td>
                  <td className="p-3 text-sm">
                    <div className="flex items-center gap-1.5">
                      {/* ALWAYS show upload button when ticket is raised (allows re-upload if wrong file) */}
                      {(po.status === 'Rejected' || po.dispatchStatus === 'Rejected') && (
                        <button
                          onClick={() => handleUploadInvoice(po.id)}
                          className="bg-orange-500 text-white rounded-md px-2.5 py-1.5 text-xs hover:bg-orange-600 flex items-center gap-1"
                        >
                          <FileText size={12} />
                          {po.vendorInvoiceFile ? 'Re-upload' : 'Upload'}
                        </button>
                      )}

                      {/* Vendor Invoice - ONLY show if vendor has actually uploaded (strict check) */}
                      {po.vendorInvoiceFile && po.vendorInvoiceUrl && po.vendorInvoiceUrl !== po.accountsInvoiceUrl && (
                        <button
                          onClick={() => {
                            console.log('Viewing vendor invoice:', po.vendorInvoiceUrl)
                            handleViewInvoice(po.vendorInvoiceUrl!, 'Your')
                          }}
                          className="bg-blue-500 text-white rounded-md px-2.5 py-1.5 text-xs hover:bg-blue-600 flex items-center gap-1"
                        >
                          <FileText size={12} />
                          View Yours
                        </button>
                      )}
                      
                      {/* Accounts Invoice - always show if exists */}
                      {po.accountsInvoiceFile && po.accountsInvoiceUrl && (
                        <button
                          onClick={() => handleViewInvoice(po.accountsInvoiceUrl!, 'Accounts')}
                          className="bg-purple-500 text-white rounded-md px-2.5 py-1.5 text-xs hover:bg-purple-600 flex items-center gap-1"
                        >
                          <FileText size={12} />
                          View Accounts
                        </button>
                      )}

                      {/* Show rejection reason with expandable feature */}
                      {(po.status === 'Rejected' || po.dispatchStatus === 'Rejected') && po.rejectionReason && (
                        <RejectionReasonBox reason={po.rejectionReason} />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-3">
          {paginatedPurchaseOrders.map((po) => (
            <div key={po.id} className="rounded-xl p-4 border border-gray-200 bg-white">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-secondary text-lg truncate">{po.poNumber}</h3>
                  <p className="text-sm text-gray-500">{po.date}</p>
                  <p className="text-sm text-gray-500 truncate">Orders: {po.linkedOrders.join(', ')}</p>
                </div>
                <div className="ml-2 flex-shrink-0">
                  {getStatusBadge(po.status)}
                </div>
              </div>
              
              {/* Info Grid */}
              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div>
                  <span className="text-gray-500 block">Item</span>
                  <span className="font-medium">{po.items}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Quantity</span>
                  <span className="font-medium">{po.quantity}</span>
                </div>
                <div className="col-span-2">
                  <span className="text-gray-500 block">Dispatch Status</span>
                  <div className="mt-1">
                    {getStatusBadge(po.dispatchStatus as PurchaseOrder['status'] || po.status)}
                  </div>
                </div>
                {getValidationDisplay(po)}
              </div>

              <div className="flex flex-wrap gap-2">
                {/* ALWAYS show upload button when ticket is raised (allows re-upload if wrong file) */}
                {(po.status === 'Rejected' || po.dispatchStatus === 'Rejected') && (
                  <button
                    onClick={() => handleUploadInvoice(po.id)}
                    className="bg-orange-500 text-white rounded-md px-2.5 py-1.5 text-xs hover:bg-orange-600 flex items-center gap-1"
                  >
                    <FileText size={12} />
                    {po.vendorInvoiceFile ? 'Re-upload' : 'Upload'}
                  </button>
                )}

                {/* Vendor Invoice - ONLY show if vendor has actually uploaded (strict check) */}
                {po.vendorInvoiceFile && po.vendorInvoiceUrl && po.vendorInvoiceUrl !== po.accountsInvoiceUrl && (
                  <button
                    onClick={() => {
                      console.log('Viewing vendor invoice:', po.vendorInvoiceUrl)
                      handleViewInvoice(po.vendorInvoiceUrl!, 'Your')
                    }}
                    className="bg-blue-500 text-white rounded-md px-2.5 py-1.5 text-xs hover:bg-blue-600 flex items-center gap-1"
                  >
                    <FileText size={12} />
                    View Yours
                  </button>
                )}
                
                {/* Accounts Invoice - always show if exists */}
                {po.accountsInvoiceFile && po.accountsInvoiceUrl && (
                  <button
                    onClick={() => handleViewInvoice(po.accountsInvoiceUrl!, 'Accounts')}
                    className="bg-purple-500 text-white rounded-md px-2.5 py-1.5 text-xs hover:bg-purple-600 flex items-center gap-1"
                  >
                    <FileText size={12} />
                    View Accounts
                  </button>
                )}

                {/* Show rejection reason with expandable mobile version */}
                {(po.status === 'Rejected' || po.dispatchStatus === 'Rejected') && po.rejectionReason && (
                  <MobileRejectionReasonBox reason={po.rejectionReason} />
                )}
              </div>
            </div>
          ))}
        </div>
        {filteredPurchaseOrders.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredPurchaseOrders.length}
            startIndex={startIndex}
            endIndex={endIndex}
            onPageChange={setCurrentPage}
            itemLabel="invoices"
            variant="desktop"
          />
        )}
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
          <div className="bg-white rounded-2xl w-full max-w-[90vw] sm:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl max-h-[95vh] flex flex-col shadow-2xl transform translate-x-6 sm:translate-x-8 xl:translate-x-16">
            {/* Header - Fixed */}
            <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 xl:px-7 xl:py-5 2xl:px-8 2xl:py-6 border-b border-gray-200 flex-shrink-0">
              <h3 id="invoice-modal-title" className="font-heading text-secondary font-normal text-lg sm:text-xl xl:text-2xl 2xl:text-3xl">
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
                        className="inline-flex items-center gap-2 px-6 py-3 bg-accent text-button-text rounded-full hover:opacity-90 transition-opacity"
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