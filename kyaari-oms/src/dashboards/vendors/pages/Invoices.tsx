import React, { useState } from 'react'
import { FileText, CheckSquare, X, Clock, Wallet } from 'lucide-react'

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
  validationIssues?: string[]
  rejectionReason?: string
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
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-lg mx-2 sm:mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg sm:text-xl font-semibold text-[var(--color-heading)]">Upload Invoice</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <p className="text-sm text-gray-600">PO Number: <span className="font-medium">{po.poNumber}</span></p>
            <p className="text-sm text-gray-600">Amount: <span className="font-medium">₹{po.amount.toLocaleString()}</span></p>
            <p className="text-sm text-gray-600 sm:col-span-2">Items: <span className="font-medium">{po.items}</span></p>
            <p className="text-sm text-gray-600 sm:col-span-2">Quantity: <span className="font-medium">{po.quantity}</span></p>
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
          <label className="inline-block px-3 sm:px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg cursor-pointer hover:bg-[var(--color-accent)]/90 text-sm">
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
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">{selectedFile.name}</span>
              <span className="text-xs text-green-600">({(selectedFile.size / 1024).toFixed(1)} KB)</span>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!selectedFile}
            className="flex-1 px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-accent)]/90 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors text-sm sm:text-base"
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
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([
    {
      id: '1',
      poNumber: 'PO-2025-001',
      date: '29/09/2025',
      linkedOrders: ['ORD-003'],
      items: 'Green Beans',
      quantity: 25,
      rate: 80,
      amount: 2000,
      status: 'Received'
    },
    {
      id: '2',
      poNumber: 'PO-2025-002',
      date: '28/09/2025',
      linkedOrders: ['ORD-001', 'ORD-002'],
      items: 'Organic Tomatoes',
      quantity: 50,
      rate: 120,
      amount: 6000,
  // Vendor uploaded invoice -> dispatch status becomes Validating
  status: 'Validating',
      invoiceFile: 'invoice_PO-2025-002.pdf'
    },
    {
      id: '3',
      poNumber: 'PO-2025-003',
      date: '28/09/2025',
      linkedOrders: ['ORD-004'],
      items: 'Organic Carrots',
      quantity: 30,
      rate: 60,
      amount: 1800,
      status: 'Validated',
      invoiceFile: 'invoice_PO-2025-003.json'
    },
    {
      id: '4',
      poNumber: 'PO-2025-004',
      date: '27/09/2025',
      linkedOrders: ['ORD-005'],
      items: 'Bell Peppers',
      quantity: 15,
      rate: 150,
      amount: 2250,
      status: 'Approved',
      invoiceFile: 'invoice_PO-2025-004.pdf'
    },
    {
      id: '5',
      poNumber: 'PO-2025-005',
      date: '26/09/2025',
      linkedOrders: ['ORD-006'],
      items: 'Fresh Spinach',
      quantity: 20,
      rate: 90,
      amount: 1800,
      status: 'Rejected',
      invoiceFile: 'invoice_PO-2025-005.pdf',
      validationIssues: ['Rate mismatch: Expected ₹90, Got ₹100', 'Amount calculation error'],
      rejectionReason: 'Invoice amount does not match PO terms'
    },
    {
      id: '6',
      poNumber: 'PO-2025-006',
      date: '25/09/2025',
      linkedOrders: ['ORD-007'],
      items: 'Cucumber',
      quantity: 40,
      rate: 45,
      amount: 1800,
      // Payment released to vendor -> Dispatch status = Payment Received
      status: 'Payment Received',
      invoiceFile: 'invoice_PO-2025-006.pdf'
    }
  ])

  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null)
  const [statusFilter, setStatusFilter] = useState<'All' | PurchaseOrder['status']>('All')
  const [poSearch, setPoSearch] = useState('')
  const [linkedOrderSearch, setLinkedOrderSearch] = useState('')
  const [dateFrom, setDateFrom] = useState('') // yyyy-mm-dd
  const [dateTo, setDateTo] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize] = useState(10) // fixed to 10 rows per page

  const handleUploadInvoice = (poId: string) => {
    const po = purchaseOrders.find(p => p.id === poId)
    if (po) {
      setSelectedPO(po)
      setUploadModalOpen(true)
    }
  }

  const handleFileUpload = (file: File) => {
    if (selectedPO) {
      setPurchaseOrders(orders => 
        orders.map(po => 
          po.id === selectedPO.id 
            ? { 
                ...po, 
                status: 'Validating' as const,
                invoiceFile: file.name
              }
            : po
        )
      )
      
      // Simulate validation process
      setTimeout(() => {
        setPurchaseOrders(orders => 
          orders.map(po => 
            po.id === selectedPO.id 
              ? { ...po, status: 'Validated' as const }
              : po
          )
        )
      }, 2000)
      
      setUploadModalOpen(false)
      setSelectedPO(null)
    }
  }

  const receivedPOs = purchaseOrders.filter(po => po.status === 'Received')
  const pendingValidation = purchaseOrders.filter(po => ['Validating', 'Validated'].includes(po.status))
  const approvedPOs = purchaseOrders.filter(po => po.status === 'Approved')
  const rejectedPOs = purchaseOrders.filter(po => po.status === 'Rejected')
  const paidPOs = purchaseOrders.filter(po => po.status === 'Payment Received')

  const parsePoDate = (d: string) => {
    // PO date stored as DD/MM/YYYY
    const parts = d.split('/')
    if (parts.length !== 3) return null
    const [dd, mm, yyyy] = parts.map(Number)
    return new Date(yyyy, mm - 1, dd)
  }

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
    <div className="p-4 sm:p-6 lg:p-8 bg-[var(--color-happyplant-bg)] min-h-[calc(100vh-4rem)] font-sans w-full overflow-x-hidden">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-[var(--font-heading)] text-[var(--color-heading)] mb-2">Invoice Management</h1>
        <p className="text-sm sm:text-base text-[var(--color-primary)]">Manage Purchase Orders and upload invoices for validation</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-white/20">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
            <span className="text-xs sm:text-sm font-medium text-gray-600">New POs</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[var(--color-primary)]">{receivedPOs.length}</div>
        </div>
        
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-white/20">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" />
            <span className="text-xs sm:text-sm font-medium text-gray-600">Validating</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[var(--color-primary)]">{pendingValidation.length}</div>
        </div>
        
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-white/20">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
            <span className="text-xs sm:text-sm font-medium text-gray-600">Approved</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[var(--color-primary)]">{approvedPOs.length}</div>
        </div>
        
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-white/20">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <X className="w-4 h-4 sm:w-5 sm:h-5 text-red-500" />
            <span className="text-xs sm:text-sm font-medium text-gray-600">Rejected</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[var(--color-primary)]">{rejectedPOs.length}</div>
        </div>
        
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-white/20">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
            <span className="text-xs sm:text-sm font-medium text-gray-600">Paid</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[var(--color-primary)]">{paidPOs.length}</div>
        </div>
      </div>

      {/* Purchase Orders Table */}
      <div className="bg-white rounded-xl shadow-md border border-white/20 overflow-hidden">
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
          <h2 className="text-lg sm:text-xl font-semibold text-[var(--color-heading)]">Purchase Orders</h2>
        </div>
        {/* Filters */}
        <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <label className="text-xs text-gray-600">Status</label>
            <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value as any); setCurrentPage(1) }}
                className="text-sm p-2 border rounded bg-white"
              >
              <option value="All">All</option>
              <option value="Received">Received</option>
              <option value="Dispatched">Dispatched</option>
              <option value="Validating">Validating</option>
              <option value="Validated">Validated</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
              <option value="Payment Received">Payment Received</option>
            </select>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <label className="text-xs text-gray-600">PO#</label>
            <input
              type="text"
              value={poSearch}
              onChange={(e) => { setPoSearch(e.target.value); setCurrentPage(1) }}
              placeholder="Search PO number"
              className="text-sm p-2 border rounded"
            />
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <label className="text-xs text-gray-600">Linked Order</label>
            <input
              type="text"
              value={linkedOrderSearch}
              onChange={(e) => { setLinkedOrderSearch(e.target.value); setCurrentPage(1) }}
              placeholder="Search linked order"
              className="text-sm p-2 border rounded"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs text-gray-600">From</label>
            <input type="date" value={dateFrom} onChange={(e) => { setDateFrom(e.target.value); setCurrentPage(1) }} className="text-sm p-2 border rounded" />
            <label className="text-xs text-gray-600">To</label>
            <input type="date" value={dateTo} onChange={(e) => { setDateTo(e.target.value); setCurrentPage(1) }} className="text-sm p-2 border rounded" />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => { setStatusFilter('All'); setPoSearch(''); setLinkedOrderSearch(''); setDateFrom(''); setDateTo(''); setCurrentPage(1) }}
              className="text-sm px-3 py-2 border rounded bg-white"
            >
              Reset
            </button>
          </div>
        </div>

        
        
        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">PO Number</th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Linked Orders</th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Items</th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Qty</th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dispatch Status</th>
                <th className="px-4 xl:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
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
                    ₹{po.rate}
                  </td>
                  
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(po.status)}
                  </td>
                  <td className="px-4 xl:px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex flex-col items-start gap-2">
                      {po.status === 'Rejected' && (
                        <div>
                          <button
                            onClick={() => handleUploadInvoice(po.id)}
                            className="px-3 py-1 bg-[var(--color-accent)] text-white rounded-md hover:bg-[var(--color-accent)]/90 transition-colors text-xs font-medium flex items-center gap-1"
                          >
                            <FileText size={12} />
                            Upload Invoice
                          </button>
                        </div>
                      )}

                      {po.invoiceFile && (
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <FileText className="w-4 h-4 text-gray-500" />
                          <span className="truncate max-w-[12rem]">{po.invoiceFile}</span>
                        </div>
                      )}

                      {po.status === 'Rejected' && po.rejectionReason && (
                        <div className="text-xs text-red-600">
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
            <div key={po.id} className="p-4 sm:p-6">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-[var(--color-heading)] text-sm sm:text-base truncate">{po.poNumber}</h3>
                  <p className="text-xs sm:text-sm text-gray-600 mb-1">{po.date}</p>
                  <p className="text-xs text-gray-500 truncate">Orders: {po.linkedOrders.join(', ')}</p>
                </div>
                <div className="ml-2 flex-shrink-0">
                  {getStatusBadge(po.status)}
                </div>
              </div>
              
              <div className="mb-4 space-y-1">
                <p className="text-xs sm:text-sm text-gray-600">
                  <span className="font-medium">Item:</span> {po.items}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">
                  <span className="font-medium">Quantity:</span> {po.quantity} @ ₹{po.rate}
                </p>
                
                {getValidationDisplay(po)}
              </div>

              <div className="flex flex-col gap-2">
                {po.status === 'Rejected' && (
                  <button
                    onClick={() => handleUploadInvoice(po.id)}
                    className="w-full px-3 sm:px-4 py-2 bg-[var(--color-accent)] text-white rounded-md hover:bg-[var(--color-accent)]/90 transition-colors text-xs sm:text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <FileText size={14} />
                    Upload Invoice
                  </button>
                )}

                {po.invoiceFile && (
                  <div className="flex items-center gap-2 p-2 bg-gray-50 rounded text-xs text-gray-600">
                    <FileText className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500 flex-shrink-0" />
                    <span className="truncate">{po.invoiceFile}</span>
                  </div>
                )}

                {po.status === 'Rejected' && po.rejectionReason && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded text-xs text-red-600">
                    <p>{po.rejectionReason}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        {/* Pagination controls (below table/cards) */}
        <div className="px-4 sm:px-6 py-2 flex items-center justify-between text-sm text-gray-600">
          <div>
            Showing {Math.min((currentPage - 1) * pageSize + 1, Math.max(1, filteredPurchaseOrders.length))} - {Math.min(currentPage * pageSize, filteredPurchaseOrders.length)} of {filteredPurchaseOrders.length}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="px-2 py-1 border rounded bg-white disabled:opacity-50">Prev</button>
            <span>Page {currentPage} / {totalPages}</span>
            <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage >= totalPages} className="px-2 py-1 border rounded bg-white disabled:opacity-50">Next</button>
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
    </div>
  )
}