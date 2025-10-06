import { useState, useMemo } from 'react'
import { BarChart3, AlertTriangle, CheckSquare, Clock, Wallet } from 'lucide-react'
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  LineChart,
  Line
} from 'recharts'

type PaymentAgingRecord = {
  vendor: string
  outstandingAmount: number
  avgDaysPending: number
  oldestInvoiceDate: string
  oldestInvoiceDays: number
}

type ComplianceRecord = {
  vendor: string
  totalInvoices: number
  compliantPercentage: number
  issuesFound: number
}

type SLABreachRecord = {
  slaType: string
  breachCount: number
  avgDelayDays: number
}

type TimeRange = 'weekly' | 'monthly'

// Mock data
const PAYMENT_AGING_DATA: PaymentAgingRecord[] = [
  { vendor: 'GreenLeaf Co', outstandingAmount: 125000, avgDaysPending: 18, oldestInvoiceDate: '2025-09-05', oldestInvoiceDays: 26 },
  { vendor: 'Clay Works', outstandingAmount: 89000, avgDaysPending: 12, oldestInvoiceDate: '2025-09-15', oldestInvoiceDays: 16 },
  { vendor: 'Urban Roots', outstandingAmount: 156000, avgDaysPending: 35, oldestInvoiceDate: '2025-08-20', oldestInvoiceDays: 42 },
  { vendor: 'Plantify', outstandingAmount: 45000, avgDaysPending: 8, oldestInvoiceDate: '2025-09-20', oldestInvoiceDays: 11 },
  { vendor: 'EcoGarden Solutions', outstandingAmount: 210000, avgDaysPending: 41, oldestInvoiceDate: '2025-08-15', oldestInvoiceDays: 47 },
  { vendor: 'Flower Garden', outstandingAmount: 78000, avgDaysPending: 28, oldestInvoiceDate: '2025-08-28', oldestInvoiceDays: 34 },
]

const COMPLIANCE_DATA: ComplianceRecord[] = [
  { vendor: 'GreenLeaf Co', totalInvoices: 45, compliantPercentage: 95, issuesFound: 2 },
  { vendor: 'Clay Works', totalInvoices: 38, compliantPercentage: 100, issuesFound: 0 },
  { vendor: 'Urban Roots', totalInvoices: 52, compliantPercentage: 88, issuesFound: 6 },
  { vendor: 'Plantify', totalInvoices: 29, compliantPercentage: 96, issuesFound: 1 },
  { vendor: 'EcoGarden Solutions', totalInvoices: 67, compliantPercentage: 82, issuesFound: 12 },
  { vendor: 'Flower Garden', totalInvoices: 41, compliantPercentage: 90, issuesFound: 4 },
]

const SLA_BREACH_DATA: SLABreachRecord[] = [
  { slaType: 'Invoice Validation', breachCount: 12, avgDelayDays: 3.5 },
  { slaType: 'Payment Release', breachCount: 8, avgDelayDays: 5.2 },
  { slaType: 'Delivery Confirmation', breachCount: 15, avgDelayDays: 2.8 },
  { slaType: 'Vendor Response Time', breachCount: 6, avgDelayDays: 4.1 },
]

const PAYMENT_WEEKLY_DATA = [
  { period: 'Week 1', released: 850000, pending: 125000 },
  { period: 'Week 2', released: 920000, pending: 156000 },
  { period: 'Week 3', released: 780000, pending: 98000 },
  { period: 'Week 4', released: 1050000, pending: 203000 },
]

const PAYMENT_MONTHLY_DATA = [
  { period: 'Jun', released: 3200000, pending: 450000 },
  { period: 'Jul', released: 3800000, pending: 520000 },
  { period: 'Aug', released: 3500000, pending: 380000 },
  { period: 'Sep', released: 4100000, pending: 703000 },
]

interface KPICardProps {
  title: string
  value: string | number
  icon: React.ReactNode
  color: 'blue' | 'orange' | 'green' | 'red'
  subtitle?: string
}

function KPICard({ title, value, icon, color, subtitle }: KPICardProps) {
  const borderTopClass =
    color === 'blue'
      ? 'border-t-4 border-blue-600'
      : color === 'orange'
      ? 'border-t-4 border-orange-600'
      : color === 'green'
      ? 'border-t-4 border-green-600'
      : 'border-t-4 border-red-600'

  return (
    <div className={`bg-white p-4 sm:p-6 rounded-xl shadow-md flex items-center gap-3 sm:gap-4 border border-white/20 relative overflow-hidden ${borderTopClass}`}>
      <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-lg text-2xl sm:text-3xl text-[var(--color-heading)]">
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-xs font-semibold text-[var(--color-primary)] uppercase tracking-wide mb-1" style={{ fontFamily: 'var(--font-heading)' }}>
          {title}
        </h3>
        <div className="text-lg sm:text-xl lg:text-2xl font-bold text-[var(--color-heading)] mb-1 break-words">{value}</div>
        {subtitle && <div className="text-xs sm:text-sm text-gray-500">{subtitle}</div>}
      </div>
    </div>
  )
}

