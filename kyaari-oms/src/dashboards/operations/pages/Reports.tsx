import { useState } from 'react'
import { Clock, AlertTriangle, CheckSquare, BarChart3, Filter, ChevronUp, ChevronDown } from 'lucide-react'

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
  icon: any
  subtitle?: string
}) => (
  <div className="bg-white p-6 rounded-xl shadow-md border border-white/20">
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-blue-100 rounded-lg">
          <Icon className="w-5 h-5 text-blue-600" />
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-600">{title}</h3>
          {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
        </div>
      </div>
      {change && (
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${change.bgColor} ${change.color}`}>
          {change.isPositive ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          {change.value}%
        </div>
      )}
    </div>
    <div className="text-2xl font-bold text-[var(--color-primary)] mb-1">
      {value}{unit}
    </div>
  </div>
)

export default function Reports() {
  const [timeRange, setTimeRange] = useState('30d')

  // Calculate performance indicators
  const currentMonth = monthlyTrends[monthlyTrends.length - 1]
  const previousMonth = monthlyTrends[monthlyTrends.length - 2]
  
  const raisedChange = getPerformanceIndicator(currentMonth.ticketsRaised, previousMonth.ticketsRaised)
  const resolvedChange = getPerformanceIndicator(currentMonth.ticketsResolved, previousMonth.ticketsResolved)
  const resolutionTimeChange = getPerformanceIndicator(previousMonth.avgResolutionHours, currentMonth.avgResolutionHours) // Inverted for better performance

  const totalPendingVerification = 23 // This would come from actual data
  const resolutionRate = ((currentTicketMetrics.resolved / currentTicketMetrics.raised) * 100).toFixed(1)

  return (
    <div className="p-8 bg-[var(--color-happyplant-bg)] min-h-[calc(100vh-4rem)] font-sans w-full overflow-x-hidden">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-heading)] mb-2 font-[var(--font-heading)]">
          Reports & Analytics
        </h1>
        <p className="text-[var(--color-primary)]">
          Track operations performance and identify improvement areas
        </p>
      </div>

      {/* Time Range Filter */}
      <div className="mb-8 flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium text-gray-700">Time Range:</span>
        </div>
        <div className="flex gap-2">
          {[
            { label: '7D', value: '7d' },
            { label: '30D', value: '30d' },
            { label: '90D', value: '90d' },
            { label: 'YTD', value: 'ytd' }
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setTimeRange(option.value)}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Tickets Trend */}
        <div className="bg-white rounded-xl shadow-md border border-white/20 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-[var(--color-heading)]">Tickets Trend</h3>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Monthly Overview</span>
            </div>
          </div>
          
          <div className="space-y-4">
            {monthlyTrends.map((data) => (
              <div key={data.month} className="flex items-center gap-4">
                <div className="w-12 text-sm font-medium text-gray-600">{data.month}</div>
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-1">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                        <span>Raised: {data.ticketsRaised}</span>
                        <span>Resolved: {data.ticketsResolved}</span>
                      </div>
                      <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
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
                <div className="text-xs text-gray-500">
                  {((data.ticketsResolved / data.ticketsRaised) * 100).toFixed(0)}% resolved
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-red-200 rounded-full" />
                  <span className="text-gray-600">Raised</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span className="text-gray-600">Resolved</span>
                </div>
              </div>
              <div className="text-lg font-semibold text-[var(--color-primary)]">
                {resolutionRate}% Overall Resolution Rate
              </div>
            </div>
          </div>
        </div>

        {/* Resolution Time Trend */}
        <div className="bg-white rounded-xl shadow-md border border-white/20 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-[var(--color-heading)]">Resolution Time Trend</h3>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              <span className="text-sm text-gray-600">Average Hours</span>
            </div>
          </div>
          
          <div className="space-y-4">
            {monthlyTrends.map((data, index) => {
              const maxTime = Math.max(...monthlyTrends.map(d => d.avgResolutionHours))
              const widthPercentage = (data.avgResolutionHours / maxTime) * 100
              const isImprovement = index > 0 && data.avgResolutionHours < monthlyTrends[index - 1].avgResolutionHours
              
              return (
                <div key={data.month} className="flex items-center gap-4">
                  <div className="w-12 text-sm font-medium text-gray-600">{data.month}</div>
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
                    <div className="relative h-4 bg-gray-100 rounded-full overflow-hidden">
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

          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="text-center">
              <div className="text-2xl font-bold text-[var(--color-primary)] mb-1">
                {currentTicketMetrics.avgResolutionTime}h
              </div>
              <div className="text-sm text-gray-600">Current Average</div>
            </div>
          </div>
        </div>
      </div>

      {/* Vendor-wise Mismatch Analysis */}
      <div className="bg-white rounded-xl shadow-md border border-white/20 mb-8">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-[var(--color-heading)]">Vendor-wise Mismatch Analysis</h3>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Filter className="w-4 h-4" />
              <span>Last 30 days</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total Orders</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mismatch Orders</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Mismatch %</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Performance</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {vendorMismatchData.map((vendor) => {
                const getPerformanceColor = (percentage: number) => {
                  if (percentage <= 2) return 'bg-green-100 text-green-800'
                  if (percentage <= 5) return 'bg-yellow-100 text-yellow-800'
                  return 'bg-red-100 text-red-800'
                }

                const getPerformanceLabel = (percentage: number) => {
                  if (percentage <= 2) return 'Excellent'
                  if (percentage <= 5) return 'Good'
                  return 'Needs Attention'
                }

                return (
                  <tr key={vendor.vendorId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{vendor.vendorName}</div>
                        <div className="text-xs text-gray-500">{vendor.vendorId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {vendor.totalOrders}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                      {vendor.mismatchOrders}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900">
                          {vendor.mismatchPercentage}%
                        </span>
                        <div className="flex-1 max-w-20">
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${
                                vendor.mismatchPercentage <= 2 ? 'bg-green-500' :
                                vendor.mismatchPercentage <= 5 ? 'bg-yellow-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(vendor.mismatchPercentage * 10, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPerformanceColor(vendor.mismatchPercentage)}`}>
                        {getPerformanceLabel(vendor.mismatchPercentage)}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="p-6 border-t border-gray-200 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {vendorMismatchData.filter(v => v.mismatchPercentage <= 2).length}
              </div>
              <div className="text-sm text-gray-600">Excellent Performers</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-yellow-600">
                {vendorMismatchData.filter(v => v.mismatchPercentage > 2 && v.mismatchPercentage <= 5).length}
              </div>
              <div className="text-sm text-gray-600">Good Performers</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {vendorMismatchData.filter(v => v.mismatchPercentage > 5).length}
              </div>
              <div className="text-sm text-gray-600">Need Attention</div>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Insights */}
      <div className="bg-white rounded-xl shadow-md border border-white/20 p-6">
        <h3 className="text-lg font-semibold text-[var(--color-heading)] mb-4">Key Insights</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
              <div>
                <p className="text-sm font-medium text-gray-900">Resolution rate improved by {resolutionRate}%</p>
                <p className="text-xs text-gray-600">Tickets are being resolved more efficiently this month</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2" />
              <div>
                <p className="text-sm font-medium text-gray-900">{currentTicketMetrics.pending} tickets pending resolution</p>
                <p className="text-xs text-gray-600">Focus on clearing backlog to maintain performance</p>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2" />
              <div>
                <p className="text-sm font-medium text-gray-900">Metro Vegetables has lowest mismatch rate (0.9%)</p>
                <p className="text-xs text-gray-600">Benchmark vendor for quality consistency</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-red-500 rounded-full mt-2" />
              <div>
                <p className="text-sm font-medium text-gray-900">Green Valley Suppliers needs attention (6.7%)</p>
                <p className="text-xs text-gray-600">Schedule quality review meeting</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
