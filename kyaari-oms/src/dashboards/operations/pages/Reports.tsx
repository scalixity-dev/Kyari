import { useState, useEffect } from 'react'
import { Clock, AlertTriangle, CheckSquare, BarChart3, ChevronUp, ChevronDown, Search, ChevronLeft, ChevronRight } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { CustomDropdown } from '../../../components/CustomDropdown'
import type { DropdownOption } from '../../../components/CustomDropdown/CustomDropdown'

interface TicketMetrics {
  raised: number
  resolved: number
  pending: number
  avgResolutionTime: number
}

interface VendorMismatch {
  vendorName: string
  vendorId: string
  totalOrders: number
  mismatchOrders: number
  mismatchPercentage: number
}

interface MonthlyData {
  month: string
  ticketsRaised: number
  ticketsResolved: number
  avgResolutionHours: number
}

const currentTicketMetrics: TicketMetrics = {
  raised: 45,
  resolved: 38,
  pending: 7,
  avgResolutionTime: 18.5 // hours
}

const vendorMismatchData: VendorMismatch[] = [
  {
    vendorName: 'Green Valley Suppliers',
    vendorId: 'VEN-002',
    totalOrders: 120,
    mismatchOrders: 8,
    mismatchPercentage: 6.7
  },
  {
    vendorName: 'Farm Direct Ltd',
    vendorId: 'VEN-004',
    totalOrders: 95,
    mismatchOrders: 4,
    mismatchPercentage: 4.2
  },
  {
    vendorName: 'Fresh Farms Pvt Ltd',
    vendorId: 'VEN-001',
    totalOrders: 150,
    mismatchOrders: 5,
    mismatchPercentage: 3.3
  },
  {
    vendorName: 'Organic Harvest Co',
    vendorId: 'VEN-003',
    totalOrders: 80,
    mismatchOrders: 2,
    mismatchPercentage: 2.5
  },
  {
    vendorName: 'Metro Vegetables',
    vendorId: 'VEN-005',
    totalOrders: 110,
    mismatchOrders: 1,
    mismatchPercentage: 0.9
  }
]

const monthlyTrends: MonthlyData[] = [
  { month: 'Jul', ticketsRaised: 32, ticketsResolved: 30, avgResolutionHours: 22 },
  { month: 'Aug', ticketsRaised: 41, ticketsResolved: 39, avgResolutionHours: 20 },
  { month: 'Sep', ticketsRaised: 45, ticketsResolved: 38, avgResolutionHours: 18.5 }
]

const getPerformanceIndicator = (current: number, previous: number) => {
  const change = ((current - previous) / previous) * 100
  const isPositive = change > 0
  return {
    value: Math.abs(change).toFixed(1),
    isPositive,
    icon: isPositive ? ChevronUp : ChevronDown,
    color: isPositive ? 'text-green-600' : 'text-red-600',
    bgColor: isPositive ? 'bg-green-100' : 'bg-red-100'
  }
}

