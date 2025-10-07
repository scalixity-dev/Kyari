// React import removed - using automatic JSX runtime
import { Wallet, FileText, Users } from 'lucide-react'
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
  , BarChart, Bar
} from 'recharts'

function KPI({ title, value, subtitle }: { title: string; value: string | number; subtitle?: string }) {
  // determine an icon by title (simple mapping) for the top-level KPIs
  const icon = title.toLowerCase().includes('pending') ? <Wallet size={24} /> : title.toLowerCase().includes('released') ? <FileText size={24} /> : <Users size={24} />
  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-white/20 flex flex-col sm:flex-row items-center sm:items-center gap-3 sm:gap-4 relative overflow-hidden">
      <div className="w-12 h-12 sm:w-16 sm:h-16 flex items-center justify-center rounded-lg text-[var(--color-heading)] flex-shrink-0">
        {icon}
      </div>
      <div className="flex-1 text-center sm:text-left min-w-0">
        <div className="text-xs font-semibold text-[color:var(--color-primary)] uppercase tracking-wide mb-1 leading-tight">{title}</div>
        <div className="text-xl sm:text-2xl font-bold text-[color:var(--color-heading)] mb-1">{value}</div>
        {subtitle && <div className="text-xs sm:text-sm text-gray-400 leading-tight">{subtitle}</div>}
      </div>
    </div>
  )
}

