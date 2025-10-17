import { useState, useEffect, useRef } from 'react'
import { Plus, Upload, Search, FileText, ChevronDown, ChevronRight, Edit, Trash2, Calendar as CalendarIcon } from 'lucide-react'
import { CustomDropdown, ConfirmationModal, CSVPDFExportButton, Pagination } from '../../../components'
import { Calendar } from '../../../components/ui/calendar'
import { format } from 'date-fns'
import { orderApi, type OrderListItem, type CreateOrderRequest, type Order } from '../../../services/orderApi'
import { vendorApi, type VendorListItem } from '../../../services/vendorApi'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

type OrderStatus = 'RECEIVED' | 'ASSIGNED' | 'PROCESSING' | 'FULFILLED' | 'PARTIALLY_FULFILLED' | 'CLOSED' | 'CANCELLED'

const STATUS_STYLES: Record<OrderStatus, { label: string; bg: string; color: string; border: string }> = {
  RECEIVED: { label: 'Received', bg: '#E5E7EB', color: '#111827', border: '#D1D5DB' },
  ASSIGNED: { label: 'Assigned', bg: '#DBEAFE', color: '#1E3A8A', border: '#BFDBFE' },
  PROCESSING: { label: 'Processing', bg: '#FEF08A', color: '#92400E', border: '#FDE047' },
  FULFILLED: { label: 'Fulfilled', bg: '#D1FAE5', color: '#065F46', border: '#A7F3D0' },
  PARTIALLY_FULFILLED: { label: 'Partial', bg: '#FFEDD5', color: '#9A3412', border: '#FED7AA' },
  CLOSED: { label: 'Closed', bg: '#E0ECE8', color: '#1D4D43', border: '#B7CEC6' },
  CANCELLED: { label: 'Cancelled', bg: '#FEE2E2', color: '#991B1B', border: '#FECACA' },
}

type OrderItem = {
  sku: string
  product: string
  qty: number | ''
  amount: number | ''
}

type NewOrderDraft = {
  orderNumber: string
  items: OrderItem[]
  vendorId: string
}

