import { useMemo, useState, useEffect } from 'react'
import { Edit, Trash2, Plus, Upload, Search, FileText } from 'lucide-react'

type OrderStatus =
  | 'RECEIVED'
  | 'ASSIGNED'
  | 'CONFIRMED'
  | 'DISPATCHED'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_DONE'

type Order = {
  id: string
  sku: string
  product: string
  qty: number
  vendor: string
  status: OrderStatus
  date: string
  city: string
}

type OrderItem = {
  sku: string
  product: string
  qty: number | ''
}

type NewOrderDraft = {
  id: string
  items: OrderItem[]
  date: string
  city: string
  vendor: string
}

const STATUS_STYLES: Record<OrderStatus, { label: string; bg: string; color: string; border: string }> = {
  RECEIVED: { label: 'RECEIVED', bg: '#E5E7EB', color: '#111827', border: '#D1D5DB' }, // gray
  ASSIGNED: { label: 'ASSIGNED', bg: '#DBEAFE', color: '#1E3A8A', border: '#BFDBFE' }, // blue
  CONFIRMED: { label: 'CONFIRMED', bg: '#D1FAE5', color: '#065F46', border: '#A7F3D0' }, // green
  DISPATCHED: { label: 'DISPATCHED', bg: '#FFEDD5', color: '#9A3412', border: '#FED7AA' }, // orange
  PAYMENT_PENDING: { label: 'PAYMENT PENDING', bg: '#FEF9C3', color: '#92400E', border: '#FEF08A' }, // yellow
  PAYMENT_DONE: { label: 'Paid', bg: '#E0ECE8', color: '#1D4D43', border: '#B7CEC6' }, // deep green tint
}


