import { useParams, useNavigate } from 'react-router-dom'
import { useState, useMemo } from 'react'
import { BarChart, Bar,  XAxis, YAxis, AreaChart, Area, CartesianGrid } from 'recharts'
import { BarChart3, Clock, FileText, Package, CheckSquare, AlertTriangle, Filter } from 'lucide-react'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../../../components/ui/chart"
import { Pagination, CustomDropdown, CSVPDFExportButton } from '../../../components'

interface FilterState {
  orderNumber: string;
  status: string;
  amountMin: string;
  amountMax: string;
}

// TypeScript types
interface VendorMetrics {
  fillRate: number
  slaCompliance: number
  avgInvoiceDays: number
  avgTicketDays: number
  ordersCount: number
  pendingOrders: number
  completedOrders: number
}

interface VendorDetails {
  id: string
  name: string
  metrics: VendorMetrics
}

interface Order {
  id: string
  orderNumber: string
  date: string
  status: 'Pending' | 'Processing' | 'Completed' | 'Cancelled'
  amount: number
  items: number
}

interface TrendData {
  month: string
  fillRate: number
  slaCompliance: number
}

interface ProcessingData {
  month: string
  invoiceDays: number
  ticketDays: number
}

// Mock data for the vendor details
const mockVendorDetails: Record<string, VendorDetails> = {
  'greenleaf-farms': {
    id: 'greenleaf-farms',
    name: 'GreenLeaf Farms',
    metrics: {
      fillRate: 94,
      slaCompliance: 90,
      avgInvoiceDays: 3.5,
      avgTicketDays: 1.2,
      ordersCount: 156,
      pendingOrders: 12,
      completedOrders: 144
    }
  },
  'happyplant-co': {
    id: 'happyplant-co',
    name: 'HappyPlant Co',
    metrics: {
      fillRate: 91,
      slaCompliance: 86,
      avgInvoiceDays: 4.2,
      avgTicketDays: 1.6,
      ordersCount: 142,
      pendingOrders: 8,
      completedOrders: 134
    }
  },
  'bloomworks': {
    id: 'bloomworks',
    name: 'BloomWorks',
    metrics: {
      fillRate: 89,
      slaCompliance: 84,
      avgInvoiceDays: 3.9,
      avgTicketDays: 2.0,
      ordersCount: 128,
      pendingOrders: 15,
      completedOrders: 113
    }
  }
}

// Mock trend data
const trendData: TrendData[] = [
  { month: 'Jan', fillRate: 88, slaCompliance: 85 },
  { month: 'Feb', fillRate: 90, slaCompliance: 87 },
  { month: 'Mar', fillRate: 92, slaCompliance: 89 },
  { month: 'Apr', fillRate: 91, slaCompliance: 88 },
  { month: 'May', fillRate: 93, slaCompliance: 90 },
  { month: 'Jun', fillRate: 94, slaCompliance: 90 }
]

const processingData: ProcessingData[] = [
  { month: 'Jan', invoiceDays: 4.2, ticketDays: 1.8 },
  { month: 'Feb', invoiceDays: 3.9, ticketDays: 1.5 },
  { month: 'Mar', invoiceDays: 3.7, ticketDays: 1.3 },
  { month: 'Apr', invoiceDays: 3.8, ticketDays: 1.4 },
  { month: 'May', invoiceDays: 3.6, ticketDays: 1.2 },
  { month: 'Jun', invoiceDays: 3.5, ticketDays: 1.2 }
]

// Mock orders data
const mockOrders: Order[] = [
  { id: '1', orderNumber: 'ORD-001', date: '15/09/2025', status: 'Completed', amount: 2450, items: 25 },
  { id: '2', orderNumber: 'ORD-002', date: '18/09/2025', status: 'Processing', amount: 1890, items: 18 },
  { id: '3', orderNumber: 'ORD-003', date: '20/09/2025', status: 'Pending', amount: 3200, items: 32 },
  { id: '4', orderNumber: 'ORD-004', date: '22/09/2025', status: 'Completed', amount: 1750, items: 15 },
  { id: '5', orderNumber: 'ORD-005', date: '25/09/2025', status: 'Processing', amount: 4100, items: 41 }
]

// Helper function to format currency
const formatINR = (amount: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// Helper function to get status color
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'Completed': return 'text-green-600 bg-green-100'
    case 'Processing': return 'text-yellow-600 bg-yellow-100'
    case 'Pending': return 'text-orange-600 bg-orange-100'
    case 'Cancelled': return 'text-red-600 bg-red-100'
    default: return 'text-gray-600 bg-gray-100'
  }
}

