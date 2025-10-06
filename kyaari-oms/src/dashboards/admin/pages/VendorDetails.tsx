import { useParams, useNavigate } from 'react-router-dom'
import { LineChart, Line, ResponsiveContainer, BarChart, Bar, Tooltip, XAxis, YAxis } from 'recharts'
import { BarChart3, Clock, FileText, Package, CheckSquare, AlertTriangle } from 'lucide-react'

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

  // Get vendor details or fallback
  const vendor = id ? mockVendorDetails[id] : null

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

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-[var(--color-happyplant-bg)] min-h-screen font-sans w-full overflow-x-hidden">
      {/* Back Button */}
      <button
        onClick={handleBackClick}
        className="flex items-center gap-2 text-[var(--color-accent)] hover:text-[var(--color-accent)]/80 mb-3 sm:mb-4 font-medium text-sm sm:text-base min-h-[44px] sm:min-h-auto"
      >
        ← Back to Vendors
      </button>

      {/* Header */}
      <div className="bg-[var(--color-header-bg)] p-4 sm:p-6 lg:p-8 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] mb-4 sm:mb-6 border border-[rgba(0,0,0,0.03)]">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--color-heading)] mb-2 font-[var(--font-heading)]">{vendor.name}</h1>
        <p className="text-sm sm:text-base lg:text-lg text-[var(--color-primary)] font-medium">Detailed performance metrics and order history</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-md border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase">Fill Rate</span>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--color-primary)]">
            {vendor.metrics.fillRate}%
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-md border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase">SLA Compliance</span>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--color-primary)]">
            {vendor.metrics.slaCompliance}%
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-md border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-purple-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase">Avg Invoice</span>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--color-primary)]">
            {vendor.metrics.avgInvoiceDays}d
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-md border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase">Avg Ticket</span>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--color-primary)]">
            {vendor.metrics.avgTicketDays}d
          </div>
        </div>
      </div>

      {/* Orders Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-md border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-4 h-4 sm:w-5 sm:h-5 text-gray-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase">Total Orders</span>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--color-primary)]">
            {vendor.metrics.ordersCount}
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-md border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase">Pending</span>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-orange-600">
            {vendor.metrics.pendingOrders}
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 rounded-xl shadow-md border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 text-green-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase">Completed</span>
          </div>
          <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">
            {vendor.metrics.completedOrders}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
        {/* Performance Trends Chart */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-white/20">
          <h3 className="text-base sm:text-lg font-semibold text-[var(--color-heading)] mb-3 sm:mb-4">Performance Trends</h3>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trendData}
                margin={{ top: 20, right: 20, left: 10, bottom: 20 }}
              >
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    `${value}%`, 
                    name === 'fillRate' ? 'Fill Rate' : 'SLA Compliance'
                  ]}
                />
                <Line 
                  dataKey="fillRate" 
                  stroke="#10b981" 
                  strokeWidth={2} 
                  dot={{ r: 3 }}
                  name="fillRate"
                />
                <Line 
                  dataKey="slaCompliance" 
                  stroke="#6366f1" 
                  strokeWidth={2} 
                  dot={{ r: 3 }}
                  name="slaCompliance"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Processing Times Chart */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-white/20">
          <h3 className="text-base sm:text-lg font-semibold text-[var(--color-heading)] mb-3 sm:mb-4">Processing Times</h3>
          <div className="h-48 sm:h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={processingData}
                margin={{ top: 20, right: 20, left: 10, bottom: 20 }}
              >
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    `${value}d`, 
                    name === 'invoiceDays' ? 'Invoice Processing' : 'Ticket Resolution'
                  ]}
                />
                <Bar dataKey="invoiceDays" fill="#f97316" name="invoiceDays" />
                <Bar dataKey="ticketDays" fill="#8b5cf6" name="ticketDays" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Orders Table */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-white/20">
        <h3 className="text-base sm:text-lg font-semibold text-[var(--color-heading)] mb-3 sm:mb-4">Recent Orders</h3>
        
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="py-3 font-semibold">Order Number</th>
                <th className="font-semibold">Date</th>
                <th className="font-semibold">Status</th>
                <th className="font-semibold">Items</th>
                <th className="font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {mockOrders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="py-3 font-medium text-[var(--color-heading)]">{order.orderNumber}</td>
                  <td className="text-gray-600 text-sm">{order.date}</td>
                  <td>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="text-gray-600 text-sm">{order.items}</td>
                  <td className="font-medium text-sm">{formatINR(order.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-3">
          {mockOrders.map((order) => (
            <div key={order.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
              <div className="flex justify-between items-start mb-3">
                <h4 className="font-semibold text-[var(--color-heading)] text-base">{order.orderNumber}</h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium flex-shrink-0 ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Date:</span>
                  <span className="text-sm font-medium">{order.date}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Items:</span>
                  <span className="text-sm font-medium">{order.items}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Amount:</span>
                  <span className="text-base font-bold text-[var(--color-heading)]">{formatINR(order.amount)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}