function AccountsReports() {
  const [timeRange, setTimeRange] = useState<TimeRange>('weekly')
  const [dateFrom, setDateFrom] = useState('2025-09-01')
  const [dateTo, setDateTo] = useState('2025-10-01')
  const [vendorFilter, setVendorFilter] = useState('')
  const [isFilterOpen, setIsFilterOpen] = useState(true)

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    const totalOutstanding = PAYMENT_AGING_DATA.reduce((sum, item) => sum + item.outstandingAmount, 0)
    const avgCompliance = Math.round(COMPLIANCE_DATA.reduce((sum, item) => sum + item.compliantPercentage, 0) / COMPLIANCE_DATA.length)
    const totalBreaches = SLA_BREACH_DATA.reduce((sum, item) => sum + item.breachCount, 0)
    const currentData = timeRange === 'weekly' ? PAYMENT_WEEKLY_DATA : PAYMENT_MONTHLY_DATA
    const paymentsReleased = currentData[currentData.length - 1]?.released || 0
    const pendingPayments = currentData[currentData.length - 1]?.pending || 0

    return {
      totalOutstanding,
      avgCompliance,
      totalBreaches,
      paymentsReleased,
      pendingPayments,
    }
  }, [timeRange])

  // Filter data based on vendor filter
  const filteredPaymentAging = useMemo(() => {
    if (!vendorFilter) return PAYMENT_AGING_DATA
    return PAYMENT_AGING_DATA.filter(item => item.vendor.toLowerCase().includes(vendorFilter.toLowerCase()))
  }, [vendorFilter])

  const filteredCompliance = useMemo(() => {
    if (!vendorFilter) return COMPLIANCE_DATA
    return COMPLIANCE_DATA.filter(item => item.vendor.toLowerCase().includes(vendorFilter.toLowerCase()))
  }, [vendorFilter])

  const paymentChartData = timeRange === 'weekly' ? PAYMENT_WEEKLY_DATA : PAYMENT_MONTHLY_DATA

  return (
    <div className="p-3 sm:p-6 bg-[var(--color-happyplant-bg)] min-h-[calc(100vh-4rem)] font-sans w-full overflow-x-hidden">
      {/* Page Header */}
      <div className="bg-white p-4 sm:p-8 rounded-xl shadow-lg mb-6 sm:mb-8 border border-gray-200">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--color-heading)] mb-2 font-[var(--font-heading)]">
          Accounts Reports & KPIs
        </h1>
        <p className="text-sm sm:text-base lg:text-lg text-[var(--color-primary)] font-medium">
          Comprehensive overview of vendor payments, compliance, and performance metrics
        </p>
      </div>

      {/* Top KPI Cards */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-semibold text-[var(--color-heading)] mb-4 sm:mb-6 font-[var(--font-heading)]">
          Key Metrics Overview
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <KPICard
            title="Total Outstanding"
            value={`₹${summaryMetrics.totalOutstanding.toLocaleString('en-IN')}`}
            icon={<Wallet size={32} color="var(--color-heading)" />}
            color="blue"
            subtitle="Pending vendor payments"
          />
          <KPICard
            title="Avg Compliance"
            value={`${summaryMetrics.avgCompliance}%`}
            icon={<CheckSquare size={32} color="var(--color-heading)" />}
            color="green"
            subtitle="Invoice-PO compliance rate"
          />
          <KPICard
            title="SLA Breaches"
            value={summaryMetrics.totalBreaches}
            icon={<AlertTriangle size={32} color="var(--color-heading)" />}
            color="red"
            subtitle="Requires attention"
          />
          <KPICard
            title="Payments This Period"
            value={`₹${summaryMetrics.paymentsReleased.toLocaleString('en-IN')}`}
            icon={<BarChart3 size={32} color="var(--color-heading)" />}
            color="orange"
            subtitle={`${timeRange === 'weekly' ? 'This week' : 'This month'}`}
          />
        </div>
      </div>

      {/* Section 1: Vendor Payment Aging */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-semibold text-[var(--color-heading)] mb-4 font-[var(--font-heading)]">
          Vendor Payment Aging
        </h2>
        
        {/* Filter Bar */}
        <div className="mb-4 bg-white border border-gray-200 rounded-xl p-3 sm:p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-[var(--font-heading)] text-[var(--color-heading)] text-base sm:text-lg font-medium flex items-center gap-2">
              <Clock size={18} className="sm:w-5 sm:h-5" />
              Filters
            </h3>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="text-xs sm:text-sm text-[var(--color-accent)] underline"
            >
              {isFilterOpen ? 'Hide' : 'Show'} Filters
            </button>
          </div>

          {isFilterOpen && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="lg:col-span-1">
                <label className="block text-xs sm:text-sm font-medium mb-1 text-gray-700">Date From</label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
                />
              </div>

              <div className="lg:col-span-1">
                <label className="block text-xs sm:text-sm font-medium mb-1 text-gray-700">Date To</label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
                />
              </div>

              <div className="lg:col-span-1">
                <label className="block text-xs sm:text-sm font-medium mb-1 text-gray-700">Vendor</label>
                <input
                  type="text"
                  value={vendorFilter}
                  onChange={e => setVendorFilter(e.target.value)}
                  placeholder="Search vendor..."
                  className="w-full px-3 py-2 text-sm rounded-xl border border-gray-300 focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={() => {
                    setDateFrom('2025-09-01')
                    setDateTo('2025-10-01')
                    setVendorFilter('')
                  }}
                  className="w-full bg-white text-[var(--color-secondary)] border border-[var(--color-secondary)] rounded-full px-3 py-2 text-xs sm:text-sm hover:bg-gray-50"
                >
                  Reset Filters
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-md border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 sm:p-4 font-[var(--font-heading)] text-[var(--color-secondary)] font-medium text-sm">
                    Vendor
                  </th>
                  <th className="text-left p-3 sm:p-4 font-[var(--font-heading)] text-[var(--color-secondary)] font-medium text-sm">
                    Outstanding Amount
                  </th>
                  <th className="text-left p-3 sm:p-4 font-[var(--font-heading)] text-[var(--color-secondary)] font-medium text-sm">
                    Avg Days Pending
                  </th>
                  <th className="text-left p-3 sm:p-4 font-[var(--font-heading)] text-[var(--color-secondary)] font-medium text-sm">
                    Oldest Invoice
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPaymentAging.map((record, idx) => {
                  const isOverdue = record.oldestInvoiceDays > 30
                  return (
                    <tr
                      key={record.vendor}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    >
                      <td className="p-3 sm:p-4 font-medium text-[var(--color-primary)] text-sm sm:text-base">{record.vendor}</td>
                      <td className="p-3 sm:p-4 font-semibold text-[var(--color-primary)] text-sm sm:text-base">
                        ₹{record.outstandingAmount.toLocaleString('en-IN')}
                      </td>
                      <td className="p-3 sm:p-4">
                        <span
                          className={`inline-block px-2 py-1 sm:px-3 rounded-full text-xs sm:text-sm font-semibold ${
                            record.avgDaysPending > 30
                              ? 'bg-red-100 text-red-700 border border-red-300'
                              : record.avgDaysPending > 15
                              ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                              : 'bg-green-100 text-green-700 border border-green-300'
                          }`}
                        >
                          {record.avgDaysPending} days
                        </span>
                      </td>
                      <td className="p-3 sm:p-4">
                        <div className={`text-xs sm:text-sm ${isOverdue ? 'text-red-600 font-semibold' : 'text-gray-700'}`}>
                          {record.oldestInvoiceDate}
                        </div>
                        <div className={`text-xs sm:text-sm flex items-center gap-1 mt-1 ${isOverdue ? 'text-red-600' : 'text-gray-500'}`}>
                          {isOverdue && <AlertTriangle size={12} className="sm:w-3.5 sm:h-3.5" />}
                          <span>{record.oldestInvoiceDays} days old</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {filteredPaymentAging.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-gray-500 text-sm">
                      No records match the current filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Section 2: Invoice vs PO Compliance */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-semibold text-[var(--color-heading)] mb-4 font-[var(--font-heading)]">
          Invoice vs PO Compliance
        </h2>
        
        {/* Overall Compliance KPI */}
        <div className="mb-4">
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-white/20">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs sm:text-sm font-semibold text-[var(--color-primary)] uppercase tracking-wide mb-2">
                  Overall Compliance Rate
                </h3>
                <div className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--color-heading)]">
                  {summaryMetrics.avgCompliance}%
                </div>
              </div>
              <div className="w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 flex items-center justify-center rounded-full bg-green-100">
                <CheckSquare size={32} className="sm:w-10 sm:h-10 lg:w-12 lg:h-12" color="#16a34a" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4 flex items-center gap-2">
              <div className="flex-1 bg-gray-200 rounded-full h-2 sm:h-3">
                <div
                  className="bg-green-600 h-2 sm:h-3 rounded-full transition-all"
                  style={{ width: `${summaryMetrics.avgCompliance}%` }}
                />
              </div>
              <span className="text-xs sm:text-sm text-gray-600 font-medium">{summaryMetrics.avgCompliance}%</span>
            </div>
          </div>
        </div>

        {/* Compliance Table */}
        <div className="bg-white rounded-xl shadow-md border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 sm:p-4 font-[var(--font-heading)] text-[var(--color-secondary)] font-medium text-sm">
                    Vendor
                  </th>
                  <th className="text-left p-3 sm:p-4 font-[var(--font-heading)] text-[var(--color-secondary)] font-medium text-sm">
                    Total Invoices
                  </th>
                  <th className="text-left p-3 sm:p-4 font-[var(--font-heading)] text-[var(--color-secondary)] font-medium text-sm">
                    Compliant %
                  </th>
                  <th className="text-left p-3 sm:p-4 font-[var(--font-heading)] text-[var(--color-secondary)] font-medium text-sm">
                    Issues Found
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredCompliance.map((record, idx) => (
                  <tr
                    key={record.vendor}
                    className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                  >
                    <td className="p-3 sm:p-4 font-medium text-[var(--color-primary)] text-sm sm:text-base">{record.vendor}</td>
                    <td className="p-3 sm:p-4 text-[var(--color-primary)] text-sm sm:text-base">{record.totalInvoices}</td>
                    <td className="p-3 sm:p-4">
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[80px] sm:max-w-[120px]">
                          <div
                            className={`h-2 rounded-full transition-all ${
                              record.compliantPercentage >= 95
                                ? 'bg-green-600'
                                : record.compliantPercentage >= 85
                                ? 'bg-yellow-500'
                                : 'bg-red-600'
                            }`}
                            style={{ width: `${record.compliantPercentage}%` }}
                          />
                        </div>
                        <span
                          className={`font-semibold text-xs sm:text-sm ${
                            record.compliantPercentage >= 95
                              ? 'text-green-600'
                              : record.compliantPercentage >= 85
                              ? 'text-yellow-600'
                              : 'text-red-600'
                          }`}
                        >
                          {record.compliantPercentage}%
                        </span>
                      </div>
                    </td>
                    <td className="p-3 sm:p-4">
                      <span
                        className={`inline-block px-2 py-1 sm:px-3 rounded-full text-xs sm:text-sm font-semibold ${
                          record.issuesFound === 0
                            ? 'bg-green-100 text-green-700 border border-green-300'
                            : record.issuesFound <= 3
                            ? 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                            : 'bg-red-100 text-red-700 border border-red-300'
                        }`}
                      >
                        {record.issuesFound}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredCompliance.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-6 text-center text-gray-500 text-sm">
                      No records match the current filters
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Section 3: SLA Breaches */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-semibold text-[var(--color-heading)] mb-4 font-[var(--font-heading)]">
          SLA Breaches
        </h2>
        
        {/* Full-width table with visual bars */}
        <div className="bg-white rounded-xl shadow-md border border-white/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3 sm:p-4 font-[var(--font-heading)] text-[var(--color-secondary)] font-medium text-sm">
                    SLA Type
                  </th>
                  <th className="text-left p-3 sm:p-4 font-[var(--font-heading)] text-[var(--color-secondary)] font-medium text-sm">
                    Breaches Count
                  </th>
                  <th className="text-left p-3 sm:p-4 font-[var(--font-heading)] text-[var(--color-secondary)] font-medium text-sm">
                    Avg Delay (Days)
                  </th>
                  <th className="text-left p-3 sm:p-4 font-[var(--font-heading)] text-[var(--color-secondary)] font-medium text-sm">
                    Breach Visualization
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {SLA_BREACH_DATA.map((record, idx) => {
                  const maxBreaches = Math.max(...SLA_BREACH_DATA.map(r => r.breachCount))
                  const barWidth = (record.breachCount / maxBreaches) * 100
                  
                  return (
                    <tr
                      key={record.slaType}
                      className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
                    >
                      <td className="p-3 sm:p-4 font-medium text-[var(--color-primary)] text-sm sm:text-base">
                        <div className="flex items-center gap-2">
                          <AlertTriangle size={16} className="sm:w-4.5 sm:h-4.5 text-red-600" />
                          <span>{record.slaType}</span>
                        </div>
                      </td>
                      <td className="p-3 sm:p-4">
                        <span className="inline-block px-2 py-1 sm:px-3 sm:py-1.5 rounded-full text-xs sm:text-sm font-bold bg-red-100 text-red-700 border border-red-300">
                          {record.breachCount}
                        </span>
                      </td>
                      <td className="p-3 sm:p-4">
                        <span className={`font-semibold text-sm sm:text-base ${
                          record.avgDelayDays > 5 
                            ? 'text-red-600' 
                            : record.avgDelayDays > 3 
                            ? 'text-orange-600' 
                            : 'text-yellow-600'
                        }`}>
                          {record.avgDelayDays} days
                        </span>
                      </td>
                      <td className="p-3 sm:p-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-4 sm:h-6 max-w-[150px] sm:max-w-[200px]">
                            <div
                              className="bg-gradient-to-r from-red-500 to-red-600 h-4 sm:h-6 rounded-full flex items-center justify-end pr-1 sm:pr-2 transition-all"
                              style={{ width: `${barWidth}%` }}
                            >
                              {barWidth > 25 && (
                                <span className="text-xs font-bold text-white">{record.breachCount}</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          
          {/* Summary footer */}
          <div className="bg-red-50 border-t border-red-200 p-3 sm:p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-xs sm:text-sm">
              <div className="flex items-center gap-2 text-red-800 font-medium">
                <AlertTriangle size={14} className="sm:w-4 sm:h-4" />
                <span>Total SLA Breaches: <strong>{SLA_BREACH_DATA.reduce((sum, r) => sum + r.breachCount, 0)}</strong></span>
              </div>
              <div className="text-red-700">
                Avg Delay Across All Types: <strong>{(SLA_BREACH_DATA.reduce((sum, r) => sum + r.avgDelayDays, 0) / SLA_BREACH_DATA.length).toFixed(1)} days</strong>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 4: Payment Summary */}
      <div className="mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-2xl font-semibold text-[var(--color-heading)] mb-4 font-[var(--font-heading)]">
          Payment Summary
        </h2>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-white/20 border-t-4 border-t-green-600">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-lg bg-green-100">
                <CheckSquare size={24} className="sm:w-8 sm:h-8" color="#16a34a" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-semibold text-[var(--color-primary)] uppercase tracking-wide mb-1">
                  Payments Released This {timeRange === 'weekly' ? 'Week' : 'Month'}
                </h3>
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--color-heading)] break-words">
                  ₹{summaryMetrics.paymentsReleased.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-white/20 border-t-4 border-t-orange-600">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-lg bg-orange-100">
                <Clock size={24} className="sm:w-8 sm:h-8" color="#ea580c" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-xs font-semibold text-[var(--color-primary)] uppercase tracking-wide mb-1">
                  Pending Payments
                </h3>
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-[var(--color-heading)] break-words">
                  ₹{summaryMetrics.pendingPayments.toLocaleString('en-IN')}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chart with Toggle */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-white/20">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6">
            <h3 className="text-base sm:text-lg font-semibold text-[#2d3748]">Payment Trends</h3>
            <div className="flex gap-2 bg-gray-100 rounded-full p-1 w-full sm:w-auto">
              <button
                onClick={() => setTimeRange('weekly')}
                className={`flex-1 sm:flex-none px-3 py-2 sm:px-4 rounded-full text-xs sm:text-sm font-medium transition-all ${
                  timeRange === 'weekly'
                    ? 'bg-[var(--color-accent)] text-[var(--color-button-text)] shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setTimeRange('monthly')}
                className={`flex-1 sm:flex-none px-3 py-2 sm:px-4 rounded-full text-xs sm:text-sm font-medium transition-all ${
                  timeRange === 'monthly'
                    ? 'bg-[var(--color-accent)] text-[var(--color-button-text)] shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={paymentChartData}>
              <XAxis 
                dataKey="period" 
                fontSize={12}
                tick={{ fontSize: 12 }}
              />
              <YAxis 
                tickFormatter={(value) => `₹${(value / 1000)}K`} 
                fontSize={12}
                tick={{ fontSize: 12 }}
              />
              <Tooltip 
                formatter={(value: number) => `₹${value.toLocaleString('en-IN')}`}
                labelStyle={{ fontSize: 12 }}
                contentStyle={{ fontSize: 12 }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="released"
                stroke="#16a34a"
                strokeWidth={2}
                name="Released"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
              <Line
                type="monotone"
                dataKey="pending"
                stroke="#ea580c"
                strokeWidth={2}
                name="Pending"
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default AccountsReports

