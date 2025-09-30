import React, { useState } from 'react'
import { ChevronUp as TrendingUpIcon, ChevronDown as TrendingDownIcon, AlertTriangle, Wallet, Clock, CheckSquare, X, Package, BarChart3 } from 'lucide-react'
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts'

interface PerformanceData {
  fillRate: number
  rejectionRate: number
  slaBreaches: number
  pendingPayments: number
  releasedPayments: number
  totalOrders: number
  completedOrders: number
  rejectedOrders: number
}

const performanceData: PerformanceData = {
  fillRate: 92.5,
  rejectionRate: 4.2,
  slaBreaches: 3,
  pendingPayments: 45600,
  releasedPayments: 128400,
  totalOrders: 156,
  completedOrders: 144,
  rejectedOrders: 12
}

// Sample data for charts - Monthly data
const fillRateTrendMonthly = [
  { period: 'May', fillRate: 88.2, rejectionRate: 6.1 },
  { period: 'Jun', fillRate: 90.1, rejectionRate: 5.8 },
  { period: 'Jul', fillRate: 91.5, rejectionRate: 4.9 },
  { period: 'Aug', fillRate: 89.8, rejectionRate: 5.2 },
  { period: 'Sep', fillRate: 92.5, rejectionRate: 4.2 }
]

// Weekly data for single month view
const fillRateTrendWeekly = [
  { period: 'Week 1', fillRate: 89.5, rejectionRate: 5.2 },
  { period: 'Week 2', fillRate: 91.8, rejectionRate: 4.1 },
  { period: 'Week 3', fillRate: 93.2, rejectionRate: 3.8 },
  { period: 'Week 4', fillRate: 92.1, rejectionRate: 4.6 }
]

// Daily data for single week view
const fillRateTrendDaily = [
  { period: 'Mon', fillRate: 90.0, rejectionRate: 5.0 },
  { period: 'Tue', fillRate: 94.5, rejectionRate: 3.2 },
  { period: 'Wed', fillRate: 88.7, rejectionRate: 6.1 },
  { period: 'Thu', fillRate: 92.3, rejectionRate: 4.5 },
  { period: 'Fri', fillRate: 95.1, rejectionRate: 2.8 },
  { period: 'Sat', fillRate: 91.4, rejectionRate: 4.2 },
  { period: 'Sun', fillRate: 89.8, rejectionRate: 5.5 }
]

const slaBreachData = [
  { type: 'Order Confirmation', count: 12, target: 2 },
  { type: 'Dispatch Marking', count: 8, target: 1 },
  { type: 'Invoice Upload', count: 5, target: 1 }
]

const rejectionReasons = [
  { name: 'Quality Issues', value: 35, color: '#ef4444' },
  { name: 'Stock Unavailable', value: 28, color: '#f97316' },
  { name: 'Price Mismatch', value: 20, color: '#eab308' },
  { name: 'Late Delivery', value: 17, color: '#6b7280' }
]

// Monthly payment data
const paymentTrendMonthly = [
  { period: 'May', pending: 52000, released: 98000 },
  { period: 'Jun', pending: 48000, released: 112000 },
  { period: 'Jul', pending: 39000, released: 125000 },
  { period: 'Aug', pending: 42000, released: 118000 },
  { period: 'Sep', pending: 45600, released: 128400 }
]

// Weekly payment data for single month view
const paymentTrendWeekly = [
  { period: 'Week 1', pending: 52000, released: 31000 },
  { period: 'Week 2', pending: 48000, released: 35200 },
  { period: 'Week 3', pending: 41000, released: 32800 },
  { period: 'Week 4', pending: 45600, released: 29400 }
]

// Daily payment data for single week view
const paymentTrendDaily = [
  { period: 'Mon', pending: 48000, released: 18500 },
  { period: 'Tue', pending: 46200, released: 22100 },
  { period: 'Wed', pending: 44800, released: 19800 },
  { period: 'Thu', pending: 47100, released: 21200 },
  { period: 'Fri', pending: 45600, released: 24600 },
  { period: 'Sat', pending: 43200, released: 16800 },
  { period: 'Sun', pending: 41500, released: 15200 }
]

