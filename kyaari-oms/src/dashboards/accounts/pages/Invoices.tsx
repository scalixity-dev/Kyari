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
    <div className="p-4 sm:p-6 lg:pl-9 xl:p-9 2xl:p-9 bg-[color:var(--color-sharktank-bg)] min-h-[calc(100vh-4rem)] font-sans w-full overflow-x-hidden">
      {/* Page Header */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--color-heading)] mb-2">Invoice Management</h2>
        <p className="text-sm text-[var(--color-heading)]">Manage Purchase Orders and Vendor Invoices</p>
      </div>

      {/* Section 1: PO Generation */}
      <div className="mb-6 sm:mb-8">
        <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h3 className="text-lg sm:text-xl font-semibold text-[var(--color-heading)]">Purchase Order Generation</h3>
          {selectedPOCount > 0 && (
            <button
              onClick={handleBulkGeneratePO}
              className="bg-accent text-button-text rounded-full px-4 xl:px-5 2xl:px-6 py-2 xl:py-2.5 2xl:py-3 flex items-center gap-2 xl:gap-3 2xl:gap-4 hover:opacity-90 text-sm sm:text-base xl:text-lg 2xl:text-xl transition-opacity"
            >
              <FileText size={16} className="xl:w-5 xl:h-5 2xl:w-6 2xl:h-6" />
              <span className="hidden sm:inline">Generate PO for {selectedPOCount} order{selectedPOCount !== 1 ? 's' : ''}</span>
              <span className="sm:hidden">Generate PO ({selectedPOCount})</span>
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="mb-4 xl:mb-5 2xl:mb-6 bg-white rounded-xl shadow-md p-3 sm:p-4 xl:p-5 2xl:p-6 border border-gray-200">
          <div className="flex flex-col sm:flex-row gap-3 xl:gap-4 2xl:gap-5 xl:items-center">
            {/* Search Bar */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none z-10" size={18} />
              <input
                type="text"
                placeholder="Search by Order ID, Vendor, or Items..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent shadow-sm text-sm min-h-[44px]"
              />
            </div>

            {/* Status Filter */}
            <div className="w-full sm:w-auto sm:min-w-[180px] xl:min-w-[200px] 2xl:min-w-[220px]">
              <CustomDropdown
                value={statusFilter}
                options={statusOptions}
                onChange={(value) => setStatusFilter(value as 'All' | POStatus)}
                placeholder="Select Status"
              />
            </div>
          </div>
        </div>

        <div className="hidden lg:block rounded-xl shadow-md overflow-hidden border border-white/10 bg-white/70">
          {/* Table head bar */}
          <div className="bg-[#C3754C] text-white">
            <div className="grid grid-cols-[50px_90px_1fr_0.8fr_0.9fr_0.8fr_0.8fr_0.8fr_150px] xl:grid-cols-[60px_100px_1.2fr_0.9fr_1fr_0.9fr_0.9fr_0.9fr_170px] 2xl:grid-cols-[70px_120px_1.3fr_1fr_1.1fr_1fr_1fr_1fr_190px] gap-2 xl:gap-3 2xl:gap-4 px-3 xl:px-4 2xl:px-6 py-3 xl:py-4 2xl:py-5 font-['Quicksand'] font-bold text-sm xl:text-base 2xl:text-lg leading-[100%] tracking-[0] text-center">
              <div className="flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={selectedPOCount > 0 && selectedPOCount === poOrders.filter(o => o.poStatus === 'Pending').length}
                  onChange={toggleSelectAllPOs}
                  className="rounded border-white w-4 h-4"
                />
              </div>
              <div className="text-xs xl:text-sm 2xl:text-base">Order ID</div>
              <div className="text-xs xl:text-sm 2xl:text-base">Vendor</div>
              <div className="text-xs xl:text-sm 2xl:text-base">Confirmed Qty</div>
              <div className="text-xs xl:text-sm 2xl:text-base">Amount</div>
              <div className="text-xs xl:text-sm 2xl:text-base">PO Status</div>
              <div className="text-xs xl:text-sm 2xl:text-base">Account Invoice</div>
              <div className="text-xs xl:text-sm 2xl:text-base">Vendor Invoice</div>
              <div className="text-xs xl:text-sm 2xl:text-base">Actions</div>
            </div>
          </div>

          {/* Body */}
          <div className="bg-white">
            <div className="py-2">
              {paginatedOrders.length === 0 ? (
                <div className="px-3 xl:px-4 2xl:px-6 py-6 xl:py-8 text-center text-gray-500 text-xs xl:text-sm 2xl:text-base">No orders found matching your filters</div>
              ) : (
                paginatedOrders.map((order) => {
                  const poStyle = PO_STATUS_STYLES[order.poStatus]
                  const isSelected = selectedPOs.has(order.id)
                  const canGeneratePO = order.poStatus === 'Pending'
                  const isExpanded = expandedRows.has(order.id)

                  return (
                    <div key={order.id}>
                      <div className="grid grid-cols-[50px_90px_1fr_0.8fr_0.9fr_0.8fr_0.8fr_0.8fr_150px] xl:grid-cols-[60px_100px_1.2fr_0.9fr_1fr_0.9fr_0.9fr_0.9fr_170px] 2xl:grid-cols-[70px_120px_1.3fr_1fr_1.1fr_1fr_1fr_1fr_190px] gap-2 xl:gap-3 2xl:gap-4 px-3 xl:px-4 2xl:px-6 py-2 xl:py-3 2xl:py-4 items-center text-center hover:bg-gray-50 font-bold">
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => togglePOSelection(order.id)}
                            disabled={!canGeneratePO}
                            className="rounded border-gray-300 w-4 h-4"
                          />
                        </div>
                        <div className="text-[10px] xl:text-xs 2xl:text-sm font-medium text-gray-800 truncate">{order.id}</div>
                        <div className="flex items-center justify-center min-w-0">
                          <button
                            onClick={() => toggleRowExpansion(order.id)}
                            className="flex items-center gap-0.5 xl:gap-1 hover:text-accent transition-colors text-[10px] xl:text-xs 2xl:text-sm text-gray-700 min-w-0 max-w-full"
                          >
                            {isExpanded ? <ChevronDown size={12} className="flex-shrink-0" /> : <ChevronRight size={12} className="flex-shrink-0" />}
                            <span className="truncate">{order.vendor}</span>
                          </button>
                        </div>
                        <div className="text-[10px] xl:text-xs 2xl:text-sm font-semibold text-gray-900">{order.confirmedQty}</div>
                        <div className="text-[10px] xl:text-xs 2xl:text-sm font-semibold text-gray-900 truncate">₹{order.amount.toLocaleString('en-IN')}</div>
                        <div className="flex items-center justify-center">
                          <span 
                            className="inline-block px-1 xl:px-1.5 2xl:px-2 py-0.5 xl:py-1 rounded-md text-[9px] xl:text-[10px] 2xl:text-xs font-semibold whitespace-nowrap"
                            style={{
                              backgroundColor: poStyle.bg,
                              color: poStyle.color,
                            }}
                          >
                            {order.poStatus}
                          </span>
                        </div>
                        <div className="flex items-center justify-center">
                          {order.poStatus === 'Generated' && order.accountInvoice ? (
                            <button
                              onClick={() => handleViewInvoice(order.accountInvoice!, 'Account')}
                              className="flex items-center gap-0.5 text-accent hover:text-secondary transition-colors text-[9px] xl:text-[10px] 2xl:text-xs whitespace-nowrap"
                            >
                              <Eye size={10} className="flex-shrink-0" />
                              <span>View</span>
                            </button>
                          ) : (
                            <span className="text-gray-400 text-[9px] xl:text-[10px] 2xl:text-xs">—</span>
                          )}
                        </div>
                        <div className="flex items-center justify-center">
                          {order.vendorInvoice ? (
                            <button
                              onClick={() => handleViewInvoice(order.vendorInvoice!, 'Vendor')}
                              className="flex items-center gap-0.5 text-accent hover:text-secondary transition-colors text-[9px] xl:text-[10px] 2xl:text-xs whitespace-nowrap"
                            >
                              <Eye size={10} className="flex-shrink-0" />
                              <span>View</span>
                            </button>
                          ) : (
                            <span className="text-gray-400 text-[9px] xl:text-[10px] 2xl:text-xs">—</span>
                          )}
                        </div>
                        <div className="flex gap-0.5 xl:gap-1 justify-center items-center">
                          <input
                            type="file"
                            ref={(el) => { fileInputRefs.current[order.id] = el }}
                            onChange={(e) => handleFileChange(order.id, e)}
                            accept=".pdf,.jpg,.jpeg,.png"
                            className="hidden"
                          />
                          <button 
                            onClick={() => handleUploadInvoice(order.id)}
                            className="rounded-md px-1 xl:px-1.5 2xl:px-2 py-0.5 xl:py-1 text-[9px] xl:text-[10px] 2xl:text-xs flex items-center gap-0.5 bg-accent text-button-text hover:opacity-90 whitespace-nowrap flex-shrink-0"
                            title="Upload Invoice"
                          >
                            <Upload size={10} className="flex-shrink-0" />
                            <span>Upload</span>
                          </button>
                          {canGeneratePO ? (
                            <button 
                              onClick={() => handleGeneratePO(order, 'json')}
                              className="rounded-md px-1 xl:px-1.5 2xl:px-2 py-0.5 xl:py-1 text-[9px] xl:text-[10px] 2xl:text-xs flex items-center gap-0.5 bg-secondary text-white hover:opacity-90 whitespace-nowrap flex-shrink-0"
                              title="Generate PO (JSON)"
                            >
                              <FileText size={10} className="flex-shrink-0" />
                              <span>JSON</span>
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleViewPO(order.id)}
                              className="rounded-md px-1 xl:px-1.5 2xl:px-2 py-0.5 xl:py-1 text-[9px] xl:text-[10px] 2xl:text-xs flex items-center gap-0.5 bg-secondary text-white hover:opacity-90 whitespace-nowrap flex-shrink-0"
                              title="View Purchase Order"
                            >
                              <Eye size={10} className="flex-shrink-0" />
                              <span>JSON</span>
                            </button>
                          )}
                        </div>
                      </div>
                      {isExpanded && (
                        <div className="px-3 xl:px-4 2xl:px-6 py-2 xl:py-3 bg-gray-50 border-t border-gray-100">
                          <div className="bg-white rounded-lg p-2 xl:p-3 2xl:p-4 max-w-3xl">
                            <div className="text-xs xl:text-sm 2xl:text-base font-medium text-secondary mb-1">Items:</div>
                            <div className="text-xs xl:text-sm 2xl:text-base text-gray-700">{order.items}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Pagination controls (desktop) */}
          <div className="flex items-center justify-between px-3 xl:px-4 2xl:px-6 py-2.5 xl:py-3 bg-white border-t border-gray-100">
            <div className="text-[10px] xl:text-xs 2xl:text-sm text-gray-500">
              Showing {filteredOrders.length === 0 ? 0 : startIndex + 1}-{Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length}
            </div>
            <div className="flex items-center gap-1 xl:gap-1.5 2xl:gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="h-7 w-7 xl:h-8 xl:w-8 2xl:h-9 2xl:w-9 flex items-center justify-center rounded-md border border-gray-200 text-gray-700 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                aria-label="Previous page"
              >
                <svg className="w-3.5 h-3.5 xl:w-4 xl:h-4 2xl:w-5 2xl:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`min-w-7 h-7 xl:min-w-8 xl:h-8 2xl:min-w-9 2xl:h-9 px-1.5 xl:px-2 2xl:px-2.5 rounded-md border text-[10px] xl:text-xs 2xl:text-sm transition-colors ${currentPage === p ? 'bg-[var(--color-secondary)] text-white border-[var(--color-secondary)]' : 'border-gray-200 text-gray-700 bg-white hover:bg-gray-50'}`}
                >
                  {p}
                </button>
              ))}
              <button
                onClick={() => {
                  if (filteredOrders.length === 0) return
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }}
                disabled={filteredOrders.length === 0 || currentPage === totalPages}
                className="h-7 w-7 xl:h-8 xl:w-8 2xl:h-9 2xl:w-9 flex items-center justify-center rounded-md border border-gray-200 text-gray-700 disabled:opacity-40 hover:bg-gray-50 transition-colors"
                aria-label="Next page"
              >
                <svg className="w-3.5 h-3.5 xl:w-4 xl:h-4 2xl:w-5 2xl:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
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

          {/* Pagination controls (mobile) */}
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200">
            <div className="text-xs text-gray-500">
              {filteredOrders.length === 0 ? 'No results' : `Showing ${startIndex + 1}-${Math.min(endIndex, filteredOrders.length)} of ${filteredOrders.length}`}
            </div>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))} 
                disabled={currentPage === 1} 
                className="h-8 px-3 rounded-md border border-gray-200 text-gray-700 disabled:opacity-40 text-sm font-medium"
              >
                Prev
              </button>
            <button 
              onClick={() => {
                if (filteredOrders.length === 0) return
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }} 
              disabled={filteredOrders.length === 0 || currentPage === totalPages} 
              className="h-8 px-3 rounded-md border border-gray-200 text-gray-700 disabled:opacity-40 text-sm font-medium"
            >
              Next
            </button>
            </div>
          </div>
        </div>
      </div>

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
                {imageLoadError ? (
                  <div className="text-center p-8 xl:p-10 2xl:p-12 text-gray-500 text-sm xl:text-base 2xl:text-lg">
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
