import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LineChart, Line, ResponsiveContainer, BarChart, Bar, Tooltip } from 'recharts'

const sparkData = [
  { v: 78 }, { v: 82 }, { v: 85 }, { v: 80 }, { v: 88 }, { v: 90 }, { v: 92 }
]

export default function VendorTracking() {
  const navigate = useNavigate()
  
  // mock KPIs
  const vendorPerformance = { fillRate: 92, slaCompliance: 88 }
  const accounts = { avgInvoiceDays: 3.8 }
  const ops = { avgTicketDays: 1.6 }
  const [vendorHover, setVendorHover] = useState<number | null>(null)
  const [accountsHover, setAccountsHover] = useState<number | null>(null)
  const [opsHover, setOpsHover] = useState<number | null>(null)
  
  const handleVendorClick = (vendorId: string) => {
    navigate(`/admin/vendors/${vendorId}`)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-[var(--color-happyplant-bg)] min-h-screen font-sans w-full overflow-x-hidden">
      <div className="bg-[var(--color-header-bg)] p-4 sm:p-6 lg:p-8 rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.06)] mb-4 sm:mb-6 border border-[rgba(0,0,0,0.03)]">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--color-heading)] mb-2 font-[var(--font-heading)]">Vendor Tracking</h1>
        <p className="text-sm sm:text-base lg:text-lg text-[var(--color-primary)] font-medium">Performance, accounts and ops insights for vendors</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <div className="bg-white p-4 sm:p-5 rounded-xl shadow-md border border-white/20">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-3">Vendor Performance</div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3 sm:gap-0">
            <div className="flex-1">
              <div className="text-3xl sm:text-4xl font-bold text-[var(--color-primary)]">{vendorPerformance.fillRate}% {vendorHover !== null && <span className="text-sm text-gray-500">({vendorHover}%)</span>}</div>
              <div className="text-sm text-gray-400">Fill rate</div>
            </div>
            <div className="flex-1 text-left sm:text-right">
              <div className="text-xl sm:text-2xl font-bold text-[var(--color-primary)]">{vendorPerformance.slaCompliance}%</div>
              <div className="text-sm text-gray-400">SLA compliance</div>
            </div>
          </div>
          <div className="w-full h-12 sm:h-16 mb-2">
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
                <Line dataKey="v" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-5 rounded-xl shadow-md border border-white/20">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-3">Accounts</div>
          <div className="text-2xl sm:text-3xl font-bold text-[var(--color-primary)] mb-1">{accounts.avgInvoiceDays}d {accountsHover !== null && <span className="text-sm text-gray-500">({accountsHover}d)</span>}</div>
          <div className="text-sm text-gray-400 mb-4">Avg invoice processing time</div>
          <div className="h-16 sm:h-20">
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

        <div className="bg-white p-4 sm:p-5 rounded-xl shadow-md border border-white/20">
          <div className="text-xs font-semibold text-gray-500 uppercase mb-3">Operations</div>
          <div className="text-2xl sm:text-3xl font-bold text-[var(--color-primary)] mb-1">{ops.avgTicketDays}d {opsHover !== null && <span className="text-sm text-gray-500">({opsHover}d)</span>}</div>
          <div className="text-sm text-gray-400 mb-4">Avg ticket resolution time</div>
          <div className="h-16 sm:h-20">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={[{ v: 2 }, { v: 1 }, { v: 2 }, { v: 1 }, { v: 1.5 }]}
                margin={{ top: 4, right: 4, left: 4, bottom: 4 }}
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

      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-white/20">
        <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-[var(--color-heading)]">Vendor health overview</h2>
        <p className="text-sm text-gray-500 mb-4">Quick look at top vendors and their key metrics.</p>
        
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-auto">
          <table className="w-full table-auto">
            <thead>
              <tr className="text-left text-sm text-gray-500 border-b">
                <th className="py-3 font-semibold">Vendor</th>
                <th className="font-semibold">Fill rate</th>
                <th className="font-semibold">SLA</th>
                <th className="font-semibold">Avg invoice (days)</th>
                <th className="font-semibold">Avg ticket (days)</th>
              </tr>
            </thead>
            <tbody>
              <tr 
                className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleVendorClick('greenleaf-farms')}
              >
                <td className="py-3 font-medium text-[var(--color-heading)]">GreenLeaf Farms</td>
                <td className="text-green-600 font-semibold">94%</td>
                <td className="text-green-600 font-semibold">90%</td>
                <td>3.5</td>
                <td>1.2</td>
              </tr>
              <tr 
                className="border-b hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleVendorClick('happyplant-co')}
              >
                <td className="py-3 font-medium text-[var(--color-heading)]">HappyPlant Co</td>
                <td className="text-green-600 font-semibold">91%</td>
                <td className="text-yellow-600 font-semibold">86%</td>
                <td>4.2</td>
                <td>1.6</td>
              </tr>
              <tr 
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => handleVendorClick('bloomworks')}
              >
                <td className="py-3 font-medium text-[var(--color-heading)]">BloomWorks</td>
                <td className="text-yellow-600 font-semibold">89%</td>
                <td className="text-yellow-600 font-semibold">84%</td>
                <td>3.9</td>
                <td>2.0</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          <div 
            className="border border-gray-200 rounded-lg p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors active:bg-gray-200"
            onClick={() => handleVendorClick('greenleaf-farms')}
          >
            <div className="font-semibold text-[var(--color-heading)] text-base mb-3">GreenLeaf Farms</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-500 mb-1">Fill Rate</div>
                <div className="text-green-600 font-semibold">94%</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">SLA</div>
                <div className="text-green-600 font-semibold">90%</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Avg Invoice</div>
                <div className="font-medium">3.5 days</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Avg Ticket</div>
                <div className="font-medium">1.2 days</div>
              </div>
            </div>
          </div>
          
          <div 
            className="border border-gray-200 rounded-lg p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors active:bg-gray-200"
            onClick={() => handleVendorClick('happyplant-co')}
          >
            <div className="font-semibold text-[var(--color-heading)] text-base mb-3">HappyPlant Co</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-500 mb-1">Fill Rate</div>
                <div className="text-green-600 font-semibold">91%</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">SLA</div>
                <div className="text-yellow-600 font-semibold">86%</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Avg Invoice</div>
                <div className="font-medium">4.2 days</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Avg Ticket</div>
                <div className="font-medium">1.6 days</div>
              </div>
            </div>
          </div>
          
          <div 
            className="border border-gray-200 rounded-lg p-4 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors active:bg-gray-200"
            onClick={() => handleVendorClick('bloomworks')}
          >
            <div className="font-semibold text-[var(--color-heading)] text-base mb-3">BloomWorks</div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs text-gray-500 mb-1">Fill Rate</div>
                <div className="text-yellow-600 font-semibold">89%</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">SLA</div>
                <div className="text-yellow-600 font-semibold">84%</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Avg Invoice</div>
                <div className="font-medium">3.9 days</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Avg Ticket</div>
                <div className="font-medium">2.0 days</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}