import { useMemo, useState, useEffect, useRef } from 'react'
import { Eye, FileText, X } from 'lucide-react'

type DeliveryStatus = 'Pending' | 'In Transit' | 'Delivered' | 'Delayed'
type InvoiceStatus = 'Not Generated' | 'Generated' | 'Pending Approval' | 'Paid'

type VendorOrder = {
  id: string
  vendor: string
  items: string
  quantity: number
  confirmedQty: number
  deliveryStatus: DeliveryStatus
  invoiceStatus: InvoiceStatus
  orderDate: string
  deliveryDate?: string
}

const DELIVERY_STATUS_STYLES: Record<DeliveryStatus, { bg: string; color: string; border: string }> = {
  'Pending': { bg: '#FEF9C3', color: '#92400E', border: '#FEF08A' },
  'In Transit': { bg: '#DBEAFE', color: '#1E3A8A', border: '#BFDBFE' },
  'Delivered': { bg: '#D1FAE5', color: '#065F46', border: '#A7F3D0' },
  'Delayed': { bg: '#FEE2E2', color: '#DC2626', border: '#FECACA' },
}

const INVOICE_STATUS_STYLES: Record<InvoiceStatus, { bg: string; color: string; border: string }> = {
  'Not Generated': { bg: '#E5E7EB', color: '#111827', border: '#D1D5DB' },
  'Generated': { bg: '#DBEAFE', color: '#1E3A8A', border: '#BFDBFE' },
  'Pending Approval': { bg: '#FEF9C3', color: '#92400E', border: '#FEF08A' },
  'Paid': { bg: '#D1FAE5', color: '#065F46', border: '#A7F3D0' },
}

const INITIAL_ORDERS: VendorOrder[] = [
  { id: 'VO-2301', vendor: 'GreenLeaf Co', items: 'Rose (50), Lily (30)', quantity: 80, confirmedQty: 80, deliveryStatus: 'Delivered', invoiceStatus: 'Paid', orderDate: '2025-09-15', deliveryDate: '2025-09-18' },
  { id: 'VO-2302', vendor: 'Urban Roots', items: 'Monstera Plant', quantity: 25, confirmedQty: 25, deliveryStatus: 'Delivered', invoiceStatus: 'Pending Approval', orderDate: '2025-09-16', deliveryDate: '2025-09-19' },
  { id: 'VO-2303', vendor: 'Plantify', items: 'Snake Plant (15), ZZ Plant (10)', quantity: 25, confirmedQty: 25, deliveryStatus: 'Delivered', invoiceStatus: 'Generated', orderDate: '2025-09-17', deliveryDate: '2025-09-20' },
  { id: 'VO-2304', vendor: 'Clay Works', items: 'Terracotta Pots (Large)', quantity: 50, confirmedQty: 48, deliveryStatus: 'Delivered', invoiceStatus: 'Not Generated', orderDate: '2025-09-18', deliveryDate: '2025-09-21' },
  { id: 'VO-2305', vendor: 'EcoGarden Solutions', items: 'Organic Fertilizer', quantity: 100, confirmedQty: 100, deliveryStatus: 'In Transit', invoiceStatus: 'Not Generated', orderDate: '2025-09-20' },
  { id: 'VO-2306', vendor: 'Flower Garden', items: 'Sunflower (40), Marigold (60)', quantity: 100, confirmedQty: 95, deliveryStatus: 'Delayed', invoiceStatus: 'Not Generated', orderDate: '2025-09-19' },
  { id: 'VO-2307', vendor: 'Urban Roots', items: 'Potting Soil Mix', quantity: 75, confirmedQty: 75, deliveryStatus: 'Pending', invoiceStatus: 'Not Generated', orderDate: '2025-09-22' },
  { id: 'VO-2308', vendor: 'GreenLeaf Co', items: 'Succulent Collection', quantity: 30, confirmedQty: 30, deliveryStatus: 'Delivered', invoiceStatus: 'Generated', orderDate: '2025-09-14', deliveryDate: '2025-09-17' },
  { id: 'VO-2309', vendor: 'Plantify', items: 'Indoor Plant Stand', quantity: 20, confirmedQty: 20, deliveryStatus: 'In Transit', invoiceStatus: 'Not Generated', orderDate: '2025-09-21' },
  { id: 'VO-2310', vendor: 'Clay Works', items: 'Ceramic Planters (Medium)', quantity: 35, confirmedQty: 35, deliveryStatus: 'Delivered', invoiceStatus: 'Paid', orderDate: '2025-09-12', deliveryDate: '2025-09-15' },
]

