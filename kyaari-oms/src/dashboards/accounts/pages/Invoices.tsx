import { useState } from 'react'
import { FileText, CheckSquare, X, Search, Upload } from 'lucide-react'

type POStatus = 'Pending' | 'Generated'
type ValidationStatus = 'Pending' | 'Matched' | 'Mismatch'

type POOrder = {
  id: string
  vendor: string
  confirmedQty: number
  poStatus: POStatus
  items: string
  amount: number
}

type InvoiceRecord = {
  id: string
  vendor: string
  orderId: string
  poLinked: boolean
  invoiceUploaded: boolean
  validationStatus: ValidationStatus
  invoiceNumber?: string
  invoiceAmount?: number
  poAmount?: number
}

const PO_STATUS_STYLES: Record<POStatus, { bg: string; color: string; border: string }> = {
  'Pending': { bg: '#FEF9C3', color: '#92400E', border: '#FEF08A' },
  'Generated': { bg: '#D1FAE5', color: '#065F46', border: '#A7F3D0' },
}

const VALIDATION_STATUS_STYLES: Record<ValidationStatus, { bg: string; color: string; border: string }> = {
  'Pending': { bg: '#FEF9C3', color: '#92400E', border: '#FEF08A' },
  'Matched': { bg: '#D1FAE5', color: '#065F46', border: '#A7F3D0' },
  'Mismatch': { bg: '#FEE2E2', color: '#DC2626', border: '#FECACA' },
}

const INITIAL_PO_ORDERS: POOrder[] = [
  { id: 'VO-2301', vendor: 'GreenLeaf Co', confirmedQty: 80, poStatus: 'Generated', items: 'Rose (50), Lily (30)', amount: 45000 },
  { id: 'VO-2302', vendor: 'Urban Roots', confirmedQty: 25, poStatus: 'Pending', items: 'Monstera Plant', amount: 12500 },
  { id: 'VO-2303', vendor: 'Plantify', confirmedQty: 25, poStatus: 'Pending', items: 'Snake Plant (15), ZZ Plant (10)', amount: 8750 },
  { id: 'VO-2304', vendor: 'Clay Works', confirmedQty: 48, poStatus: 'Generated', items: 'Terracotta Pots (Large)', amount: 19200 },
  { id: 'VO-2305', vendor: 'EcoGarden Solutions', confirmedQty: 100, poStatus: 'Pending', items: 'Organic Fertilizer', amount: 35000 },
  { id: 'VO-2306', vendor: 'Flower Garden', confirmedQty: 95, poStatus: 'Pending', items: 'Sunflower (40), Marigold (60)', amount: 28500 },
]

const INITIAL_INVOICES: InvoiceRecord[] = [
  { id: 'INV-001', vendor: 'GreenLeaf Co', orderId: 'VO-2301', poLinked: true, invoiceUploaded: true, validationStatus: 'Matched', invoiceNumber: 'INV-GLC-2301', invoiceAmount: 45000, poAmount: 45000 },
  { id: 'INV-002', vendor: 'Clay Works', orderId: 'VO-2304', poLinked: true, invoiceUploaded: true, validationStatus: 'Pending', invoiceNumber: 'INV-CW-2304', invoiceAmount: 19500, poAmount: 19200 },
  { id: 'INV-003', vendor: 'Urban Roots', orderId: 'VO-2302', poLinked: true, invoiceUploaded: true, validationStatus: 'Pending', invoiceNumber: 'INV-UR-2302', invoiceAmount: 12500, poAmount: 12500 },
  { id: 'INV-004', vendor: 'Plantify', orderId: 'VO-2303', poLinked: true, invoiceUploaded: true, validationStatus: 'Mismatch', invoiceNumber: 'INV-PLT-2303', invoiceAmount: 9500, poAmount: 8750 },
  { id: 'INV-005', vendor: 'EcoGarden Solutions', orderId: 'VO-2305', poLinked: false, invoiceUploaded: false, validationStatus: 'Pending' },
]