const MetricCard = ({ title, value, unit, change, icon: Icon, subtitle }: {
  title: string
  value: number | string
  unit?: string
  change?: { value: string; isPositive: boolean; color: string; bgColor: string }
  icon: LucideIcon
  subtitle?: string
}) => (
  <div className="bg-[#ECDDC9] pt-12 sm:pt-16 pb-4 sm:pb-6 px-4 sm:px-6 rounded-xl shadow-sm flex flex-col items-center gap-2 sm:gap-3 border border-gray-200 relative overflow-visible">
    <div className="absolute -top-8 sm:-top-10 left-1/2 -translate-x-1/2 w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-full bg-[#C3754C] text-white shadow-md">
      <Icon className="w-7 h-7 sm:w-8 sm:h-8" color="white" />
    </div>
    <div className="flex flex-col items-center text-center w-full">

      <h3 className="text-sm sm:text-base md:text-[18px] leading-[110%] tracking-[0] text-center text-[#2d3748] mb-1 sm:mb-2 font-bold">{title}</h3>
      {change && (
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${change.bgColor} ${change.color} mb-2`}>
          {change.isPositive ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {change.value}%
        </div>
      )}
      <div className="text-2xl sm:text-3xl font-bold text-[#2d3748] mb-1 sm:mb-2">
        {value}{unit}
      </div>
      {subtitle && <div className="text-xs sm:text-sm text-orange-600 font-semibold leading-tight">{subtitle}</div>}
    </div>
  </div>
)

export default function Reports() {
  const [timeRange, setTimeRange] = useState('30d')
  const [vendorSearch, setVendorSearch] = useState('')
  const [performanceFilter, setPerformanceFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 4

  const performanceOptions: DropdownOption[] = [
    { value: 'all', label: 'All' },
    { value: 'Excellent', label: 'Excellent' },
    { value: 'Good', label: 'Good' },
    { value: 'Needs Attention', label: 'Needs Attention' }
  ]

  // Calculate performance indicators
  const currentMonth = monthlyTrends[monthlyTrends.length - 1]
  const previousMonth = monthlyTrends[monthlyTrends.length - 2]
  
  const raisedChange = getPerformanceIndicator(currentMonth.ticketsRaised, previousMonth.ticketsRaised)
  const resolvedChange = getPerformanceIndicator(currentMonth.ticketsResolved, previousMonth.ticketsResolved)
  const resolutionTimeChange = getPerformanceIndicator(previousMonth.avgResolutionHours, currentMonth.avgResolutionHours) // Inverted for better performance

  const totalPendingVerification = 23 // This would come from actual data
  const resolutionRate = ((currentTicketMetrics.resolved / currentTicketMetrics.raised) * 100).toFixed(1)

  // Helper function to get performance label
  const getPerformanceLabel = (percentage: number) => {
    if (percentage <= 2) return 'Excellent'
    if (percentage <= 5) return 'Good'
    return 'Needs Attention'
  }

  // Filter vendors based on search and performance
  const filteredVendors = vendorMismatchData.filter((vendor) => {
    // Filter by search term
    const matchesSearch = vendor.vendorName.toLowerCase().includes(vendorSearch.toLowerCase()) ||
                         vendor.vendorId.toLowerCase().includes(vendorSearch.toLowerCase())
    
    // Filter by performance
    const vendorPerformance = getPerformanceLabel(vendor.mismatchPercentage)
    const matchesPerformance = performanceFilter === 'all' || vendorPerformance === performanceFilter
    
    return matchesSearch && matchesPerformance
  })

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [vendorSearch, performanceFilter])

  // Calculate pagination
  const totalPages = Math.ceil(filteredVendors.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedVendors = filteredVendors.slice(startIndex, endIndex)

  // Pagination handlers
  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)))
  }

  return (
    <div className="p-4 sm:p-6 lg:p-9 bg-[color:var(--color-sharktank-bg)] min-h-[calc(100vh-4rem)] font-sans w-full overflow-x-hidden">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl text-[var(--color-heading)] mb-2 font-bold">
          Reports & Analytics
        </h1>
        <p className="text-sm sm:text-base text-[var(--color-primary)]">
          Track operations performance and identify improvement areas
        </p>
      </div>

      {/* Time Range Filter */}
      <div className="mb-6 sm:mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
          <span className="text-sm font-medium text-gray-700">Time Range:</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[
            { label: '7D', value: '7d' },
            { label: '30D', value: '30d' },
            { label: '90D', value: '90d' },
            { label: 'YTD', value: 'ytd' }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setTimeRange(option.value)}
              className={`px-3 py-1.5 sm:py-1 rounded-lg text-sm font-medium transition-colors min-h-[44px] sm:min-h-0 min-w-[60px] ${
                timeRange === option.value
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50 border border-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Key Metrics */}
      <div className="mb-6 sm:mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 py-8 sm:py-10 gap-10 sm:gap-12 xl:gap-6">
          <MetricCard
            title="Tickets Raised"
            value={currentTicketMetrics.raised}
            icon={AlertTriangle}
            change={raisedChange}
            subtitle="This month"
          />
          <MetricCard
            title="Tickets Resolved"
            value={currentTicketMetrics.resolved}
            icon={CheckSquare}
            change={resolvedChange}
            subtitle="This month"
          />
          <MetricCard
            title="Avg Resolution Time"
            value={currentTicketMetrics.avgResolutionTime}
            unit="h"
            icon={Clock}
            change={resolutionTimeChange}
            subtitle="Hours to resolve"
          />
          <MetricCard
            title="Pending Verification"
            value={totalPendingVerification}
            icon={AlertTriangle}
            subtitle="Awaiting action"
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
        {/* Tickets Trend */}
        <div className="bg-white rounded-xl shadow-md border border-white/20 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
            <h3 className="text-base sm:text-lg font-semibold text-[var(--color-heading)]">Tickets Trend</h3>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-gray-600">Monthly Overview</span>
            </div>
          </div>
          
          <div className="space-y-4">
            {monthlyTrends.map((data) => (
              <div key={data.month} className="flex items-center gap-2 sm:gap-4">
                <div className="w-10 sm:w-12 text-xs sm:text-sm font-medium text-gray-600">{data.month}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-1">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Raised: {data.ticketsRaised}</span>
                        <span>Resolved: {data.ticketsResolved}</span>
                      </div>
                      <div className="relative h-3 sm:h-4 bg-gray-100 rounded-full overflow-hidden">
                        <div 
                          className="absolute left-0 top-0 h-full bg-red-200 rounded-full"
                          style={{ width: `${(data.ticketsRaised / 50) * 100}%` }}
                        />
                        <div 
                          className="absolute left-0 top-0 h-full bg-green-500 rounded-full"
                          style={{ width: `${(data.ticketsResolved / 50) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 w-16 sm:w-auto text-right">
                  {((data.ticketsResolved / data.ticketsRaised) * 100).toFixed(0)}% resolved
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-200">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between text-sm gap-3">
              <div className="flex items-center gap-3 sm:gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-200 rounded-full flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-gray-600">Raised</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full flex-shrink-0" />
                  <span className="text-xs sm:text-sm text-gray-600">Resolved</span>
                </div>
              </div>
              <div className="text-base sm:text-lg font-semibold text-[var(--color-primary)]">
                {resolutionRate}% Overall Resolution Rate
              </div>
            </div>
          </div>
        </div>

        {/* Resolution Time Trend */}
        <div className="bg-white rounded-xl shadow-md border border-white/20 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
            <h3 className="text-base sm:text-lg font-semibold text-[var(--color-heading)]">Resolution Time Trend</h3>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500 flex-shrink-0" />
              <span className="text-xs sm:text-sm text-gray-600">Average Hours</span>
            </div>
          </div>
          
          <div className="space-y-4">
            {monthlyTrends.map((data, index) => {
              const maxTime = Math.max(...monthlyTrends.map(d => d.avgResolutionHours))
              const widthPercentage = (data.avgResolutionHours / maxTime) * 100
              const isImprovement = index > 0 && data.avgResolutionHours < monthlyTrends[index - 1].avgResolutionHours
              
              return (
                <div key={data.month} className="flex items-center gap-2 sm:gap-4">
                  <div className="w-10 sm:w-12 text-xs sm:text-sm font-medium text-gray-600">{data.month}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                      <span>{data.avgResolutionHours}h avg</span>
                      {index > 0 && (
                        <span className={`flex items-center gap-1 ${isImprovement ? 'text-green-600' : 'text-red-600'}`}>
                          {isImprovement ? '↓' : '↑'} 
                          {Math.abs(data.avgResolutionHours - monthlyTrends[index - 1].avgResolutionHours).toFixed(1)}h
                        </span>
                      )}
                    </div>
                    <div className="relative h-3 sm:h-4 bg-gray-100 rounded-full overflow-hidden">
                      <div 
                        className={`absolute left-0 top-0 h-full rounded-full transition-all duration-300 ${
                          isImprovement ? 'bg-green-500' : 'bg-yellow-500'
                        }`}
                        style={{ width: `${widthPercentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>

          <div className="mt-4 sm:mt-6 pt-4 border-t border-gray-200">
            <div className="text-center">
              <div className="text-xl sm:text-2xl font-bold text-[var(--color-primary)] mb-1">
                {currentTicketMetrics.avgResolutionTime}h
              </div>
              <div className="text-xs sm:text-sm text-gray-600">Current Average</div>
            </div>
          </div>
        </div>
      </div>

      {/* Vendor-wise Mismatch Analysis */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-semibold text-[var(--color-heading)] mb-4">
          Vendor-wise Mismatch Analysis
        </h2>
        
        {/* Filters */}
        <div className="mb-4 sm:mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by vendor name or ID..."
                  value={vendorSearch}
                  onChange={(e) => setVendorSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
                />
              </div>
            </div>
            
            {/* Performance Filter */}
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700 whitespace-nowrap">Performance:</span>
              <CustomDropdown
                value={performanceFilter}
                options={performanceOptions}
                onChange={setPerformanceFilter}
                className="min-w-[160px]"
              />
            </div>
          </div>
          
          {/* Results count */}
          <div className="mt-3 text-sm text-gray-600">
            Showing {filteredVendors.length > 0 ? startIndex + 1 : 0}-{Math.min(endIndex, filteredVendors.length)} of {filteredVendors.length} vendors
            {filteredVendors.length !== vendorMismatchData.length && (
              <span className="text-gray-500"> (filtered from {vendorMismatchData.length} total)</span>
            )}
          </div>
        </div>
        
        <div className="rounded-xl shadow-md overflow-hidden border border-white/10 bg-white/70">
          {/* Desktop Table View - hidden on mobile */}
          <div className="hidden md:block overflow-x-auto">
            {/* Table head bar */}
            <div className="bg-[#C3754C] text-white">
              <div className="flex justify-between px-3 md:px-4 lg:px-6 py-4 md:py-4 lg:py-5 font-heading font-bold text-sm md:text-base lg:text-[18px] leading-[100%] tracking-[0]">
                <div className="flex-1 text-center">Vendor</div>
                <div className="flex-1 text-center">Total Orders</div>
                <div className="flex-1 text-center">Mismatch Orders</div>
                <div className="flex-1 text-center">Mismatch %</div>
                <div className="flex-1 text-center">Performance</div>
              </div>
            </div>
            {/* Body */}
            <div className="bg-white">
              <div className="py-2">
                {paginatedVendors.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p className="text-sm">No vendors found matching the selected filters.</p>
                  </div>
                ) : (
                  paginatedVendors.map((vendor) => {
                    const getPerformanceColor = (percentage: number) => {
                      if (percentage <= 2) return 'bg-green-100 text-green-700 border border-green-300'
                      if (percentage <= 5) return 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                      return 'bg-red-100 text-red-700 border border-red-300'
                    }

                    return (
                    <div key={vendor.vendorId} className="flex justify-between px-3 md:px-4 lg:px-6 py-3 md:py-4 items-center hover:bg-gray-50">
                      <div className="flex-1 text-center">
                        <div className="text-xs md:text-sm font-medium text-gray-800">{vendor.vendorName}</div>
                        <div className="text-xs text-gray-500">{vendor.vendorId}</div>
                      </div>
                      <div className="flex-1 text-xs md:text-sm text-gray-700 text-center">
                        {vendor.totalOrders}
                      </div>
                      <div className="flex-1 text-xs md:text-sm text-gray-700 text-center">
                        {vendor.mismatchOrders}
                      </div>
                      <div className="flex-1 flex items-center justify-center gap-2 sm:gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[120px]">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              vendor.mismatchPercentage <= 2
                                ? 'bg-green-600'
                                : vendor.mismatchPercentage <= 5
                                ? 'bg-yellow-500'
                                : 'bg-red-600'
                            }`}
                            style={{ width: `${Math.min(vendor.mismatchPercentage * 10, 100)}%` }}
                          />
                        </div>
                        <span className={`font-semibold text-xs sm:text-sm ${
                          vendor.mismatchPercentage <= 2
                            ? 'text-green-600'
                            : vendor.mismatchPercentage <= 5
                            ? 'text-yellow-600'
                            : 'text-red-600'
                        }`}>
                          {vendor.mismatchPercentage}%
                        </span>
                      </div>
                      <div className="flex-1 flex items-center justify-center">
                        <span className={`inline-block px-2 py-1 sm:px-3 rounded-full text-xs sm:text-sm font-semibold whitespace-nowrap ${getPerformanceColor(vendor.mismatchPercentage)}`}>
                          {getPerformanceLabel(vendor.mismatchPercentage)}
                        </span>
                      </div>
                    </div>
                    )
                  })
                )}
              </div>
            </div>
          </div>

          {/* Mobile Card View - visible only on mobile */}
          <div className="md:hidden bg-white">
            {paginatedVendors.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p className="text-sm">No vendors found matching the selected filters.</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {paginatedVendors.map((vendor) => {
                  const getPerformanceColor = (percentage: number) => {
                    if (percentage <= 2) return 'bg-green-100 text-green-700 border border-green-300'
                    if (percentage <= 5) return 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                    return 'bg-red-100 text-red-700 border border-red-300'
                  }

                  return (
                    <div key={vendor.vendorId} className="p-4 space-y-3">
                      {/* Vendor Name and ID */}
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="text-sm font-semibold text-gray-900">{vendor.vendorName}</div>
                          <div className="text-xs text-gray-500">{vendor.vendorId}</div>
                        </div>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${getPerformanceColor(vendor.mismatchPercentage)}`}>
                          {getPerformanceLabel(vendor.mismatchPercentage)}
                        </span>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-600 mb-1">Total Orders</div>
                          <div className="text-lg font-semibold text-gray-900">{vendor.totalOrders}</div>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <div className="text-xs text-gray-600 mb-1">Mismatch Orders</div>
                          <div className="text-lg font-semibold text-gray-900">{vendor.mismatchOrders}</div>
                        </div>
                      </div>

                      {/* Mismatch Percentage */}
                      <div>
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-2">
                          <span>Mismatch Rate</span>
                          <span className={`font-semibold ${
                            vendor.mismatchPercentage <= 2
                              ? 'text-green-600'
                              : vendor.mismatchPercentage <= 5
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}>
                            {vendor.mismatchPercentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              vendor.mismatchPercentage <= 2
                                ? 'bg-green-600'
                                : vendor.mismatchPercentage <= 5
                                ? 'bg-yellow-500'
                                : 'bg-red-600'
                            }`}
                            style={{ width: `${Math.min(vendor.mismatchPercentage * 10, 100)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          
          {/* Pagination Controls */}
          {filteredVendors.length > 0 && totalPages > 1 && (
            <div className="bg-white border-t border-gray-200 px-4 py-3 sm:px-6">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                {/* Page info */}
                <div className="text-sm text-gray-700">
                  Page <span className="font-medium">{currentPage}</span> of <span className="font-medium">{totalPages}</span>
                </div>
                
                {/* Pagination buttons */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`p-2 rounded-lg border transition-colors ${
                      currentPage === 1
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                    }`}
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  {/* Page numbers */}
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                      // Show first page, last page, current page, and pages around current
                      const showPage = 
                        page === 1 || 
                        page === totalPages || 
                        (page >= currentPage - 1 && page <= currentPage + 1)
                      
                      // Show ellipsis
                      const showEllipsisBefore = page === currentPage - 2 && currentPage > 3
                      const showEllipsisAfter = page === currentPage + 2 && currentPage < totalPages - 2
                      
                      if (showEllipsisBefore || showEllipsisAfter) {
                        return (
                          <span key={page} className="px-2 text-gray-500">
                            ...
                          </span>
                        )
                      }
                      
                      if (!showPage) return null
                      
                      return (
                        <button
                          key={page}
                          onClick={() => goToPage(page)}
                          className={`min-w-[36px] h-9 px-3 rounded-lg text-sm font-medium transition-colors ${
                            currentPage === page
                              ? 'bg-[var(--color-accent)] text-white'
                              : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    })}
                  </div>
                  
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`p-2 rounded-lg border transition-colors ${
                      currentPage === totalPages
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                        : 'bg-white text-gray-700 hover:bg-gray-50 border-gray-300'
                    }`}
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Summary Insights */}
      <div className="bg-white rounded-xl shadow-md border border-white/20 p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-semibold text-[var(--color-heading)] mb-4">Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-900">Resolution rate improved by {resolutionRate}%</p>
                <p className="text-xs text-gray-600">Tickets are being resolved more efficiently this month</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-900">{currentTicketMetrics.pending} tickets pending resolution</p>
                <p className="text-xs text-gray-600">Focus on clearing backlog to maintain performance</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-900">Metro Vegetables has lowest mismatch rate (0.9%)</p>
                <p className="text-xs text-gray-600">Benchmark vendor for quality consistency</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-2 flex-shrink-0" />
              <div>
                <p className="text-xs sm:text-sm font-medium text-gray-900">Green Valley Suppliers needs attention (6.7%)</p>
                <p className="text-xs text-gray-600">Schedule quality review meeting</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
