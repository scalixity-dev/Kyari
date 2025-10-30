import { useState, useEffect } from 'react'
import { Clock, AlertTriangle, CheckSquare, Search } from 'lucide-react'
import { CustomDropdown } from '../../../components/CustomDropdown'
import type { DropdownOption } from '../../../components/CustomDropdown/CustomDropdown'
import { KPICard } from '../../../components'
import { TicketApi } from '../../../services/ticketApi'
import { ReceivedOrdersApiService } from '../../../services/receivedOrdersApi'
import { CSVPDFExportButton } from '../../../components/ui/export-button'
import { Pagination } from '../../../components/ui/Pagination'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, BarChart, Bar } from 'recharts'

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

type TimeRange = 'weekly' | 'monthly' | 'yearly'

const currentTicketMetrics: TicketMetrics = {
  raised: 45,
  resolved: 38,
  pending: 7,
  avgResolutionTime: 18.5 // hours
}

export default function Reports() {
  const [timeRange, setTimeRange] = useState<TimeRange>('monthly')
  const [ticketTrendData, setTicketTrendData] = useState<MonthlyData[]>([])
  const [resolutionTimeData, setResolutionTimeData] = useState<MonthlyData[]>([])
  const [vendorMismatchData, setVendorMismatchData] = useState<VendorMismatch[]>([])
  const [vendorSearch, setVendorSearch] = useState('')
  const [performanceFilter, setPerformanceFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const performanceOptions: DropdownOption[] = [
    { value: 'all', label: 'All' },
    { value: 'Excellent', label: 'Excellent' },
    { value: 'Good', label: 'Good' },
    { value: 'Needs Attention', label: 'Needs Attention' }
  ]

  const totalPendingVerification = 23 // This would come from actual data

  // Fetch real ticket trends for the first chart
  useEffect(() => {
    let isMounted = true

    const formatWeekLabel = (fromISO: string, toISO: string) => {
      const from = new Date(fromISO)
      const to = new Date(toISO)
      const month = from.toLocaleDateString('en', { month: 'short' })
      return `${month} ${from.getDate()}-${to.getDate()}`
    }

    const formatMonthLabel = (fromISO: string) => {
      const d = new Date(fromISO)
      return d.toLocaleDateString('en', { month: 'short' })
    }

    const formatYearLabel = (fromISO: string) => {
      return String(new Date(fromISO).getFullYear())
    }

    const load = async () => {
      try {
        const res = await TicketApi.getTrends({ period: timeRange })
        const items: MonthlyData[] = res.data.trends.map((t) => {
          const monthLabel = timeRange === 'weekly'
            ? formatWeekLabel(t.periodStart, t.periodEnd)
            : timeRange === 'monthly'
            ? formatMonthLabel(t.periodStart)
            : formatYearLabel(t.periodStart)
          return {
            month: monthLabel,
            ticketsRaised: t.raised,
            ticketsResolved: t.resolved,
            avgResolutionHours: 0
          }
        })
        if (isMounted) setTicketTrendData(items)
      } catch (_e) {
        if (isMounted) setTicketTrendData([])
      }
    }

    load()
    return () => { isMounted = false }
  }, [timeRange])

  // Fetch real resolution time trends for the second chart
  useEffect(() => {
    let isMounted = true

    const formatWeekLabel = (fromISO: string, toISO: string) => {
      const from = new Date(fromISO)
      const to = new Date(toISO)
      const month = from.toLocaleDateString('en', { month: 'short' })
      return `${month} ${from.getDate()}-${to.getDate()}`
    }

    const formatMonthLabel = (fromISO: string) => {
      const d = new Date(fromISO)
      return d.toLocaleDateString('en', { month: 'short' })
    }

    const formatYearLabel = (fromISO: string) => {
      return String(new Date(fromISO).getFullYear())
    }

    const load = async () => {
      try {
        const res = await TicketApi.getResolutionTimeTrends({ period: timeRange })
        const items: MonthlyData[] = res.data.trends.map((t) => {
          const monthLabel = timeRange === 'weekly'
            ? formatWeekLabel(t.periodStart, t.periodEnd)
            : timeRange === 'monthly'
            ? formatMonthLabel(t.periodStart)
            : formatYearLabel(t.periodStart)
          return {
            month: monthLabel,
            ticketsRaised: 0,
            ticketsResolved: t.totalResolved,
            avgResolutionHours: t.avgResolutionHours
          }
        })
        if (isMounted) setResolutionTimeData(items)
      } catch (_e) {
        if (isMounted) setResolutionTimeData([])
      }
    }

    load()
    return () => { isMounted = false }
  }, [timeRange])

  // Fetch vendor mismatch analysis data
  useEffect(() => {
    let isMounted = true

    const load = async () => {
      try {
        const res = await ReceivedOrdersApiService.getVendorMismatchAnalysis()
        const items: VendorMismatch[] = res.data.map((v) => ({
          vendorName: v.vendorName,
          vendorId: v.vendorId,
          totalOrders: v.totalOrders,
          mismatchOrders: v.mismatchOrders,
          mismatchPercentage: v.mismatchPercentage,
        }))
        if (isMounted) setVendorMismatchData(items)
      } catch (_e) {
        if (isMounted) setVendorMismatchData([])
      }
    }

    load()
    return () => { isMounted = false }
  }, [])

  // Helper function to get performance label
  const getPerformanceLabel = (percentage: number) => {
    if (percentage <= 2) return 'Excellent'
    if (percentage <= 5) return 'Good'
    return 'Needs Attention'
  }

  // Helper function to format resolution time (hours to days + hours)
  const formatResolutionTime = (hours: number): string => {
    if (hours < 24) {
      return `${hours}h`
    }
    const days = Math.floor(hours / 24)
    const remainingHours = Math.round(hours % 24)
    if (remainingHours === 0) {
      return `${days} day${days > 1 ? 's' : ''}`
    }
    return `${days} day${days > 1 ? 's' : ''} ${remainingHours} hour${remainingHours > 1 ? 's' : ''}`
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


  // --- Export helpers ---
  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const toCSV = (rows: Array<Record<string, unknown>>, headerOrder?: string[]) => {
    if (!rows || rows.length === 0) return ''
    const headers = headerOrder && headerOrder.length > 0 ? headerOrder : Array.from(new Set(rows.flatMap((r) => Object.keys(r))))
    const escapeCell = (val: unknown) => {
      const s = val === undefined || val === null ? '' : String(val)
      return s.includes(',') || s.includes('"') || s.includes('\n') ? '"' + s.replace(/"/g, '""') + '"' : s
    }
    const lines = [headers.join(',')]
    for (const row of rows) {
      lines.push(headers.map((h) => escapeCell((row as Record<string, unknown>)[h])).join(','))
    }
    return lines.join('\n')
  }

  const handleExportCSV = () => {
    const rows = filteredVendors.map(v => ({
      vendorName: v.vendorName,
      vendorId: v.vendorId,
      totalOrders: v.totalOrders,
      mismatchOrders: v.mismatchOrders,
      mismatchPercentage: v.mismatchPercentage,
      performance: getPerformanceLabel(v.mismatchPercentage)
    }))
    const csv = toCSV(rows, ['vendorName','vendorId','totalOrders','mismatchOrders','mismatchPercentage','performance'])
    downloadFile(csv, `ops_vendor_mismatch_${new Date().toISOString().slice(0,10)}.csv`, 'text/csv;charset=utf-8;')
  }

  const handleExportPDF = () => {
    const rows = filteredVendors
    const escapeHTML = (s: unknown) =>
      String(s ?? '').replace(
        /[&<>"']/g,
        (m) =>
          ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
          }[m] as string)
      )
    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Vendor-wise Mismatch Analysis</title>
          <style>
            body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Arial; padding: 16px; color:#111827 }
            h1 { font-size: 18px; margin: 0 0 12px }
            table { width: 100%; border-collapse: collapse; font-size: 12px; background: #fff }
            th, td { text-align: left; padding: 8px; border-bottom: 1px solid #e5e7eb }
            thead { background: #f9fafb }
          </style>
        </head>
        <body>
          <h1>Vendor-wise Mismatch Analysis</h1>
          <table>
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Vendor ID</th>
                <th>Total Orders</th>
                <th>Mismatch Orders</th>
                <th>Mismatch %</th>
                <th>Performance</th>
              </tr>
            </thead>
            <tbody>
              ${rows
                .map(
                  (r) => `<tr>
                <td>${escapeHTML(r.vendorName)}</td>
                <td>${escapeHTML(r.vendorId)}</td>
                <td>${r.totalOrders}</td>
                <td>${r.mismatchOrders}</td>
                <td>${r.mismatchPercentage}%</td>
                <td>${escapeHTML(
                  getPerformanceLabel(r.mismatchPercentage)
                )}</td>
              </tr>`
                )
                .join('')}
            </tbody>
          </table>
        </body>
      </html>
    `
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    document.body.appendChild(iframe)
    const doc = iframe.contentWindow?.document
    if (!doc) {
      document.body.removeChild(iframe)
      return
    }
    doc.open()
    doc.write(html)
    doc.close()
    const cleanup = () => {
      if (iframe.parentNode) document.body.removeChild(iframe)
    }
    iframe.contentWindow?.addEventListener('afterprint', cleanup, { once: true })
    setTimeout(
      () => {
        iframe.contentWindow?.focus()
        iframe.contentWindow?.print()
        setTimeout(cleanup, 1500)
      },
      250
    )
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


      {/* Key Metrics */}
      <div className="mb-6 sm:mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 pt-6 sm:pt-6 pb-4 sm:pb-6 gap-10 sm:gap-12 xl:gap-6">
          <KPICard
            title="Tickets Raised"
            value={currentTicketMetrics.raised}
            icon={<AlertTriangle size={32} />}
            subtitle="This month"
          />
          <KPICard
            title="Tickets Resolved"
            value={currentTicketMetrics.resolved}
            icon={<CheckSquare size={32} />}
            subtitle="This month"
          />
          <KPICard
            title="Avg Resolution Time"
            value={`${currentTicketMetrics.avgResolutionTime}h`}
            icon={<Clock size={32} />}
            subtitle="Hours to resolve"
          />
          <KPICard
            title="Pending Verification"
            value={totalPendingVerification}
            icon={<AlertTriangle size={32} />}
            subtitle="Awaiting action"
          />
        </div>
      </div>

      

      {/* Charts Section */}
      <div className="space-y-6 sm:space-y-8 mb-6 sm:mb-8">
        {/* Tickets Trend */}
        <div className="bg-white rounded-xl shadow-md border border-white/20 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
            <h3 className="text-base sm:text-lg font-semibold text-[var(--color-heading)]">Tickets Trend</h3>
            <div className="flex gap-2 bg-gray-100 rounded-full p-1 w-full sm:w-auto">
              <button
                onClick={() => setTimeRange('weekly')}
                className={`flex-1 sm:flex-none px-4 py-2.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all min-h-[44px] sm:min-h-0 ${
                  timeRange === 'weekly'
                    ? 'bg-[var(--color-accent)] text-[var(--color-button-text)] shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 active:bg-gray-200'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setTimeRange('monthly')}
                className={`flex-1 sm:flex-none px-4 py-2.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all min-h-[44px] sm:min-h-0 ${
                  timeRange === 'monthly'
                    ? 'bg-[var(--color-accent)] text-[var(--color-button-text)] shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 active:bg-gray-200'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setTimeRange('yearly')}
                className={`flex-1 sm:flex-none px-4 py-2.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all min-h-[44px] sm:min-h-0 ${
                  timeRange === 'yearly'
                    ? 'bg-[var(--color-accent)] text-[var(--color-button-text)] shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 active:bg-gray-200'
                }`}
              >
                Yearly
              </button>
            </div>
          </div>
          
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ticketTrendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    fontSize: '12px'
                  }}
                  formatter={(value: number, name: string) => [
                    value, 
                    name === 'ticketsRaised' ? 'Tickets Raised' : 
                    name === 'ticketsResolved' ? 'Tickets Resolved' : name
                  ]}
                />
                <Legend 
                  wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                  formatter={(value: string) => 
                    value === 'ticketsRaised' ? 'Tickets Raised' : 
                    value === 'ticketsResolved' ? 'Tickets Resolved' : value
                  }
                />
                <Line 
                  type="monotone" 
                  dataKey="ticketsRaised" 
                  stroke="var(--color-accent)" 
                  strokeWidth={2}
                  dot={{ fill: 'var(--color-accent)', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: 'var(--color-accent)', strokeWidth: 2 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="ticketsResolved" 
                  stroke="var(--color-secondary)" 
                  strokeWidth={2}
                  dot={{ fill: 'var(--color-secondary)', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, stroke: 'var(--color-secondary)', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

         
        </div>

        {/* Resolution Time Trend */}
        <div className="bg-white rounded-xl shadow-md border border-white/20 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3">
            <h3 className="text-base sm:text-lg font-semibold text-[var(--color-heading)]">Resolution Time Trend</h3>
            <div className="flex gap-2 bg-gray-100 rounded-full p-1 w-full sm:w-auto">
              <button
                onClick={() => setTimeRange('weekly')}
                className={`flex-1 sm:flex-none px-4 py-2.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all min-h-[44px] sm:min-h-0 ${
                  timeRange === 'weekly'
                    ? 'bg-[var(--color-accent)] text-[var(--color-button-text)] shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 active:bg-gray-200'
                }`}
              >
                Weekly
              </button>
              <button
                onClick={() => setTimeRange('monthly')}
                className={`flex-1 sm:flex-none px-4 py-2.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all min-h-[44px] sm:min-h-0 ${
                  timeRange === 'monthly'
                    ? 'bg-[var(--color-accent)] text-[var(--color-button-text)] shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 active:bg-gray-200'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setTimeRange('yearly')}
                className={`flex-1 sm:flex-none px-4 py-2.5 sm:px-4 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all min-h-[44px] sm:min-h-0 ${
                  timeRange === 'yearly'
                    ? 'bg-[var(--color-accent)] text-[var(--color-button-text)] shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 active:bg-gray-200'
                }`}
              >
                Yearly
              </button>
            </div>
          </div>
          
          <div className="h-64 sm:h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={resolutionTimeData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="month" 
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis 
                  stroke="#6b7280"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value: number) => formatResolutionTime(value)}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                    fontSize: '12px'
                  }}
                  formatter={(value: number) => [formatResolutionTime(value), 'Avg Resolution Time']}
                  labelFormatter={(label: string) => 
                    `${timeRange === 'weekly' ? 'Week' : timeRange === 'monthly' ? 'Month' : 'Year'}: ${label}`
                  }
                />
                <Bar 
                  dataKey="avgResolutionHours" 
                  fill="var(--color-secondary)"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          
        </div>
      </div>

      {/* Vendor-wise Mismatch Analysis */}
      <div className="mb-6 sm:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h2 className="text-xl sm:text-2xl font-semibold text-[var(--color-heading)]">
            Vendor-wise Mismatch Analysis
          </h2>
          <div className="flex justify-end">
            <CSVPDFExportButton
              onExportCSV={handleExportCSV}
              onExportPDF={handleExportPDF}
              buttonClassName="min-h-[42px]"
            />
          </div>
        </div>
        
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
          
       
        </div>

        
        {/* Desktop Table View */}
        <div className="hidden lg:block bg-white overflow-hidden rounded-t-xl shadow-md border border-white/20">
          <div className="overflow-x-auto">
            <table className="w-full border-separate border-spacing-0">
              <thead>
                <tr className="" style={{ background: 'var(--color-accent)' }}>
                  <th className="text-left p-3 font-heading font-normal" 
                      style={{ color: 'var(--color-button-text)' }}>
                    Vendor
                  </th>
                  <th className="text-center p-3 font-heading font-normal" 
                      style={{ color: 'var(--color-button-text)' }}>
                    Total Orders
                  </th>
                  <th className="text-center p-3 font-heading font-normal" 
                      style={{ color: 'var(--color-button-text)' }}>
                    Mismatch Orders
                  </th>
                  <th className="text-center p-3 font-heading font-normal" 
                      style={{ color: 'var(--color-button-text)' }}>
                    Mismatch %
                  </th>
                  <th className="text-center p-3 font-heading font-normal" 
                      style={{ color: 'var(--color-button-text)' }}>
                    Performance
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedVendors.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-gray-500">
                      No vendors found matching the selected filters.
                    </td>
                  </tr>
                ) : (
                  paginatedVendors.map((vendor) => {
                    const getPerformanceColor = (percentage: number) => {
                      if (percentage <= 2) return 'bg-green-100 text-green-700 border border-green-300'
                      if (percentage <= 5) return 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                      return 'bg-red-100 text-red-700 border border-red-300'
                    }

                    return (
                      <tr key={vendor.vendorId} className="border-b border-gray-100 hover:bg-gray-50 bg-white">
                        <td className="p-3">
                          <div className="font-semibold text-secondary">{vendor.vendorName}</div>
                          <div className="text-sm text-gray-500">{vendor.vendorId}</div>
                        </td>
                        <td className="p-3 text-sm font-medium text-secondary text-center">
                          {vendor.totalOrders}
                        </td>
                        <td className="p-3 text-sm font-medium text-secondary text-center">
                          {vendor.mismatchOrders}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <div className="bg-gray-200 rounded-full h-2 w-20">
                              <div
                                className="h-2 rounded-full transition-all"
                                style={{ 
                                  width: `${Math.min(vendor.mismatchPercentage * 10, 100)}%`,
                                  backgroundColor: vendor.mismatchPercentage <= 2 
                                    ? 'var(--color-secondary)' 
                                    : vendor.mismatchPercentage <= 5 
                                    ? 'var(--color-accent)' 
                                    : 'var(--color-accent)'
                                }}
                              />
                            </div>
                            <span className="text-sm font-semibold" style={{
                              color: vendor.mismatchPercentage <= 2 
                                ? 'var(--color-secondary)' 
                                : vendor.mismatchPercentage <= 5 
                                ? 'var(--color-accent)' 
                                : 'var(--color-accent)'
                            }}>
                              {vendor.mismatchPercentage}%
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${getPerformanceColor(vendor.mismatchPercentage)}`}>
                            {getPerformanceLabel(vendor.mismatchPercentage)}
                          </span>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden space-y-3">
          {paginatedVendors.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center">
              <p className="text-gray-500">No vendors found matching the selected filters.</p>
            </div>
          ) : (
            paginatedVendors.map((vendor) => {
              const getPerformanceColor = (percentage: number) => {
                if (percentage <= 2) return 'bg-green-100 text-green-700 border border-green-300'
                if (percentage <= 5) return 'bg-yellow-100 text-yellow-700 border border-yellow-300'
                return 'bg-red-100 text-red-700 border border-red-300'
              }

              return (
                <div key={vendor.vendorId} className="rounded-xl p-4 border border-gray-200 bg-white">
                  {/* Header Section */}
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-secondary text-lg">{vendor.vendorName}</h3>
                      <div className="text-sm text-gray-500">{vendor.vendorId}</div>
                    </div>
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${getPerformanceColor(vendor.mismatchPercentage)}`}>
                      {getPerformanceLabel(vendor.mismatchPercentage)}
                    </span>
                  </div>
                  
                  {/* Info Grid */}
                  <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                    <div>
                      <span className="text-gray-500 block">Total Orders</span>
                      <span className="font-medium text-secondary">{vendor.totalOrders}</span>
                    </div>
                    <div>
                      <span className="text-gray-500 block">Mismatch Orders</span>
                      <span className="font-medium text-secondary">{vendor.mismatchOrders}</span>
                    </div>
                  </div>

                  {/* Mismatch Percentage */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between text-sm mb-2">
                      <span className="text-gray-500">Mismatch Rate</span>
                      <span className="font-semibold" style={{
                        color: vendor.mismatchPercentage <= 2 
                          ? 'var(--color-secondary)' 
                          : vendor.mismatchPercentage <= 5 
                          ? 'var(--color-accent)' 
                          : 'var(--color-accent)'
                      }}>
                        {vendor.mismatchPercentage}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full transition-all"
                        style={{ 
                          width: `${Math.min(vendor.mismatchPercentage * 10, 100)}%`,
                          backgroundColor: vendor.mismatchPercentage <= 2 
                            ? 'var(--color-secondary)' 
                            : vendor.mismatchPercentage <= 5 
                            ? 'var(--color-accent)' 
                            : 'var(--color-accent)'
                        }}
                      />
                    </div>
                  </div>
                </div>
              )
            })
          )}
        </div>

        {/* Pagination */}
        {filteredVendors.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredVendors.length}
            startIndex={startIndex}
            endIndex={endIndex}
            onPageChange={setCurrentPage}
            itemLabel="vendors"
          />
        )}

      </div>

    </div>
  )
}