function AccountsInvoices() {
  const [poOrders, setPOOrders] = useState<POOrder[]>(INITIAL_PO_ORDERS)
  const [invoices, setInvoices] = useState<InvoiceRecord[]>(INITIAL_INVOICES)
  const [selectedPOs, setSelectedPOs] = useState<Set<string>>(new Set())
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false)

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

  function handleGeneratePO(order: POOrder, format: 'pdf' | 'json') {
    alert(`Generating PO for ${order.id} in ${format.toUpperCase()} format...`)
    // In real app, this would trigger PO generation
    setPOOrders(prev => prev.map(o => o.id === order.id ? { ...o, poStatus: 'Generated' } : o))
  }

  function handleBulkGeneratePO() {
    const eligibleOrders = poOrders.filter(o => selectedPOs.has(o.id) && o.poStatus === 'Pending')
    
    if (eligibleOrders.length === 0) {
      alert('No eligible orders selected. Only orders with Pending PO status can generate POs.')
      return
    }

    alert(`Generating POs for ${eligibleOrders.length} order(s)...`)
    setPOOrders(prev => prev.map(o => selectedPOs.has(o.id) ? { ...o, poStatus: 'Generated' } : o))
    setSelectedPOs(new Set())
  }

  function handleApproveInvoice(invoice: InvoiceRecord) {
    alert(`Invoice ${invoice.invoiceNumber || invoice.id} approved!`)
    setInvoices(prev => prev.map(inv => inv.id === invoice.id ? { ...inv, validationStatus: 'Matched' } : inv))
  }

  function handleRejectInvoice(invoice: InvoiceRecord) {
    alert(`Invoice ${invoice.invoiceNumber || invoice.id} rejected!`)
    setInvoices(prev => prev.map(inv => inv.id === invoice.id ? { ...inv, validationStatus: 'Mismatch' } : inv))
  }

  function handleAutoCheck(invoice: InvoiceRecord) {
    if (!invoice.invoiceUploaded) {
      alert('No invoice uploaded yet.')
      return
    }

    // Simulate auto-check logic
    if (invoice.invoiceAmount === invoice.poAmount) {
      alert(`Auto-check complete: Invoice matches PO (₹${invoice.poAmount?.toLocaleString('en-IN')})`)
      setInvoices(prev => prev.map(inv => inv.id === invoice.id ? { ...inv, validationStatus: 'Matched' } : inv))
    } else {
      alert(`Auto-check complete: Mismatch detected!\nPO Amount: ₹${invoice.poAmount?.toLocaleString('en-IN')}\nInvoice Amount: ₹${invoice.invoiceAmount?.toLocaleString('en-IN')}`)
      setInvoices(prev => prev.map(inv => inv.id === invoice.id ? { ...inv, validationStatus: 'Mismatch' } : inv))
    }
  }

  const selectedPOCount = selectedPOs.size

  return (
    <div className="p-6 font-sans text-primary">
      {/* Page Header */}
      <div className="mb-6">
        <h2 className="font-heading text-secondary text-3xl font-semibold mb-2">Invoice Management</h2>
        <p className="text-sm text-gray-600">Manage Purchase Orders and Vendor Invoices</p>
      </div>

      {/* Section 1: PO Generation */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-heading text-secondary text-xl font-medium">Purchase Order Generation</h3>
          {selectedPOCount > 0 && (
            <button
              onClick={handleBulkGeneratePO}
              className="bg-accent text-button-text rounded-full px-4 py-2 flex items-center gap-2 hover:opacity-90"
            >
              <FileText size={16} />
              <span>Generate PO for {selectedPOCount} order{selectedPOCount !== 1 ? 's' : ''}</span>
            </button>
          )}
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
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
                  <th className="text-left p-3 font-heading text-secondary font-medium">Items</th>
                  <th className="text-left p-3 font-heading text-secondary font-medium">Confirmed Qty</th>
                  <th className="text-left p-3 font-heading text-secondary font-medium">Amount</th>
                  <th className="text-left p-3 font-heading text-secondary font-medium">PO Status</th>
                  <th className="text-left p-3 font-heading text-secondary font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {poOrders.map((order, idx) => {
                  const poStyle = PO_STATUS_STYLES[order.poStatus]
                  const isSelected = selectedPOs.has(order.id)
                  const canGeneratePO = order.poStatus === 'Pending'

                  return (
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
                      <td className="p-3">{order.vendor}</td>
                      <td className="p-3 text-sm">{order.items}</td>
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
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleGeneratePO(order, 'pdf')}
                            disabled={!canGeneratePO}
                            className={`rounded-full px-3 py-1.5 text-sm flex items-center gap-1 ${
                              canGeneratePO 
                                ? 'bg-accent text-button-text hover:opacity-90' 
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                            title={!canGeneratePO ? 'PO already generated' : 'Generate PO (PDF)'}
                          >
                            <FileText size={14} />
                            <span>PDF</span>
                          </button>
                          <button 
                            onClick={() => handleGeneratePO(order, 'json')}
                            disabled={!canGeneratePO}
                            className={`rounded-full px-3 py-1.5 text-sm flex items-center gap-1 ${
                              canGeneratePO 
                                ? 'bg-secondary text-white hover:opacity-90' 
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                            title={!canGeneratePO ? 'PO already generated' : 'Generate PO (JSON)'}
                          >
                            <FileText size={14} />
                            <span>JSON</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Section 2: Invoice Upload & Validation */}
      <div>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-heading text-secondary text-xl font-medium">Invoice Upload & Validation</h3>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="bg-accent text-button-text rounded-full px-4 py-2 flex items-center gap-2 hover:opacity-90"
          >
            <Upload size={16} />
            <span>Upload Invoice</span>
          </button>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-3 font-heading text-secondary font-medium">Vendor</th>
                  <th className="text-left p-3 font-heading text-secondary font-medium">Order ID</th>
                  <th className="text-left p-3 font-heading text-secondary font-medium">Invoice Number</th>
                  <th className="text-left p-3 font-heading text-secondary font-medium">PO Linked</th>
                  <th className="text-left p-3 font-heading text-secondary font-medium">Invoice Uploaded</th>
                  <th className="text-left p-3 font-heading text-secondary font-medium">Validation Status</th>
                  <th className="text-left p-3 font-heading text-secondary font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((invoice, idx) => {
                  const validationStyle = VALIDATION_STATUS_STYLES[invoice.validationStatus]

                  return (
                    <tr key={invoice.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50 hover:bg-[#F5F3E7] transition-colors'}>
                      <td className="p-3">{invoice.vendor}</td>
                      <td className="p-3 font-medium">{invoice.orderId}</td>
                      <td className="p-3 text-sm">{invoice.invoiceNumber || '—'}</td>
                      <td className="p-3">
                        {invoice.poLinked ? (
                          <span className="text-green-600 font-medium">✓ Yes</span>
                        ) : (
                          <span className="text-gray-400">✗ No</span>
                        )}
                      </td>
                      <td className="p-3">
                        {invoice.invoiceUploaded ? (
                          <span className="text-green-600 font-medium">✓ Yes</span>
                        ) : (
                          <span className="text-gray-400">✗ No</span>
                        )}
                      </td>
                      <td className="p-3">
                        <span 
                          className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap"
                          style={{
                            backgroundColor: validationStyle.bg,
                            color: validationStyle.color,
                            borderColor: validationStyle.border,
                          }}
                        >
                          {invoice.validationStatus}
                        </span>
                      </td>
                      <td className="p-3">
                        <div className="flex gap-2">
                          <button 
                            onClick={() => handleApproveInvoice(invoice)}
                            disabled={!invoice.invoiceUploaded}
                            className={`rounded-full p-1.5 flex items-center justify-center ${
                              invoice.invoiceUploaded
                                ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                            title="Approve Invoice"
                          >
                            <CheckSquare size={18} />
                          </button>
                          <button 
                            onClick={() => handleRejectInvoice(invoice)}
                            disabled={!invoice.invoiceUploaded}
                            className={`rounded-full p-1.5 flex items-center justify-center ${
                              invoice.invoiceUploaded
                                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                            title="Reject Invoice"
                          >
                            <X size={18} />
                          </button>
                          <button 
                            onClick={() => handleAutoCheck(invoice)}
                            disabled={!invoice.invoiceUploaded}
                            className={`rounded-full p-1.5 flex items-center justify-center ${
                              invoice.invoiceUploaded
                                ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                            }`}
                            title="Auto-Check (Compare Invoice vs PO)"
                          >
                            <Search size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Upload Invoice Modal */}
      {isUploadModalOpen && (
        <UploadInvoiceModal 
          onClose={() => setIsUploadModalOpen(false)}
          onUpload={(data) => {
            alert(`Invoice uploaded successfully!\nVendor: ${data.vendor}\nOrder ID: ${data.orderId}`)
            setIsUploadModalOpen(false)
          }}
        />
      )}
    </div>
  )
}

function UploadInvoiceModal({ 
  onClose, 
  onUpload 
}: { 
  onClose: () => void
  onUpload: (data: { vendor: string; orderId: string; invoiceNumber: string; file: File | null }) => void
}) {
  const [vendor, setVendor] = useState('')
  const [orderId, setOrderId] = useState('')
  const [invoiceNumber, setInvoiceNumber] = useState('')
  const [file, setFile] = useState<File | null>(null)

  function handleSubmit() {
    if (!vendor || !orderId || !invoiceNumber) {
      alert('Please fill all required fields')
      return
    }
    onUpload({ vendor, orderId, invoiceNumber, file })
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white w-[540px] max-w-[96%] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading text-secondary text-2xl">Upload Invoice</h3>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X size={20} className="text-gray-500" />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Vendor *</label>
            <input
              value={vendor}
              onChange={(e) => setVendor(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
              placeholder="Enter vendor name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order ID *</label>
            <input
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
              placeholder="e.g. VO-2301"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number *</label>
            <input
              value={invoiceNumber}
              onChange={(e) => setInvoiceNumber(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
              placeholder="e.g. INV-GLC-2301"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Upload File</label>
            <input
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              accept=".pdf,.jpg,.jpeg,.png"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
            />
            <p className="text-xs text-gray-500 mt-1">Accepted formats: PDF, JPG, PNG</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button 
            onClick={onClose} 
            className="bg-white text-secondary border border-secondary rounded-full px-4 py-2 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button 
            onClick={handleSubmit} 
            className="bg-accent text-button-text rounded-full px-4 py-2 hover:opacity-90"
          >
            Upload Invoice
          </button>
        </div>
      </div>
    </div>
  )
}

export default AccountsInvoices
