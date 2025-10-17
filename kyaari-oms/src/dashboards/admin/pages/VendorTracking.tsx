import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, FileText, Clock, Filter } from 'lucide-react'
import { Pagination, KPICard, CSVPDFExportButton } from '../../../components'

interface FilterState {
  vendor: string;
  fillRateMin: string;
  fillRateMax: string;
  slaMin: string;
  slaMax: string;
}

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
  
  // Pagination state
  const [page, setPage] = useState(1)
  const pageSize = 10
  
  // Filter state
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<FilterState>({
    vendor: '',
    fillRateMin: '',
    fillRateMax: '',
    slaMin: '',
    slaMax: ''
  })
  
  // Filter logic
  const filteredVendors = useMemo(() => {
    return vendorsData.filter(vendor => {
      if (filters.vendor && !vendor.name.toLowerCase().includes(filters.vendor.toLowerCase())) return false
      if (filters.fillRateMin && vendor.fillRate < parseInt(filters.fillRateMin)) return false
      if (filters.fillRateMax && vendor.fillRate > parseInt(filters.fillRateMax)) return false
      if (filters.slaMin && vendor.sla < parseInt(filters.slaMin)) return false
      if (filters.slaMax && vendor.sla > parseInt(filters.slaMax)) return false
      return true
    })
  }, [filters])
  
  const totalPages = Math.max(1, Math.ceil(filteredVendors.length / pageSize))
  const startIndex = (page - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, filteredVendors.length)
  const pageVendors = filteredVendors.slice(startIndex, endIndex)
  
  const handleVendorClick = (vendorId: string) => {
    navigate(`/admin/vendors/${vendorId}`)
  }
  
  const getPerformanceColor = (value: number, threshold: { good: number; fair: number }) => {
    if (value >= threshold.good) return 'text-green-600'
    if (value >= threshold.fair) return 'text-yellow-600'
    return 'text-red-600'
  }
  
  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPage(1) // Reset to first page when filter changes
  }
  
  const handleResetFilters = () => {
    setFilters({
      vendor: '',
      fillRateMin: '',
      fillRateMax: '',
      slaMin: '',
      slaMax: ''
    })
    setPage(1)
  }
  
  const handleExportCSV = () => {
    const headers = ['Vendor', 'Fill Rate (%)', 'SLA (%)', 'Avg Invoice (days)', 'Avg Ticket (days)']
    const csvContent = [
      headers.join(','),
      ...filteredVendors.map(vendor => [
        `"${vendor.name}"`,
        vendor.fillRate,
        vendor.sla,
        vendor.avgInvoice,
        vendor.avgTicket
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vendors-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleExportPDF = () => {
    const content = filteredVendors.map(vendor => 
      `${vendor.name} | Fill Rate: ${vendor.fillRate}% | SLA: ${vendor.sla}% | Avg Invoice: ${vendor.avgInvoice}d | Avg Ticket: ${vendor.avgTicket}d`
    ).join('\n')
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vendors-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-[var(--color-sharktank-bg)] min-h-screen font-sans w-full overflow-x-hidden">
      {/* Page Header */}
      <div className="mb-6 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-heading mb-2">Vendor Tracking</h1>
        <p className="text-sm sm:text-base text-gray-600">Monitor vendor performance and health metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <KPICard
          title="Vendor Performance"
          value={`${vendorPerformance.fillRate}%`}
          subtitle={`Fill rate • SLA: ${vendorPerformance.slaCompliance}%`}
          icon={<BarChart3 size={32} />}
        />
        <KPICard
          title="Accounts"
          value={`${accounts.avgInvoiceDays}d`}
          subtitle="Avg invoice processing time"
          icon={<FileText size={32} />}
        />
        <KPICard
          title="Operations"
          value={`${ops.avgTicketDays}d`}
          subtitle="Avg ticket resolution time"
          icon={<Clock size={32} />}
        />
      </div>

      <div className="bg-transparent rounded-xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-3 text-[var(--color-heading)]">Vendor health overview</h2>
            <p className="text-sm text-gray-500">Quick look at top vendors and their key metrics.</p>
          </div>
          
          {/* Filter and Export Buttons */}
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2 bg-white border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors min-h-[44px] sm:min-h-auto w-full sm:w-auto"
            >
              <Filter size={16} className="flex-shrink-0" />
              <span className="text-sm">Filter</span>
            </button>
            <CSVPDFExportButton
              onExportCSV={handleExportCSV}
              onExportPDF={handleExportPDF}
            />
          </div>
        </div>
        
        {/* Filter Section */}
        {showFilters && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Vendor Name</label>
                <input
                  type="text"
                  value={filters.vendor}
                  onChange={(e) => handleFilterChange('vendor', e.target.value)}
                  placeholder="Search vendor..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200 min-h-[44px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Fill Rate Range (%)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={filters.fillRateMin}
                    onChange={(e) => handleFilterChange('fillRateMin', e.target.value)}
                    placeholder="Min"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200 min-h-[44px]"
                  />
                  <input
                    type="number"
                    value={filters.fillRateMax}
                    onChange={(e) => handleFilterChange('fillRateMax', e.target.value)}
                    placeholder="Max"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200 min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">SLA Range (%)</label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={filters.slaMin}
                    onChange={(e) => handleFilterChange('slaMin', e.target.value)}
                    placeholder="Min"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200 min-h-[44px]"
                  />
                  <input
                    type="number"
                    value={filters.slaMax}
                    onChange={(e) => handleFilterChange('slaMax', e.target.value)}
                    placeholder="Max"
                    min="0"
                    max="100"
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200 min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Actions</label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <button
                    onClick={handleResetFilters}
                    className="px-4 py-2 border border-secondary rounded-md text-secondary font-medium hover:bg-gray-50 text-sm min-h-[44px]"
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
        
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
            totalItems={filteredVendors.length}
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
            totalItems={filteredVendors.length}
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