function LineChart({ data }: { data: number[] }) {
  // Convert numeric series into objects for Recharts
  const chartData = data.map((v, i) => ({
    name: new Date(2025, i, 1).toLocaleString('en-US', { month: 'short' }),
    value: v
  }))

  return (
    <div className="bg-white p-4 sm:p-5 rounded-lg shadow-md border border-white/10">
      <div className="text-sm sm:text-base font-semibold text-[color:var(--color-heading)] mb-3">Monthly payout trend</div>
      <ResponsiveContainer width="100%" height={200}>
        <RechartsLineChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
          <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 12 }} />
          <YAxis tickFormatter={(val) => `₹${Number(val / 1000).toLocaleString()}k`} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value: any) => `₹${Number(value).toLocaleString()}`} />
          <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
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

  return (
    <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-white/20">
      <div className="text-center text-base sm:text-lg font-semibold text-[color:var(--color-heading)] mb-4">Pending vs Cleared</div>
      <ResponsiveContainer width="100%" height={220}>
        <RechartsPieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} label={false}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Legend verticalAlign="bottom" wrapperStyle={{ fontSize: '12px' }} />
          <Tooltip formatter={(value: any) => `${value}`} />
        </RechartsPieChart>
      </ResponsiveContainer>
      
      {/* Enhanced invoice breakdown similar to Dashboard */}
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
          <div className="text-xs sm:text-sm text-gray-500 font-medium">Total Invoices</div>
          <div className="text-xl sm:text-2xl font-bold text-[var(--color-primary)]">{pending + cleared}</div>
          <div className="text-xs sm:text-sm text-gray-400">This period</div>
        </div>
        <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
          <div className="text-xs sm:text-sm text-gray-500 font-medium">Processing Rate</div>
          <div className="text-xl sm:text-2xl font-bold text-[var(--color-primary)]">{Math.round((cleared / (pending + cleared)) * 100)}%</div>
          <div className="text-xs sm:text-sm text-gray-400">Completion rate</div>
        </div>
      </div>

      <div className="mt-4 space-y-3 sm:space-y-0 sm:grid sm:grid-cols-1 lg:grid-cols-2 sm:gap-3">
        <div className="flex items-center gap-3 text-sm text-gray-700 font-medium">
          <span className="w-3 h-3 rounded-sm bg-[var(--color-warning)] block flex-shrink-0" />
          <div className="min-w-0">
            <div className="font-semibold">Pending</div>
            <div className="text-xs sm:text-sm text-gray-400 truncate">{pending} invoices</div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-700 font-medium">
          <span className="w-3 h-3 rounded-sm bg-[var(--color-success)] block flex-shrink-0" />
          <div className="min-w-0">
            <div className="font-semibold">Cleared</div>
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
    { title: 'Total Payments Pending', value: '₹2,34,500', subtitle: '23 invoices' },
    { title: 'Payments Released This Month', value: '₹5,60,000', subtitle: '42 payouts' },
    { title: 'Vendor with Highest Outstanding', value: 'GreenLeaf Farms', subtitle: '₹75,000' }
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

  const monthly = [120000, 95000, 130000, 110000, 150000, 125000, 140000, 135000, 160000, 155000, 170000, 180000]

  const pending = transactions.filter((t) => t.status.toLowerCase() === 'pending').length
  const cleared = transactions.filter((t) => t.status.toLowerCase() === 'released' || t.status.toLowerCase() === 'approved').length

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-[color:var(--color-happyplant-bg)] min-h-[calc(100vh-4rem)] font-sans w-full overflow-x-hidden">
      <div className="bg-[var(--color-header-bg)] p-4 sm:p-6 lg:p-8 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] mb-4 sm:mb-6 border border-[rgba(0,0,0,0.03)]">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--color-heading)] mb-2 font-[var(--font-heading)]">Money Flow</h1>
        <p className="text-sm sm:text-base lg:text-lg text-[var(--color-primary)] font-medium">Payments, reconciliation and transaction insights</p>
      </div>

      <div className="mb-6 lg:mb-8">
        <h2 className="text-xl sm:text-2xl font-semibold text-[var(--color-heading)] mb-4 sm:mb-6 font-[var(--font-heading)]">Today's Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
          {kpis.map((k, i) => (
            <KPI key={i} title={k.title} value={k.value} subtitle={k.subtitle} />
          ))}
        </div>
      </div>

          {/* Charts row: Monthly, Weekly and Pending vs Cleared */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="md:col-span-2 lg:col-span-1">
              <LineChart data={monthly} />
            </div>
            <div className="md:col-span-2 lg:col-span-1">
              <div className="bg-white p-4 sm:p-5 rounded-lg shadow-md border border-white/10 h-full">
                <div className="text-sm sm:text-base font-semibold text-[color:var(--color-heading)] mb-3">Weekly payout trend (4 weeks)</div>
                <div style={{ width: '100%', height: 200 }}>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={[{ week: 'W1', cleared: 320000, pending: 80000 }, { week: 'W2', cleared: 280000, pending: 60000 }, { week: 'W3', cleared: 350000, pending: 50000 }, { week: 'W4', cleared: 300000, pending: 70000 }]} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid stroke="#eef2f7" />
                      <XAxis dataKey="week" tick={{ fill: '#64748b', fontSize: 12 }} />
                      <YAxis tickFormatter={(val) => `₹${Number(val / 1000).toLocaleString()}k`} tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value: any) => `₹${Number(value).toLocaleString()}`} />
                      <Legend wrapperStyle={{ fontSize: '12px' }} />
                      <Bar dataKey="cleared" stackId="a" fill="#48bb78" />
                      <Bar dataKey="pending" stackId="a" fill="#dd6b20" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <div className="md:col-span-1 lg:col-span-1">
              <PieChart pending={pending} cleared={cleared} />
            </div>
          </div>

          <div className="mb-4 sm:mb-6">
            <div className="bg-white p-4 sm:p-6 rounded-lg shadow-md border border-white/10">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-2">
                <div className="text-base sm:text-lg font-semibold text-[color:var(--color-heading)]">Transactions</div>
                <div className="text-sm text-gray-500">Showing recent 10</div>
              </div>

              {/* Desktop Table */}
              <div className="hidden md:block overflow-auto">
                <table className="w-full table-auto border-collapse">
                  <thead>
                    <tr className="text-left border-b border-slate-100">
                      <th className="py-3 text-sm font-semibold">Invoice ID</th>
                      <th className="text-sm font-semibold">Vendor</th>
                      <th className="text-sm font-semibold">Amount</th>
                      <th className="text-sm font-semibold">Status</th>
                      <th className="text-sm font-semibold">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions
                      .slice()
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 10)
                      .map((t) => (
                      <tr key={t.id} className="border-b border-slate-50 hover:bg-gray-50">
                        <td className="py-3 align-top font-medium text-sm">{t.id}</td>
                        <td className="align-middle py-3 text-sm">{t.vendor}</td>
                        <td className="align-middle py-3 font-medium text-sm">{t.amount}</td>
                        <td className="align-middle py-3">
                          <span className={`px-2 py-1 rounded-md font-semibold text-xs ${t.status === 'Pending' ? 'bg-amber-50 text-amber-600' : t.status === 'Released' ? 'bg-green-50 text-green-600' : 'bg-sky-50 text-sky-600'}`}>{t.status}</span>
                        </td>
                        <td className="align-middle text-xs text-gray-600">{t.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {transactions
                  .slice()
                  .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                  .slice(0, 10)
                  .map((t) => (
                    <div key={t.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div className="font-semibold text-sm text-[color:var(--color-heading)]">{t.id}</div>
                        <span className={`px-2 py-1 rounded-md font-semibold text-xs ${t.status === 'Pending' ? 'bg-amber-50 text-amber-600' : t.status === 'Released' ? 'bg-green-50 text-green-600' : 'bg-sky-50 text-sky-600'}`}>{t.status}</span>
                      </div>
                      <div className="text-sm text-gray-700 mb-1">{t.vendor}</div>
                      <div className="flex justify-between items-end">
                        <div className="font-semibold text-base text-[color:var(--color-heading)]">{t.amount}</div>
                        <div className="text-xs text-gray-500">{t.date}</div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-white p-4 sm:p-5 rounded-lg shadow-md border border-white/10">
          <h3 className="mt-0 mb-3 text-base sm:text-lg font-semibold text-[color:var(--color-heading)]">Reconciliation Summary</h3>
          <div className="grid grid-cols-2 gap-4 sm:gap-6">
            <div className="text-center sm:text-left">
              <div className="text-xs text-gray-500 mb-1">Cleared invoices</div>
              <div className="text-xl sm:text-2xl font-bold text-[color:var(--color-heading)]">{cleared}</div>
            </div>
            <div className="text-center sm:text-left">
              <div className="text-xs text-gray-500 mb-1">Mismatched invoices</div>
              <div className="text-xl sm:text-2xl font-bold text-amber-600">2</div>
            </div>
          </div>
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <div className="text-sm text-blue-700 leading-relaxed">
              <strong>Quick notes:</strong> Review mismatched invoices and update payment statuses accordingly.
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-lg shadow-md border border-white/10">
          <h3 className="mt-0 mb-3 text-base sm:text-lg font-semibold text-[color:var(--color-heading)]">Recent Activity</h3>
          <div className="space-y-3">
            <div className="flex items-start gap-3 p-2 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <div className="text-sm font-medium">Released payment INV-1005</div>
                <div className="text-xs text-gray-500">to HappyPlant Co • 09/12</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-2 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-amber-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <div className="text-sm font-medium">Validation flagged mismatch</div>
                <div className="text-xs text-gray-500">on INV-1004 • 09/11</div>
              </div>
            </div>
            <div className="flex items-start gap-3 p-2 bg-gray-50 rounded-lg">
              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
              <div>
                <div className="text-sm font-medium">Approved INV-1003</div>
                <div className="text-xs text-gray-500">for SharkTank Ltd • 09/08</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}


