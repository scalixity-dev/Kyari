import { useState, useRef, useMemo, useEffect } from 'react'
import { FileText, Upload, Search, ChevronDown, ChevronRight, Eye, X } from 'lucide-react'
import { CustomDropdown } from '../../../components/CustomDropdown/CustomDropdown'
import { JsonViewerModal } from '../../../components/JsonViewerModal'
import { Pagination } from '../../../components/ui/Pagination'
import { Loader } from '../../../components/Loader'
import { InvoiceApiService } from '../../../services/invoiceApi'
import type { POOrder, POStatus } from '../../../services/invoiceApi'
import toast from 'react-hot-toast'

const PO_STATUS_STYLES: Record<POStatus, { bg: string; color: string; border: string }> = {
  'Pending': { bg: '#FEF9C3', color: '#92400E', border: '#FEF08A' },
  'Generated': { bg: '#D1FAE5', color: '#065F46', border: '#A7F3D0' },
}

function AccountsInvoices() {
  const [poOrders, setPOOrders] = useState<POOrder[]>([])
  const [loading, setLoading] = useState(true)
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

  // JSON viewer state
  const [jsonViewerOpen, setJsonViewerOpen] = useState(false)
  const [currentJsonData, setCurrentJsonData] = useState<Record<string, unknown> | null>(null)
  const [currentInvoiceNumber, setCurrentInvoiceNumber] = useState<string>('')
  
  // JSON loading states
  const [jsonLoadingStates, setJsonLoadingStates] = useState<Set<string>>(new Set())

  // Fetch PO orders on mount
  useEffect(() => {
    fetchPOOrders()
  }, [])

  const fetchPOOrders = async () => {
    try {
      setLoading(true)
      const orders = await InvoiceApiService.getPOOrders()
      setPOOrders(orders)
    } catch (error) {
      console.error('Failed to fetch PO orders:', error)
    } finally {
      setLoading(false)
    }
  }

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
    const order = poOrders.find(o => o.id === orderId)
    
    // Validate that PO is created before allowing upload
    if (!order) {
      toast.error('Order not found')
      return
    }
    
    if (order.poStatus === 'Pending') {
      toast.error('Please create PO for this order first before uploading invoice')
      return
    }
    
    fileInputRefs.current[orderId]?.click()
  }

  async function handleFileChange(orderId: string, e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      try {
        const order = poOrders.find(o => o.id === orderId)
        if (!order) {
          toast.error('Order not found')
          return
        }
        
        // Double-check PO status (in case state changed)
        if (order.poStatus === 'Pending') {
          toast.error('Please create PO for this order first before uploading invoice')
          return
        }

        // Upload file to S3 and link to order
        await InvoiceApiService.uploadAndLinkInvoice(
          file,
          order.orderId,
          order.vendorId
        )

        // Refresh PO orders to get latest data with updated status
        await fetchPOOrders()
      } catch (error) {
        console.error('Failed to upload invoice:', error)
      }
      
      // Reset the input so the same file can be selected again
      e.target.value = ''
    }
  }

  function handleViewInvoice(invoiceUrl: string, type: string) {
    setViewingInvoice({ url: invoiceUrl, type })
    setImageLoadError(false)
  }

  function handleCloseInvoice() {
    setViewingInvoice(null)
    setImageLoadError(false)
  }

  // Helper functions for JSON loading states
  function setJsonLoading(orderId: string, isLoading: boolean) {
    setJsonLoadingStates(prev => {
      const newSet = new Set(prev)
      if (isLoading) {
        newSet.add(orderId)
      } else {
        newSet.delete(orderId)
      }
      return newSet
    })
  }

  function isJsonLoading(orderId: string): boolean {
    return jsonLoadingStates.has(orderId)
  }

  // Detect file type from URL
  function getFileType(url: string): 'pdf' | 'image' | 'unknown' {
    const lowerUrl = url.toLowerCase()
    if (lowerUrl.includes('.pdf') || lowerUrl.includes('application/pdf')) {
      return 'pdf'
    }
    if (lowerUrl.match(/\.(jpg|jpeg|png|gif|webp|bmp)/)) {
      return 'image'
    }
    return 'unknown'
  }

  function handleDownloadJson() {
    if (!currentJsonData) return
    const blob = new Blob([JSON.stringify(currentJsonData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `invoice-${currentInvoiceNumber}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function handleGeneratePO(order: POOrder, format: 'pdf' | 'json') {
    try {
      if (format === 'json') {
        setJsonLoading(order.id, true)
        
        // Generate invoice in JSON format with separate orderId and vendorId
        const invoice = await InvoiceApiService.generateInvoice({
          orderId: order.orderId, // Use the actual order ID
          vendorId: order.vendorId,
          items: [],
          totalAmount: order.amount
        })

        // Check if invoice already existed
        if (invoice.alreadyExists && invoice.jsonContent) {
          toast.success('Invoice already exists. Opening viewer...')
          // Show in JSON viewer modal
          setCurrentJsonData(invoice.jsonContent as Record<string, unknown>)
          setCurrentInvoiceNumber((invoice.invoiceNumber as string) || (invoice.id as string) || 'invoice')
          setJsonViewerOpen(true)
        } else if (invoice.jsonContent) {
          // New invoice created, show in viewer to download
          toast.success('Invoice generated successfully!')
          setCurrentJsonData(invoice.jsonContent as Record<string, unknown>)
          setCurrentInvoiceNumber((invoice.invoiceNumber as string) || (invoice.id as string) || 'invoice')
          setJsonViewerOpen(true)
        }

        // Refresh data to update status
        await fetchPOOrders()
      }
    } catch (error) {
      console.error('Failed to generate PO:', error)
      toast.error('Failed to generate invoice')
    } finally {
      setJsonLoading(order.id, false)
    }
  }

  async function handleViewPO(orderId: string) {
    try {
      setJsonLoading(orderId, true)
      
      const order = poOrders.find(o => o.id === orderId)
      if (!order?.invoiceId) {
        toast.error('No invoice data available for this order')
        return
      }

      // Fetch invoice JSON data from backend
      const invoiceData = await InvoiceApiService.getInvoiceJson(order.invoiceId)
      
      // Show in JSON viewer modal
      setCurrentJsonData(invoiceData.jsonContent as Record<string, unknown>)
      setCurrentInvoiceNumber((invoiceData.invoiceNumber as string) || order.orderNumber)
      setJsonViewerOpen(true)
    } catch (error) {
      console.error('Failed to view invoice JSON:', error)
      toast.error('Failed to load invoice data')
    } finally {
      setJsonLoading(orderId, false)
    }
  }

  async function handleBulkGeneratePO() {
    const eligibleOrders = poOrders.filter(o => selectedPOs.has(o.id) && o.poStatus === 'Pending')
    
    if (eligibleOrders.length === 0) {
      return
    }

    try {
      // Generate invoices for all selected orders
      await Promise.all(
        eligibleOrders.map(order => 
          InvoiceApiService.generateInvoice({
            orderId: order.orderId, // Use actual order ID
            vendorId: order.vendorId,
            items: [],
            totalAmount: order.amount
          })
        )
      )

      // Refresh data
      await fetchPOOrders()
      setSelectedPOs(new Set())
    } catch (error) {
      console.error('Failed to bulk generate POs:', error)
    }
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
        order.orderId.toLowerCase().includes(searchQuery.toLowerCase()) ||
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

  // Reset filters function
  function resetFilters() {
    setSearchQuery('')
    setStatusFilter('All')
    setCurrentPage(1)
  }

  return (
    <div className="p-4 sm:p-6 lg:pl-9 xl:p-9 2xl:p-9 bg-[color:var(--color-sharktank-bg)] min-h-[calc(100vh-4rem)] font-sans w-full overflow-x-hidden">
      {/* Page Header */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-heading mb-2">Invoice Management</h1>
        <p className="text-sm sm:text-base text-gray-600">Manage Purchase Orders and Vendor Invoices</p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader size="xl" color="primary" />
        </div>
      )}

      {/* Empty State */}
      {!loading && poOrders.length === 0 && (
        <div className="bg-white rounded-xl shadow-md border border-white/20 p-12 text-center">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No PO Orders Found</h3>
          <p className="text-gray-500">No confirmed vendor orders are ready for invoice generation.</p>
        </div>
      )}

      {/* Section 1: PO Generation */}
      {!loading && poOrders.length > 0 && (
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
          <div className="flex flex-col sm:flex-row gap-3 xl:gap-4 2xl:gap-5 items-stretch sm:items-end">
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
                className="[&>button]:py-2 [&>button]:xl:py-2.5 [&>button]:2xl:py-3"
              />
            </div>

            {/* Reset Button */}
            <div className="flex justify-end sm:justify-start">
              <button 
                onClick={resetFilters} 
                className="bg-white text-secondary border border-secondary rounded-xl px-3 sm:px-4 py-2.5 text-xs sm:text-sm hover:bg-gray-50 transition-colors duration-200 min-h-[44px]"
              >
                Reset
              </button>
            </div>
          </div>
        </div>

        <div className="hidden lg:block rounded-xl shadow-md overflow-hidden border border-white/10 bg-white/70">
          {/* Table head bar */}
          <div className="bg-[#C3754C] text-white">
            <div className="grid grid-cols-[50px_90px_90px_1fr_0.8fr_0.9fr_0.8fr_0.8fr_0.8fr_150px] xl:grid-cols-[60px_100px_100px_1.2fr_0.9fr_1fr_0.9fr_0.9fr_0.9fr_170px] 2xl:grid-cols-[70px_120px_120px_1.3fr_1fr_1.1fr_1fr_1fr_1fr_190px] gap-2 xl:gap-3 2xl:gap-4 px-3 xl:px-4 2xl:px-6 py-3 xl:py-4 2xl:py-5 font-['Fraunces'] text-sm xl:text-base 2xl:text-lg leading-[100%] tracking-[0] text-center">
              <div className="flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={selectedPOCount > 0 && selectedPOCount === poOrders.filter(o => o.poStatus === 'Pending').length}
                  onChange={toggleSelectAllPOs}
                  className="rounded border-white w-4 h-4"
                />
              </div>
              <div className="text-xs xl:text-sm 2xl:text-base">Order ID</div>
              <div className="text-xs xl:text-sm 2xl:text-base">PO ID</div>
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
                      <div className="grid grid-cols-[50px_90px_90px_1fr_0.8fr_0.9fr_0.8fr_0.8fr_0.8fr_150px] xl:grid-cols-[60px_100px_100px_1.2fr_0.9fr_1fr_0.9fr_0.9fr_0.9fr_170px] 2xl:grid-cols-[70px_120px_120px_1.3fr_1fr_1.1fr_1fr_1fr_1fr_190px] gap-2 xl:gap-3 2xl:gap-4 px-3 xl:px-4 2xl:px-6 py-2 xl:py-3 2xl:py-4 items-center text-center hover:bg-gray-50 font-bold">
                        <div className="flex items-center justify-center">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => togglePOSelection(order.id)}
                            disabled={!canGeneratePO}
                            className="rounded border-gray-300 w-4 h-4"
                          />
                        </div>
                        <div className="text-[10px] xl:text-xs 2xl:text-sm font-medium text-gray-800 truncate">{order.orderId}</div>
                        <div className="text-[10px] xl:text-xs 2xl:text-sm font-medium text-gray-800 truncate">
                          {order.poStatus === 'Generated' && order.poNumber ? order.poNumber : '—'}
                        </div>
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
                              disabled={isJsonLoading(order.id)}
                              className="rounded-md px-1 xl:px-1.5 2xl:px-2 py-0.5 xl:py-1 text-[9px] xl:text-[10px] 2xl:text-xs flex items-center gap-0.5 bg-secondary text-white hover:opacity-90 whitespace-nowrap flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Generate PO (JSON)"
                            >
                              {isJsonLoading(order.id) ? (
                                <Loader size="xs" color="white" className="flex-shrink-0" />
                              ) : (
                                <FileText size={10} className="flex-shrink-0" />
                              )}
                              <span>JSON</span>
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleViewPO(order.id)}
                              disabled={isJsonLoading(order.id)}
                              className="rounded-md px-1 xl:px-1.5 2xl:px-2 py-0.5 xl:py-1 text-[9px] xl:text-[10px] 2xl:text-xs flex items-center gap-0.5 bg-secondary text-white hover:opacity-90 whitespace-nowrap flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="View Purchase Order"
                            >
                              {isJsonLoading(order.id) ? (
                                <Loader size="xs" color="white" className="flex-shrink-0" />
                              ) : (
                                <Eye size={10} className="flex-shrink-0" />
                              )}
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

          {filteredOrders.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredOrders.length}
              startIndex={startIndex}
              endIndex={Math.min(endIndex, filteredOrders.length)}
              onPageChange={setCurrentPage}
              itemLabel="invoices"
              variant="desktop"
            />
          )}
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
                        <div className="font-medium text-secondary">{order.orderId}</div>
                        {order.poStatus === 'Generated' && order.poNumber && (
                          <div className="text-xs text-gray-500 mt-0.5">PO: {order.poNumber}</div>
                        )}
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
                        disabled={isJsonLoading(order.id)}
                        className="flex-1 rounded-full px-3 py-2 text-sm flex items-center justify-center gap-1 bg-secondary text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isJsonLoading(order.id) ? (
                          <Loader size="sm" color="white" />
                        ) : (
                          <FileText size={14} />
                        )}
                        <span>JSON</span>
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleViewPO(order.id)}
                        disabled={isJsonLoading(order.id)}
                        className="flex-1 rounded-full px-3 py-2 text-sm flex items-center justify-center gap-1 bg-secondary text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {isJsonLoading(order.id) ? (
                          <Loader size="sm" color="white" />
                        ) : (
                          <Eye size={14} />
                        )}
                        <span>JSON</span>
                      </button>
                    )}
                  </div>
                </div>
                )
              })
            )}

          {filteredOrders.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredOrders.length}
              startIndex={startIndex}
              endIndex={Math.min(endIndex, filteredOrders.length)}
              onPageChange={setCurrentPage}
              itemLabel="invoices"
              variant="mobile"
            />
          )}
        </div>
      </div>
      )}

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

      {/* JSON Viewer Modal */}
      <JsonViewerModal
        isOpen={jsonViewerOpen}
        onClose={() => setJsonViewerOpen(false)}
        jsonData={currentJsonData}
        title={`Invoice JSON - ${currentInvoiceNumber}`}
        onDownload={handleDownloadJson}
      />
    </div>
  )
}

export default AccountsInvoices
