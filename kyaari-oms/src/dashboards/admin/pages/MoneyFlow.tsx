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
  const icon = title.toLowerCase().includes('pending') ? <Wallet size={28} /> : title.toLowerCase().includes('released') ? <FileText size={28} /> : <Users size={28} />
  return (
    <div className="bg-white p-5 rounded-lg shadow-md border border-white/10 flex items-center gap-4">
      <div className="w-12 h-12 flex items-center justify-center rounded-md text-[var(--color-heading)]">
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-xs font-semibold text-[color:var(--color-primary)] uppercase">{title}</div>
        <div className="text-2xl font-bold text-[color:var(--color-heading)]">{value}</div>
        {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
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
    <div className="bg-white p-5 rounded-lg shadow-md border border-white/10">
      <div className="text-base font-semibold text-[color:var(--color-heading)] mb-3">Monthly payout trend</div>
      <ResponsiveContainer width="100%" height={220}>
        <RechartsLineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#eef2f7" />
          <XAxis dataKey="name" tick={{ fill: '#64748b' }} />
          <YAxis tickFormatter={(val) => `₹${Number(val).toLocaleString()}`} />
          <Tooltip formatter={(value: any) => `₹${Number(value).toLocaleString()}`} />
          <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={3} dot={{ r: 4 }} />
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
    <div className="bg-white p-5 rounded-lg shadow-md border border-white/10">
      <div className="text-base font-semibold text-[color:var(--color-heading)] mb-3">Pending vs Cleared</div>
      <ResponsiveContainer width="100%" height={200}>
        <RechartsPieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} label={(entry) => `${entry.name} (${entry.value})`}>
            {data.map((_, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Legend verticalAlign="bottom" />
          <Tooltip formatter={(value: any) => `${value}`} />
        </RechartsPieChart>
      </ResponsiveContainer>
      <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="flex items-center gap-3 text-sm text-gray-700 font-medium">
          <span className="w-3 h-3 rounded-sm bg-[var(--color-warning)] block" />
          <div>
            <div className="font-semibold">Pending</div>
            <div className="text-sm text-gray-400">{pending} invoices</div>
          </div>
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-700 font-medium">
          <span className="w-3 h-3 rounded-sm bg-[var(--color-success)] block" />
          <div>
            <div className="font-semibold">Cleared</div>
            <div className="text-sm text-gray-400">{cleared} invoices</div>
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
    <div className="p-8 bg-[color:var(--color-happyplant-bg)] min-h-[calc(100vh-4rem)]">
      <div className="mb-5">
        <h1 className="m-0 font-[var(--font-heading)] text-2xl text-[color:var(--color-heading)]">Money Flow</h1>
        <p className="m-0 text-[color:var(--color-primary)]">Payments, reconciliation and transaction insights</p>
      </div>

      <div className="grid gap-4 grid-cols-1 md:grid-cols-3 mb-5">
        {kpis.map((k, i) => (
          <KPI key={i} title={k.title} value={k.value} subtitle={k.subtitle} />
        ))}
      </div>

          {/* Charts row: Monthly, Weekly and Pending vs Cleared */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-5">
            <LineChart data={monthly} />
            <div>
              <div className="bg-white p-5 rounded-lg shadow-md border border-white/10 h-full">
                <div className="text-base font-semibold text-[color:var(--color-heading)] mb-3">Weekly payout trend (4 weeks)</div>
                <div style={{ width: '100%', height: 220 }}>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={[{ week: 'W1', cleared: 320000, pending: 80000 }, { week: 'W2', cleared: 280000, pending: 60000 }, { week: 'W3', cleared: 350000, pending: 50000 }, { week: 'W4', cleared: 300000, pending: 70000 }]} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                      <CartesianGrid stroke="#eef2f7" />
                      <XAxis dataKey="week" tick={{ fill: '#64748b' }} />
                      <YAxis tickFormatter={(val) => `₹${Number(val).toLocaleString()}`} />
                      <Tooltip formatter={(value: any) => `₹${Number(value).toLocaleString()}`} />
                      <Legend />
                      <Bar dataKey="cleared" stackId="a" fill="#48bb78" />
                      <Bar dataKey="pending" stackId="a" fill="#dd6b20" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
            <PieChart pending={pending} cleared={cleared} />
          </div>

          <div className="mb-5">
            <div className="bg-white p-6 rounded-lg shadow-md border border-white/10">
              <div className="flex justify-between items-center mb-4">
                <div className="text-base font-semibold text-[color:var(--color-heading)]">Transactions</div>
                <div className="text-sm text-gray-500">Showing recent 10</div>
              </div>

              <div className="overflow-auto">
                <table className="w-full table-auto border-collapse">
                  <thead>
                    <tr className="text-left border-b border-slate-100">
                      <th className="py-3">Invoice ID</th>
                      <th>Vendor</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions
                      .slice()
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .slice(0, 10)
                      .map((t) => (
                      <tr key={t.id} className="border-b border-slate-50">
                        <td className="py-3 align-top font-medium">{t.id}</td>
                        <td className="align-middle py-3">{t.vendor}</td>
                        <td className="align-middle py-3 font-medium">{t.amount}</td>
                        <td className="align-middle py-3">
                          <span className={`px-2 py-1 rounded-md font-semibold text-sm ${t.status === 'Pending' ? 'bg-amber-50 text-amber-600' : t.status === 'Released' ? 'bg-green-50 text-green-600' : 'bg-sky-50 text-sky-600'}`}>{t.status}</span>
                        </td>
                        <td className="align-middle text-sm text-gray-600">{t.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-5 rounded-lg shadow-md border border-white/10">
          <h3 className="mt-0 mb-2">Reconciliation Summary</h3>
          <div className="flex gap-3">
            <div className="flex-1">
              <div className="text-xs text-gray-500">Cleared invoices</div>
              <div className="text-xl font-bold">{cleared}</div>
            </div>
            <div className="flex-1">
              <div className="text-xs text-gray-500">Mismatched invoices</div>
              <div className="text-xl font-bold text-amber-600">2</div>
            </div>
          </div>
          <div className="mt-3 text-sm text-gray-500">Quick notes: Review mismatched invoices and update payment statuses accordingly.</div>
        </div>

        <div className="bg-white p-5 rounded-lg shadow-md border border-white/10">
          <h3 className="mt-0 mb-2">Recent activity</h3>
          <ul className="list-disc ml-5">
            <li>09/12: Released payment INV-1005 to HappyPlant Co</li>
            <li>09/11: Validation flagged mismatch on INV-1004</li>
            <li>09/08: Approved INV-1003 for SharkTank Ltd</li>
          </ul>
        </div>
      </div>
    </div>
  )
}


