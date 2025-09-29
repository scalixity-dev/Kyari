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
      <div className="p-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--color-heading)]">Vendor Not Found</h1>
          <p className="text-gray-500 mt-2">The requested vendor could not be found.</p>
          <button
            onClick={() => navigate('/admin/tracking/vendors')}
            className="mt-4 px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-accent)]/90"
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
    <div className="p-4 md:p-8 bg-[var(--color-happyplant-bg)] min-h-screen">
      {/* Header with Back Button */}
      <div className="mb-6">
        <button
          onClick={handleBackClick}
          className="flex items-center gap-2 text-[var(--color-accent)] hover:text-[var(--color-accent)]/80 mb-4 font-medium"
        >
          ← Back to Vendors
        </button>
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--color-heading)]">{vendor.name}</h1>
        <p className="text-sm text-gray-500">Detailed performance metrics and order history</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-md border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-5 h-5 text-green-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase">Fill Rate</span>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-[var(--color-primary)]">
            {vendor.metrics.fillRate}%
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-md border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <CheckSquare className="w-5 h-5 text-blue-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase">SLA Compliance</span>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-[var(--color-primary)]">
            {vendor.metrics.slaCompliance}%
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-md border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="w-5 h-5 text-purple-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase">Avg Invoice</span>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-[var(--color-primary)]">
            {vendor.metrics.avgInvoiceDays}d
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-md border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-5 h-5 text-orange-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase">Avg Ticket</span>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-[var(--color-primary)]">
            {vendor.metrics.avgTicketDays}d
          </div>
        </div>
      </div>

      {/* Orders Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-xl shadow-md border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <Package className="w-5 h-5 text-gray-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase">Total Orders</span>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-[var(--color-primary)]">
            {vendor.metrics.ordersCount}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-md border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase">Pending</span>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-orange-600">
            {vendor.metrics.pendingOrders}
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl shadow-md border border-white/20">
          <div className="flex items-center gap-2 mb-2">
            <CheckSquare className="w-5 h-5 text-green-500" />
            <span className="text-xs font-semibold text-gray-500 uppercase">Completed</span>
          </div>
          <div className="text-2xl md:text-3xl font-bold text-green-600">
            {vendor.metrics.completedOrders}
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        {/* Performance Trends Chart */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-white/20">
          <h3 className="text-lg font-semibold text-[var(--color-heading)] mb-4">Performance Trends</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={trendData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    `${value}%`, 
                    name === 'fillRate' ? 'Fill Rate' : 'SLA Compliance'
                  ]}
                />
                <Line 
                  dataKey="fillRate" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  dot={{ r: 4 }}
                  name="fillRate"
                />
                <Line 
                  dataKey="slaCompliance" 
                  stroke="#6366f1" 
                  strokeWidth={3} 
                  dot={{ r: 4 }}
                  name="slaCompliance"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Processing Times Chart */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-white/20">
          <h3 className="text-lg font-semibold text-[var(--color-heading)] mb-4">Processing Times</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={processingData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <XAxis dataKey="month" />
                <YAxis />
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
      <div className="bg-white p-6 rounded-xl shadow-md border border-white/20">
        <h3 className="text-lg font-semibold text-[var(--color-heading)] mb-4">Recent Orders</h3>
        
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="py-3">Order Number</th>
                <th>Date</th>
                <th>Status</th>
                <th>Items</th>
                <th>Amount</th>
              </tr>
            </thead>
            <tbody>
              {mockOrders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="py-3 font-medium">{order.orderNumber}</td>
                  <td className="text-gray-600">{order.date}</td>
                  <td>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status}
                    </span>
                  </td>
                  <td className="text-gray-600">{order.items}</td>
                  <td className="font-medium">{formatINR(order.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards */}
        <div className="md:hidden space-y-4">
          {mockOrders.map((order) => (
            <div key={order.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-2">
                <h4 className="font-medium">{order.orderNumber}</h4>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                  {order.status}
                </span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <div>Date: {order.date}</div>
                <div>Items: {order.items}</div>
                <div className="font-medium text-black">Amount: {formatINR(order.amount)}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}