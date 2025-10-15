// React import removed - using automatic JSX runtime
import React from 'react'
import { Wallet, FileText, Users, Search, ChevronDown } from 'lucide-react'
import { CSVPDFExportButton, Pagination } from '../../../components'
import {
  ResponsiveContainer,
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  Legend
} from 'recharts'
import { KPICard } from '../../../components'

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
      <ResponsiveContainer width="100%" height={300} className="sm:!h-[360px]">
        <RechartsLineChart data={chartData} margin={{ top: 10, right: 5, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11 }} />
          <YAxis tickFormatter={(val) => `₹${Number(val / 1000).toLocaleString()}k`} tick={{ fontSize: 10 }} />
          <Tooltip formatter={(value: number | string) => `₹${Number(value).toLocaleString()}`} />
          <Legend wrapperStyle={{ fontSize: '14px', paddingTop: 8 }} />
          <Line type="monotone" dataKey="cleared" name="Cleared" stroke="#22c55e" strokeWidth={2} dot={{ r: 3 }} />
          <Line type="monotone" dataKey="pending" name="Pending" stroke="#f59e0b" strokeWidth={2} dot={{ r: 3 }} />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  )
}

function PieChart({ pending, cleared }: { pending: number; cleared: number }) {
  const data = [
    { name: 'Pending', value: pending },
    { name: 'Cleared', value: cleared }
  ]
  const colors = ['#dd6b20', '#48bb78']
  const total = pending + cleared

  return (
    <div className="bg-white p-3 sm:p-4 md:p-6 rounded-xl shadow-md border border-white/20">
      <div className="text-center text-base sm:text-lg font-semibold text-[color:var(--color-heading)] mb-3 sm:mb-4">Pending vs Cleared</div>
      <ResponsiveContainer width="100%" height={200} className="sm:!h-[220px]">
        <RechartsPieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius="45%" outerRadius="70%" paddingAngle={2} label={false}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '11px' }} />
          <Tooltip formatter={(value: number | string) => `${value}`} />
        </RechartsPieChart>
      </ResponsiveContainer>
      
      {/* Enhanced invoice breakdown similar to Dashboard */}
      <div className="mt-3 sm:mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
          <div className="text-xs sm:text-sm text-gray-500 font-medium">Total Invoices</div>
          <div className="text-xl sm:text-2xl font-bold text-[var(--color-primary)]">{total}</div>
          <div className="text-xs sm:text-sm text-gray-400">This period</div>
        </div>
        <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
          <div className="text-xs sm:text-sm text-gray-500 font-medium">Processing Rate</div>
          <div className="text-xl sm:text-2xl font-bold text-[var(--color-primary)]">{total ? Math.round((cleared / total) * 100) : 0}%</div>
          <div className="text-xs sm:text-sm text-gray-400">Completion rate</div>
        </div>
      </div>

      <div className="mt-3 sm:mt-4 space-y-3 sm:space-y-0 sm:grid sm:grid-cols-1 lg:grid-cols-2 sm:gap-3">
        <div className="flex items-center gap-3 text-sm text-gray-700 font-medium">
          <span className="w-3 h-3 rounded-sm bg-[var(--color-warning)] block flex-shrink-0" />
          <div className="min-w-0">
            <div className="font-semibold text-sm">Pending</div>
            <div className="text-xs sm:text-sm text-gray-400 truncate">{pending} invoices</div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-700 font-medium">
          <span className="w-3 h-3 rounded-sm bg-[var(--color-success)] block flex-shrink-0" />
          <div className="min-w-0">
            <div className="font-semibold text-sm">Cleared</div>
            <div className="text-xs sm:text-sm text-gray-400 truncate">{cleared} invoices</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MoneyFlow() {
  // mock data
  const kpis = [
    { 
      title: 'Total Payments Pending', 
      value: '₹2,34,500', 
      subtitle: '23 invoices',
      icon: <Wallet size={32} />
    },
    { 
      title: 'Payments Released This Month', 
      value: '₹5,60,000', 
      subtitle: '42 payouts',
      icon: <FileText size={32} />
    },
    { 
      title: 'Vendor with Highest Outstanding', 
      value: 'GreenLeaf Farms', 
      subtitle: '₹75,000',
      icon: <Users size={32} />
    }
  ]

  const transactions = [
    { id: 'INV-1009', vendor: 'BloomWorks', amount: '₹3,200', status: 'Released', date: '2025-09-14' },
    { id: 'INV-1008', vendor: 'GreenLeaf Farms', amount: '₹11,500', status: 'Pending', date: '2025-09-13' },
    { id: 'INV-1007', vendor: 'HappyPlant Co', amount: '₹6,400', status: 'Released', date: '2025-09-13' },
    { id: 'INV-1006', vendor: 'SharkTank Ltd', amount: '₹19,000', status: 'Approved', date: '2025-09-13' },
    { id: 'INV-1005', vendor: 'HappyPlant Co', amount: '₹23,800', status: 'Released', date: '2025-09-12' },
    { id: 'INV-1004', vendor: 'GreenLeaf Farms', amount: '₹75,000', status: 'Pending', date: '2025-09-11' },
    { id: 'INV-1003', vendor: 'SharkTank Ltd', amount: '₹45,000', status: 'Approved', date: '2025-09-08' },
    { id: 'INV-1002', vendor: 'HappyPlant Co', amount: '₹8,200', status: 'Released', date: '2025-09-05' },
    { id: 'INV-1001', vendor: 'GreenLeaf Farms', amount: '₹12,500', status: 'Pending', date: '2025-09-02' }
  ]

  // Trend datasets (mock)
  const [trendRange, setTrendRange] = React.useState<TrendRange>('Monthly')
  const weeklyData: LineChartData = {
    labels: ['W1', 'W2', 'W3', 'W4'],
    pending: [80000, 60000, 50000, 70000],
    cleared: [320000, 280000, 350000, 300000]
  }
  const monthlyData: LineChartData = {
    labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
    pending: [50000, 40000, 45000, 52000, 47000, 43000, 48000, 46000, 49000, 51000, 53000, 55000],
    cleared: [120000, 95000, 130000, 110000, 150000, 125000, 140000, 135000, 160000, 155000, 170000, 180000]
  }
  const yearlyData: LineChartData = {
    labels: ['2022','2023','2024','2025'],
    pending: [520000, 480000, 510000, 495000],
    cleared: [1350000, 1480000, 1620000, 1750000]
  }
  const trendData = trendRange === 'Weekly' ? weeklyData : trendRange === 'Yearly' ? yearlyData : monthlyData

  const pending = transactions.filter((t) => t.status.toLowerCase() === 'pending').length
  const cleared = transactions.filter((t) => t.status.toLowerCase() === 'released' || t.status.toLowerCase() === 'approved').length

  // Filters and search state
  const [statusFilter, setStatusFilter] = React.useState<'All' | 'Pending' | 'Released' | 'Approved'>('All')
  const [sortOrder, setSortOrder] = React.useState<'Latest' | 'Oldest'>('Latest')
  const [searchQuery, setSearchQuery] = React.useState('')
  const [statusOpen, setStatusOpen] = React.useState(false)
  const [sortOpen, setSortOpen] = React.useState(false)
  const [page, setPage] = React.useState(1)
  const pageSize = 5

  const filteredTransactions = transactions
    .filter((t) => {
      if (statusFilter !== 'All' && t.status !== statusFilter) return false
      if (!searchQuery.trim()) return true
      const q = searchQuery.toLowerCase()
      return t.id.toLowerCase().includes(q) || t.vendor.toLowerCase().includes(q)
    })
    .sort((a, b) => {
      const diff = new Date(b.date).getTime() - new Date(a.date).getTime()
      return sortOrder === 'Latest' ? diff : -diff
    })

  // Reset to first page when filters change
  React.useEffect(() => {
    setPage(1)
  }, [statusFilter, sortOrder, searchQuery])

  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / pageSize))
  const startIndex = (page - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, filteredTransactions.length)
  const pageTransactions = filteredTransactions.slice(startIndex, endIndex)

  // Export functions
  const handleExportCSV = () => {
    const headers = ['Invoice ID', 'Vendor', 'Amount', 'Status', 'Date']
    const csvContent = [
      headers.join(','),
      ...filteredTransactions.map(t => [
        t.id,
        `"${t.vendor}"`,
        t.amount,
        t.status,
        t.date
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `money-flow-transactions-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleExportPDF = () => {
    const content = [
      'MONEY FLOW TRANSACTIONS REPORT',
      `Generated: ${new Date().toLocaleString()}`,
      `Total Transactions: ${filteredTransactions.length}`,
      `Filter: ${statusFilter}`,
      `Sort: ${sortOrder}`,
      '',
      '=== TRANSACTIONS ===',
      ...filteredTransactions.map(t => 
        `${t.id} | ${t.vendor} | ${t.amount} | ${t.status} | ${t.date}`
      )
    ].join('\n')
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `money-flow-transactions-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-9 bg-[color:var(--color-sharktank-bg)] min-h-[calc(100vh-4rem)] font-sans w-full overflow-x-hidden">
     

      <div className="mb-4 sm:mb-6 lg:mb-8">
        <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--color-heading)] mb-4 sm:mb-6 font-[var(--font-heading)]">Money Flow</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 py-8 sm:py-10 gap-6 sm:gap-8 xl:gap-6">
          {kpis.map((k, i) => (
            <KPICard 
              key={i} 
              title={k.title} 
              value={k.value} 
              subtitle={k.subtitle}
              icon={k.icon}
            />
          ))}
        </div>
      </div>

          {/* Graph section - full width line chart with pending vs cleared and range filter */}
          <div className="mb-4 sm:mb-6">
            <LineChart data={trendData} range={trendRange} onChangeRange={setTrendRange} />
          </div>

          {/* Pending vs Cleared - Full Width */}
          <div className="mb-4 sm:mb-6">
            <PieChart pending={pending} cleared={cleared} />
          </div>

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
                  {pageTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-8 text-center text-gray-500">No transactions found</td>
                    </tr>
                  ) : (
                    pageTransactions.map((t) => (
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
                totalItems={filteredTransactions.length}
                startIndex={startIndex}
                endIndex={endIndex}
                onPageChange={setPage}
                variant="desktop"
                itemLabel="transactions"
              />
            </div>

            {/* Mobile cards */}
            <div className="md:hidden space-y-3">
              {pageTransactions.length === 0 ? (
                <div className="rounded-xl p-4 border border-gray-200 bg-white text-center text-gray-500">
                  No transactions found
                </div>
              ) : (
                <>
                  {pageTransactions.map((t) => (
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
                totalItems={filteredTransactions.length}
                startIndex={startIndex}
                endIndex={endIndex}
                onPageChange={setPage}
                variant="mobile"
                itemLabel="transactions"
              />
            </div>
          </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6">
        <div className="bg-white p-3 sm:p-4 md:p-5 rounded-lg shadow-md border border-white/10">
          <h3 className="mt-0 mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-[color:var(--color-heading)]">Reconciliation Summary</h3>
          <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6">
            <div className="text-center sm:text-left">
              <div className="text-xs sm:text-sm text-gray-500 mb-1">Cleared invoices</div>
              <div className="text-xl sm:text-2xl font-bold text-[color:var(--color-heading)]">{cleared}</div>
            </div>
            <div className="text-center sm:text-left">
              <div className="text-xs sm:text-sm text-gray-500 mb-1">Mismatched invoices</div>
              <div className="text-xl sm:text-2xl font-bold text-amber-600">2</div>
            </div>
          </div>
          <div className="mt-3 sm:mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-xs sm:text-sm text-blue-700 leading-relaxed">
              <strong>Quick notes:</strong> Review mismatched invoices and update payment statuses accordingly.
            </div>
          </div>
        </div>

        <div className="bg-white p-3 sm:p-4 md:p-5 rounded-lg shadow-md border border-white/10">
          <h3 className="mt-0 mb-3 sm:mb-4 text-base sm:text-lg font-semibold text-[color:var(--color-heading)]">Recent Activity</h3>
          <div className="space-y-2.5 sm:space-y-3">
            <div className="flex items-start gap-2.5 sm:gap-3 p-2 sm:p-2.5 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-medium leading-tight">Released payment INV-1005</div>
                <div className="text-xs text-gray-500 mt-0.5">to HappyPlant Co • 09/12</div>
              </div>
            </div>
            <div className="flex items-start gap-2.5 sm:gap-3 p-2 sm:p-2.5 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-amber-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-medium leading-tight">Validation flagged mismatch</div>
                <div className="text-xs text-gray-500 mt-0.5">on INV-1004 • 09/11</div>
              </div>
            </div>
            <div className="flex items-start gap-2.5 sm:gap-3 p-2 sm:p-2.5 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 sm:mt-2 flex-shrink-0"></div>
              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-medium leading-tight">Approved INV-1003</div>
                <div className="text-xs text-gray-500 mt-0.5">for SharkTank Ltd • 09/08</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