const orderFulfillmentData = [
  { week: 'Week 1', delivered: 35, rejected: 2, pending: 8 },
  { week: 'Week 2', delivered: 42, rejected: 1, pending: 5 },
  { week: 'Week 3', delivered: 38, rejected: 3, pending: 6 },
  { week: 'Week 4', delivered: 29, rejected: 6, pending: 4 }
]

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  trend?: 'up' | 'down'
  icon: React.ElementType
  color: string
  suffix?: string
  description?: string
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  title, value, change, trend, icon: Icon, color, suffix = '', description 
}) => {
  return (
    <div className="bg-white p-6 rounded-xl shadow-md border border-white/20">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm font-medium ${
            trend === 'up' ? 'text-green-600' : 'text-red-600'
          }`}>
            {trend === 'up' ? <TrendingUpIcon size={16} /> : <TrendingDownIcon size={16} />}
            {Math.abs(change)}%
          </div>
        )}
      </div>
      <div className="mb-1">
        <span className="text-2xl font-bold text-[var(--color-primary)]">
          {typeof value === 'number' && value > 1000 ? value.toLocaleString() : value}
          {suffix}
        </span>
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-gray-500">{description}</p>
      )}
    </div>
  )
}

export default function Performance() {
  const [timeRange, setTimeRange] = useState<'1W' | '1M' | '3M' | '6M' | '1Y'>('3M')
  const [dateRange, setDateRange] = useState({
    from: '2025-05-01',
    to: '2025-09-29'
  })
  const [useCustomDateRange, setUseCustomDateRange] = useState(false)

  // Function to get appropriate data based on time range
  const getDataForTimeRange = () => {
    if (useCustomDateRange) {
      // For custom range, use monthly data filtered by date range
      return {
        fillRateData: filterDataByDateRange(fillRateTrendMonthly, 'period'),
        paymentData: filterDataByDateRange(paymentTrendMonthly, 'period')
      }
    }

    switch (timeRange) {
      case '1W':
        return {
          fillRateData: fillRateTrendDaily,
          paymentData: paymentTrendDaily
        }
      case '1M':
        return {
          fillRateData: fillRateTrendWeekly,
          paymentData: paymentTrendWeekly
        }
      case '3M':
      case '6M':
      case '1Y':
      default:
        return {
          fillRateData: fillRateTrendMonthly,
          paymentData: paymentTrendMonthly
        }
    }
  }

  // Function to filter data based on date range
  const filterDataByDateRange = (data: any[], dateField: string = 'period') => {
    if (!useCustomDateRange) return data
    
    return data.filter((item) => {
      // For demo purposes, we'll use month names to simulate date filtering
      // In a real app, you'd have actual date values to filter with
      const monthIndex = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        .indexOf(item[dateField]?.substring(0, 3))
      
      if (monthIndex === -1) return true // Keep items that don't match month pattern
      
      const fromMonth = new Date(dateRange.from).getMonth()
      const toMonth = new Date(dateRange.to).getMonth()
      
      return monthIndex >= fromMonth && monthIndex <= toMonth
    })
  }

  // Get data based on current selection
  const { fillRateData, paymentData } = getDataForTimeRange()

  // Get chart title based on time range
  const getChartTitle = (baseTitle: string) => {
    if (useCustomDateRange) return `${baseTitle} (Custom Range)`
    
    switch (timeRange) {
      case '1W': return `${baseTitle} (Daily)`
      case '1M': return `${baseTitle} (Weekly)`
      case '3M':
      case '6M': 
      case '1Y': return `${baseTitle} (Monthly)`
      default: return baseTitle
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-md">
          <p className="font-medium text-gray-800">{label}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.value}{entry.name.includes('Rate') ? '%' : ''}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <div className="p-8 bg-[var(--color-happyplant-bg)] min-h-[calc(100vh-4rem)] font-sans w-full overflow-x-hidden">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[var(--color-heading)] mb-2 font-[var(--font-heading)]">Performance Analytics</h1>
        <p className="text-[var(--color-primary)]">Track your vendor performance metrics and insights</p>
      </div>

      {/* Time Range Selector */}
      <div className="flex flex-col lg:flex-row gap-4 mb-8">
        <div className="flex gap-2 flex-wrap">
          {(['1W', '1M', '3M', '6M', '1Y'] as const).map((range) => (
            <button
              key={range}
              onClick={() => {
                setTimeRange(range)
                setUseCustomDateRange(false)
              }}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                timeRange === range && !useCustomDateRange
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              {range}
            </button>
          ))}
          <button
            onClick={() => setUseCustomDateRange(true)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              useCustomDateRange
                ? 'bg-[var(--color-accent)] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Custom Range
          </button>
        </div>

        {/* Date Range Filter */}
        {useCustomDateRange && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 bg-white p-4 rounded-lg shadow-md border border-white/20">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">From:</label>
              <input
                type="date"
                value={dateRange.from}
                onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">To:</label>
              <input
                type="date"
                value={dateRange.to}
                onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
              />
            </div>
            <button
              onClick={() => {
                // Force re-render by updating a dummy state or just log for now
                console.log('Filtering data from', dateRange.from, 'to', dateRange.to)
                // In a real app, you might trigger an API call here
              }}
              className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-accent)]/90 transition-colors"
            >
              Apply Filter
            </button>
            <button
              onClick={() => {
                setUseCustomDateRange(false)
                setTimeRange('3M')
              }}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg text-sm font-medium hover:bg-gray-600 transition-colors"
            >
              Reset
            </button>
          </div>
        )}
      </div>

      {/* Active Filter Indicator */}
      {useCustomDateRange && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <span className="font-medium">Showing data from:</span> {new Date(dateRange.from).toLocaleDateString('en-GB')} 
            <span className="mx-2">to</span> {new Date(dateRange.to).toLocaleDateString('en-GB')}
          </p>
        </div>
      )}

      {/* Key Performance Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <MetricCard
          title="Fill Rate"
          value={performanceData.fillRate}
          suffix="%"
          change={2.8}
          trend="up"
          icon={CheckSquare}
          color="bg-green-500"
          description="Orders successfully fulfilled"
        />
        
        <MetricCard
          title="Rejection Rate"
          value={performanceData.rejectionRate}
          suffix="%"
          change={1.2}
          trend="down"
          icon={X}
          color="bg-red-500"
          description="Orders rejected or declined"
        />
        
        <MetricCard
          title="SLA Breaches"
          value={performanceData.slaBreaches}
          change={0}
          icon={AlertTriangle}
          color="bg-yellow-500"
          description="This month's SLA violations"
        />
        
        <MetricCard
          title="Payment Status"
          value={`₹${(performanceData.pendingPayments / 1000).toFixed(0)}K`}
          icon={Wallet}
          color="bg-blue-500"
          description={`₹${(performanceData.releasedPayments / 1000).toFixed(0)}K released this month`}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Fill Rate & Rejection Trend */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[var(--color-heading)]">
              {getChartTitle('Fill Rate & Rejection Trend')}
            </h3>
            <TrendingUpIcon className="w-5 h-5 text-green-500" />
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={fillRateData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="period" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="fillRate" 
                stroke="#10b981" 
                strokeWidth={3}
                name="Fill Rate"
                dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }}
              />
              <Line 
                type="monotone" 
                dataKey="rejectionRate" 
                stroke="#ef4444" 
                strokeWidth={3}
                name="Rejection Rate"
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Payment Summary */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[var(--color-heading)]">
              {getChartTitle('Payment Summary')}
            </h3>
            <Wallet className="w-5 h-5 text-blue-500" />
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={paymentData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="period" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                formatter={(value: number) => [`₹${(value / 1000).toFixed(0)}K`, '']}
                labelFormatter={(label) => `Period: ${label}`}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="released"
                stackId="1"
                stroke="#10b981"
                fill="#10b981"
                name="Released Payments"
                fillOpacity={0.8}
              />
              <Area
                type="monotone"
                dataKey="pending"
                stackId="2"
                stroke="#f59e0b"
                fill="#f59e0b"
                name="Pending Payments"
                fillOpacity={0.8}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Second Row Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* SLA Breach Analysis */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[var(--color-heading)]">SLA Breach Analysis</h3>
            <Clock className="w-5 h-5 text-yellow-500" />
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={slaBreachData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="type" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#ef4444" name="Actual Breaches" />
              <Bar dataKey="target" fill="#10b981" name="Target (Max)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Rejection Reasons */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-[var(--color-heading)]">Rejection Reasons</h3>
            <BarChart3 className="w-5 h-5 text-red-500" />
          </div>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={rejectionReasons}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={(entry: any) => `${entry.name}: ${entry.percent?.toFixed(0) || 0}%`}
              >
                {rejectionReasons.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Order Fulfillment Weekly Analysis */}
      <div className="bg-white p-6 rounded-xl shadow-md border border-white/20 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--color-heading)]">Weekly Order Fulfillment</h3>
          <Package className="w-5 h-5 text-blue-500" />
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={orderFulfillmentData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="week" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Bar dataKey="delivered" fill="#10b981" name="Delivered" />
            <Bar dataKey="rejected" fill="#ef4444" name="Rejected" />
            <Bar dataKey="pending" fill="#f59e0b" name="Pending" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Insights */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-white/20">
          <h3 className="text-lg font-semibold text-[var(--color-heading)] mb-4">Performance Insights</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium text-gray-800">Excellent Fill Rate</p>
                <p className="text-xs text-gray-600">Your 92.5% fill rate is above industry average of 88%</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-yellow-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium text-gray-800">SLA Improvement Needed</p>
                <p className="text-xs text-gray-600">Focus on order confirmation times to reduce SLA breaches</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
              <div>
                <p className="text-sm font-medium text-gray-800">Payment Processing</p>
                <p className="text-xs text-gray-600">₹45.6K pending payments, expected release in 3-5 days</p>
              </div>
            </div>
          </div>
        </div>

        {/* Performance Goals */}
        <div className="bg-white p-6 rounded-xl shadow-md border border-white/20">
          <h3 className="text-lg font-semibold text-[var(--color-heading)] mb-4">Performance Goals</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Fill Rate Target</span>
                <span className="text-sm text-gray-600">92.5% / 95%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '97.4%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Rejection Rate Target</span>
                <span className="text-sm text-gray-600">4.2% / 3%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-red-500 h-2 rounded-full" style={{ width: '71.4%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">SLA Compliance</span>
                <span className="text-sm text-gray-600">97% / 100%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '97%' }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}