const initialOrders: Order[] = [
  // Multiple orders with same ID (ORD-1001)
  { id: 'ORD-1001', sku: 'KY-ROSE-01', product: 'Rose', qty: 100, vendor: 'Flower Garden', status: 'RECEIVED', date: '2025-01-15', city: 'Mumbai' },
  { id: 'ORD-1001', sku: 'KY-SUN-01', product: 'Sunflower', qty: 100, vendor: 'Flower Garden', status: 'RECEIVED', date: '2025-01-15', city: 'Mumbai' },
  
  // Single order
  { id: 'ORD-1002', sku: 'KY-PLNT-05', product: 'Snake Plant', qty: 1, vendor: 'Urban Roots', status: 'ASSIGNED', date: '2025-01-16', city: 'Delhi' },
  
  // Multiple orders with same ID (ORD-1003)
  { id: 'ORD-1003', sku: 'KY-PLNT-12', product: 'Monstera', qty: 3, vendor: 'Plantify', status: 'CONFIRMED', date: '2025-01-17', city: 'Bengaluru' },
  { id: 'ORD-1003', sku: 'KY-PLNT-15', product: 'Fiddle Leaf Fig', qty: 2, vendor: 'Plantify', status: 'CONFIRMED', date: '2025-01-17', city: 'Bengaluru' },
  { id: 'ORD-1003', sku: 'KY-PLNT-18', product: 'Rubber Plant', qty: 1, vendor: 'Plantify', status: 'CONFIRMED', date: '2025-01-17', city: 'Bengaluru' },
  
  // Single order
  { id: 'ORD-1004', sku: 'KY-PT-002', product: 'Terracotta Pot', qty: 4, vendor: 'Clay Works', status: 'DISPATCHED', date: '2025-01-18', city: 'Pune' },
  
  // Multiple orders with same ID (ORD-1005)
  { id: 'ORD-1005', sku: 'KY-ACC-21', product: 'Watering Can', qty: 1, vendor: 'Urban Roots', status: 'PAYMENT_PENDING', date: '2025-01-19', city: 'Mumbai' },
  { id: 'ORD-1005', sku: 'KY-ACC-22', product: 'Plant Fertilizer', qty: 2, vendor: 'Urban Roots', status: 'PAYMENT_PENDING', date: '2025-01-19', city: 'Mumbai' },
  
  // Single order
  { id: 'ORD-1006', sku: 'KY-PLNT-08', product: 'ZZ Plant', qty: 2, vendor: 'GreenLeaf Co', status: 'PAYMENT_DONE', date: '2025-01-20', city: 'Hyderabad' },
]

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isSplitModalOpen, setIsSplitModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  const [filterCity, setFilterCity] = useState('')
  const [filterVendor, setFilterVendor] = useState('')
  const [filterStatus, setFilterStatus] = useState<OrderStatus | ''>('')
  const [filterDate, setFilterDate] = useState('')

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const vendors = useMemo(() => Array.from(new Set(orders.map(o => o.vendor))).sort(), [orders])
  const cities = useMemo(() => Array.from(new Set(orders.map(o => o.city))).sort(), [orders])

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (filterCity && o.city !== filterCity) return false
      if (filterVendor && o.vendor !== filterVendor) return false
      if (filterStatus && o.status !== filterStatus) return false
      if (filterDate && o.date !== filterDate) return false
      return true
    })
  }, [orders, filterCity, filterVendor, filterStatus, filterDate])

  // Pagination calculations
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedOrders = filteredOrders.slice(startIndex, endIndex)

  // Reset to first page when filters change
  const resetPagination = () => {
    setCurrentPage(1)
  }

  // Reset pagination when filters change
  useEffect(() => {
    resetPagination()
  }, [filterCity, filterVendor, filterStatus, filterDate])

  const [draft, setDraft] = useState<NewOrderDraft>({
    id: '',
    items: [{ sku: '', product: '', qty: '' }],
    date: '',
    city: '',
    vendor: '',
  })

  function resetFilters() {
    setFilterCity('')
    setFilterVendor('')
    setFilterStatus('')
    setFilterDate('')
    resetPagination()
  }

  function handleAddOrder() {
    if (!draft.id || !draft.date || !draft.city || !draft.vendor || draft.items.length === 0) {
      alert('Please fill all required fields')
      return
    }
    
    // Validate all items
    for (const item of draft.items) {
      if (!item.sku || !item.product || item.qty === '') {
        alert('Please fill all item fields including quantity')
        return
      }
    }
    
    // Create multiple orders for each item
    const newOrders: Order[] = draft.items.map(item => ({
      id: draft.id,
      sku: item.sku,
      product: item.product,
      qty: Number(item.qty),
      vendor: draft.vendor,
      status: 'RECEIVED' as OrderStatus,
      date: draft.date,
      city: draft.city,
    }))
    
    setOrders(prev => [...newOrders, ...prev])
    setIsAddModalOpen(false)
    setDraft({ id: '', items: [{ sku: '', product: '', qty: '' }], date: '', city: '', vendor: '' })
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
        alert('Please select a valid Excel file (.xls or .xlsx)')
        return
      }
      
      setSelectedFile(file)
    }
  }

  function handleFileUpload() {
    if (!selectedFile) {
      alert('Please select a file first')
      return
    }
    
    // Here you would typically send the file to your backend
    // For now, we'll just show a success message
    alert(`File "${selectedFile.name}" selected successfully!`)
    setIsUploadModalOpen(false)
    setSelectedFile(null)
  }

  function handleSplitOrder(order: Order) {
    setSelectedOrder(order)
    setIsSplitModalOpen(true)
  }

  function handleEditOrder(order: Order) {
    setSelectedOrder(order)
    setIsEditModalOpen(true)
  }

  function handleSplitSubmit(splitQuantities: number[]) {
    if (!selectedOrder) return
    
    const totalSplitQty = splitQuantities.reduce((sum, qty) => sum + qty, 0)
    if (totalSplitQty !== selectedOrder.qty) {
      alert(`Total split quantity (${totalSplitQty}) must equal original quantity (${selectedOrder.qty})`)
      return
    }

    // Remove original order
    setOrders(prev => prev.filter(o => !(o.id === selectedOrder.id && o.sku === selectedOrder.sku)))
    
    // Create new split orders
    const newSplitOrders: Order[] = splitQuantities.map((qty, index) => ({
      ...selectedOrder,
      id: `${selectedOrder.id}-${index + 1}`,
      qty: qty,
      status: 'RECEIVED' as OrderStatus
    }))
    
    setOrders(prev => [...newSplitOrders, ...prev])
    setIsSplitModalOpen(false)
    setSelectedOrder(null)
  }

  function handleEditSubmit(updatedOrder: Order) {
    if (!selectedOrder) return
    
    setOrders(prev => prev.map(o => 
      o.id === selectedOrder.id && o.sku === selectedOrder.sku ? updatedOrder : o
    ))
    
    setIsEditModalOpen(false)
    setSelectedOrder(null)
  }

  return (
    <div className="p-6 font-sans text-primary">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading text-secondary text-2xl font-semibold">Orders</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="bg-accent text-button-text rounded-full px-4 py-2.5 border border-transparent flex items-center gap-2"
          >
            <Plus size={16} />
            <span>Add New Order</span>
          </button>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-white text-secondary border border-secondary rounded-full px-4 py-2.5 flex items-center gap-2"
          >
            <Upload size={16} />
            <span>Upload Excel</span>
          </button>
          <button
            onClick={() => setIsFilterOpen(v => !v)}
            className="bg-white text-secondary border border-secondary rounded-full px-4 py-2.5 flex items-center gap-2"
          >
            <Search size={16} />
            <span>Filters</span>
          </button>
        </div>
      </div>

      {isFilterOpen && (
        <div className="flex gap-3 items-center mb-4 bg-white border border-secondary/20 rounded-xl p-3">
          <select value={filterCity} onChange={e => setFilterCity(e.target.value)} className="px-3 py-2 rounded-xl">
            <option value="">City</option>
            {cities.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select value={filterVendor} onChange={e => setFilterVendor(e.target.value)} className="px-3 py-2 rounded-xl">
            <option value="">Vendor</option>
            {vendors.map(v => (
              <option key={v} value={v}>{v}</option>
            ))}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as OrderStatus | '')} className="px-3 py-2 rounded-xl">
            <option value="">Status</option>
            {Object.keys(STATUS_STYLES).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="px-3 py-2 rounded-xl" />
          <button onClick={resetFilters} className="bg-white text-secondary border border-secondary rounded-full px-4 py-2">Reset</button>
        </div>
      )}

      <div className="bg-header-bg rounded-xl overflow-hidden">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            <tr className="bg-white">
              {['Order ID','SKU','Product','Qty','Vendor','Status','Date','Actions'].map(h => (
                <th key={h} className="text-left p-3 font-heading text-secondary font-normal">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedOrders.map((o, idx) => {
              const st = STATUS_STYLES[o.status]
              return (
                <tr key={`${o.id}-${o.sku}-${idx}`} className={idx % 2 === 0 ? 'bg-white' : 'bg-header-bg'}>
                  <td className="p-3">{o.id}</td>
                  <td className="p-3">{o.sku}</td>
                  <td className="p-3">{o.product}</td>
                  <td className="p-3">{o.qty}</td>
                  <td className="p-3">{o.vendor}</td>
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
                  <td className="p-3">{o.date}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button className="bg-white text-secondary border border-secondary rounded-full px-2.5 py-1.5 text-sm">Assign</button>
                      <button 
                        onClick={() => handleSplitOrder(o)}
                        className="bg-white text-secondary border border-secondary rounded-full px-2.5 py-1.5 text-sm hover:bg-gray-50"
                      >
                        Split
                      </button>
                      <button 
                        onClick={() => handleEditOrder(o)}
                        className="bg-white text-secondary border border-secondary rounded-full px-2.5 py-1.5 text-sm hover:bg-gray-50 flex items-center justify-center"
                        title="Edit Order"
                      >
                        <Edit size={16} />
                      </button>
                      <button 
                        className="bg-white text-red-600 border border-red-600 rounded-full px-2.5 py-1.5 text-sm flex items-center justify-center"
                        title="Delete Order"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
            {paginatedOrders.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-gray-500">No orders match current filters.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {filteredOrders.length > 0 && (
        <div className="flex items-center justify-between mt-4 bg-white border border-secondary/20 rounded-xl p-4">
          <div className="text-sm text-gray-600">
            Showing {startIndex + 1} to {Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length} orders
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-3 py-2 rounded-lg border text-sm ${
                currentPage === 1 
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                  : 'bg-white text-secondary border-secondary hover:bg-gray-50'
              }`}
            >
              Previous
            </button>
            
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 rounded-lg border text-sm ${
                    currentPage === page
                      ? 'bg-accent text-button-text border-accent'
                      : 'bg-white text-secondary border-secondary hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-3 py-2 rounded-lg border text-sm ${
                currentPage === totalPages 
                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed' 
                  : 'bg-white text-secondary border-secondary hover:bg-gray-50'
              }`}
            >
              Next
            </button>
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-[600px] rounded-2xl p-5 max-h-[90vh] overflow-y-auto">
            <div className="mb-3">
              <h3 className="font-heading text-secondary font-normal">Add New Order</h3>
            </div>
            
            {/* Order Details */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Order ID</label>
                <input 
                  value={draft.id} 
                  onChange={e => setDraft({ ...draft, id: e.target.value })} 
                  placeholder="ORD-XXXX" 
                  className="w-full px-2.5 py-2 rounded-lg border border-gray-300" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input 
                  type="date" 
                  value={draft.date} 
                  onChange={e => setDraft({ ...draft, date: e.target.value })} 
                  className="w-full px-2.5 py-2 rounded-lg border border-gray-300" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">City/Address</label>
                <input 
                  value={draft.city} 
                  onChange={e => setDraft({ ...draft, city: e.target.value })} 
                  placeholder="Mumbai" 
                  className="w-full px-2.5 py-2 rounded-lg border border-gray-300" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Vendor</label>
                <select 
                  value={draft.vendor} 
                  onChange={e => setDraft({ ...draft, vendor: e.target.value })} 
                  className="w-full px-2.5 py-2 rounded-lg border border-gray-300"
                >
                  <option value="">Select Vendor</option>
                  {vendors.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Items Section */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-medium text-secondary">Order Items</h4>
                <button
                  onClick={() => setDraft({ ...draft, items: [...draft.items, { sku: '', product: '', qty: '' }] })}
                  className="bg-accent text-button-text rounded-full px-3 py-1.5 text-sm flex items-center gap-2"
                >
                  <Plus size={14} />
                  <span>Add Item</span>
                </button>
              </div>
              
              {draft.items.map((item, index) => (
                <div key={index} className="grid grid-cols-4 gap-3 mb-3 p-3 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium mb-1">SKU</label>
                    <input 
                      value={item.sku} 
                      onChange={e => {
                        const newItems = [...draft.items]
                        newItems[index] = { ...item, sku: e.target.value }
                        setDraft({ ...draft, items: newItems })
                      }} 
                      placeholder="KY-PLNT-01" 
                      className="w-full px-2.5 py-2 rounded-lg border border-gray-300" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Product Name</label>
                    <input 
                      value={item.product} 
                      onChange={e => {
                        const newItems = [...draft.items]
                        newItems[index] = { ...item, product: e.target.value }
                        setDraft({ ...draft, items: newItems })
                      }} 
                      placeholder="Rose" 
                      className="w-full px-2.5 py-2 rounded-lg border border-gray-300" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Quantity</label>
                    <input 
                      type="number" 
                      value={item.qty} 
                      onChange={e => {
                        const newItems = [...draft.items]
                        newItems[index] = { ...item, qty: e.target.value === '' ? '' : Number(e.target.value) }
                        setDraft({ ...draft, items: newItems })
                      }} 
                      min={1} 
                      className="w-full px-2.5 py-2 rounded-lg border border-gray-300" 
                    />
                  </div>
                  <div className="flex items-end">
                    {draft.items.length > 1 && (
                      <button
                        onClick={() => {
                          const newItems = draft.items.filter((_, i) => i !== index)
                          setDraft({ ...draft, items: newItems })
                        }}
                        className="bg-red-500 text-white rounded-full px-3 py-2 text-sm w-full"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button 
                onClick={() => setIsAddModalOpen(false)} 
                className="bg-white text-secondary border border-secondary rounded-full px-3.5 py-2"
              >
                Cancel
              </button>
              <button 
                onClick={handleAddOrder} 
                className="bg-accent text-button-text rounded-full px-3.5 py-2"
              >
                Save Order
              </button>
            </div>
          </div>
        </div>
      )}

      {isUploadModalOpen && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-[520px] rounded-2xl p-5">
            <div className="mb-3">
              <h3 className="font-heading text-secondary font-normal">Upload Orders (Excel)</h3>
            </div>
            
            <div 
              className="border-2 border-dashed border-gray-300 rounded-2xl p-6 text-center text-gray-500 bg-header-bg relative cursor-pointer"
              onClick={() => document.getElementById('file-input')?.click()}
            >
              {selectedFile ? (
                <div>
                  <div className="text-lg mb-2 flex items-center justify-center"><FileText size={24} /></div>
                  <div className="font-semibold text-secondary mb-1">{selectedFile.name}</div>
                  <div className="text-sm">Click to select a different file</div>
                </div>
              ) : (
                <div>
                  <div className="text-2xl mb-2 flex items-center justify-center"><Upload size={24} /></div>
                  <div className="mb-1">Drag & drop your Excel file here, or click to browse</div>
                  <div className="text-xs">Supports .xls and .xlsx files</div>
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
            
            <div className="flex justify-end gap-2 mt-4">
              <button 
                onClick={() => {
                  setIsUploadModalOpen(false)
                  setSelectedFile(null)
                }} 
                className="bg-white text-secondary border border-secondary rounded-full px-3.5 py-2"
              >
                Cancel
              </button>
              <button 
                onClick={handleFileUpload}
                disabled={!selectedFile}
                className={`rounded-full px-3.5 py-2 border-none ${
                  selectedFile 
                    ? 'bg-accent text-button-text cursor-pointer' 
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                Upload
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Split Order Modal */}
      {isSplitModalOpen && selectedOrder && (
        <SplitOrderModal
          order={selectedOrder}
          onClose={() => {
            setIsSplitModalOpen(false)
            setSelectedOrder(null)
          }}
          onSubmit={handleSplitSubmit}
        />
      )}

      {/* Edit Order Modal */}
      {isEditModalOpen && selectedOrder && (
        <EditOrderModal
          order={selectedOrder}
          onClose={() => {
            setIsEditModalOpen(false)
            setSelectedOrder(null)
          }}
          onSubmit={handleEditSubmit}
          vendors={vendors}
        />
      )}
    </div>
  )
}

// Split Order Modal Component
function SplitOrderModal({ order, onClose, onSubmit }: { 
  order: Order; 
  onClose: () => void; 
  onSubmit: (quantities: number[]) => void;
}) {
  const [splitQuantities, setSplitQuantities] = useState<number[]>([])
  const [newQuantity, setNewQuantity] = useState<number>(0)

  const totalSplit = splitQuantities.reduce((sum, qty) => sum + qty, 0)
  const isValid = totalSplit === order.qty && splitQuantities.every(qty => qty > 0)
  const remainingQty = order.qty - totalSplit

  function addSplit() {
    if (newQuantity > 0 && newQuantity <= remainingQty) {
      setSplitQuantities(prev => [...prev, newQuantity])
      setNewQuantity(0)
    }
  }

  function removeSplit(index: number) {
    setSplitQuantities(prev => prev.filter((_, i) => i !== index))
  }

  function handleSubmit() {
    if (isValid) {
      onSubmit(splitQuantities)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[500px] rounded-2xl p-5">
        <div className="mb-4">
          <h3 className="font-heading text-secondary font-normal">Split Order</h3>
          <p className="text-sm text-gray-600 mt-1">
            Split "{order.product}" (Qty: {order.qty}) into multiple orders
          </p>
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <input
              type="number"
              value={newQuantity}
              onChange={e => setNewQuantity(Number(e.target.value))}
              placeholder="Enter quantity"
              min={1}
              max={remainingQty}
              className="flex-1 px-3 py-2 rounded-lg border border-gray-300"
            />
            <button
              onClick={addSplit}
              disabled={newQuantity <= 0 || newQuantity > remainingQty}
              className="bg-accent text-button-text rounded-full px-4 py-2 text-sm disabled:bg-gray-300"
            >
              Add Split
            </button>
          </div>

          <div className="space-y-2">
            {splitQuantities.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                No splits added yet. Enter a quantity and click "Add Split" to start.
              </div>
            ) : (
              splitQuantities.map((qty, index) => (
                <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                  <span className="flex-1">Split {index + 1}: {qty} units</span>
                  <button
                    onClick={() => removeSplit(index)}
                    className="bg-red-500 text-white rounded-full px-3 py-1 text-sm"
                  >
                    Remove
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="mt-3 text-sm">
            <span className={totalSplit === order.qty ? 'text-green-600' : 'text-red-600'}>
              Total: {totalSplit} / {order.qty}
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="bg-white text-secondary border border-secondary rounded-full px-4 py-2">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isValid}
            className={`rounded-full px-4 py-2 ${
              isValid 
                ? 'bg-accent text-button-text' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            Split Order
          </button>
        </div>
      </div>
    </div>
  )
}

// Edit Order Modal Component
function EditOrderModal({ order, onClose, onSubmit, vendors }: { 
  order: Order; 
  onClose: () => void; 
  onSubmit: (updatedOrder: Order) => void;
  vendors: string[];
}) {
  const [editedOrder, setEditedOrder] = useState<Order>({ ...order })

  function handleSubmit() {
    if (!editedOrder.sku || !editedOrder.product || editedOrder.qty <= 0) {
      alert('Please fill all required fields with valid values')
      return
    }
    onSubmit(editedOrder)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[500px] rounded-2xl p-5">
        <div className="mb-4">
          <h3 className="font-heading text-secondary font-normal">Edit Order</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Order ID</label>
            <input
              value={editedOrder.id}
              onChange={e => setEditedOrder({ ...editedOrder, id: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">SKU</label>
              <input
                value={editedOrder.sku}
                onChange={e => setEditedOrder({ ...editedOrder, sku: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Product</label>
              <input
                value={editedOrder.product}
                onChange={e => setEditedOrder({ ...editedOrder, product: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Quantity</label>
              <input
                type="number"
                value={editedOrder.qty}
                onChange={e => setEditedOrder({ ...editedOrder, qty: Number(e.target.value) })}
                min={1}
                className="w-full px-3 py-2 rounded-lg border border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Status</label>
              <select
                value={editedOrder.status}
                onChange={e => setEditedOrder({ ...editedOrder, status: e.target.value as OrderStatus })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300"
              >
                {Object.keys(STATUS_STYLES).map(status => (
                  <option key={status} value={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">Vendor</label>
              <select
                value={editedOrder.vendor}
                onChange={e => setEditedOrder({ ...editedOrder, vendor: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300"
              >
                {vendors.map(vendor => (
                  <option key={vendor} value={vendor}>{vendor}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">City</label>
              <input
                value={editedOrder.city}
                onChange={e => setEditedOrder({ ...editedOrder, city: e.target.value })}
                className="w-full px-3 py-2 rounded-lg border border-gray-300"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Date</label>
            <input
              type="date"
              value={editedOrder.date}
              onChange={e => setEditedOrder({ ...editedOrder, date: e.target.value })}
              className="w-full px-3 py-2 rounded-lg border border-gray-300"
            />
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onClose} className="bg-white text-secondary border border-secondary rounded-full px-4 py-2">
            Cancel
          </button>
          <button onClick={handleSubmit} className="bg-accent text-button-text rounded-full px-4 py-2">
            Save Changes
          </button>
        </div>
      </div>
    </div>
  )
}