function AccountsVendorOrders() {
  const [orders] = useState<VendorOrder[]>(INITIAL_ORDERS)
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set())
  const [isFilterOpen, setIsFilterOpen] = useState(true)
  const [isViewModalOpen, setIsViewModalOpen] = useState(false)
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<VendorOrder | null>(null)
  const [isVendorDropdownOpen, setIsVendorDropdownOpen] = useState(false)

  const vendorDropdownRef = useRef<HTMLDivElement>(null)

  // Filters
  const [filterVendor, setFilterVendor] = useState<string[]>([])
  const [filterStatus, setFilterStatus] = useState<InvoiceStatus | ''>('')
  const [filterDeliveryStatus, setFilterDeliveryStatus] = useState<DeliveryStatus | ''>('')

  const vendors = useMemo(() => Array.from(new Set(orders.map(o => o.vendor))).sort(), [orders])

  // Close vendor dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (vendorDropdownRef.current && !vendorDropdownRef.current.contains(event.target as Node)) {
        setIsVendorDropdownOpen(false)
      }
    }

    if (isVendorDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isVendorDropdownOpen])

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (filterVendor.length > 0 && !filterVendor.includes(o.vendor)) return false
      if (filterStatus && o.invoiceStatus !== filterStatus) return false
      if (filterDeliveryStatus && o.deliveryStatus !== filterDeliveryStatus) return false
      return true
    })
  }, [orders, filterVendor, filterStatus, filterDeliveryStatus])

  function resetFilters() {
    setFilterVendor([])
    setFilterStatus('')
    setFilterDeliveryStatus('')
  }

  function toggleVendorFilter(vendor: string) {
    setFilterVendor(prev => 
      prev.includes(vendor) 
        ? prev.filter(v => v !== vendor)
        : [...prev, vendor]
    )
  }

  function toggleOrderSelection(orderId: string) {
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

  function toggleSelectAll() {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set())
    } else {
      setSelectedOrders(new Set(filteredOrders.map(o => o.id)))
    }
  }

  function handleViewDetails(order: VendorOrder) {
    setSelectedOrder(order)
    setIsViewModalOpen(true)
  }

  function handleGenerateInvoice(order: VendorOrder) {
    setSelectedOrder(order)
    setIsGenerateModalOpen(true)
  }

  function handleBulkGenerateInvoices() {
    const eligibleOrders = filteredOrders.filter(o => 
      selectedOrders.has(o.id) && o.deliveryStatus === 'Delivered'
    )
    
    if (eligibleOrders.length === 0) {
      alert('No eligible orders selected. Only delivered orders can generate invoices.')
      return
    }

    alert(`Generating invoices for ${eligibleOrders.length} order(s)...`)
    // In a real app, this would call an API
    setSelectedOrders(new Set())
  }

  const allSelected = filteredOrders.length > 0 && selectedOrders.size === filteredOrders.length
  const selectedCount = selectedOrders.size

  return (
    <div className="p-6 font-sans text-primary">
      {/* Page Heading */}
      <div className="mb-6">
        <h2 className="font-heading text-secondary text-3xl font-semibold mb-2">Vendor Orders</h2>
        <p className="text-sm text-gray-600">Track and manage vendor orders, deliveries, and invoicing</p>
      </div>

      {/* Filter Bar */}
      <div className="mb-4 bg-white border border-secondary/20 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading text-secondary text-lg font-medium">Filters</h3>
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="text-sm text-secondary underline"
          >
            {isFilterOpen ? 'Hide' : 'Show'} Filters
          </button>
        </div>

        {isFilterOpen && (
          <div className="flex flex-wrap gap-3 items-end">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium mb-1 text-gray-700">Vendor (Multi-select)</label>
              <div className="relative" ref={vendorDropdownRef}>
                <div 
                  onClick={() => setIsVendorDropdownOpen(!isVendorDropdownOpen)}
                  className="px-3 py-2 border border-gray-300 rounded-xl bg-white min-h-[42px] flex flex-wrap gap-2 items-center cursor-pointer hover:border-gray-400 transition-colors"
                >
                  {filterVendor.length === 0 ? (
                    <span className="text-gray-400 text-sm">Select vendors...</span>
                  ) : (
                    filterVendor.map(v => (
                      <span key={v} className="inline-flex items-center gap-1 px-2 py-1 bg-accent/10 text-accent rounded-lg text-sm">
                        {v}
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleVendorFilter(v)
                          }} 
                          className="hover:text-red-600"
                        >
                          <X size={14} />
                        </button>
                      </span>
                    ))
                  )}
                </div>
                {isVendorDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-48 overflow-y-auto z-10">
                    {vendors.map(v => (
                      <label key={v} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={filterVendor.includes(v)}
                          onChange={() => toggleVendorFilter(v)}
                          className="rounded"
                        />
                        <span className="text-sm">{v}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 min-w-[180px]">
              <label className="block text-sm font-medium mb-1 text-gray-700">Invoice Status</label>
              <select 
                value={filterStatus} 
                onChange={e => setFilterStatus(e.target.value as InvoiceStatus | '')} 
                className="w-full px-3 py-2 rounded-xl border border-gray-300"
              >
                <option value="">All Statuses</option>
                <option value="Not Generated">Not Generated</option>
                <option value="Generated">Generated</option>
                <option value="Pending Approval">Pending Approval</option>
                <option value="Paid">Paid</option>
              </select>
            </div>

            <div className="flex-1 min-w-[180px]">
              <label className="block text-sm font-medium mb-1 text-gray-700">Delivery Status</label>
              <select 
                value={filterDeliveryStatus} 
                onChange={e => setFilterDeliveryStatus(e.target.value as DeliveryStatus | '')} 
                className="w-full px-3 py-2 rounded-xl border border-gray-300"
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="In Transit">In Transit</option>
                <option value="Delivered">Delivered</option>
                <option value="Delayed">Delayed</option>
              </select>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={resetFilters} 
                className="bg-white text-secondary border border-secondary rounded-full px-4 py-2 hover:bg-gray-50"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedCount > 0 && (
        <div className="mb-4 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-center justify-between">
          <div className="text-sm text-blue-800">
            <strong>{selectedCount}</strong> order{selectedCount !== 1 ? 's' : ''} selected
          </div>
          <button
            onClick={handleBulkGenerateInvoices}
            className="bg-accent text-button-text rounded-full px-4 py-2 flex items-center gap-2 hover:opacity-90"
          >
            <FileText size={16} />
            <span>Generate Invoices</span>
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-header-bg rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="bg-white">
                <th className="text-left p-3 font-heading text-secondary font-normal">
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                </th>
                <th className="text-left p-3 font-heading text-secondary font-normal">Order ID</th>
                <th className="text-left p-3 font-heading text-secondary font-normal">Vendor</th>
                <th className="text-left p-3 font-heading text-secondary font-normal">Items</th>
                <th className="text-left p-3 font-heading text-secondary font-normal">Quantity</th>
                <th className="text-left p-3 font-heading text-secondary font-normal">Confirmed Qty</th>
                <th className="text-left p-3 font-heading text-secondary font-normal">Delivery Status</th>
                <th className="text-left p-3 font-heading text-secondary font-normal">Invoice Status</th>
                <th className="text-left p-3 font-heading text-secondary font-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order, idx) => {
                const deliveryStyle = DELIVERY_STATUS_STYLES[order.deliveryStatus]
                const invoiceStyle = INVOICE_STATUS_STYLES[order.invoiceStatus]
                const isSelected = selectedOrders.has(order.id)
                const canGenerateInvoice = order.deliveryStatus === 'Delivered' && order.invoiceStatus === 'Not Generated'

                return (
                  <tr key={order.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-header-bg hover:bg-[#F5F3E7] transition-colors'}>
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleOrderSelection(order.id)}
                        className="rounded"
                      />
                    </td>
                    <td className="p-3 font-medium">{order.id}</td>
                    <td className="p-3">{order.vendor}</td>
                    <td className="p-3 text-sm">{order.items}</td>
                    <td className="p-3">{order.quantity}</td>
                    <td className="p-3">
                      <span className={order.confirmedQty !== order.quantity ? 'text-orange-600 font-semibold' : ''}>
                        {order.confirmedQty}
                      </span>
                    </td>
                    <td className="p-3">
                      <span 
                        className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap"
                        style={{
                          backgroundColor: deliveryStyle.bg,
                          color: deliveryStyle.color,
                          borderColor: deliveryStyle.border,
                        }}
                      >
                        {order.deliveryStatus}
                      </span>
                    </td>
                    <td className="p-3">
                      <span 
                        className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap"
                        style={{
                          backgroundColor: invoiceStyle.bg,
                          color: invoiceStyle.color,
                          borderColor: invoiceStyle.border,
                        }}
                      >
                        {order.invoiceStatus}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button 
                          onClick={() => handleViewDetails(order)}
                          className="bg-white text-secondary border border-secondary rounded-full px-3 py-1.5 text-sm hover:bg-gray-50 flex items-center gap-1"
                        >
                          <Eye size={14} />
                          <span>View</span>
                        </button>
                        <button 
                          onClick={() => handleGenerateInvoice(order)}
                          disabled={!canGenerateInvoice}
                          className={`rounded-full px-3 py-1.5 text-sm flex items-center gap-1 ${
                            canGenerateInvoice 
                              ? 'bg-accent text-button-text hover:opacity-90' 
                              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          }`}
                          title={!canGenerateInvoice ? 'Only delivered orders can generate invoices' : 'Generate PO/Invoice'}
                        >
                          <FileText size={14} />
                          <span>PO/Invoice</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-gray-500">No orders match current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* View Details Modal */}
      {isViewModalOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-[600px] max-w-[96%] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-heading text-secondary text-2xl">Order Details</h3>
              <button onClick={() => setIsViewModalOpen(false)} className="p-1 rounded-lg hover:bg-gray-100">
                <X size={20} className="text-gray-500" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Order ID</label>
                  <div className="text-lg font-semibold">{selectedOrder.id}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Vendor</label>
                  <div className="text-lg">{selectedOrder.vendor}</div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-1">Items</label>
                <div className="text-base">{selectedOrder.items}</div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Ordered Quantity</label>
                  <div className="text-lg font-semibold">{selectedOrder.quantity}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Confirmed Quantity</label>
                  <div className={`text-lg font-semibold ${selectedOrder.confirmedQty !== selectedOrder.quantity ? 'text-orange-600' : ''}`}>
                    {selectedOrder.confirmedQty}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Order Date</label>
                  <div className="text-base">{selectedOrder.orderDate}</div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Delivery Date</label>
                  <div className="text-base">{selectedOrder.deliveryDate || 'Pending'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Delivery Status</label>
                  <span 
                    className="inline-block px-3 py-1.5 rounded-full text-sm font-semibold border"
                    style={{
                      backgroundColor: DELIVERY_STATUS_STYLES[selectedOrder.deliveryStatus].bg,
                      color: DELIVERY_STATUS_STYLES[selectedOrder.deliveryStatus].color,
                      borderColor: DELIVERY_STATUS_STYLES[selectedOrder.deliveryStatus].border,
                    }}
                  >
                    {selectedOrder.deliveryStatus}
                  </span>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-1">Invoice Status</label>
                  <span 
                    className="inline-block px-3 py-1.5 rounded-full text-sm font-semibold border"
                    style={{
                      backgroundColor: INVOICE_STATUS_STYLES[selectedOrder.invoiceStatus].bg,
                      color: INVOICE_STATUS_STYLES[selectedOrder.invoiceStatus].color,
                      borderColor: INVOICE_STATUS_STYLES[selectedOrder.invoiceStatus].border,
                    }}
                  >
                    {selectedOrder.invoiceStatus}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-6">
              <button 
                onClick={() => setIsViewModalOpen(false)} 
                className="bg-white text-secondary border border-secondary rounded-full px-4 py-2 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Generate Invoice Modal */}
      {isGenerateModalOpen && selectedOrder && (
        <GenerateInvoiceModal 
          order={selectedOrder} 
          onClose={() => setIsGenerateModalOpen(false)} 
        />
      )}
    </div>
  )
}

function GenerateInvoiceModal({ order, onClose }: { order: VendorOrder; onClose: () => void }) {
  const [poNumber, setPoNumber] = useState(`PO-${order.id.split('-')[1]}`)
  const [invoiceNumber, setInvoiceNumber] = useState(`INV-${order.id.split('-')[1]}`)
  const [amount, setAmount] = useState('')
  const [gstAmount, setGstAmount] = useState('')

  function handleGenerate() {
    if (!poNumber || !invoiceNumber || !amount) {
      alert('Please fill all required fields')
      return
    }
    alert(`Invoice ${invoiceNumber} generated successfully for ${order.vendor}!`)
    onClose()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[540px] max-w-[96%] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-secondary text-2xl">Generate PO / Invoice</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="text-sm text-gray-600">Order: <strong>{order.id}</strong> • Vendor: <strong>{order.vendor}</strong></div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">PO Number *</label>
            <input
              value={poNumber}
              onChange={(e) => setPoNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
              placeholder="Enter PO number"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number *</label>
            <input
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
              placeholder="Enter invoice number"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Base Amount (₹) *</label>
              <input
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">GST Amount (₹)</label>
              <input
                value={gstAmount}
                onChange={(e) => setGstAmount(e.target.value)}
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
                placeholder="0.00"
              />
            </div>
          </div>

          {amount && (
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-sm text-gray-600">Total Amount</div>
              <div className="text-2xl font-bold text-secondary">
                ₹{(parseFloat(amount) + parseFloat(gstAmount || '0')).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button 
            onClick={onClose} 
            className="bg-white text-secondary border border-secondary rounded-full px-4 py-2 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleGenerate} 
            className="bg-accent text-button-text rounded-full px-4 py-2 hover:opacity-90"
          >
            Generate Invoice
          </button>
        </div>
      </div>
    </div>
  )
}

export default AccountsVendorOrders


