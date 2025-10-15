import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { LineChart, Line, ResponsiveContainer, BarChart, Bar, Tooltip } from 'recharts'
import { Pagination } from '../../../components'

const sparkData = [
  { v: 78 }, { v: 82 }, { v: 85 }, { v: 80 }, { v: 88 }, { v: 90 }, { v: 92 }
]

// Mock vendor data
const vendorsData = [
  { id: 'greenleaf-farms', name: 'GreenLeaf Farms', fillRate: 94, sla: 90, avgInvoice: 3.5, avgTicket: 1.2 },
  { id: 'happyplant-co', name: 'HappyPlant Co', fillRate: 91, sla: 86, avgInvoice: 4.2, avgTicket: 1.6 },
  { id: 'bloomworks', name: 'BloomWorks', fillRate: 89, sla: 84, avgInvoice: 3.9, avgTicket: 2.0 },
  { id: 'eco-greens', name: 'Eco Greens', fillRate: 92, sla: 88, avgInvoice: 3.7, avgTicket: 1.4 },
  { id: 'valley-organics', name: 'Valley Organics', fillRate: 87, sla: 82, avgInvoice: 4.5, avgTicket: 2.2 },
  { id: 'sunrise-farms', name: 'Sunrise Farms', fillRate: 93, sla: 91, avgInvoice: 3.3, avgTicket: 1.1 },
  { id: 'pure-harvest', name: 'Pure Harvest', fillRate: 88, sla: 85, avgInvoice: 4.0, avgTicket: 1.8 },
  { id: 'green-earth', name: 'Green Earth Co', fillRate: 90, sla: 87, avgInvoice: 3.8, avgTicket: 1.5 },
  { id: 'natural-foods', name: 'Natural Foods Inc', fillRate: 86, sla: 83, avgInvoice: 4.3, avgTicket: 2.1 },
  { id: 'golden-harvest', name: 'Golden Harvest', fillRate: 91, sla: 89, avgInvoice: 3.6, avgTicket: 1.3 },
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
  
  // Pagination state
  const [page, setPage] = useState(1)
  const pageSize = 5
  
  const totalPages = Math.max(1, Math.ceil(vendorsData.length / pageSize))
  const startIndex = (page - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, vendorsData.length)
  const pageVendors = vendorsData.slice(startIndex, endIndex)
  
  const handleVendorClick = (vendorId: string) => {
    navigate(`/admin/vendors/${vendorId}`)
  }
  
  const getPerformanceColor = (value: number, threshold: { good: number; fair: number }) => {
    if (value >= threshold.good) return 'text-green-600'
    if (value >= threshold.fair) return 'text-yellow-600'
    return 'text-red-600'
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-[var(--color-sharktank-bg)] min-h-screen font-sans w-full overflow-x-hidden">
      
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[var(--color-heading)] mb-2 font-[var(--font-heading)]">Vendor Tracking</h1>
        <p className="text-sm sm:text-base lg:text-lg text-[var(--color-primary)] font-medium mb-6">Performance, accounts and ops insights for vendors</p>
     

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
                <Line dataKey="v" stroke="var(--color-secondary)" strokeWidth={2} dot={{ r: 3 }} />
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

      <div className="bg-transparent rounded-xl">
        <div className="mb-4">
          <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-[var(--color-heading)]">Vendor health overview</h2>
          <p className="text-sm text-gray-500 mb-4">Quick look at top vendors and their key metrics.</p>
        </div>
        
        {/* Desktop Table View */}
        <div className="hidden md:block bg-header-bg rounded-xl overflow-hidden">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr style={{ background: 'var(--color-accent)' }}>
                <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Vendor</th>
                <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Fill rate</th>
                <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>SLA</th>
                <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Avg invoice (days)</th>
                <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Avg ticket (days)</th>
              </tr>
            </thead>
            <tbody>
              {pageVendors.map((vendor) => (
                <tr 
                  key={vendor.id}
                  className="border-b border-gray-100 hover:bg-gray-50 bg-white transition-colors cursor-pointer"
                  onClick={() => handleVendorClick(vendor.id)}
                >
                  <td className="p-3 font-semibold text-secondary">{vendor.name}</td>
                  <td className={`p-3 text-sm font-semibold ${getPerformanceColor(vendor.fillRate, { good: 90, fair: 85 })}`}>
                    {vendor.fillRate}%
                  </td>
                  <td className={`p-3 text-sm font-semibold ${getPerformanceColor(vendor.sla, { good: 88, fair: 83 })}`}>
                    {vendor.sla}%
                  </td>
                  <td className="p-3 text-sm text-gray-700">{vendor.avgInvoice}</td>
                  <td className="p-3 text-sm text-gray-700">{vendor.avgTicket}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* Desktop Pagination */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={vendorsData.length}
            startIndex={startIndex}
            endIndex={endIndex}
            onPageChange={setPage}
            variant="desktop"
            itemLabel="vendors"
          />
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {pageVendors.map((vendor) => (
            <div 
              key={vendor.id}
              className="rounded-xl p-4 border border-gray-200 bg-white cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => handleVendorClick(vendor.id)}
            >
              <div className="font-semibold text-secondary text-lg mb-3">{vendor.name}</div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-gray-500 block mb-1">Fill Rate</div>
                  <div className={`font-semibold ${getPerformanceColor(vendor.fillRate, { good: 90, fair: 85 })}`}>
                    {vendor.fillRate}%
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 block mb-1">SLA</div>
                  <div className={`font-semibold ${getPerformanceColor(vendor.sla, { good: 88, fair: 83 })}`}>
                    {vendor.sla}%
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 block mb-1">Avg Invoice</div>
                  <div className="font-medium">{vendor.avgInvoice} days</div>
                </div>
                <div>
                  <div className="text-gray-500 block mb-1">Avg Ticket</div>
                  <div className="font-medium">{vendor.avgTicket} days</div>
                </div>
              </div>
            </div>
          ))}
          {/* Mobile Pagination */}
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            totalItems={vendorsData.length}
            startIndex={startIndex}
            endIndex={endIndex}
            onPageChange={setPage}
            variant="mobile"
            itemLabel="vendors"
          />
        </div>
      </div>
    </div>
  )
}