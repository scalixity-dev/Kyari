import { useParams, useNavigate } from 'react-router-dom'
import { useState, useMemo, useEffect } from 'react'
import { BarChart, Bar,  XAxis, YAxis, AreaChart, Area, CartesianGrid } from 'recharts'
import { BarChart3, Clock, FileText, Package, CheckSquare, AlertTriangle, Filter } from 'lucide-react'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../../../components/ui/chart"
import { Pagination, CustomDropdown, CSVPDFExportButton } from '../../../components'
import { vendorTrackingApi, type VendorPerformanceMetricsDto, type VendorSlaDto } from '../../../services/vendorTrackingApi'

interface FilterState {
  orderNumber: string;
  status: string;
  amountMin: string;
  amountMax: string;
}

// TypeScript types
interface VendorDetails {
  id: string
  companyName: string
  contactPersonName: string
  contactPhone: string
  fillRate?: number
  slaComplianceRate?: number
  user: {
    id: string
    email?: string
    name: string
    status: string
  }
}

interface Order {
  id: string
  orderNumber: string
  date: string
  status: string
  assignedQuantity: number
  confirmedQuantity?: number
  assignedAt: Date
  vendorActionAt?: Date
  orderItem: {
    productName: string
    quantity: number
    order: {
      orderNumber: string
      createdAt: Date
    }
  }
}

interface TrendData {
  period: string
  fillRate: number
  slaCompliance: number
}

interface ProcessingData {
  period: string
  fulfillmentTime: number
  slaCompliance: number
}

interface TimeFilter {
  type: 'days' | 'weeks' | 'months'
  label: string
}

// Time filter options
const timeFilters: TimeFilter[] = [
  { type: 'days', label: 'Last 30 Days' },
  { type: 'weeks', label: 'Last 4 Weeks' },
  { type: 'months', label: 'Last 12 Months' }
]

// Generate mock data based on time filter
const generateTrendData = (filterType: 'days' | 'weeks' | 'months'): TrendData[] => {
  if (filterType === 'days') {
    return Array.from({ length: 30 }, (_, i) => ({
      period: `${i + 1}`,
      fillRate: 85 + Math.random() * 10,
      slaCompliance: 80 + Math.random() * 15
    }))
  } else if (filterType === 'weeks') {
    return Array.from({ length: 4 }, (_, i) => ({
      period: `Week ${i + 1}`,
      fillRate: 85 + Math.random() * 10,
      slaCompliance: 80 + Math.random() * 15
    }))
  } else {
    return Array.from({ length: 12 }, (_, i) => ({
      period: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
      fillRate: 85 + Math.random() * 10,
      slaCompliance: 80 + Math.random() * 15
    }))
  }
}

const generateProcessingData = (filterType: 'days' | 'weeks' | 'months'): ProcessingData[] => {
  if (filterType === 'days') {
    return Array.from({ length: 30 }, (_, i) => ({
      period: `${i + 1}`,
      fulfillmentTime: 2 + Math.random() * 3,
      slaCompliance: 80 + Math.random() * 15
    }))
  } else if (filterType === 'weeks') {
    return Array.from({ length: 4 }, (_, i) => ({
      period: `Week ${i + 1}`,
      fulfillmentTime: 2 + Math.random() * 3,
      slaCompliance: 80 + Math.random() * 15
    }))
  } else {
    return Array.from({ length: 12 }, (_, i) => ({
      period: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][i],
      fulfillmentTime: 2 + Math.random() * 3,
      slaCompliance: 80 + Math.random() * 15
    }))
  }
}


// Helper function to get status color
const getStatusColor = (status: string): string => {
  switch (status) {
    case 'COMPLETED':
    case 'VERIFIED_OK':
    case 'DISPATCHED':
      return 'text-green-600 bg-green-100'
    case 'VENDOR_CONFIRMED_FULL':
    case 'VENDOR_CONFIRMED_PARTIAL':
    case 'INVOICED':
      return 'text-blue-600 bg-blue-100'
    case 'PENDING_CONFIRMATION':
      return 'text-orange-600 bg-orange-100'
    case 'VENDOR_DECLINED':
    case 'VERIFIED_MISMATCH':
      return 'text-red-600 bg-red-100'
    case 'STORE_RECEIVED':
      return 'text-purple-600 bg-purple-100'
    default: return 'text-gray-600 bg-gray-100'
  }
}

