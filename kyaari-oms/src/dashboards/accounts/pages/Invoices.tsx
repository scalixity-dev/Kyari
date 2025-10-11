import { useState, useRef, useMemo, useEffect } from 'react'
import { FileText, Upload, Search, ChevronDown, ChevronRight, Eye, X } from 'lucide-react'
import { CustomDropdown } from '../../../components/CustomDropdown/CustomDropdown'

type POStatus = 'Pending' | 'Generated'

type POOrder = {
  id: string
  vendor: string
  confirmedQty: number
  poStatus: POStatus
  items: string
  amount: number
  accountInvoice: string | null
  vendorInvoice: string | null
}

const PO_STATUS_STYLES: Record<POStatus, { bg: string; color: string; border: string }> = {
  'Pending': { bg: '#FEF9C3', color: '#92400E', border: '#FEF08A' },
  'Generated': { bg: '#D1FAE5', color: '#065F46', border: '#A7F3D0' },
}

const INITIAL_PO_ORDERS: POOrder[] = [
  { id: 'VO-2301', vendor: 'GreenLeaf Co', confirmedQty: 80, poStatus: 'Generated', items: 'Rose (50), Lily (30)', amount: 45000, accountInvoice: null, vendorInvoice: 'https://example.com/invoices/vendor-2301.pdf' },
  { id: 'VO-2302', vendor: 'Urban Roots', confirmedQty: 25, poStatus: 'Pending', items: 'Monstera Plant', amount: 12500, accountInvoice: null, vendorInvoice: null },
  { id: 'VO-2303', vendor: 'Plantify', confirmedQty: 25, poStatus: 'Pending', items: 'Snake Plant (15), ZZ Plant (10)', amount: 8750, accountInvoice: null, vendorInvoice: 'https://example.com/invoices/vendor-2303.pdf' },
  { id: 'VO-2304', vendor: 'Clay Works', confirmedQty: 48, poStatus: 'Generated', items: 'Terracotta Pots (Large)', amount: 19200, accountInvoice: null, vendorInvoice: null },
  { id: 'VO-2305', vendor: 'EcoGarden Solutions', confirmedQty: 100, poStatus: 'Pending', items: 'Organic Fertilizer', amount: 35000, accountInvoice: null, vendorInvoice: 'https://example.com/invoices/vendor-2305.pdf' },
  { id: 'VO-2306', vendor: 'Flower Garden', confirmedQty: 95, poStatus: 'Pending', items: 'Sunflower (40), Marigold (60)', amount: 28500, accountInvoice: null, vendorInvoice: null },
]

