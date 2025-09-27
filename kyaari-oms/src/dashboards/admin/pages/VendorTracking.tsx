import { useState } from 'react'
import { LineChart, Line, ResponsiveContainer, BarChart, Bar, Tooltip } from 'recharts'

const sparkData = [
  { v: 78 }, { v: 82 }, { v: 85 }, { v: 80 }, { v: 88 }, { v: 90 }, { v: 92 }
]

export default function VendorTracking() {
  // mock KPIs
  const vendorPerformance = { fillRate: 92, slaCompliance: 88 }
  const accounts = { avgInvoiceDays: 3.8 }
  const ops = { avgTicketDays: 1.6 }
  const [vendorHover, setVendorHover] = useState<number | null>(null)
  const [accountsHover, setAccountsHover] = useState<number | null>(null)
  const [opsHover, setOpsHover] = useState<number | null>(null)

  return (
    <div className="p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Vendor Tracking</h1>
        <p className="text-sm text-gray-500">Performance, accounts and ops insights for vendors</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white pt-5 px-5 pb-0 rounded-xl shadow-md border border-white/20">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-3">Vendor Performance</div>
          <div className="flex justify-between items-center mb-4">
            <div className="flex-1">
              <div className="text-4xl font-bold text-[var(--color-primary)]">{vendorPerformance.fillRate}% {vendorHover !== null && <span className="text-sm text-gray-500">({vendorHover}%)</span>}</div>
              <div className="text-sm text-gray-400">Fill rate</div>
            </div>
            <div className="flex-1 text-right">
              <div className="text-2xl font-bold text-[var(--color-primary)]">{vendorPerformance.slaCompliance}%</div>
              <div className="text-sm text-gray-400">SLA compliance</div>
            </div>
          </div>
          <div className="w-full h-16 mb-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={sparkData}
                onMouseMove={(state: any) => {
                  if (state && state.activePayload && state.activePayload.length) setVendorHover(state.activePayload[0].payload.v)
                  else setVendorHover(null)
                }}
                onMouseLeave={() => setVendorHover(null)}
              >
                <Tooltip formatter={(value: any) => `${value}%`} />
                <Line dataKey="v" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white pt-5 px-5 pb-0 rounded-xl shadow-md border border-white/20">
          <div className="text-xs font-semibold text-gray-500 uppercase">Accounts</div>
          <div className="text-3xl font-bold text-[var(--color-primary)]">{accounts.avgInvoiceDays}d {accountsHover !== null && <span className="text-sm text-gray-500">({accountsHover}d)</span>}</div>
          <div className="text-sm text-gray-400">Avg invoice processing time</div>
          <div className="mt-4 h-20">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={[{ v: 4 }, { v: 3 }, { v: 5 }, { v: 3 }, { v: 4 }]}
                margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
                onMouseMove={(state: any) => {
                  if (state && state.activePayload && state.activePayload.length) setAccountsHover(state.activePayload[0].payload.v)
                  else setAccountsHover(null)
                }}
                onMouseLeave={() => setAccountsHover(null)}
              >
                <Tooltip formatter={(value: any) => `${value}d`} />
                <Bar dataKey="v" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white pt-5 px-5 pb-0 rounded-xl shadow-md border border-white/20">
          <div className="text-xs font-semibold text-gray-500 uppercase">Operations</div>
          <div className="text-3xl font-bold text-[var(--color-primary)]">{ops.avgTicketDays}d {opsHover !== null && <span className="text-sm text-gray-500">({opsHover}d)</span>}</div>
          <div className="text-sm text-gray-400">Avg ticket resolution time</div>
          <div className="mt-4 h-20 p-2 md:h-24 lg:h-28 md:p-3">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={[{ v: 2 }, { v: 1 }, { v: 2 }, { v: 1 }, { v: 1.5 }]}
                margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
                onMouseMove={(state: any) => {
                  if (state && state.activePayload && state.activePayload.length) setOpsHover(state.activePayload[0].payload.v)
                  else setOpsHover(null)
                }}
                onMouseLeave={() => setOpsHover(null)}
              >
                <Tooltip formatter={(value: any) => `${value}d`} />
                <Line dataKey="v" stroke="#f97316" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-md border border-white/20">
        <h2 className="text-lg font-semibold mb-3">Vendor health overview</h2>
        <p className="text-sm text-gray-500 mb-4">Quick look at top vendors and their key metrics.</p>
        <div className="overflow-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="py-3">Vendor</th>
                <th>Fill rate</th>
                <th>SLA</th>
                <th>Avg invoice (days)</th>
                <th>Avg ticket (days)</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b">
                <td className="py-3 font-medium">GreenLeaf Farms</td>
                <td>94%</td>
                <td>90%</td>
                <td>3.5</td>
                <td>1.2</td>
              </tr>
              <tr className="border-b">
                <td className="py-3 font-medium">HappyPlant Co</td>
                <td>91%</td>
                <td>86%</td>
                <td>4.2</td>
                <td>1.6</td>
              </tr>
              <tr>
                <td className="py-3 font-medium">BloomWorks</td>
                <td>89%</td>
                <td>84%</td>
                <td>3.9</td>
                <td>2.0</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}