export default function Orders() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState<OrderListItem[]>([])
  const [vendors, setVendors] = useState<VendorListItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isLoadingVendors, setIsLoadingVendors] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null)
  const [expandedOrderDetails, setExpandedOrderDetails] = useState<Order | null>(null)
  const [isLoadingDetails, setIsLoadingDetails] = useState(false)
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null)
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false)
  const [selectedOrderForAssign, setSelectedOrderForAssign] = useState<OrderListItem | null>(null)
  const [assignVendorId, setAssignVendorId] = useState('')
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [orderToDelete, setOrderToDelete] = useState<OrderListItem | null>(null)
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [isBulkAssignModalOpen, setIsBulkAssignModalOpen] = useState(false)
  const [bulkAssignVendorId, setBulkAssignVendorId] = useState('')

  const [filterVendorId, setFilterVendorId] = useState('')
  const [filterStatus, setFilterStatus] = useState<OrderStatus | ''>('')
  const [filterSearch, setFilterSearch] = useState('')
  const [filterFromDate, setFilterFromDate] = useState<Date | undefined>()
  const [filterToDate, setFilterToDate] = useState<Date | undefined>()
  const [showFromCalendar, setShowFromCalendar] = useState(false)
  const [showToCalendar, setShowToCalendar] = useState(false)
  const fromCalendarRef = useRef<HTMLDivElement>(null)
  const toCalendarRef = useRef<HTMLDivElement>(null)

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [total, setTotal] = useState(0)
  const itemsPerPage = 10

  const [draft, setDraft] = useState<NewOrderDraft>({
    orderNumber: '',
    items: [{ sku: '', product: '', qty: '', amount: '' }],
    vendorId: '',
  })

  // Generate automatic order number with timestamp
  const generateOrderNumber = () => {
    const now = new Date()
    const year = now.getFullYear().toString().slice(-2)
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const day = now.getDate().toString().padStart(2, '0')
    const time = Date.now().toString().slice(-6)
    return `ORD-${year}${month}${day}-${time}`
  }

  // Fetch vendors for the dropdown
  const fetchVendors = async () => {
    try {
      setIsLoadingVendors(true)
      const response = await vendorApi.getVendors({ status: 'ACTIVE', verified: true, limit: 100 })
      setVendors(response.vendors)
    } catch (error) {
      console.error('Error fetching vendors:', error)
    } finally {
      setIsLoadingVendors(false)
    }
  }

  // Fetch vendors and generate order number when Add Modal opens
  useEffect(() => {
    if (isAddModalOpen) {
      if (vendors.length === 0) {
        fetchVendors()
      }
      // Generate new order number when modal opens
      if (!draft.orderNumber) {
        setDraft(prev => ({ ...prev, orderNumber: generateOrderNumber() }))
      }
    }
  }, [isAddModalOpen])

  // Fetch orders from backend
  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      const response = await orderApi.getOrders({
        page: currentPage,
        limit: itemsPerPage,
        status: filterStatus || undefined,
        vendorId: filterVendorId || undefined,
        search: filterSearch || undefined,
      })
      
      setOrders(response.orders)
      setTotalPages(response.pagination.pages)
      setTotal(response.pagination.total)
    } catch (error) {
      toast.error('Failed to load orders')
      console.error('Error fetching orders:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Fetch orders on mount and when filters/pagination change
  useEffect(() => {
    fetchOrders()
  }, [currentPage, filterStatus, filterVendorId, filterSearch])

  // Reset pagination when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1)
    }
  }, [filterStatus, filterVendorId, filterSearch])

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

  function resetFilters() {
    setFilterVendorId('')
    setFilterStatus('')
    setFilterSearch('')
    setFilterFromDate(undefined)
    setFilterToDate(undefined)
    setShowFromCalendar(false)
    setShowToCalendar(false)
    setCurrentPage(1)
  }

  async function handleAddOrder() {
    if (!draft.orderNumber || draft.items.length === 0) {
      toast.error('Please fill all required fields')
      return
    }

    // If editing, vendorId is required
    if (editingOrderId && !draft.vendorId) {
      toast.error('Vendor is required when editing an order')
      return
    }

    // Vendor is optional for new orders (can be assigned later)
    
    // Validate all items
    for (const item of draft.items) {
      if (!item.product || item.qty === '' || item.amount === '') {
        toast.error('Please fill all item fields including product name, quantity and amount')
        return
      }
      if (Number(item.qty) <= 0 || Number(item.amount) <= 0) {
        toast.error('Quantity and amount must be greater than 0')
        return
      }
    }
    
    try {
      setIsLoading(true)
      const orderData: CreateOrderRequest = {
        orderNumber: draft.orderNumber,
        primaryVendorId: draft.vendorId,
        items: draft.items.map(item => ({
          productName: item.product,
          sku: item.sku || undefined,
          quantity: Number(item.qty),
          pricePerUnit: Number(item.amount)
        }))
      }
      
      if (editingOrderId) {
        await orderApi.updateOrder(editingOrderId, orderData)
        toast.success('Order updated successfully!')
      } else {
        // Create new order
      await orderApi.createOrder(orderData)
        toast.success('Order created successfully! Use "Assign" button to assign vendor.')
      }
      
      setIsAddModalOpen(false)
      setEditingOrderId(null)
      // Reset draft with new auto-generated order number
      setDraft({ orderNumber: generateOrderNumber(), items: [{ sku: '', product: '', qty: '', amount: '' }], vendorId: '' })
      fetchOrders() // Refresh the list
    } catch (error) {
      toast.error(error instanceof Error ? error.message : `Failed to ${editingOrderId ? 'update' : 'create'} order`)
    } finally {
      setIsLoading(false)
    }
  }

  function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) {
      // Validate file type
      const validTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        '.xls',
        '.xlsx'
      ]
      
      const isValidType = validTypes.some(type => 
        file.type === type || file.name.toLowerCase().endsWith(type)
      )
      
      if (!isValidType) {
        toast.error('Please select a valid Excel file (.xls or .xlsx)')
        event.target.value = ''
        return
      }
      
      setSelectedFile(file)
    }
  }

  async function handleFileUpload() {
    if (!selectedFile) {
      toast.error('Please select a file first')
      return
    }
    
    try {
      setIsLoading(true)
      const result = await orderApi.uploadExcel(selectedFile)
      
      if (result.failedCount > 0) {
        // Show partial success with errors
        const errorMessages = result.errors.map(e => `${e.orderNumber}: ${e.error}`).join('\n')
        toast.error(
          `Uploaded ${result.successCount} orders successfully, ${result.failedCount} failed.\n${errorMessages}`,
          { duration: 10000 }
        )
      } else {
        toast.success(`Successfully uploaded ${result.successCount} orders!`)
      }
      
    setIsUploadModalOpen(false)
    setSelectedFile(null)
      fetchOrders() // Refresh the list
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upload Excel file')
      console.error('Error uploading Excel:', error)
    } finally {
      setIsLoading(false)
    }
  }

  async function handleDownloadTemplate() {
    try {
      const blob = await orderApi.downloadExcelTemplate()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'order_template.xlsx'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      toast.success('Template downloaded successfully!')
    } catch (error) {
      toast.error('Failed to download template')
      console.error('Error downloading template:', error)
    }
  }

  function handleViewOrder(orderId: string) {
    navigate(`/admin/tracking/orders/${orderId}`)
  }

  async function handleToggleExpand(orderId: string) {
    if (expandedOrderId === orderId) {
      // Collapse
      setExpandedOrderId(null)
      setExpandedOrderDetails(null)
    } else {
      // Expand
      setExpandedOrderId(orderId)
      setIsLoadingDetails(true)
      try {
        const details = await orderApi.getOrderById(orderId)
        setExpandedOrderDetails(details)
      } catch (error) {
        toast.error('Failed to load order details')
        console.error('Error fetching order details:', error)
        setExpandedOrderId(null)
      } finally {
        setIsLoadingDetails(false)
      }
    }
  }

  async function handleEditOrder(orderId: string) {
    try {
      setIsLoading(true)
      // Fetch full order details
      const orderDetails = await orderApi.getOrderById(orderId)
      
      // Populate the modal with existing data
      setDraft({
        orderNumber: orderDetails.orderNumber,
        vendorId: orderDetails.primaryVendor.id,
        items: orderDetails.items.map(item => ({
          sku: item.sku || '',
          product: item.productName,
          qty: item.quantity,
          amount: item.pricePerUnit
        }))
      })
      
      setEditingOrderId(orderId)
      setIsAddModalOpen(true)
      
      // Fetch vendors if not already loaded
      if (vendors.length === 0) {
        await fetchVendors()
      }
    } catch (error) {
      toast.error('Failed to load order details for editing')
      console.error('Error fetching order for edit:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function handleOpenAssignModal(order: OrderListItem) {
    setSelectedOrderForAssign(order)
    setAssignVendorId('')
    setIsAssignModalOpen(true)
    
    // Fetch vendors if not already loaded
    if (vendors.length === 0) {
      fetchVendors()
    }
  }

  async function handleAssignVendor() {
    if (!selectedOrderForAssign || !assignVendorId) {
      toast.error('Please select a vendor')
      return
    }

    try {
      setIsLoading(true)
      await orderApi.assignVendor(selectedOrderForAssign.id, assignVendorId)
      
      toast.success('Vendor assigned successfully!')
      setIsAssignModalOpen(false)
      setSelectedOrderForAssign(null)
      setAssignVendorId('')
      fetchOrders() // Refresh the list
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to assign vendor')
      console.error('Error assigning vendor:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function handleDeleteClick(order: OrderListItem) {
    setOrderToDelete(order)
    setDeleteConfirmOpen(true)
  }

  async function handleConfirmDelete() {
    if (!orderToDelete) return

    try {
      setIsLoading(true)
      await orderApi.deleteOrder(orderToDelete.id)
      toast.success('Order deleted successfully!')
      setDeleteConfirmOpen(false)
      setOrderToDelete(null)
      fetchOrders() // Refresh the list
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete order')
      console.error('Error deleting order:', error)
    } finally {
      setIsLoading(false)
    }
  }

  function handleSelectOrder(orderId: string) {
    setSelectedOrders(prev => {
      const newSet = new Set(prev)
      if (newSet.has(orderId)) {
        newSet.delete(orderId)
      } else {
        newSet.add(orderId)
      }
      return newSet
    })
  }

  function handleSelectAll() {
    // Only select unassigned orders (RECEIVED status)
    const unassignedOrders = orders.filter(o => o.status === 'RECEIVED')
    if (selectedOrders.size === unassignedOrders.length && unassignedOrders.length > 0) {
      setSelectedOrders(new Set())
    } else {
      setSelectedOrders(new Set(unassignedOrders.map(o => o.id)))
    }
  }

  function handleOpenBulkAssignModal() {
    if (selectedOrders.size === 0) {
      toast.error('Please select at least one order')
      return
    }
    setIsBulkAssignModalOpen(true)
    if (vendors.length === 0) {
      fetchVendors()
    }
  }

  async function handleBulkAssignVendor() {
    if (!bulkAssignVendorId) {
      toast.error('Please select a vendor')
      return
    }

    try {
      setIsLoading(true)
      const orderIds = Array.from(selectedOrders)
      let successCount = 0
      let failedCount = 0
      const errors: string[] = []

      for (const orderId of orderIds) {
        try {
          await orderApi.assignVendor(orderId, bulkAssignVendorId)
          successCount++
        } catch (error) {
          failedCount++
          const orderNumber = orders.find(o => o.id === orderId)?.orderNumber || orderId
          errors.push(`${orderNumber}: ${error instanceof Error ? error.message : 'Failed'}`)
        }
      }

      if (failedCount > 0) {
        toast.error(
          `Assigned ${successCount} orders successfully, ${failedCount} failed.\n${errors.join('\n')}`,
          { duration: 10000 }
        )
      } else {
        toast.success(`Successfully assigned ${successCount} orders!`)
      }

      setIsBulkAssignModalOpen(false)
      setBulkAssignVendorId('')
      setSelectedOrders(new Set())
      fetchOrders()
    } catch (error) {
      toast.error('Failed to bulk assign vendors')
      console.error('Error bulk assigning vendors:', error)
    } finally {
      setIsLoading(false)
    }
  }

  // Export functions
  const handleExportCSV = () => {
    const headers = ['Order Number', 'Items', 'Vendor', 'Status', 'Created Date']
    const csvContent = [
      headers.join(','),
      ...orders.map(order => {
        const status = STATUS_STYLES[order.status as OrderStatus]?.label || order.status
        return [
          order.orderNumber,
          order.itemCount,
          `"${order.primaryVendor.companyName}"`,
          status,
          new Date(order.createdAt).toLocaleDateString('en-GB')
        ].join(',')
      })
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleExportPDF = () => {
    const content = [
      'ORDERS REPORT',
      `Generated: ${new Date().toLocaleString()}`,
      `Total Orders: ${total}`,
      '',
      '=== ORDER LIST ===',
      ...orders.map(order => {
        const status = STATUS_STYLES[order.status as OrderStatus]?.label || order.status
        return [
          `Order: ${order.orderNumber}`,
          `Vendor: ${order.primaryVendor.companyName}`,
          `Items: ${order.itemCount}`,
          `Status: ${status}`,
          `Created: ${new Date(order.createdAt).toLocaleDateString('en-GB')}`,
          '---'
        ].join('\n')
      })
    ].join('\n')
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `orders-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 sm:p-6 font-sans text-primary min-h-[calc(100vh-4rem)] w-full" style={{ background: 'var(--color-sharktank-bg)' }}>
      {/* Page Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-heading mb-2">Orders</h1>
        <p className="text-sm sm:text-base text-gray-600">Manage and track all customer orders</p>
      </div>

      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div></div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-accent text-button-text rounded-lg px-4 py-2.5 border border-transparent flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap"
          >
            <Plus size={16} />
            <span>Add New Order</span>
          </button>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="bg-white text-secondary rounded-lg px-4 py-2.5 flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap"
          >
            <Upload size={16} />
            <span>Upload Excel</span>
          </button>
            <button
              onClick={() => setIsFilterOpen(v => !v)}
              className="bg-accent text-button-text rounded-lg px-4 py-2.5 border border-transparent flex items-center justify-center gap-2 text-sm sm:text-base whitespace-nowrap"
            >
              <Search size={16} />
              <span>Filters</span>
            </button>
            <CSVPDFExportButton
              onExportCSV={handleExportCSV}
              onExportPDF={handleExportPDF}
              buttonClassName="!py-2.5 !min-h-0 sm:text-base"
            />
        </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedOrders.size > 0 && (
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-sm font-medium text-purple-900">
                {selectedOrders.size} order{selectedOrders.size !== 1 ? 's' : ''} selected
              </span>
              <p className="text-xs text-purple-700 mt-1">
                ✓ Only unassigned orders (RECEIVED status) can be selected
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSelectedOrders(new Set())}
                className="bg-white text-purple-700 border border-purple-300 rounded-lg px-3 py-1.5 text-sm hover:bg-purple-50 transition-colors"
              >
                Clear Selection
              </button>
              <button
                onClick={handleOpenBulkAssignModal}
                className="bg-purple-600 text-white rounded-lg px-4 py-1.5 text-sm hover:bg-purple-700 transition-colors"
              >
                Bulk Assign Vendor
              </button>
            </div>
          </div>
        )}
      </div>

      {isFilterOpen && (
        <div className="mb-6 bg-white border border-secondary/20 rounded-xl p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
            <input
              type="text"
              value={filterSearch}
              onChange={(e) => setFilterSearch(e.target.value)}
              placeholder="Search by order number..."
              className="px-3 py-2.5 rounded-xl border border-gray-300 text-sm hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200"
            />
            <CustomDropdown
              value={filterStatus}
              onChange={(value) => setFilterStatus(value as OrderStatus | '')}
              options={[
                { value: '', label: 'All Status' },
                ...Object.keys(STATUS_STYLES).map(status => ({ value: status, label: STATUS_STYLES[status as OrderStatus].label }))
              ]}
              placeholder="All Status"
            />
            <input 
              type="text" 
              value={filterVendorId} 
              onChange={e => setFilterVendorId(e.target.value)} 
              placeholder="Vendor ID (optional)"
              className="px-3 py-2.5 rounded-xl border border-gray-300 text-sm hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200" 
            />
            
            {/* From Date Picker */}
            <div className="relative" ref={fromCalendarRef}>
              <button
                type="button"
                onClick={() => {
                  setShowFromCalendar(!showFromCalendar)
                  setShowToCalendar(false)
                }}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200 flex items-center justify-between text-left bg-white"
              >
                <span className={filterFromDate ? 'text-gray-900' : 'text-gray-500'}>
                  {filterFromDate ? format(filterFromDate, 'MMM dd, yyyy') : 'From date'}
                </span>
                <CalendarIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
              </button>
              {showFromCalendar && (
                <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-md shadow-lg left-0 right-0">
                  <Calendar
                    mode="single"
                    selected={filterFromDate}
                    onSelect={(date) => {
                      setFilterFromDate(date)
                      setShowFromCalendar(false)
                    }}
                    initialFocus
                    disabled={(date) => filterToDate ? date > filterToDate : false}
                    className="w-full"
                  />
                </div>
              )}
            </div>

            {/* To Date Picker */}
            <div className="relative" ref={toCalendarRef}>
              <button
                type="button"
                onClick={() => {
                  setShowToCalendar(!showToCalendar)
                  setShowFromCalendar(false)
                }}
                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-xl hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200 flex items-center justify-between text-left bg-white"
              >
                <span className={filterToDate ? 'text-gray-900' : 'text-gray-500'}>
                  {filterToDate ? format(filterToDate, 'MMM dd, yyyy') : 'To date'}
                </span>
                <CalendarIcon className="h-4 w-4 text-gray-500 flex-shrink-0" />
              </button>
              {showToCalendar && (
                <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-md shadow-lg left-0 right-0">
                  <Calendar
                    mode="single"
                    selected={filterToDate}
                    onSelect={(date) => {
                      setFilterToDate(date)
                      setShowToCalendar(false)
                    }}
                    initialFocus
                    disabled={(date) => filterFromDate ? date < filterFromDate : false}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </div>
          <div className="flex justify-center sm:justify-end">
            <button 
              onClick={resetFilters} 
              className="bg-white text-secondary border border-secondary rounded-lg px-6 py-2.5 text-sm hover:bg-gray-50 transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading ? (
        <div className="bg-white rounded-xl p-12 text-center">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading orders...</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block bg-header-bg rounded-xl overflow-hidden">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr className="" style={{ background: 'var(--color-accent)' }}>
                  <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>
                    <input
                      type="checkbox"
                      checked={selectedOrders.size > 0 && selectedOrders.size === orders.filter(o => o.status === 'RECEIVED').length}
                      onChange={handleSelectAll}
                      className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                      title="Select all unassigned orders"
                    />
                  </th>
                  {['','Order Number','Items','Vendor','Status','Created','Actions'].map(h => (
                    <th key={h} className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map((order) => {
                  const st = STATUS_STYLES[order.status as OrderStatus]
                  const isExpanded = expandedOrderId === order.id
                  const isSelected = selectedOrders.has(order.id)
                  return (
                    <>
                      <tr key={order.id} className={`border-b border-gray-100 hover:bg-gray-50 ${isSelected ? 'bg-purple-50' : 'bg-white'}`}>
                        <td className="p-3">
                          {order.status === 'RECEIVED' ? (
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectOrder(order.id)}
                              onClick={(e) => e.stopPropagation()}
                              className="w-4 h-4 rounded border-gray-300 cursor-pointer"
                            />
                          ) : (
                            <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500" title="Already assigned">
                              <span className="text-white text-xs font-bold">✓</span>
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleToggleExpand(order.id)
                            }}
                            className="text-secondary hover:text-accent transition-colors"
                          >
                            {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                          </button>
                        </td>
                      <td className="p-3 font-semibold text-secondary">{order.orderNumber}</td>
                      <td className="p-3">{order.itemCount} item{order.itemCount !== 1 ? 's' : ''}</td>
                      <td className="p-3">{order.primaryVendor.companyName}</td>
                      <td className="p-3">
                        <span 
                          className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border"
                          style={{
                            backgroundColor: st.bg,
                            color: st.color,
                            borderColor: st.border,
                          }}
                        >
                          {st.label}
                        </span>
                      </td>
                      <td className="p-3">{new Date(order.createdAt).toLocaleDateString('en-GB')}</td>
                      <td className="p-3">
                          <div className="flex items-center gap-1.5">
                          <button 
                              onClick={(e) => {
                                e.stopPropagation()
                                handleEditOrder(order.id)
                              }}
                              className="bg-blue-500 text-white rounded-md px-2.5 py-1.5 text-xs hover:bg-blue-600 flex items-center gap-1"
                              title="Edit Order"
                            >
                              <Edit size={12} />
                              Edit
                            </button>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation()
                                handleOpenAssignModal(order)
                              }}
                              className="bg-purple-500 text-white rounded-md px-2.5 py-1.5 text-xs hover:bg-purple-600"
                              title="Assign Vendor"
                            >
                              Assign
                            </button>
                            {order.status === 'RECEIVED' && (
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteClick(order)
                                }}
                                className="bg-red-500 text-white rounded-md px-2.5 py-1.5 text-xs hover:bg-red-600 flex items-center gap-1"
                                title="Delete Order"
                              >
                                <Trash2 size={12} />
                              </button>
                            )}
                            <button 
                              onClick={(e) => {
                                e.stopPropagation()
                                handleViewOrder(order.id)
                              }}
                              className="bg-[var(--color-accent)] text-[var(--color-button-text)] rounded-md px-2.5 py-1.5 text-xs hover:brightness-95"
                              title="View Details"
                            >
                              View
                          </button>
                        </div>
                      </td>
                    </tr>
                      {isExpanded && (
                        <tr key={`${order.id}-details`} className="bg-gray-50">
                          <td colSpan={8} className="p-0">
                            <div className="px-6 py-4 border-t border-gray-200">
                              {isLoadingDetails ? (
                                <div className="text-center py-4">
                                  <div className="w-8 h-8 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                                  <p className="text-gray-500 text-sm">Loading items...</p>
                                </div>
                              ) : expandedOrderDetails ? (
                                <div className="bg-white rounded-lg overflow-hidden">
                                  <table className="w-full">
                                    <thead>
                                      <tr className="bg-gray-100 border-b border-gray-200">
                                        <th className="text-left p-3 text-sm font-semibold text-secondary">Product Name</th>
                                        <th className="text-left p-3 text-sm font-semibold text-secondary">SKU</th>
                                        <th className="text-right p-3 text-sm font-semibold text-secondary">Quantity</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {expandedOrderDetails.items.map((item, idx) => (
                                        <tr key={item.id} className={`${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} border-b border-gray-100`}>
                                          <td className="p-3 text-sm font-medium text-secondary">{item.productName}</td>
                                          <td className="p-3 text-sm text-gray-600">{item.sku || '-'}</td>
                                          <td className="p-3 text-sm text-right font-semibold text-gray-700">{item.quantity}</td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p className="text-center text-gray-500 py-4">Failed to load items</p>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  )
                })}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={8} className="p-6 text-center text-gray-500">No orders found. Create your first order to get started!</td>
                  </tr>
                )}
              </tbody>
            </table>
            {/* Pagination Controls */}
            {total > 0 && (
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={total}
                startIndex={(currentPage - 1) * itemsPerPage}
                endIndex={Math.min(currentPage * itemsPerPage, total)}
                onPageChange={setCurrentPage}
                itemLabel="orders"
                variant="desktop"
              />
            )}
          </div>
        </>
      )}

      {/* Mobile Card View */}
      {!isLoading && (
        <div className="lg:hidden space-y-3">
          {orders.length === 0 ? (
            <div className="bg-white rounded-xl p-6 text-center text-gray-500">
              No orders found. Create your first order to get started!
            </div>
          ) : (
            orders.map((order) => {
              const st = STATUS_STYLES[order.status as OrderStatus]
              const isExpanded = expandedOrderId === order.id
              const isSelected = selectedOrders.has(order.id)
              return (
                <div 
                  key={order.id} 
                  className={`rounded-xl p-4 border border-gray-200 ${isSelected ? 'bg-purple-50 border-purple-300' : 'bg-white'}`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-2">
                      {order.status === 'RECEIVED' ? (
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOrder(order.id)}
                          onClick={(e) => e.stopPropagation()}
                          className="w-4 h-4 mt-1 rounded border-gray-300 cursor-pointer"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500 mt-1" title="Already assigned">
                          <span className="text-white text-xs font-bold">✓</span>
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleExpand(order.id)
                        }}
                        className="text-secondary hover:text-accent transition-colors mt-1"
                      >
                        {isExpanded ? <ChevronDown size={20} /> : <ChevronRight size={20} />}
                      </button>
                    <div>
                      <h3 className="font-semibold text-secondary text-lg">{order.orderNumber}</h3>
                      <p className="text-sm text-gray-600">{new Date(order.createdAt).toLocaleDateString('en-GB')}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span 
                        className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap"
                        style={{
                          backgroundColor: st.bg,
                          color: st.color,
                          borderColor: st.border,
                        }}
                      >
                        {st.label}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div>
                      <span className="text-gray-500 block">Items</span>
                      <span className="font-medium">{order.itemCount}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-gray-500 block">Vendor</span>
                      <span className="font-medium">{order.primaryVendor.companyName}</span>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="mb-4 p-3 bg-white rounded-lg border border-gray-200">
                      {isLoadingDetails ? (
                        <div className="text-center py-4">
                          <div className="w-6 h-6 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                          <p className="text-gray-500 text-xs">Loading items...</p>
                        </div>
                      ) : expandedOrderDetails ? (
                        <div>
                          <h4 className="font-semibold text-sm text-secondary mb-3 pb-2 border-b border-gray-200">
                            Order Items ({expandedOrderDetails.items.length})
                          </h4>
                          <div className="space-y-2">
                            {expandedOrderDetails.items.map((item, idx) => (
                              <div key={item.id} className={`flex justify-between items-center p-2 rounded ${idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}`}>
                                <div className="flex-1">
                                  <div className="font-medium text-xs text-secondary">{item.productName}</div>
                                  {item.sku && <div className="text-xs text-gray-500">SKU: {item.sku}</div>}
                                </div>
                                <div className="text-right">
                                  <div className="text-sm font-semibold text-gray-700">Qty: {item.quantity}</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleEditOrder(order.id)
                      }}
                      className="bg-blue-500 text-white rounded-full px-3 py-1.5 text-xs flex items-center justify-center gap-1"
                    >
                      <Edit size={12} />
                      Edit
                    </button>
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleOpenAssignModal(order)
                      }}
                      className="bg-purple-500 text-white rounded-full px-3 py-1.5 text-xs"
                    >
                      Assign
                    </button>
                    {order.status === 'RECEIVED' && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteClick(order)
                        }}
                        className="bg-red-500 text-white rounded-full px-3 py-1.5 text-xs flex items-center justify-center gap-1"
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                    )}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation()
                        handleViewOrder(order.id)
                      }}
                      className={`bg-accent text-button-text rounded-full px-3 py-1.5 text-xs ${order.status === 'RECEIVED' ? '' : 'col-span-2'}`}
                    >
                      View
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-[600px] rounded-2xl p-4 sm:p-5 max-h-[90vh] overflow-y-auto">
            <div className="mb-4">
              <h3 className="font-heading text-secondary font-normal text-lg sm:text-xl">
                {editingOrderId ? 'Edit Order' : 'Add New Order'}
              </h3>
            </div>
            
            {/* Order Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-sm font-medium mb-2">Order Number *</label>
                <div className="flex gap-2">
                  <input 
                    value={draft.orderNumber} 
                    onChange={e => setDraft({ ...draft, orderNumber: e.target.value })} 
                    placeholder="ORD-XXXX" 
                    className="flex-1 px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-accent focus:outline-none bg-gray-50" 
                    required
                    readOnly={!!editingOrderId}
                  />
                  {!editingOrderId && (
                  <button
                    type="button"
                    onClick={() => setDraft({ ...draft, orderNumber: generateOrderNumber() })}
                    className="px-3 py-2.5 bg-gray-200 text-gray-700 rounded-lg text-sm hover:bg-gray-300 transition-colors whitespace-nowrap"
                    title="Generate new order number"
                  >
                    <Plus className="inline w-4 h-4 mr-1" /> New
                  </button>
                  )}
                </div>
                {!editingOrderId && <p className="text-xs text-gray-500 mt-1">Auto-generated (click icon to regenerate)</p>}
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">
                  Initial Vendor * 
                  <span className="text-xs text-gray-500 font-normal ml-1">(can be changed via Assign)</span>
                </label>
                {isLoadingVendors ? (
                  <div className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-500">
                    Loading vendors...
                  </div>
                ) : (
                  <CustomDropdown
                    value={draft.vendorId}
                    onChange={(value) => setDraft({ ...draft, vendorId: value })}
                    options={[
                      { value: '', label: 'Select Vendor' },
                      ...vendors.map(vendor => ({ 
                        value: vendor.id, 
                        label: `${vendor.companyName} - ${vendor.warehouseLocation}` 
                      }))
                    ]}
                    placeholder="Select Vendor"
                  />
                )}
              </div>
            </div>

            {/* Items Section */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-secondary">Order Items</h4>
                <button
                  onClick={() => setDraft({ ...draft, items: [...draft.items, { sku: '', product: '', qty: '', amount: '' }] })}
                  className="bg-accent text-button-text rounded-lg px-3 py-1.5 text-sm flex items-center gap-2"
                >
                  <Plus size={14} />
                  <span>Add Item</span>
                </button>
              </div>
              
              {draft.items.map((item, index) => {
                const totalAmount = item.qty && item.amount ? Number(item.qty) * Number(item.amount) : 0
                return (
                  <div key={index} className="mb-4 p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-semibold text-secondary">Item #{index + 1}</span>
                      {draft.items.length > 1 && (
                        <button
                          onClick={() => {
                            const newItems = draft.items.filter((_, i) => i !== index)
                          setDraft({ ...draft, items: newItems })
                        }} 
                          className="bg-red-500 text-white rounded-lg px-3 py-1.5 text-xs hover:bg-red-600 transition-colors"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <div className="sm:col-span-2">
                        <label className="block text-sm font-medium mb-2">Product Name *</label>
                      <input 
                        value={item.product} 
                        onChange={e => {
                          const newItems = [...draft.items]
                          newItems[index] = { ...item, product: e.target.value }
                          setDraft({ ...draft, items: newItems })
                        }} 
                          placeholder="e.g., Rose, Lily, Tulip" 
                          className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none" 
                      />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">SKU (Optional)</label>
                      <input 
                          value={item.sku} 
                        onChange={e => {
                          const newItems = [...draft.items]
                            newItems[index] = { ...item, sku: e.target.value }
                          setDraft({ ...draft, items: newItems })
                        }} 
                          placeholder="e.g., KY-PLNT-01" 
                          className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none" 
                      />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Quantity *</label>
                      <input 
                        type="number" 
                        value={item.qty} 
                        onChange={e => {
                          const newItems = [...draft.items]
                          newItems[index] = { ...item, qty: e.target.value === '' ? '' : Number(e.target.value) }
                          setDraft({ ...draft, items: newItems })
                        }} 
                        min={1} 
                          placeholder="0"
                          className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none" 
                      />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-2">Price per Unit (₹) *</label>
                      <input 
                        type="number" 
                        value={item.amount} 
                        onChange={e => {
                          const newItems = [...draft.items]
                          newItems[index] = { ...item, amount: e.target.value === '' ? '' : Number(e.target.value) }
                          setDraft({ ...draft, items: newItems })
                        }} 
                        min={0} 
                        step="0.01"
                        placeholder="0.00"
                          className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none" 
                      />
                    </div>
                      <div className="sm:col-span-2">
                        <div className="bg-white rounded-lg p-3 border border-accent/30">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-600">Total Amount:</span>
                            <span className="text-lg font-semibold text-accent">
                              ₹{totalAmount.toFixed(2)}
                            </span>
                  </div>
                          {item.qty && item.amount && (
                            <p className="text-xs text-gray-500 mt-1">
                              {item.qty} × ₹{Number(item.amount).toFixed(2)} = ₹{totalAmount.toFixed(2)}
                            </p>
                    )}
                  </div>
                </div>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-6">
              <button 
                onClick={() => {
                  setIsAddModalOpen(false)
                  setEditingOrderId(null)
                  setDraft({ orderNumber: '', items: [{ sku: '', product: '', qty: '', amount: '' }], vendorId: '' })
                }}
                className="bg-white text-secondary border border-secondary rounded-lg px-4 py-2.5 text-sm sm:text-base hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                onClick={handleAddOrder}
                disabled={isLoading}
                className="bg-accent text-button-text rounded-lg px-4 py-2.5 text-sm sm:text-base hover:bg-accent/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (editingOrderId ? 'Updating...' : 'Creating...') : (editingOrderId ? 'Update Order' : 'Save Order')}
              </button>
            </div>
          </div>
        </div>
      )}

      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-[700px] rounded-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto">
            <div className="mb-4">
              <h3 className="font-heading text-secondary font-normal text-lg sm:text-xl">Upload Orders (Excel)</h3>
            </div>
            
            {/* Excel Format Instructions */}
            <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <FileText size={18} />
                Excel File Format
              </h4>
              <p className="text-sm text-blue-800 mb-3">
                Your Excel file must contain the following columns:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <div className="bg-white rounded p-2">
                  <span className="font-semibold text-blue-900">Order Number</span>
                  <span className="text-red-500 ml-1">*</span>
                  <p className="text-xs text-gray-600">e.g., ORD-250110-001</p>
                </div>
                <div className="bg-white rounded p-2">
                  <span className="font-semibold text-blue-900">SKU</span>
                  <span className="text-gray-500 text-xs ml-1">(optional)</span>
                  <p className="text-xs text-gray-600">e.g., KY-ROSE-001</p>
                </div>
                <div className="bg-white rounded p-2">
                  <span className="font-semibold text-blue-900">Product Name</span>
                  <span className="text-red-500 ml-1">*</span>
                  <p className="text-xs text-gray-600">e.g., Red Rose</p>
                </div>
                <div className="bg-white rounded p-2">
                  <span className="font-semibold text-blue-900">Quantity</span>
                  <span className="text-red-500 ml-1">*</span>
                  <p className="text-xs text-gray-600">e.g., 100</p>
                </div>
                <div className="bg-white rounded p-2">
                  <span className="font-semibold text-blue-900">Price Per Unit</span>
                  <span className="text-red-500 ml-1">*</span>
                  <p className="text-xs text-gray-600">e.g., 25.50</p>
                </div>
                <div className="bg-white rounded p-2">
                  <span className="font-semibold text-blue-900">Vendor ID</span>
                  <span className="text-gray-500 text-xs ml-1">(optional)</span>
                  <p className="text-xs text-gray-600">Leave blank to assign later</p>
                </div>
              </div>
              <div className="mt-4 bg-white rounded-lg p-3 border border-blue-300">
                <p className="text-xs text-blue-800 mb-2">
                  <span className="text-red-500 font-bold">*</span> = Required columns
                </p>
                <p className="text-xs text-blue-700">
                  💡 Download the sample template below to see the exact format with examples
                </p>
              </div>

              <button
                onClick={handleDownloadTemplate}
                className="mt-3 bg-blue-600 text-white rounded-lg px-4 py-2.5 text-sm hover:bg-blue-700 transition-colors flex items-center gap-2 w-full justify-center shadow-sm"
              >
                <FileText size={16} />
                Download Sample Excel Template
              </button>
            </div>
            
            <div 
              className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center text-gray-500 bg-gray-50 relative cursor-pointer hover:border-accent hover:bg-accent/5 transition-colors"
              onClick={() => document.getElementById('file-input')?.click()}
            >
              {selectedFile ? (
                <div>
                  <div className="text-lg mb-2 flex items-center justify-center text-green-600"><FileText size={32} /></div>
                  <div className="font-semibold text-secondary mb-1">{selectedFile.name}</div>
                  <div className="text-sm text-gray-600">
                    Size: {(selectedFile.size / 1024).toFixed(2)} KB
                  </div>
                  <div className="text-sm text-blue-600 mt-2">Click to select a different file</div>
                </div>
              ) : (
                <div>
                  <div className="text-2xl mb-2 flex items-center justify-center"><Upload size={32} /></div>
                  <div className="mb-1 font-medium text-gray-700">Drag & drop your Excel file here, or click to browse</div>
                  <div className="text-xs text-gray-500">Supports .xls and .xlsx files only</div>
                </div>
              )}
              
              <input
                id="file-input"
                type="file"
                accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>

            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-800 mb-2">
                <strong>📌 Important Notes:</strong>
              </p>
              <ul className="text-xs text-yellow-800 space-y-1 ml-4 list-disc">
                <li><strong>Multiple Items Per Order:</strong> You can add multiple rows with the same Order Number. They will automatically be grouped as one order with multiple items.</li>
                <li><strong>Vendor ID (Optional):</strong> You can leave Vendor ID blank and assign vendors later using the "Assign" button. If provided, all rows with the same Order Number MUST have the same Vendor ID.</li>
                <li><strong>Example:</strong> ORD-001 with 3 items = 3 rows in Excel, all with "ORD-001" (Vendor ID can be blank).</li>
              </ul>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end gap-3 mt-4">
              <button 
                onClick={() => {
                  setIsUploadModalOpen(false)
                  setSelectedFile(null)
                }} 
                className="bg-white text-secondary border border-secondary rounded-lg px-4 py-2.5 text-sm sm:text-base hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                onClick={handleFileUpload}
                disabled={!selectedFile || isLoading}
                className={`rounded-lg px-4 py-2.5 text-sm sm:text-base border-none transition-colors ${
                  selectedFile && !isLoading
                    ? 'bg-accent text-button-text cursor-pointer hover:bg-accent/90' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {isLoading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assign Vendor Modal */}
      {isAssignModalOpen && selectedOrderForAssign && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-[500px] rounded-2xl p-4 sm:p-5">
            <div className="mb-4">
              <h3 className="font-heading text-secondary font-normal text-lg sm:text-xl">Assign Vendor</h3>
              <p className="text-sm text-gray-600 mt-1">Order: {selectedOrderForAssign.orderNumber}</p>
            </div>
            
            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Select Vendor *</label>
              {isLoadingVendors ? (
                <div className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-500">
                  Loading vendors...
                </div>
              ) : (
                <CustomDropdown
                  value={assignVendorId}
                  onChange={(value) => setAssignVendorId(value)}
                  options={[
                    { value: '', label: 'Select Vendor' },
                    ...vendors.map(vendor => ({ 
                      value: vendor.id, 
                      label: `${vendor.companyName} - ${vendor.warehouseLocation}` 
                    }))
                  ]}
                  placeholder="Select Vendor"
                />
              )}
              <p className="text-xs text-gray-500 mt-2">
                Current Vendor: {selectedOrderForAssign.primaryVendor.companyName}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button 
                onClick={() => {
                  setIsAssignModalOpen(false)
                  setSelectedOrderForAssign(null)
                  setAssignVendorId('')
                }}
                className="bg-white text-secondary border border-secondary rounded-lg px-4 py-2.5 text-sm sm:text-base hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                onClick={handleAssignVendor}
                disabled={isLoading || !assignVendorId}
                className="bg-purple-500 text-white rounded-lg px-4 py-2.5 text-sm sm:text-base hover:bg-purple-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Assigning...' : 'Assign Vendor'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && orderToDelete && (
        <ConfirmationModal
          isOpen={deleteConfirmOpen}
          onClose={() => {
            setDeleteConfirmOpen(false)
            setOrderToDelete(null)
          }}
          onConfirm={handleConfirmDelete}
          title="Delete Order"
          message={`Are you sure you want to delete order "${orderToDelete.orderNumber}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
        />
      )}

      {/* Bulk Assign Vendor Modal */}
      {isBulkAssignModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-[500px] rounded-2xl p-4 sm:p-5">
            <div className="mb-4">
              <h3 className="font-heading text-secondary font-normal text-lg sm:text-xl">Bulk Assign Vendor</h3>
              <p className="text-sm text-gray-600 mt-1">
                Assigning vendor to {selectedOrders.size} selected order{selectedOrders.size !== 1 ? 's' : ''}
              </p>
            </div>
            
            <div className="mb-4 bg-purple-50 border border-purple-200 rounded-lg p-3 max-h-32 overflow-y-auto">
              <p className="text-xs font-semibold text-purple-900 mb-2">Selected Orders:</p>
              <div className="space-y-1">
                {Array.from(selectedOrders).map(orderId => {
                  const order = orders.find(o => o.id === orderId)
                  return order ? (
                    <div key={orderId} className="text-xs text-purple-800">
                      • {order.orderNumber} - {order.primaryVendor.companyName}
                    </div>
                  ) : null
                })}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium mb-2">Select Vendor *</label>
              {isLoadingVendors ? (
                <div className="w-full px-3 py-2.5 rounded-lg border border-gray-300 text-sm text-gray-500">
                  Loading vendors...
                </div>
              ) : (
                <CustomDropdown
                  value={bulkAssignVendorId}
                  onChange={(value) => setBulkAssignVendorId(value)}
                  options={[
                    { value: '', label: 'Select Vendor' },
                    ...vendors.map(vendor => ({ 
                      value: vendor.id, 
                      label: `${vendor.companyName} - ${vendor.warehouseLocation}` 
                    }))
                  ]}
                  placeholder="Select Vendor"
                />
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <button 
                onClick={() => {
                  setIsBulkAssignModalOpen(false)
                  setBulkAssignVendorId('')
                }}
                className="bg-white text-secondary border border-secondary rounded-lg px-4 py-2.5 text-sm sm:text-base hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button 
                onClick={handleBulkAssignVendor}
                disabled={isLoading || !bulkAssignVendorId}
                className="bg-purple-600 text-white rounded-lg px-4 py-2.5 text-sm sm:text-base hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Assigning...' : `Assign to ${selectedOrders.size} Orders`}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}