function AccountsInvoices() {
  const [poOrders, setPOOrders] = useState<POOrder[]>(INITIAL_PO_ORDERS)
  const [selectedPOs, setSelectedPOs] = useState<Set<string>>(new Set())
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({})
  
  // Filter states
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'All' | POStatus>('All')
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // Expanded rows state
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  // Invoice viewer state
  const [viewingInvoice, setViewingInvoice] = useState<{ url: string; type: string } | null>(null)
  const [imageLoadError, setImageLoadError] = useState(false)

  function toggleRowExpansion(orderId: string) {
    setExpandedRows(prev => {
      const newSet = new Set(prev)
      if (newSet.has(orderId)) {
        newSet.delete(orderId)
      } else {
        newSet.add(orderId)
      }
      return newSet
    })
  }

  function togglePOSelection(orderId: string) {
    setSelectedPOs(prev => {
      const newSet = new Set(prev)
      if (newSet.has(orderId)) {
        newSet.delete(orderId)
      } else {
        newSet.add(orderId)
      }
      return newSet
    })
  }

  function toggleSelectAllPOs() {
    const eligibleOrders = poOrders.filter(o => o.poStatus === 'Pending')
    if (selectedPOs.size === eligibleOrders.length) {
      setSelectedPOs(new Set())
    } else {
      setSelectedPOs(new Set(eligibleOrders.map(o => o.id)))
    }
  }

  function handleUploadInvoice(orderId: string) {
    fileInputRefs.current[orderId]?.click()
  }

  function handleFileChange(orderId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      // Create a mock URL for the uploaded file (in real app, this would be uploaded to server)
      const mockUrl = URL.createObjectURL(file)
      setPOOrders(prev => prev.map(o => 
        o.id === orderId 
          ? { ...o, poStatus: 'Generated', accountInvoice: mockUrl } 
          : o
      ))
      // Reset the input so the same file can be selected again
      e.target.value = ''
    }
  }

  function handleViewInvoice(invoiceUrl: string, type: string) {
    setViewingInvoice({ url: invoiceUrl, type })
  }

  function handleCloseInvoice() {
    setViewingInvoice(null)
    setImageLoadError(false)
  }

  function handleGeneratePO(order: POOrder, format: 'pdf' | 'json') {
    // In real app, this would trigger PO generation in the specified format
    console.log(`Generating PO for ${order.id} in ${format.toUpperCase()} format`)
    setPOOrders(prev => prev.map(o => o.id === order.id ? { ...o, poStatus: 'Generated' } : o))
  }

  function handleViewPO(orderId: string) {
    // In real app, this would open/download the generated PO
    console.log(`Viewing PO for ${orderId}`)
    alert(`Opening Purchase Order for ${orderId}`)
  }

  function handleBulkGeneratePO() {
    const eligibleOrders = poOrders.filter(o => selectedPOs.has(o.id) && o.poStatus === 'Pending')
    
    if (eligibleOrders.length === 0) {
      return
    }

    setPOOrders(prev => prev.map(o => selectedPOs.has(o.id) ? { ...o, poStatus: 'Generated' } : o))
    setSelectedPOs(new Set())
  }

  // Status dropdown options
  const statusOptions = [
    { value: 'All', label: 'All Status' },
    { value: 'Pending', label: 'Pending' },
    { value: 'Generated', label: 'Generated' }
  ]

  // Filter orders based on search and filters
  const filteredOrders = useMemo(() => {
    return poOrders.filter(order => {
      // Search filter
      const matchesSearch = searchQuery === '' || 
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.vendor.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items.toLowerCase().includes(searchQuery.toLowerCase())
      
      // Status filter
      const matchesStatus = statusFilter === 'All' || order.poStatus === statusFilter
      
      return matchesSearch && matchesStatus
    })
  }, [poOrders, searchQuery, statusFilter])

  // Pagination calculations
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex)

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery, statusFilter])

  const selectedPOCount = selectedPOs.size

  return (
    <div className="p-3 sm:p-6 font-sans text-primary max-w-full mx-auto">
      {/* Page Header */}
      <div className="mb-4 sm:mb-6">
        <h2 className="font-heading text-secondary text-2xl sm:text-3xl font-semibold mb-2">Invoice Management</h2>
        <p className="text-sm text-gray-600">Manage Purchase Orders and Vendor Invoices</p>
      </div>

      {/* Section 1: PO Generation */}
      <div className="mb-6 sm:mb-8">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="font-heading text-secondary text-lg sm:text-xl font-medium">Purchase Order Generation</h3>
          {selectedPOCount > 0 && (
            <button
              onClick={handleBulkGeneratePO}
              className="bg-accent text-button-text rounded-full px-4 py-2 flex items-center gap-2 hover:opacity-90 text-sm sm:text-base"
            >
              <FileText size={16} />
              <span className="hidden sm:inline">Generate PO for {selectedPOCount} order{selectedPOCount !== 1 ? 's' : ''}</span>
              <span className="sm:hidden">Generate PO ({selectedPOCount})</span>
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="mb-4 flex flex-col sm:flex-row gap-3">
          {/* Search Bar */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10" size={18} />
            <input
              type="text"
              placeholder="Search by Order ID, Vendor, or Items..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent shadow-sm"
            />
          </div>

          {/* Status Filter */}
          <div className="w-full sm:w-auto sm:min-w-[180px]">
            <CustomDropdown
              value={statusFilter}
              options={statusOptions}
              onChange={(value) => setStatusFilter(value as 'All' | POStatus)}
              placeholder="Select Status"
            />
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          {/* Desktop Table View */}
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-3 font-heading text-secondary font-medium">
                    <input
                      type="checkbox"
                      checked={selectedPOCount > 0 && selectedPOCount === poOrders.filter(o => o.poStatus === 'Pending').length}
                      onChange={toggleSelectAllPOs}
                      className="rounded"
                    />
                  </th>
                  <th className="text-left p-3 font-heading text-secondary font-medium">Order ID</th>
                  <th className="text-left p-3 font-heading text-secondary font-medium">Vendor</th>
                  <th className="text-left p-3 font-heading text-secondary font-medium">Confirmed Qty</th>
                  <th className="text-left p-3 font-heading text-secondary font-medium">Amount</th>
                  <th className="text-left p-3 font-heading text-secondary font-medium">PO Status</th>
                  <th className="text-left p-3 font-heading text-secondary font-medium">Account Invoice</th>
                  <th className="text-left p-3 font-heading text-secondary font-medium">Vendor Invoice</th>
                  <th className="text-left p-3 font-heading text-secondary font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedOrders.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="p-8 text-center text-gray-500">
                      No orders found matching your filters
                    </td>
                  </tr>
                ) : (
                  paginatedOrders.map((order, idx) => {
                    const poStyle = PO_STATUS_STYLES[order.poStatus]
                    const isSelected = selectedPOs.has(order.id)
                    const canGeneratePO = order.poStatus === 'Pending'
                    const isExpanded = expandedRows.has(order.id)

                    return (
                      <>
                        <tr key={order.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-[#F5F3E7] transition-colors'}>
                          <td className="p-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => togglePOSelection(order.id)}
                              disabled={!canGeneratePO}
                              className="rounded"
                            />
                          </td>
                          <td className="p-3 font-medium">{order.id}</td>
                          <td className="p-3">
                            <button
                              onClick={() => toggleRowExpansion(order.id)}
                              className="flex items-center gap-2 hover:text-accent transition-colors"
                            >
                              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                              <span>{order.vendor}</span>
                            </button>
                          </td>
                          <td className="p-3">{order.confirmedQty}</td>
                          <td className="p-3 font-medium">₹{order.amount.toLocaleString('en-IN')}</td>
                          <td className="p-3">
                            <span 
                              className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap"
                              style={{
                                backgroundColor: poStyle.bg,
                                color: poStyle.color,
                                borderColor: poStyle.border,
                              }}
                            >
                              {order.poStatus}
                            </span>
                          </td>
                          <td className="p-3">
                            {order.poStatus === 'Generated' && order.accountInvoice ? (
                              <button
                                onClick={() => handleViewInvoice(order.accountInvoice!, 'Account')}
                                className="flex items-center gap-1 text-accent hover:text-secondary transition-colors text-sm"
                              >
                                <Eye size={16} />
                                <span>View</span>
                              </button>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="p-3">
                            {order.vendorInvoice ? (
                              <button
                                onClick={() => handleViewInvoice(order.vendorInvoice!, 'Vendor')}
                                className="flex items-center gap-1 text-accent hover:text-secondary transition-colors text-sm"
                              >
                                <Eye size={16} />
                                <span>View</span>
                              </button>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2">
                              <input
                                type="file"
                                ref={(el) => { fileInputRefs.current[order.id] = el }}
                                onChange={(e) => handleFileChange(order.id, e)}
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="hidden"
                              />
                              <button 
                                onClick={() => handleUploadInvoice(order.id)}
                                className="rounded-full px-3 py-1.5 text-sm flex items-center gap-1 bg-accent text-button-text hover:opacity-90"
                                title="Upload Invoice"
                              >
                                <Upload size={14} />
                                <span>Upload Invoice</span>
                              </button>
                              {canGeneratePO ? (
                                <button 
                                  onClick={() => handleGeneratePO(order, 'json')}
                                  className="rounded-full px-3 py-1.5 text-sm flex items-center gap-1 bg-secondary text-white hover:opacity-90"
                                  title="Generate PO (JSON)"
                                >
                                  <FileText size={14} />
                                  <span>JSON</span>
                                </button>
                              ) : (
                                <button 
                                  onClick={() => handleViewPO(order.id)}
                                  className="rounded-full px-3 py-1.5 text-sm flex items-center gap-1 bg-secondary text-white hover:opacity-90"
                                  title="View Purchase Order"
                                >
                                  <Eye size={14} />
                                  <span>JSON</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td colSpan={9} className="p-3 pl-12">
                              <div className="bg-gray-100 rounded-lg p-3 max-w-2xl">
                                <div className="text-sm font-medium text-secondary mb-1">Items:</div>
                                <div className="text-sm text-gray-700">{order.items}</div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden">
            {paginatedOrders.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No orders found matching your filters
              </div>
            ) : (
              paginatedOrders.map((order, idx) => {
                const poStyle = PO_STATUS_STYLES[order.poStatus]
                const isSelected = selectedPOs.has(order.id)
                const canGeneratePO = order.poStatus === 'Pending'
                const isExpanded = expandedRows.has(order.id)

                return (
                  <div key={order.id} className={`p-4 border-b border-gray-200 last:border-b-0 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => togglePOSelection(order.id)}
                        disabled={!canGeneratePO}
                        className="rounded mt-1"
                      />
                      <div>
                        <div className="font-medium text-secondary">{order.id}</div>
                        <button
                          onClick={() => toggleRowExpansion(order.id)}
                          className="flex items-center gap-1 text-sm text-gray-600 hover:text-accent transition-colors mt-1"
                        >
                          {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                          <span>{order.vendor}</span>
                        </button>
                      </div>
                    </div>
                    <span 
                      className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap"
                      style={{
                        backgroundColor: poStyle.bg,
                        color: poStyle.color,
                        borderColor: poStyle.border,
                      }}
                    >
                      {order.poStatus}
                    </span>
                  </div>
                  
                  {isExpanded && (
                    <div className="mb-3 ml-8 bg-gray-100 rounded-lg p-3">
                      <div className="text-xs font-medium text-secondary mb-1">Items:</div>
                      <div className="text-sm text-gray-700">{order.items}</div>
                    </div>
                  )}
                  
                  <div className="space-y-2 mb-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Qty:</span>
                      <span className="font-medium">{order.confirmedQty}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Amount:</span>
                      <span className="font-medium">₹{order.amount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Account Invoice:</span>
                      {order.poStatus === 'Generated' && order.accountInvoice ? (
                        <button
                          onClick={() => handleViewInvoice(order.accountInvoice!, 'Account')}
                          className="flex items-center gap-1 text-accent hover:text-secondary transition-colors"
                        >
                          <Eye size={14} />
                          <span className="font-medium">View</span>
                        </button>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Vendor Invoice:</span>
                      {order.vendorInvoice ? (
                        <button
                          onClick={() => handleViewInvoice(order.vendorInvoice!, 'Vendor')}
                          className="flex items-center gap-1 text-accent hover:text-secondary transition-colors"
                        >
                          <Eye size={14} />
                          <span className="font-medium">View</span>
                        </button>
                      ) : (
                        <span className="text-gray-400">—</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <input
                      type="file"
                      ref={(el) => { fileInputRefs.current[order.id] = el }}
                      onChange={(e) => handleFileChange(order.id, e)}
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                    />
                    <button 
                      onClick={() => handleUploadInvoice(order.id)}
                      className="flex-1 rounded-full px-3 py-2 text-sm flex items-center justify-center gap-1 bg-accent text-button-text hover:opacity-90"
                    >
                      <Upload size={14} />
                      <span>Upload Invoice</span>
                    </button>
                    {canGeneratePO ? (
                      <button 
                        onClick={() => handleGeneratePO(order, 'json')}
                        className="flex-1 rounded-full px-3 py-2 text-sm flex items-center justify-center gap-1 bg-secondary text-white hover:opacity-90"
                      >
                        <FileText size={14} />
                        <span>JSON</span>
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleViewPO(order.id)}
                        className="flex-1 rounded-full px-3 py-2 text-sm flex items-center justify-center gap-1 bg-secondary text-white hover:opacity-90"
                      >
                        <Eye size={14} />
                        <span>JSON</span>
                      </button>
                    )}
                  </div>
                </div>
                )
              })
            )}
          </div>
        </div>

        {/* Pagination Controls */}
        {filteredOrders.length > 0 && (
          <div className="mt-6 bg-white border border-gray-200 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="text-sm text-gray-600 text-center sm:text-left">
                Showing {startIndex + 1} to {Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length} orders
              </div>
              
              <div className="flex items-center justify-center gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                    currentPage === 1 
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                      : 'bg-white text-secondary border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Previous
                </button>
                
                <div className="flex gap-1 max-w-[200px] overflow-x-auto">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                    let page: number;
                    if (totalPages <= 5) {
                      page = i + 1;
                    } else if (currentPage <= 3) {
                      page = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      page = totalPages - 4 + i;
                    } else {
                      page = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`px-3 py-2 rounded-lg border text-sm min-w-[44px] transition-colors ${
                          currentPage === page
                            ? 'bg-accent text-button-text border-accent'
                            : 'bg-white text-secondary border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
                
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className={`px-3 py-2 rounded-lg border text-sm transition-colors ${
                    currentPage === totalPages 
                      ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                      : 'bg-white text-secondary border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Invoice Viewer Modal */}
      {viewingInvoice && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="invoice-modal-title"
        >
          <div className="bg-white rounded-2xl w-full max-w-[95vw] sm:max-w-5xl max-h-[95vh] flex flex-col shadow-2xl">
            {/* Header - Fixed */}
            <div className="flex items-center justify-between px-4 py-3 sm:px-6 sm:py-4 border-b border-gray-200 flex-shrink-0">
              <h3 id="invoice-modal-title" className="font-heading text-secondary font-normal text-lg sm:text-xl">
                {viewingInvoice.type} Invoice
              </h3>
              <button
                onClick={handleCloseInvoice}
                className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                aria-label="Close invoice viewer"
              >
                <X size={24} />
              </button>
            </div>
            
            {/* Content - Scrollable */}
            <div className="flex-1 overflow-auto p-4 sm:p-6 bg-gray-50">
              <div className="flex items-start justify-center min-h-full">
                {imageLoadError ? (
                  <div className="text-center p-8 text-gray-500">
                    Unable to load invoice preview.{' '}
                    <a 
                      href={viewingInvoice.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-accent hover:underline"
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
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AccountsInvoices
