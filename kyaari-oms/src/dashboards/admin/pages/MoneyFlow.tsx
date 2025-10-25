// React import removed - using automatic JSX runtime
import * as React from 'react'
import { Wallet, FileText, Users, Search, ChevronDown } from 'lucide-react'
import { CSVPDFExportButton, Pagination } from '../../../components'
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  Sector
} from 'recharts'
import { KPICard } from '../../../components'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../../../components/ui/chart"
import { MoneyFlowApi, type MoneyFlowKPIDto, type MoneyFlowTransactionDto, type MoneyFlowTrendDataDto, type MoneyFlowPieChartDto } from '../../../services/moneyFlowApi'
import toast from 'react-hot-toast'

type TrendRange = 'Weekly' | 'Monthly' | 'Yearly'

interface LineChartData {
  labels: string[]
  pending: number[]
  cleared: number[]
}

function LineChart({ data, range, onChangeRange }: { data: LineChartData; range: TrendRange; onChangeRange: (r: TrendRange) => void }) {
  const chartData = data.labels.map((label, i) => ({
    name: label,
    pending: data.pending[i] ?? 0,
    cleared: data.cleared[i] ?? 0
  }))

  const chartConfig = {
    cleared: {
      label: "Cleared",
      color: "var(--color-secondary)",
    },
    pending: {
      label: "Pending",
      color: "var(--color-accent)",
    },
  }

  return (
    <div className="bg-white p-3 sm:p-4 md:p-5 rounded-lg shadow-md border border-white/10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0 mb-3">
        <div className="text-base sm:text-lg md:text-xl font-semibold text-[color:var(--color-heading)]">Payout trend</div>
        <div className="flex items-center gap-2 bg-gray-100 rounded-md p-1">
          {(['Weekly', 'Monthly', 'Yearly'] as const).map(period => (
            <button
              key={period}
              onClick={() => onChangeRange(period)}
              className={`px-3 py-1 text-sm rounded-md transition-colors ${range === period ? 'bg-[var(--color-accent)] text-[var(--color-button-text)]' : 'text-gray-600 hover:text-gray-900'}`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>
      <ChartContainer config={chartConfig} className="h-[300px] sm:h-[360px] w-full">
        <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="fillCleared" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-secondary)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="var(--color-secondary)" stopOpacity={0.1} />
            </linearGradient>
            <linearGradient id="fillPending" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.8} />
              <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0.1} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" vertical={false} />
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#64748b', fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            tickFormatter={(val) => `₹${Number(val / 1000).toLocaleString()}k`} 
            tick={{ fontSize: 10 }}
            tickLine={false}
            axisLine={false}
          />
          <ChartTooltip 
            cursor={{ stroke: '#cbd5e1', strokeWidth: 1 }}
            content={<ChartTooltipContent 
              formatter={(value) => [`₹${Number(value).toLocaleString()}`, ""]}
              className="bg-white"
            />}
          />
          <Area 
            type="monotone" 
            dataKey="cleared" 
            stroke="var(--color-secondary)" 
            strokeWidth={2}
            fill="url(#fillCleared)"
            fillOpacity={1}
          />
          <Area 
            type="monotone" 
            dataKey="pending" 
            stroke="var(--color-accent)" 
            strokeWidth={2}
            fill="url(#fillPending)"
            fillOpacity={1}
          />
        </AreaChart>
      </ChartContainer>
    </div>
  )
}

function PieChart({ pending, cleared }: { pending: number; cleared: number }) {
  const [activePieIndex, setActivePieIndex] = React.useState<number | undefined>(undefined)
  
  const total = pending + cleared
  const pendingPercent = total ? Math.round((pending / total) * 100) : 0
  const clearedPercent = total ? Math.round((cleared / total) * 100) : 0

  const pieChartData = [
    { name: 'Pending', value: pendingPercent, count: pending, fill: 'var(--color-accent)' },
    { name: 'Cleared', value: clearedPercent, count: cleared, fill: 'var(--color-secondary)' }
  ]

  // Custom render function for active pie sector (makes it bigger on hover with animation)
  const renderActiveShape = (props: any) => {
    const {
      cx,
      cy,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fill,
    } = props

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 15} // Expand by 15px on hover
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          style={{
            filter: 'drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.2))',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </g>
    )
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-white/20">
      <h3 className="text-base sm:text-lg font-semibold text-[color:var(--color-heading)] mb-4 sm:mb-6">Pending vs Cleared</h3>
      
      {/* Two column layout: Left for content, Right for pie chart */}
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start">
        {/* Left side: Content */}
        <div className="flex-1 w-full">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <div className="text-sm text-gray-500 mb-2 font-medium">Total Invoices</div>
              <div className="text-3xl sm:text-4xl font-extrabold text-gray-900">{total}</div>
              <div className="text-xs sm:text-sm text-gray-400 mt-1">This period</div>
            </div>
            <div>
              <div className="text-sm text-gray-500 mb-2 font-medium">Processing Rate</div>
              <div className="text-3xl sm:text-4xl font-extrabold text-gray-900">{clearedPercent}%</div>
              <div className="text-xs sm:text-sm text-gray-400 mt-1">Completion rate</div>
            </div>
          </div>

          {/* Legend */}
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <span className="w-4 h-4 rounded-full block flex-shrink-0 mt-0.5" style={{ background: 'var(--color-accent)' }} />
              <div>
                <div className="text-sm font-semibold text-gray-700 mb-0.5">Pending</div>
                <div className="text-xs text-gray-500">{pending} invoices • {pendingPercent}%</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <span className="w-4 h-4 rounded-full block flex-shrink-0 mt-0.5" style={{ background: 'var(--color-secondary)' }} />
              <div>
                <div className="text-sm font-semibold text-gray-700 mb-0.5">Cleared</div>
                <div className="text-xs text-gray-500">{cleared} invoices • {clearedPercent}%</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right side: Interactive Donut Chart - Centered */}
        <div className="flex-shrink-0 flex items-center justify-center w-full lg:w-auto">
          <ResponsiveContainer width={280} height={280}>
            <RechartsPieChart>
              <Pie 
                activeIndex={activePieIndex}
                activeShape={renderActiveShape}
                data={pieChartData}
                cx="50%" 
                cy="50%" 
                innerRadius={75} 
                outerRadius={115} 
                paddingAngle={2}
                strokeWidth={0}
                dataKey="value"
                onMouseEnter={(_, index) => setActivePieIndex(index)}
                onMouseLeave={() => setActivePieIndex(undefined)}
                animationBegin={0}
                animationDuration={400}
                animationEasing="ease-in-out"
              >
                {pieChartData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.fill}
                    style={{
                      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                      cursor: 'pointer'
                    }}
                  />
                ))}
              </Pie>
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload
                    return (
                      <div className="rounded-lg border bg-white p-3 shadow-lg">
                        <div className="font-semibold text-gray-900">{data.name}</div>
                        <div className="text-sm text-gray-600 mt-1">
                          <div>{data.value}% of total</div>
                          <div>{data.count} invoices</div>
                        </div>
                      </div>
                    )
                  }
                  return null
                }}
              />
            </RechartsPieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  )
}

