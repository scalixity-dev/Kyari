import { useState, useMemo, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { BarChart3, Users, Package, Filter } from 'lucide-react'
import { Pagination, KPICard, CSVPDFExportButton } from '../../../components'
import { vendorTrackingApi, type VendorTrackingDashboardResponse } from '../../../services/vendorTrackingApi'

interface FilterState {
  vendor: string;
  fillRateMin: string;
  fillRateMax: string;
  slaMin: string;
  slaMax: string;
}

// Use the imported types from the API service
type DashboardData = VendorTrackingDashboardResponse;

export default function VendorTracking() {
  const navigate = useNavigate()
  
  // State management
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
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
  
  // Fetch dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        const data = await vendorTrackingApi.getVendorTrackingDashboard()
        setDashboardData(data)
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch vendor data'
        setError(`API Error: ${errorMessage}. Please check if the backend server is running.`)
        console.error('Error fetching vendor data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])
  // Loading state for vendor table (shows Orders-style loading UI)
  const [isLoadingVendors, setIsLoadingVendors] = useState(false)
  
  // Filter logic
  const filteredVendors = useMemo(() => {
    if (!dashboardData?.vendors) return []
    
    return dashboardData.vendors.filter(vendor => {
      if (filters.vendor && !vendor.vendor.companyName.toLowerCase().includes(filters.vendor.toLowerCase())) return false
      if (filters.fillRateMin && vendor.metrics.fillRate < parseInt(filters.fillRateMin)) return false
      if (filters.fillRateMax && vendor.metrics.fillRate > parseInt(filters.fillRateMax)) return false
      if (filters.slaMin && vendor.metrics.slaCompliance < parseInt(filters.slaMin)) return false
      if (filters.slaMax && vendor.metrics.slaCompliance > parseInt(filters.slaMax)) return false
      return true
    })
  }, [dashboardData, filters])
  
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
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'text-green-600 bg-green-50'
      case 'INACTIVE': return 'text-yellow-600 bg-yellow-50'
      case 'NO_ORDERS': return 'text-gray-600 bg-gray-50'
      default: return 'text-gray-600 bg-gray-50'
    }
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
    const headers = ['Vendor', 'Fill Rate (%)', 'SLA (%)', 'Total Orders', 'Active Orders', 'Avg Fulfillment (days)', 'Status']
    const csvContent = [
      headers.join(','),
      ...filteredVendors.map(vendor => [
        `"${vendor.vendor.companyName}"`,
        vendor.metrics.fillRate,
        vendor.metrics.slaCompliance,
        vendor.metrics.totalOrders,
        vendor.metrics.activeOrders,
        vendor.metrics.avgFulfillmentTime,
        vendor.status
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
      `${vendor.vendor.companyName} | Fill Rate: ${vendor.metrics.fillRate}% | SLA: ${vendor.metrics.slaCompliance}% | Orders: ${vendor.metrics.totalOrders} | Active: ${vendor.metrics.activeOrders} | Avg Fulfillment: ${vendor.metrics.avgFulfillmentTime}d`
    ).join('\n')
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vendors-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 bg-[var(--color-sharktank-bg)] min-h-screen font-sans w-full overflow-x-hidden flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-accent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading vendor data...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 bg-[var(--color-sharktank-bg)] min-h-screen font-sans w-full overflow-x-hidden flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-accent text-white rounded-md hover:bg-accent/90"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-[var(--color-sharktank-bg)] min-h-screen font-sans w-full overflow-x-hidden">
      {/* Page Header */}
      <div className="mb-6 sm:mb-10">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-heading mb-2">Vendor Tracking</h1>
        <p className="text-sm sm:text-base text-gray-600">Monitor vendor performance and health metrics</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-4 sm:mb-6">
        <KPICard
          title="Total Vendors"
          value={dashboardData?.summary.totalVendors || 0}
          subtitle="Active vendors in system"
          icon={<Users size={32} />}
        />
        <KPICard
          title="Avg Fill Rate"
          value={`${dashboardData?.summary.averageFillRate || 0}%`}
          subtitle="Overall vendor performance"
          icon={<BarChart3 size={32} />}
        />
        <KPICard
          title="Avg SLA Compliance"
          value={`${dashboardData?.summary.averageSlaCompliance || 0}%`}
          subtitle="Service level agreement"
          icon={<BarChart3 size={32} />}
        />
        <KPICard
          title="Active Orders"
          value={dashboardData?.summary.totalActiveOrders || 0}
          subtitle={`${dashboardData?.summary.totalCompletedOrders || 0} completed`}
          icon={<Package size={32} />}
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
                <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Fill Rate</th>
                <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>SLA</th>
                <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Orders</th>
                <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Avg Fulfillment</th>
                <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {pageVendors.map((vendor) => (
                <tr 
                  key={vendor.vendorId}
                  className="border-b border-gray-100 hover:bg-gray-50 bg-white transition-colors cursor-pointer"
                  onClick={() => handleVendorClick(vendor.vendorId)}
                >
                  <td className="p-3 font-semibold text-secondary">{vendor.vendor.companyName}</td>
                  <td className={`p-3 text-sm font-semibold ${getPerformanceColor(vendor.metrics.fillRate, { good: 90, fair: 85 })}`}>
                    {vendor.metrics.fillRate}%
                  </td>
                  <td className={`p-3 text-sm font-semibold ${getPerformanceColor(vendor.metrics.slaCompliance, { good: 88, fair: 83 })}`}>
                    {vendor.metrics.slaCompliance}%
                  </td>
                  <td className="p-3 text-sm text-gray-700">
                    <div className="flex flex-col">
                      <span className="font-medium">{vendor.metrics.totalOrders}</span>
                      <span className="text-xs text-gray-500">{vendor.metrics.activeOrders} active</span>
                    </div>
                  </td>
                  <td className="p-3 text-sm text-gray-700">{vendor.metrics.avgFulfillmentTime}d</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vendor.status)}`}>
                      {vendor.status}
                    </span>
                  </td>
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
              key={vendor.vendorId}
              className="rounded-xl p-4 border border-gray-200 bg-white cursor-pointer hover:bg-gray-50 transition-colors"
              onClick={() => handleVendorClick(vendor.vendorId)}
            >
              <div className="flex justify-between items-start mb-3">
                <div className="font-semibold text-secondary text-lg">{vendor.vendor.companyName}</div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(vendor.status)}`}>
                  {vendor.status}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <div className="text-gray-500 block mb-1">Fill Rate</div>
                  <div className={`font-semibold ${getPerformanceColor(vendor.metrics.fillRate, { good: 90, fair: 85 })}`}>
                    {vendor.metrics.fillRate}%
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 block mb-1">SLA</div>
                  <div className={`font-semibold ${getPerformanceColor(vendor.metrics.slaCompliance, { good: 88, fair: 83 })}`}>
                    {vendor.metrics.slaCompliance}%
                  </div>
                </div>
                <div>
                  <div className="text-gray-500 block mb-1">Total Orders</div>
                  <div className="font-medium">{vendor.metrics.totalOrders}</div>
                </div>
                <div>
                  <div className="text-gray-500 block mb-1">Avg Fulfillment</div>
                  <div className="font-medium">{vendor.metrics.avgFulfillmentTime}d</div>
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