export default function VendorDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  
  // Filter state
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    orderNumber: '',
    status: '',
    amountMin: '',
    amountMax: ''
  })

  // Get vendor details or fallback
  const vendor = id ? mockVendorDetails[id] : null
  
  // Filter logic
  const filteredOrders = useMemo(() => {
    return mockOrders.filter(order => {
      if (filters.orderNumber && !order.orderNumber.toLowerCase().includes(filters.orderNumber.toLowerCase())) return false
      if (filters.status && order.status !== filters.status) return false
      if (filters.amountMin && order.amount < parseInt(filters.amountMin)) return false
      if (filters.amountMax && order.amount > parseInt(filters.amountMax)) return false
      return true
    })
  }, [filters])

  // Pagination calculations
  const totalPages = Math.ceil(filteredOrders.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, filteredOrders.length)
  const paginatedOrders = useMemo(() => 
    filteredOrders.slice(startIndex, endIndex),
    [filteredOrders, startIndex, endIndex]
  )

  if (!vendor) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 bg-[var(--color-happyplant-bg)] min-h-screen font-sans w-full overflow-x-hidden">
        <div className="bg-white p-6 sm:p-8 rounded-xl shadow-md border border-white/20 text-center max-w-md mx-auto mt-8 sm:mt-16">
          <h1 className="text-xl sm:text-2xl font-bold text-[var(--color-heading)] mb-3">Vendor Not Found</h1>
          <p className="text-gray-500 mb-6 text-sm sm:text-base">The requested vendor could not be found.</p>
          <button
            onClick={() => navigate('/admin/tracking/vendors')}
            className="px-4 sm:px-6 py-2 sm:py-3 bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-accent)]/90 transition-colors text-sm sm:text-base min-h-[44px] w-full sm:w-auto"
          >
            Back to Vendors
          </button>
        </div>
      </div>
    )
  }

  const handleBackClick = () => {
    navigate('/admin/tracking/vendors')
  }
  
  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1) // Reset to first page when filter changes
  }
  
  const handleResetFilters = () => {
    setFilters({
      orderNumber: '',
      status: '',
      amountMin: '',
      amountMax: ''
    })
    setCurrentPage(1)
  }
  
  const handleExportCSV = () => {
    const headers = ['Order Number', 'Date', 'Status', 'Items', 'Amount (INR)']
    const csvContent = [
      headers.join(','),
      ...filteredOrders.map(order => [
        order.orderNumber,
        order.date,
        order.status,
        order.items,
        order.amount
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vendor-orders-${id}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleExportPDF = () => {
    const content = filteredOrders.map(order => 
      `${order.orderNumber} | ${order.date} | ${order.status} | Items: ${order.items} | ${formatINR(order.amount)}`
    ).join('\n')
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vendor-orders-${id}-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-[var(--color-sharktank-bg)] min-h-screen font-sans w-full overflow-x-hidden">
      {/* Back Button */}
      <button
        onClick={handleBackClick}
        className="flex items-center gap-2 text-[var(--color-accent)] hover:text-[var(--color-accent)]/80 mb-3 sm:mb-4 font-medium text-sm sm:text-base min-h-[44px] sm:min-h-auto"
      >
        ← Back to Vendors
      </button>

      {/* Header */}
      <div className="mb-9">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-heading mb-2">{vendor.name}</h1>
        <p className="text-sm sm:text-base text-gray-600">Detailed performance metrics and order history</p>
      </div>

      {/* KPI Cards (status-card style) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-10">
        <div className="bg-[var(--color-happyplant-bg)] p-6 pt-10 rounded-xl shadow-sm text-center relative">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 sm:w-14 sm:h-14 bg-[var(--color-accent)] rounded-full p-2.5 sm:p-3 flex items-center justify-center text-white shadow-md">
            <BarChart3 className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-semibold text-gray-800 mb-1">Fill Rate</h4>
          <div className="text-2xl font-bold text-gray-900 mt-1">{vendor.metrics.fillRate}%</div>
        </div>

        <div className="bg-[var(--color-happyplant-bg)] p-6 pt-10 rounded-xl shadow-sm text-center relative">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 sm:w-14 sm:h-14 bg-[var(--color-accent)] rounded-full p-2.5 sm:p-3 flex items-center justify-center text-white shadow-md">
            <CheckSquare className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-semibold text-gray-800 mb-1">SLA Compliance</h4>
          <div className="text-2xl font-bold text-gray-900 mt-1">{vendor.metrics.slaCompliance}%</div>
        </div>

        <div className="bg-[var(--color-happyplant-bg)] p-6 pt-10 rounded-xl shadow-sm text-center relative">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 sm:w-14 sm:h-14 bg-[var(--color-accent)] rounded-full p-2.5 sm:p-3 flex items-center justify-center text-white shadow-md">
            <FileText className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-semibold text-gray-800 mb-1">Avg Invoice</h4>
          <div className="text-2xl font-bold text-gray-900 mt-1">{vendor.metrics.avgInvoiceDays}d</div>
        </div>

        <div className="bg-[var(--color-happyplant-bg)] p-6 pt-10 rounded-xl shadow-sm text-center relative">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 sm:w-14 sm:h-14 bg-[var(--color-accent)] rounded-full p-2.5 sm:p-3 flex items-center justify-center text-white shadow-md">
            <Clock className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-semibold text-gray-800 mb-1">Avg Ticket</h4>
          <div className="text-2xl font-bold text-gray-900 mt-1">{vendor.metrics.avgTicketDays}d</div>
        </div>
      </div>

      {/* Orders Summary Cards (status-card style) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-[var(--color-happyplant-bg)] p-6 pt-10 rounded-xl shadow-sm text-center relative">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 sm:w-14 sm:h-14 bg-[var(--color-accent)] rounded-full p-2.5 sm:p-3 flex items-center justify-center text-white shadow-md">
            <Package className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-semibold text-gray-800 mb-1">Total Orders</h4>
          <div className="text-2xl font-bold text-gray-900 mt-1">{vendor.metrics.ordersCount}</div>
        </div>

        <div className="bg-[var(--color-happyplant-bg)] p-6 pt-10 rounded-xl shadow-sm text-center relative">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 sm:w-14 sm:h-14 bg-[var(--color-accent)] rounded-full p-2.5 sm:p-3 flex items-center justify-center text-white shadow-md">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-semibold text-gray-800 mb-1">Pending</h4>
          <div className="text-2xl font-bold text-orange-600 mt-1">{vendor.metrics.pendingOrders}</div>
        </div>

        <div className="bg-[var(--color-happyplant-bg)] p-6 pt-10 rounded-xl shadow-sm text-center relative">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 sm:w-14 sm:h-14 bg-[var(--color-accent)] rounded-full p-2.5 sm:p-3 flex items-center justify-center text-white shadow-md">
            <CheckSquare className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-semibold text-gray-800 mb-1">Completed</h4>
          <div className="text-2xl font-bold text-green-600 mt-1">{vendor.metrics.completedOrders}</div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
        {/* Performance Trends Chart */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-white/20">
          <h3 className="text-base sm:text-lg font-semibold text-[var(--color-heading)] mb-3 sm:mb-4">Performance Trends</h3>
          <ChartContainer 
            config={{
              fillRate: {
                label: "Fill Rate",
                color: "var(--color-secondary)",
              },
              slaCompliance: {
                label: "SLA Compliance",
                color: "var(--color-accent)",
              },
            }}
            className="h-48 sm:h-64 w-full"
          >
            <AreaChart
              data={trendData}
              margin={{ top: 20, right: 20, left: -20, bottom: 20 }}
            >
              <defs>
                <linearGradient id="fillFillRate" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-secondary)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-secondary)" stopOpacity={0.1} />
                </linearGradient>
                <linearGradient id="fillSlaCompliance" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
                domain={[75, 100]}
              />
              <ChartTooltip 
                cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }}
                content={<ChartTooltipContent 
                  formatter={(value, name) => [
                    `${value}%`, 
                    name === 'fillRate' ? 'Fill Rate' : 'SLA Compliance'
                  ]}
                  className="bg-white"
                />}
              />
              <Area 
                type="monotone" 
                dataKey="fillRate" 
                stroke="var(--color-secondary)" 
                strokeWidth={2}
                fill="url(#fillFillRate)"
                fillOpacity={1}
              />
              <Area 
                type="monotone" 
                dataKey="slaCompliance" 
                stroke="var(--color-accent)" 
                strokeWidth={2}
                fill="url(#fillSlaCompliance)"
                fillOpacity={1}
              />
            </AreaChart>
          </ChartContainer>
        </div>

        {/* Processing Times Chart */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-white/20">
          <h3 className="text-base sm:text-lg font-semibold text-[var(--color-heading)] mb-3 sm:mb-4">Processing Times</h3>
          <ChartContainer 
            config={{
              invoiceDays: {
                label: "Invoice Processing",
                color: "var(--color-secondary)",
              },
              ticketDays: {
                label: "Ticket Resolution",
                color: "var(--color-accent)",
              },
            }}
            className="h-48 sm:h-64 w-full"
          >
            <BarChart
              data={processingData}
              margin={{ top: 20, right: 20, left: -20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
              <XAxis 
                dataKey="month" 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />
              <ChartTooltip 
                cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                content={<ChartTooltipContent 
                  formatter={(value, name) => [
                    `${value}d`, 
                    name === 'invoiceDays' ? 'Invoice Processing' : 'Ticket Resolution'
                  ]}
                  className="bg-white"
                />}
              />
              <Bar dataKey="invoiceDays" fill="var(--color-secondary)" radius={[8, 8, 0, 0]} />
              <Bar dataKey="ticketDays" fill="var(--color-accent)" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ChartContainer>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 sm:mb-4">
          <div>
            <h3 className="text-base sm:text-xl font-semibold text-[var(--color-heading)] mb-1 sm:mb-2">Recent Orders</h3>
            <p className="text-sm text-gray-500">Latest order activity and status</p>
          </div>
          
          {/* Filter and Export Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors min-h-[44px] sm:min-h-auto w-full sm:w-auto"
            >
              <Filter size={16} className="flex-shrink-0" />
              <span className="text-sm">Filter</span>
            </button>
            <CSVPDFExportButton
              onExportCSV={handleExportCSV}
              onExportPDF={handleExportPDF}
            />
          </div>
        </div>
        
        {/* Filter Section */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Order Number</label>
                <input
                  type="text"
                  value={filters.orderNumber}
                  onChange={(e) => handleFilterChange('orderNumber', e.target.value)}
                  placeholder="Search order..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200 min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <CustomDropdown
                  value={filters.status}
                  onChange={(value) => handleFilterChange('status', value)}
                  options={[
                    { value: '', label: 'All Status' },
                    { value: 'Pending', label: 'Pending' },
                    { value: 'Processing', label: 'Processing' },
                    { value: 'Completed', label: 'Completed' },
                    { value: 'Cancelled', label: 'Cancelled' }
                  ]}
                  placeholder="All Status"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Amount Range (₹)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={filters.amountMin}
                    onChange={(e) => handleFilterChange('amountMin', e.target.value)}
                    placeholder="Min"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200 min-h-[44px]"
                  />
                  <input
                    type="number"
                    value={filters.amountMax}
                    onChange={(e) => handleFilterChange('amountMax', e.target.value)}
                    placeholder="Max"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200 min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Actions</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handleResetFilters}
                    className="px-4 py-2 border border-secondary rounded-md text-secondary font-medium hover:bg-gray-50 text-sm min-h-[44px]"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {/* Desktop Table */}
        <div className="hidden lg:block bg-white rounded-xl overflow-hidden shadow-md border border-gray-100">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="" style={{ background: 'var(--color-accent)' }}>
                <th className="text-left p-3 font-heading font-normal text-xs uppercase tracking-wider" style={{ color: 'var(--color-button-text)' }}>
                  Order Number
                </th>
                <th className="text-left p-3 font-heading font-normal text-xs uppercase tracking-wider" style={{ color: 'var(--color-button-text)' }}>
                  Date
                </th>
                <th className="text-left p-3 font-heading font-normal text-xs uppercase tracking-wider" style={{ color: 'var(--color-button-text)' }}>
                  Status
                </th>
                <th className="text-left p-3 font-heading font-normal text-xs uppercase tracking-wider" style={{ color: 'var(--color-button-text)' }}>
                  Items
                </th>
                <th className="text-left p-3 font-heading font-normal text-xs uppercase tracking-wider" style={{ color: 'var(--color-button-text)' }}>
                  Amount
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedOrders.map((order) => (
                <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50 bg-white transition-colors">
                  <td className="p-3 font-semibold text-[var(--color-secondary)]">{order.orderNumber}</td>
                  <td className="p-3 text-sm text-gray-600">{order.date}</td>
                  <td className="p-3">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-gray-600">{order.items}</td>
                  <td className="p-3 text-sm font-medium text-gray-900">{formatINR(order.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {/* Desktop Pagination */}
          {filteredOrders.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredOrders.length}
              startIndex={startIndex}
              endIndex={endIndex}
              onPageChange={setCurrentPage}
              itemLabel="orders"
              variant="desktop"
            />
          )}
        </div>

        {/* Mobile Cards */}
        <div className="lg:hidden space-y-3">
          {paginatedOrders.map((order) => (
            <div key={order.id} className="rounded-xl p-4 border border-gray-200 bg-white">
              <div className="flex items-start justify-between mb-3">
                <h4 className="font-semibold text-[var(--color-secondary)] text-lg">{order.orderNumber}</h4>
                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-2 text-sm">
                <div>
                  <span className="text-gray-500 block">Date</span>
                  <span className="font-medium">{order.date}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Items</span>
                  <span className="font-medium">{order.items}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-gray-100">
                <span className="text-gray-500 text-sm block mb-1">Amount</span>
                <span className="text-base font-bold text-[var(--color-heading)]">{formatINR(order.amount)}</span>
              </div>
            </div>
          ))}
          
          {/* Mobile Pagination */}
          {filteredOrders.length > 0 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={filteredOrders.length}
              startIndex={startIndex}
              endIndex={endIndex}
              onPageChange={setCurrentPage}
              itemLabel="orders"
              variant="mobile"
            />
          )}
        </div>
      </div>
    </div>
  )
}