export default function MoneyFlow() {
  // State for real data
  const [kpis, setKpis] = React.useState<MoneyFlowKPIDto[]>([])
  const [transactions, setTransactions] = React.useState<MoneyFlowTransactionDto[]>([])
  const [trendData, setTrendData] = React.useState<MoneyFlowTrendDataDto>({ labels: [], pending: [], cleared: [] })
  const [pieChartData, setPieChartData] = React.useState<MoneyFlowPieChartDto>({ pending: 0, cleared: 0, total: 0, pendingPercent: 0, clearedPercent: 0 })
  const [loading, setLoading] = React.useState(true)
  const [trendRange, setTrendRange] = React.useState<TrendRange>('Monthly')

  // Load data on component mount
  React.useEffect(() => {
    loadData()
  }, [trendRange])

  const loadData = async () => {
    try {
      setLoading(true)
      const [kpisRes, transactionsRes, trendRes, pieChartRes] = await Promise.all([
        MoneyFlowApi.getKPIs(),
        MoneyFlowApi.getTransactions({ status: 'All', page: 1, limit: 10 }),
        MoneyFlowApi.getTrendData({ range: trendRange }),
        MoneyFlowApi.getPieChartData()
      ])

      // Safely set KPIs
      if (kpisRes && kpisRes.data && kpisRes.data.kpis) {
        setKpis(kpisRes.data.kpis)
      } else {
        setKpis([])
      }

      // Safely set transactions
      if (transactionsRes && transactionsRes.data && transactionsRes.data.transactions) {
        setTransactions(transactionsRes.data.transactions)
        setTotalPages(transactionsRes.data.pagination?.totalPages || 1)
        setTotalItems(transactionsRes.data.pagination?.total || 0)
      } else {
        setTransactions([])
        setTotalPages(1)
        setTotalItems(0)
      }

      // Safely set trend data
      if (trendRes && trendRes.data && trendRes.data.trendData) {
        setTrendData(trendRes.data.trendData)
      } else {
        setTrendData({ labels: [], pending: [], cleared: [] })
      }

      // Safely set pie chart data
      if (pieChartRes && pieChartRes.data && pieChartRes.data.pieChartData) {
        setPieChartData(pieChartRes.data.pieChartData)
      } else {
        setPieChartData({ pending: 0, cleared: 0, total: 0, pendingPercent: 0, clearedPercent: 0 })
      }
    } catch (error) {
      console.error('Failed to load money flow data:', error)
      toast.error('Failed to load money flow data')
      // Set default values on error
      setKpis([])
      setTransactions([])
      setTrendData({ labels: [], pending: [], cleared: [] })
      setPieChartData({ pending: 0, cleared: 0, total: 0, pendingPercent: 0, clearedPercent: 0 })
      setTotalPages(1)
      setTotalItems(0)
    } finally {
      setLoading(false)
    }
  }

  // Filters and search state
  const [statusFilter, setStatusFilter] = React.useState<'All' | 'Pending' | 'Released' | 'Approved'>('All')
  const [sortOrder, setSortOrder] = React.useState<'Latest' | 'Oldest'>('Latest')
  const [searchQuery, setSearchQuery] = React.useState('')
  // Loading state for transactions table (used to show Orders-like loading UI)
  const [isLoadingTransactions, setIsLoadingTransactions] = React.useState(false)
  const [statusOpen, setStatusOpen] = React.useState(false)
  const [sortOpen, setSortOpen] = React.useState(false)
  const [page, setPage] = React.useState(1)
  const [totalPages, setTotalPages] = React.useState(1)
  const [totalItems, setTotalItems] = React.useState(0)
  const pageSize = 10

  // Load filtered transactions
  const loadFilteredTransactions = async () => {
    try {
      const res = await MoneyFlowApi.getTransactions({
        status: statusFilter,
        searchQuery: searchQuery.trim() || undefined,
        sortOrder,
        page,
        limit: pageSize
      })
      
      // Check if response has the expected structure
      if (res && res.data && res.data.transactions && res.data.pagination) {
        setTransactions(res.data.transactions)
        setTotalPages(res.data.pagination.totalPages || 1)
        setTotalItems(res.data.pagination.total || 0)
      } else {
        console.error('Unexpected API response structure:', res)
        toast.error('Invalid response from server')
        setTransactions([])
        setTotalPages(1)
        setTotalItems(0)
      }
    } catch (error) {
      console.error('Failed to load transactions:', error)
      toast.error('Failed to load transactions')
      setTransactions([])
      setTotalPages(1)
      setTotalItems(0)
    }
  }

  // Load filtered transactions when filters change
  React.useEffect(() => {
    loadFilteredTransactions()
  }, [statusFilter, sortOrder, searchQuery, page])

  // Reset to first page when filters change
  React.useEffect(() => {
    setPage(1)
  }, [statusFilter, sortOrder, searchQuery])

  // Export functions
  const handleExportCSV = async () => {
    try {
      const blob = await MoneyFlowApi.exportCSV({
        status: statusFilter,
        searchQuery: searchQuery.trim() || undefined,
        sortOrder
      })
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `money-flow-transactions-${new Date().toISOString().split('T')[0]}.csv`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('CSV exported successfully')
    } catch (error) {
      console.error('Failed to export CSV:', error)
      toast.error('Failed to export CSV')
    }
  }

  const handleExportPDF = async () => {
    try {
      const blob = await MoneyFlowApi.exportPDF({
        status: statusFilter,
        searchQuery: searchQuery.trim() || undefined,
        sortOrder
      })
      
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `money-flow-transactions-${new Date().toISOString().split('T')[0]}.txt`
      a.click()
      window.URL.revokeObjectURL(url)
      toast.success('PDF exported successfully')
    } catch (error) {
      console.error('Failed to export PDF:', error)
      toast.error('Failed to export PDF')
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-9 bg-[color:var(--color-sharktank-bg)] min-h-[calc(100vh-4rem)] font-sans w-full overflow-x-hidden">
      {/* Page Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-heading mb-2">Money Flow</h1>
        <p className="text-sm sm:text-base text-gray-600">Track payments, invoices, and financial transactions</p>
      </div>

      <div className="mb-4 sm:mb-6 lg:mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 py-8 sm:py-10 gap-6 sm:gap-8 xl:gap-6">
          {loading ? (
            // Loading skeleton for KPIs
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-md border border-white/10 animate-pulse">
                <div className="h-8 bg-gray-200 rounded mb-4"></div>
                <div className="h-12 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ))
          ) : (
            kpis.map((k, i) => {
              const iconMap = {
                'Wallet': <Wallet size={32} />,
                'FileText': <FileText size={32} />,
                'Users': <Users size={32} />
              }
              return (
                <KPICard 
                  key={i} 
                  title={k.title} 
                  value={k.value} 
                  subtitle={k.subtitle}
                  icon={iconMap[k.icon as keyof typeof iconMap] || <Wallet size={32} />}
                />
              )
            })
          )}
        </div>
      </div>

          {/* Graph section - full width line chart with pending vs cleared and range filter */}
          <div className="mb-4 sm:mb-6">
            <LineChart data={trendData} range={trendRange} onChangeRange={setTrendRange} />
          </div>

          {/* Pending vs Cleared - Full Width */}
          <div className="mb-4 sm:mb-6">
            <PieChart pending={pieChartData.pending} cleared={pieChartData.cleared} />
          </div>

          {isLoadingTransactions ? (
            <div className="bg-white rounded-xl p-12 text-center">
              <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading transactions...</p>
            </div>
          ) : (
          <div className="py-4 sm:py-6">
            {/* Header controls row */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
              <div className="text-2xl sm:text-3xl md:text-[28px] font-extrabold text-[var(--color-heading)] font-[var(--font-heading)]">Transactions</div>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 lg:gap-6 w-full lg:w-auto">
                <div className="relative w-full sm:flex-1 lg:w-[320px]">
                  <Search size={18} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 sm:w-5 sm:h-5 text-[#424242]" />
                  <input
                    placeholder="Search by ID or vendor"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    aria-label="Search transactions by ID or vendor"
                    className="w-full h-10 rounded-md pl-9 sm:pl-10 pr-3 bg-white shadow-sm border border-gray-200 text-sm outline-none"
                  />
                </div>
                <div className="flex items-center gap-3 sm:gap-4">
                  <div className="relative flex-1 sm:flex-none">
                    <button
                      type="button"
                      onClick={() => { setStatusOpen((s) => !s); setSortOpen(false) }}
                      className="h-10 px-0 bg-transparent border-0 text-gray-700 flex items-center gap-1 font-[var(--font-heading)] font-bold text-base sm:text-lg md:text-[20px] leading-[100%] tracking-[0] whitespace-nowrap"
                      aria-haspopup="listbox"
                      aria-expanded={statusOpen}
                      aria-controls="status-menu"
                    >
                      <span className="truncate">{statusFilter === 'All' ? 'All Status' : statusFilter}</span>
                      <ChevronDown size={20} className={`${statusOpen ? 'rotate-180' : ''} transition-transform flex-shrink-0 sm:w-6 sm:h-6`} />
                    </button>
                    {statusOpen && (
                      <div id="status-menu" role="listbox" className="absolute left-0 sm:left-1/2 sm:-translate-x-1/2 mt-1 w-36 bg-white border border-gray-200 rounded-md shadow-sm z-10">
                        {(['All','Pending','Released','Approved'] as const).map((s) => (
                          <button key={s} role="option" aria-selected={statusFilter === s} onClick={() => { setStatusFilter(s === 'All' ? 'All' : s); setStatusOpen(false) }} className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${statusFilter === s ? 'text-[color:var(--color-secondary)] font-medium' : 'text-gray-700'}`}>{s === 'All' ? 'All Status' : s}</button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="relative flex-1 sm:flex-none">
                    <button
                      type="button"
                      onClick={() => { setSortOpen((s) => !s); setStatusOpen(false) }}
                      className="h-10 px-0 bg-transparent border-0 text-gray-700 flex items-center gap-1 font-[var(--font-heading)] font-bold text-base sm:text-lg md:text-[20px] leading-[100%] tracking-[0] whitespace-nowrap"
                      aria-haspopup="listbox"
                      aria-expanded={sortOpen}
                      aria-controls="sort-menu"
                    >
                      <span>{sortOrder}</span>
                      <ChevronDown size={20} className={`${sortOpen ? 'rotate-180' : ''} transition-transform flex-shrink-0 sm:w-6 sm:h-6`} />
                    </button>
                    {sortOpen && (
                      <div id="sort-menu" role="listbox" className="absolute right-0 sm:left-1/2 sm:-translate-x-1/2 mt-1 w-28 bg-white border border-gray-200 rounded-md shadow-sm z-10">
                        {(['Latest','Oldest'] as const).map((s) => (
                          <button key={s} role="option" aria-selected={sortOrder === s} onClick={() => { setSortOrder(s); setSortOpen(false) }} className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-50 ${sortOrder === s ? 'text-[color:var(--color-secondary)] font-medium' : 'text-gray-700'}`}>{s}</button>
                        ))}
                      </div>
                    )}
                  </div>
                  <CSVPDFExportButton
                    onExportCSV={handleExportCSV}
                    onExportPDF={handleExportPDF}
                  />
                </div>
              </div>
            </div>

            {/* Desktop Table - Hidden on mobile, visible on tablet+ */}
            <div className="hidden md:block bg-header-bg rounded-xl overflow-hidden">
              <table className="w-full border-separate border-spacing-0">
                <thead>
                  <tr style={{ background: 'var(--color-accent)' }}>
                    <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Invoice ID</th>
                    <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Vendor</th>
                    <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Amount</th>
                    <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Status</th>
                    <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    // Loading skeleton for table
                    Array.from({ length: 5 }).map((_, i) => (
                      <tr key={i} className="border-b border-gray-100 bg-white">
                        <td className="p-3"><div className="h-4 bg-gray-200 rounded animate-pulse"></div></td>
                        <td className="p-3"><div className="h-4 bg-gray-200 rounded animate-pulse"></div></td>
                        <td className="p-3"><div className="h-4 bg-gray-200 rounded animate-pulse"></div></td>
                        <td className="p-3"><div className="h-4 bg-gray-200 rounded animate-pulse"></div></td>
                        <td className="p-3"><div className="h-4 bg-gray-200 rounded animate-pulse"></div></td>
                      </tr>
                    ))
                  ) : !transactions || transactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No transactions found</td>
                    </tr>
                  ) : (
                    (transactions || []).map((t) => (
                      <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50 bg-white transition-colors">
                        <td className="p-3 font-semibold text-secondary text-sm">{t.id}</td>
                        <td className="p-3 text-sm text-gray-700">{t.vendor}</td>
                        <td className="p-3 text-sm font-semibold text-secondary">{t.amount}</td>
                        <td className="p-3">
                          <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                            t.status === 'Pending' 
                              ? 'bg-amber-50 text-amber-600' 
                              : t.status === 'Released' 
                              ? 'bg-green-50 text-green-600' 
                              : 'bg-sky-50 text-sky-600'
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="p-3 text-sm text-gray-500">{t.date}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              {/* Pagination controls (desktop) */}
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalItems}
                startIndex={(page - 1) * pageSize + 1}
                endIndex={Math.min(page * pageSize, totalItems)}
                onPageChange={setPage}
                variant="desktop"
                itemLabel="transactions"
              />
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {!transactions || transactions.length === 0 ? (
                <div className="rounded-xl p-4 border border-gray-200 bg-white text-center text-gray-500">
                  No transactions found
                </div>
              ) : (
                <>
                  {(transactions || []).map((t) => (
                    <div key={t.id} className="rounded-xl p-4 border border-gray-200 bg-white">
                      <div className="flex justify-between items-start mb-3">
                        <div className="font-semibold text-secondary text-lg">{t.id}</div>
                        <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                          t.status === 'Pending' 
                            ? 'bg-amber-50 text-amber-600' 
                            : t.status === 'Released' 
                            ? 'bg-green-50 text-green-600' 
                            : 'bg-sky-50 text-sky-600'
                        }`}>
                          {t.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 mb-3">{t.vendor}</div>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-gray-500 block">Amount</span>
                          <span className="font-bold text-lg text-secondary">{t.amount}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-gray-500 block">Date</span>
                          <span className="font-medium">{t.date}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </>
              )}
              {/* Pagination controls (mobile) */}
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={totalItems}
                startIndex={(page - 1) * pageSize + 1}
                endIndex={Math.min(page * pageSize, totalItems)}
                onPageChange={setPage}
                variant="mobile"
                itemLabel="transactions"
              />
            </div>
          </div>
          )}
    </div>
  )
}