// Helper function to format status for display
const formatStatus = (status: string): string => {
  switch (status) {
    case 'PENDING_CONFIRMATION': return 'Pending'
    case 'VENDOR_CONFIRMED_FULL': return 'Confirmed Full'
    case 'VENDOR_CONFIRMED_PARTIAL': return 'Confirmed Partial'
    case 'VENDOR_DECLINED': return 'Declined'
    case 'INVOICED': return 'Invoiced'
    case 'DISPATCHED': return 'Dispatched'
    case 'STORE_RECEIVED': return 'Store Received'
    case 'VERIFIED_OK': return 'Verified OK'
    case 'VERIFIED_MISMATCH': return 'Verified Mismatch'
    case 'COMPLETED': return 'Completed'
    default: return status
  }
}

export default function VendorDetails() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10
  
  // State management
  const [vendor, setVendor] = useState<VendorDetails | null>(null)
  const [performanceMetrics, setPerformanceMetrics] = useState<VendorPerformanceMetricsDto | null>(null)
  const [slaMetrics, setSlaMetrics] = useState<VendorSlaDto | null>(null)
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Chart data state
  const [timeFilter, setTimeFilter] = useState<'days' | 'weeks' | 'months'>('days')
  const [trendData, setTrendData] = useState<TrendData[]>([])
  const [processingData, setProcessingData] = useState<ProcessingData[]>([])
  
  // Filter state
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    orderNumber: '',
    status: '',
    amountMin: '',
    amountMax: ''
  })

  // Fetch vendor data
  useEffect(() => {
    const fetchVendorData = async () => {
      if (!id) return

      try {
        setLoading(true)
        setError(null)

        // Fetch performance metrics and SLA data in parallel
        const [metricsResponse, slaResponse] = await Promise.all([
          vendorTrackingApi.getVendorPerformanceMetrics(id),
          vendorTrackingApi.getVendorSlaMetrics(id)
        ])

        setPerformanceMetrics(metricsResponse)
        setSlaMetrics(slaResponse)
        setVendor(metricsResponse.vendor)
        setOrders(metricsResponse.recentAssignments.map(assignment => ({
          id: assignment.id,
          orderNumber: assignment.orderItem.order.orderNumber,
          date: new Date(assignment.assignedAt).toLocaleDateString('en-GB'),
          status: assignment.status,
          assignedQuantity: assignment.assignedQuantity,
          confirmedQuantity: assignment.confirmedQuantity,
          assignedAt: assignment.assignedAt,
          vendorActionAt: assignment.vendorActionAt,
          orderItem: assignment.orderItem
        })))

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch vendor data'
        setError(`API Error: ${errorMessage}. Please check if the backend server is running.`)
        console.error('Error fetching vendor data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchVendorData()
  }, [id])

  // Fetch chart data when time filter changes
  useEffect(() => {
    const fetchChartData = async () => {
      if (!id) return

      try {
        const data = await vendorTrackingApi.getVendorPerformanceTrends(id, timeFilter)
        setTrendData(data.trends)
        setProcessingData(data.fulfillment)
      } catch (err) {
        console.error('Error fetching chart data:', err)
        // Fallback to mock data if API fails
        setTrendData(generateTrendData(timeFilter))
        setProcessingData(generateProcessingData(timeFilter))
      }
    }

    fetchChartData()
  }, [id, timeFilter])
  
  // Filter logic
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (filters.orderNumber && !order.orderNumber.toLowerCase().includes(filters.orderNumber.toLowerCase())) return false
      if (filters.status && order.status !== filters.status) return false
      if (filters.amountMin && order.assignedQuantity < parseInt(filters.amountMin)) return false
      if (filters.amountMax && order.assignedQuantity > parseInt(filters.amountMax)) return false
      return true
    })
  }, [orders, filters])

  // Pagination calculations
  const totalPages = Math.ceil(filteredOrders.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, filteredOrders.length)
  const paginatedOrders = useMemo(() => 
    filteredOrders.slice(startIndex, endIndex),
    [filteredOrders, startIndex, endIndex]
  )

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 bg-[var(--color-sharktank-bg)] min-h-screen font-sans w-full overflow-x-hidden flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vendor data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 bg-[var(--color-sharktank-bg)] min-h-screen font-sans w-full overflow-x-hidden flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

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
    const headers = ['Order Number', 'Date', 'Status', 'Assigned Qty', 'Confirmed Qty']
    const csvContent = [
      headers.join(','),
      ...filteredOrders.map(order => [
        order.orderNumber,
        order.date,
        order.status,
        order.assignedQuantity,
        order.confirmedQuantity || 'N/A'
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
      `${order.orderNumber} | ${order.date} | ${order.status} | Assigned: ${order.assignedQuantity} | Confirmed: ${order.confirmedQuantity || 'N/A'}`
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
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-heading mb-2">{vendor.companyName}</h1>
        <p className="text-sm sm:text-base text-gray-600">Detailed performance metrics and order history</p>
      </div>

      {/* KPI Cards (status-card style) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-10">
        <div className="bg-[var(--color-happyplant-bg)] p-6 pt-10 rounded-xl shadow-sm text-center relative">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 sm:w-14 sm:h-14 bg-[var(--color-accent)] rounded-full p-2.5 sm:p-3 flex items-center justify-center text-white shadow-md">
            <BarChart3 className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-semibold text-gray-800 mb-1">Fill Rate</h4>
          <div className="text-2xl font-bold text-gray-900 mt-1">{performanceMetrics?.metrics.calculatedFillRate.toFixed(1) || 0}%</div>
        </div>

        <div className="bg-[var(--color-happyplant-bg)] p-6 pt-10 rounded-xl shadow-sm text-center relative">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 sm:w-14 sm:h-14 bg-[var(--color-accent)] rounded-full p-2.5 sm:p-3 flex items-center justify-center text-white shadow-md">
            <CheckSquare className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-semibold text-gray-800 mb-1">SLA Compliance</h4>
          <div className="text-2xl font-bold text-gray-900 mt-1">{slaMetrics?.metrics.slaComplianceRate.toFixed(1) || 0}%</div>
        </div>

        <div className="bg-[var(--color-happyplant-bg)] p-6 pt-10 rounded-xl shadow-sm text-center relative">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 sm:w-14 sm:h-14 bg-[var(--color-accent)] rounded-full p-2.5 sm:p-3 flex items-center justify-center text-white shadow-md">
            <FileText className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-semibold text-gray-800 mb-1">Avg Fulfillment</h4>
          <div className="text-2xl font-bold text-gray-900 mt-1">{slaMetrics?.metrics.avgFulfillmentTime.toFixed(1) || 0}d</div>
        </div>

        <div className="bg-[var(--color-happyplant-bg)] p-6 pt-10 rounded-xl shadow-sm text-center relative">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 sm:w-14 sm:h-14 bg-[var(--color-accent)] rounded-full p-2.5 sm:p-3 flex items-center justify-center text-white shadow-md">
            <Clock className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-semibold text-gray-800 mb-1">Total Orders</h4>
          <div className="text-2xl font-bold text-gray-900 mt-1">{performanceMetrics?.metrics.totalOrders || 0}</div>
        </div>
      </div>

      {/* Orders Summary Cards (status-card style) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <div className="bg-[var(--color-happyplant-bg)] p-6 pt-10 rounded-xl shadow-sm text-center relative">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 sm:w-14 sm:h-14 bg-[var(--color-accent)] rounded-full p-2.5 sm:p-3 flex items-center justify-center text-white shadow-md">
            <Package className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-semibold text-gray-800 mb-1">Assigned Qty</h4>
          <div className="text-2xl font-bold text-gray-900 mt-1">{performanceMetrics?.metrics.totalAssignedQuantity || 0}</div>
        </div>

        <div className="bg-[var(--color-happyplant-bg)] p-6 pt-10 rounded-xl shadow-sm text-center relative">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 sm:w-14 sm:h-14 bg-[var(--color-accent)] rounded-full p-2.5 sm:p-3 flex items-center justify-center text-white shadow-md">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-semibold text-gray-800 mb-1">Confirmed Qty</h4>
          <div className="text-2xl font-bold text-orange-600 mt-1">{performanceMetrics?.metrics.totalConfirmedQuantity || 0}</div>
        </div>

        <div className="bg-[var(--color-happyplant-bg)] p-6 pt-10 rounded-xl shadow-sm text-center relative">
          <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-12 h-12 sm:w-14 sm:h-14 bg-[var(--color-accent)] rounded-full p-2.5 sm:p-3 flex items-center justify-center text-white shadow-md">
            <CheckSquare className="w-5 h-5" />
          </div>
          <h4 className="text-sm font-semibold text-gray-800 mb-1">Current Fill Rate</h4>
          <div className="text-2xl font-bold text-green-600 mt-1">{performanceMetrics?.metrics.currentFillRate.toFixed(1) || 0}%</div>
        </div>
      </div>

      {/* Time Filter for Charts */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-[var(--color-heading)] mb-1 sm:mb-2">Performance Analytics</h3>
            <p className="text-sm text-gray-500">Track vendor performance over time</p>
          </div>
          
          <div className="flex gap-2">
            {timeFilters.map((filter) => (
              <button
                key={filter.type}
                onClick={() => setTimeFilter(filter.type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] ${
                  timeFilter === filter.type
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {filter.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Charts Row - Stacked Vertically */}
      <div className="space-y-4 sm:space-y-6 mb-4 sm:mb-6">
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
            className="h-64 sm:h-80 w-full"
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
                dataKey="period" 
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
          <h3 className="text-base sm:text-lg font-semibold text-[var(--color-heading)] mb-3 sm:mb-4">Fulfillment Times</h3>
          <ChartContainer 
            config={{
              fulfillmentTime: {
                label: "Fulfillment Time",
                color: "var(--color-secondary)",
              },
              slaCompliance: {
                label: "SLA Compliance",
                color: "var(--color-accent)",
              },
            }}
            className="h-64 sm:h-80 w-full"
          >
            <BarChart
              data={processingData}
              margin={{ top: 20, right: 20, left: -20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
              <XAxis 
                dataKey="period" 
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
                    name === 'fulfillmentTime' ? `${value}d` : `${value}%`, 
                    name === 'fulfillmentTime' ? 'Fulfillment Time' : 'SLA Compliance'
                  ]}
                  className="bg-white"
                />}
              />
              <Bar dataKey="fulfillmentTime" fill="var(--color-secondary)" radius={[8, 8, 0, 0]} />
              <Bar dataKey="slaCompliance" fill="var(--color-accent)" radius={[8, 8, 0, 0]} />
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
                    { value: 'PENDING_CONFIRMATION', label: 'Pending Confirmation' },
                    { value: 'VENDOR_CONFIRMED_FULL', label: 'Confirmed Full' },
                    { value: 'VENDOR_CONFIRMED_PARTIAL', label: 'Confirmed Partial' },
                    { value: 'VENDOR_DECLINED', label: 'Declined' },
                    { value: 'INVOICED', label: 'Invoiced' },
                    { value: 'DISPATCHED', label: 'Dispatched' },
                    { value: 'STORE_RECEIVED', label: 'Store Received' },
                    { value: 'VERIFIED_OK', label: 'Verified OK' },
                    { value: 'VERIFIED_MISMATCH', label: 'Verified Mismatch' },
                    { value: 'COMPLETED', label: 'Completed' }
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
                  Assigned Qty
                </th>
                <th className="text-left p-3 font-heading font-normal text-xs uppercase tracking-wider" style={{ color: 'var(--color-button-text)' }}>
                  Confirmed Qty
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
                      {formatStatus(order.status)}
                    </span>
                  </td>
                  <td className="p-3 text-sm text-gray-600">{order.assignedQuantity}</td>
                  <td className="p-3 text-sm font-medium text-gray-900">{order.confirmedQuantity || 'N/A'}</td>
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
                  {formatStatus(order.status)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-2 text-sm">
                <div>
                  <span className="text-gray-500 block">Date</span>
                  <span className="font-medium">{order.date}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Assigned Qty</span>
                  <span className="font-medium">{order.assignedQuantity}</span>
                </div>
              </div>
              <div className="pt-2 border-t border-gray-100">
                <span className="text-gray-500 text-sm block mb-1">Confirmed Qty</span>
                <span className="text-base font-bold text-[var(--color-heading)]">{order.confirmedQuantity || 'N/A'}</span>
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