import React from 'react'

function KPI({ title, value, subtitle }: { title: string; value: string | number; subtitle?: string }) {
  return (
    <div className="bg-white p-5 rounded-lg shadow-md border border-white/10 flex flex-col gap-2">
      <div className="text-xs font-semibold text-[color:var(--color-primary)] uppercase">{title}</div>
      <div className="text-2xl font-bold text-[color:var(--color-heading)]">{value}</div>
      {subtitle && <div className="text-xs text-gray-500">{subtitle}</div>}
    </div>
  )
}

function LineChart({ data }: { data: number[] }) {
  // Interactive SVG line chart with axes, ticks, points and hover tooltip
  const width = 560
  const height = 220
  const padding = { top: 12, right: 20, bottom: 30, left: 50 }
  const innerW = width - padding.left - padding.right
  const innerH = height - padding.top - padding.bottom
  const max = Math.max(...data)
  const min = Math.min(...data)

  const x = (i: number) => (i / (data.length - 1)) * innerW + padding.left
  const y = (v: number) => padding.top + (1 - (v - min) / (max - min || 1)) * innerH

  const linePath = data.map((d, i) => `${i === 0 ? 'M' : 'L'} ${x(i)} ${y(d)}`).join(' ')

  // ticks
  const xTicks = data.map((_, i) => ({ x: x(i), label: new Date(2025, i, 1).toLocaleString('en-US', { month: 'short' }) }))
  const yTicks = 4
  const yTickValues = Array.from({ length: yTicks + 1 }).map((_, idx) => Math.round(min + (idx / yTicks) * (max - min)))

  const [hover, setHover] = React.useState<{ x: number; y: number; value: number; label: string } | null>(null)

  return (
    <div className="bg-white p-5 rounded-lg shadow-md border border-white/10">
      <div className="text-base font-semibold text-[color:var(--color-heading)] mb-3">Monthly payout trend</div>
      <svg width={width} height={height}>
        {/* y grid & labels */}
        {yTickValues.map((v, idx) => {
          const yy = y(v)
          return (
            <g key={idx}>
              <line x1={padding.left} x2={width - padding.right} y1={yy} y2={yy} stroke="#eef2f7" />
              <text x={padding.left - 10} y={yy + 4} textAnchor="end" fontSize={11} fill="#64748b">{`₹${v.toLocaleString()}`}</text>
            </g>
          )
        })}

        {/* x axis ticks */}
        {xTicks.map((t, idx) => (
          <g key={idx}>
            <line x1={t.x} x2={t.x} y1={height - padding.bottom} y2={height - padding.bottom + 6} stroke="#e2e8f0" />
            <text x={t.x} y={height - padding.bottom + 20} textAnchor="middle" fontSize={11} fill="#64748b">{t.label}</text>
          </g>
        ))}

        {/* axes */}
        <line x1={padding.left} x2={padding.left} y1={padding.top} y2={height - padding.bottom} stroke="#cbd5e1" />
        <line x1={padding.left} x2={width - padding.right} y1={height - padding.bottom} y2={height - padding.bottom} stroke="#cbd5e1" />

        {/* area beneath line (subtle) */}
        <path d={`${linePath} L ${width - padding.right} ${height - padding.bottom} L ${padding.left} ${height - padding.bottom} Z`} fill="#e6f4ff" opacity={0.6} />

        {/* the line */}
        <path d={linePath} fill="none" stroke="#2563eb" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round" />

        {/* points */}
        {data.map((d, i) => {
          const cx = x(i)
          const cy = y(d)
          return (
            <g key={i}>
              <circle cx={cx} cy={cy} r={5} fill="#fff" stroke="#2563eb" strokeWidth={2}
                onMouseEnter={() => setHover({ x: cx, y: cy, value: d, label: xTicks[i].label })}
                onMouseLeave={() => setHover(null)}
              />
            </g>
          )
        })}

        {/* tooltip */}
        {hover && (
          <g>
            <rect x={hover.x + 8} y={hover.y - 30} rx={6} ry={6} width={110} height={28} fill="#0f172a" opacity={0.95} />
            <text x={hover.x + 12} y={hover.y - 12} fill="#fff" fontSize={12}>{hover.label}</text>
            <text x={hover.x + 12} y={hover.y + 4} fill="#fff" fontSize={13} fontWeight={700}>{`₹${hover.value.toLocaleString()}`}</text>
          </g>
        )}
      </svg>
    </div>
  )
}

function PieChart({ pending, cleared }: { pending: number; cleared: number }) {
  const total = pending + cleared || 1
  const pendingAngle = (pending / total) * 360

  return (
    <div className="bg-white p-5 rounded-lg shadow-md border border-white/10 flex gap-4 items-center">
      <div className="w-44 text-center">
        <div className="w-36 h-36 rounded-full mx-auto" style={{ background: `conic-gradient(#dd6b20 0deg ${pendingAngle}deg, #48bb78 ${pendingAngle}deg 360deg)` }} />
        <div className="mt-3 font-semibold">Pending vs Cleared</div>
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="w-3 h-3 rounded-sm" style={{ background: '#dd6b20' }} />
          <div>Pending</div>
          <div className="ml-auto font-semibold">{pending}</div>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-3 rounded-sm" style={{ background: '#48bb78' }} />
          <div>Cleared</div>
          <div className="ml-auto font-semibold">{cleared}</div>
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

      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4 mb-5">
        <div className="bg-white p-6 rounded-lg shadow-md border border-white/10 flex flex-col h-full">
          <div className="flex justify-between items-center mb-4">
            <div className="text-base font-semibold text-[color:var(--color-heading)]">Transactions</div>
            <div className="text-sm text-gray-500">Showing recent 10</div>
          </div>

          <div className="flex-1 overflow-auto">
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
                    <td className="align-top">{t.vendor}</td>
                    <td className="align-top font-medium">{t.amount}</td>
                    <td className="align-top">
                      <span className={`px-2 py-1 rounded-md font-semibold text-sm ${t.status === 'Pending' ? 'bg-amber-50 text-amber-600' : t.status === 'Released' ? 'bg-green-50 text-green-600' : 'bg-sky-50 text-sky-600'}`}>{t.status}</span>
                    </td>
                    <td className="align-top text-sm text-gray-600">{t.date}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex flex-col gap-4 h-full">
          <LineChart data={monthly} />
          <PieChart pending={pending} cleared={cleared} />
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


