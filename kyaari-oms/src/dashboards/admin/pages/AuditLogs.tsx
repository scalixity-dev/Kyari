import { useState, useMemo } from 'react'
import { FileText } from 'lucide-react'
import { CustomDropdown } from '../../../components'

interface AuditLog {
  id: string
  timestamp: string
  user: string
  userEmail: string
  role: 'Admin' | 'Vendor' | 'Accounts' | 'Ops' | 'Store Operator'
  action: string
  module: 'Orders' | 'Vendors' | 'Payments' | 'Tickets' | 'Users' | 'Analytics'
}

// Mock data for demonstration
const mockAuditLogs: AuditLog[] = [
  {
    id: '1',
    timestamp: '2024-01-15T10:30:00Z',
    user: 'John Smith',
    userEmail: 'john@kyari.com',
    role: 'Admin',
    action: 'Assigned Order #12345 to Vendor A',
    module: 'Orders'
  },
  {
    id: '2',
    timestamp: '2024-01-15T10:25:00Z',
    user: 'Sarah Johnson',
    userEmail: 'sarah@kyari.com',
    role: 'Vendor',
    action: 'Updated delivery status for Order #12340',
    module: 'Orders'
  },
  {
    id: '3',
    timestamp: '2024-01-15T10:20:00Z',
    user: 'Mike Chen',
    userEmail: 'mike@kyari.com',
    role: 'Accounts',
    action: 'Processed payment for Order #12335',
    module: 'Payments'
  },
  {
    id: '4',
    timestamp: '2024-01-15T10:15:00Z',
    user: 'Lisa Wang',
    userEmail: 'lisa@kyari.com',
    role: 'Ops',
    action: 'Created new vendor profile for ABC Logistics',
    module: 'Vendors'
  },
  {
    id: '5',
    timestamp: '2024-01-15T10:10:00Z',
    user: 'David Brown',
    userEmail: 'david@kyari.com',
    role: 'Store Operator',
    action: 'Resolved ticket #TKT-001 regarding delivery delay',
    module: 'Tickets'
  },
  {
    id: '6',
    timestamp: '2024-01-15T10:05:00Z',
    user: 'Emma Davis',
    userEmail: 'emma@kyari.com',
    role: 'Admin',
    action: 'Updated user permissions for Store Operator role',
    module: 'Users'
  },
  {
    id: '7',
    timestamp: '2024-01-15T10:00:00Z',
    user: 'Alex Rodriguez',
    userEmail: 'alex@kyari.com',
    role: 'Vendor',
    action: 'Accepted Order #12330 for pickup',
    module: 'Orders'
  },
  {
    id: '8',
    timestamp: '2024-01-15T09:55:00Z',
    user: 'Maria Garcia',
    userEmail: 'maria@kyari.com',
    role: 'Accounts',
    action: 'Generated monthly financial report',
    module: 'Analytics'
  },
  {
    id: '9',
    timestamp: '2024-01-15T09:50:00Z',
    user: 'Tom Wilson',
    userEmail: 'tom@kyari.com',
    role: 'Ops',
    action: 'Updated vendor rating for XYZ Transport',
    module: 'Vendors'
  },
  {
    id: '10',
    timestamp: '2024-01-15T09:45:00Z',
    user: 'Jennifer Lee',
    userEmail: 'jennifer@kyari.com',
    role: 'Store Operator',
    action: 'Created support ticket for customer complaint',
    module: 'Tickets'
  },
  {
    id: '11',
    timestamp: '2024-01-15T09:40:00Z',
    user: 'Robert Taylor',
    userEmail: 'robert@kyari.com',
    role: 'Admin',
    action: 'Exported order data for external analysis',
    module: 'Analytics'
  },
  {
    id: '12',
    timestamp: '2024-01-15T09:35:00Z',
    user: 'Amanda White',
    userEmail: 'amanda@kyari.com',
    role: 'Vendor',
    action: 'Updated delivery route for Order #12325',
    module: 'Orders'
  }
]

export default function AuditLogs() {
  const [filters, setFilters] = useState({
    user: '',
    role: '',
    module: '',
    dateFrom: '',
    dateTo: ''
  })
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [sortBy] = useState<'timestamp'>('timestamp')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')

  // Filter and sort data
  const filteredAndSortedLogs = useMemo(() => {
    const filtered = mockAuditLogs.filter(log => {
      const matchesUser = !filters.user || 
        log.user.toLowerCase().includes(filters.user.toLowerCase()) ||
        log.userEmail.toLowerCase().includes(filters.user.toLowerCase())
      const matchesRole = !filters.role || log.role === filters.role
      const matchesModule = !filters.module || log.module === filters.module
      const matchesDateFrom = !filters.dateFrom || new Date(log.timestamp) >= new Date(filters.dateFrom)
      const matchesDateTo = !filters.dateTo || new Date(log.timestamp) <= new Date(filters.dateTo)
      
      return matchesUser && matchesRole && matchesModule && matchesDateFrom && matchesDateTo
    })

    // Sort data
    filtered.sort((a, b) => {
      const aValue = new Date(a[sortBy]).getTime()
      const bValue = new Date(b[sortBy]).getTime()
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
    })

    return filtered
  }, [filters, sortBy, sortOrder])

  // Pagination
  const totalPages = Math.ceil(filteredAndSortedLogs.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedLogs = filteredAndSortedLogs.slice(startIndex, startIndex + itemsPerPage)

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setCurrentPage(1) // Reset to first page when filtering
  }

  const handleResetFilters = () => {
    setFilters({
      user: '',
      role: '',
      module: '',
      dateFrom: '',
      dateTo: ''
    })
    setCurrentPage(1)
  }

  const handleSort = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc')
  }

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp)
    return date.toLocaleDateString('en-GB', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    })
  }

  const handleExportCSV = () => {
    const headers = ['Timestamp', 'User', 'Role', 'Action', 'Module']
    const csvContent = [
      headers.join(','),
      ...filteredAndSortedLogs.map(log => [
        formatTimestamp(log.timestamp),
        `"${log.user} (${log.userEmail})"`,
        log.role,
        `"${log.action}"`,
        log.module
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleExportPDF = () => {
    // For now, we'll create a simple text-based PDF export
    // In a real implementation, you'd use a library like jsPDF
    const content = filteredAndSortedLogs.map(log => 
      `${formatTimestamp(log.timestamp)} | ${log.user} (${log.role}) | ${log.action} | ${log.module}`
    ).join('\n')
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen overflow-x-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2" style={{ fontFamily: 'var(--font-heading)', color: '#1D4D43' }}>
          Audit Logs
        </h1>
        <p className="text-sm sm:text-base text-gray-600">
          System activity trail – all actions are recorded for compliance.
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6 sm:mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4 sm:mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">User</label>
            <input
              type="text"
              value={filters.user}
              onChange={(e) => handleFilterChange('user', e.target.value)}
              placeholder="Search by name or email"
              className="w-full px-3 py-3 text-sm border border-gray-300 rounded-md hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200 min-h-[44px] sm:min-h-auto"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
            <CustomDropdown
              value={filters.role}
              onChange={(value) => handleFilterChange('role', value)}
              options={[
                { value: '', label: 'All Roles' },
                { value: 'Admin', label: 'Admin' },
                { value: 'Vendor', label: 'Vendor' },
                { value: 'Accounts', label: 'Accounts' },
                { value: 'Ops', label: 'Ops' },
                { value: 'Store Operator', label: 'Store Operator' }
              ]}
              placeholder="All Roles"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Module</label>
            <CustomDropdown
              value={filters.module}
              onChange={(value) => handleFilterChange('module', value)}
              options={[
                { value: '', label: 'All Modules' },
                { value: 'Orders', label: 'Orders' },
                { value: 'Vendors', label: 'Vendors' },
                { value: 'Payments', label: 'Payments' },
                { value: 'Tickets', label: 'Tickets' },
                { value: 'Users', label: 'Users' },
                { value: 'Analytics', label: 'Analytics' }
              ]}
              placeholder="All Modules"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <div className="flex flex-col gap-2">
              <input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
                className="w-full px-3 py-3 text-sm border border-gray-300 rounded-md hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200 min-h-[44px] sm:min-h-auto"
                placeholder="From date"
              />
              <input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
                className="w-full px-3 py-3 text-sm border border-gray-300 rounded-md hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200 min-h-[44px] sm:min-h-auto"
                placeholder="To date"
              />
            </div>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setCurrentPage(1)}
            className="w-full sm:w-auto px-4 py-3 sm:py-2 rounded-md text-white font-medium text-sm min-h-[44px] sm:min-h-auto"
            style={{ backgroundColor: '#C3754C', color: '#F5F3E7' }}
          >
            Apply Filters
          </button>
          <button
            onClick={handleResetFilters}
            className="w-full sm:w-auto px-4 py-3 sm:py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 text-sm min-h-[44px] sm:min-h-auto"
            style={{ borderColor: '#1D4D43', color: '#1D4D43' }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        {/* Export Controls */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full lg:w-auto">
            <span className="text-sm text-gray-600">
              Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAndSortedLogs.length)} of {filteredAndSortedLogs.length} logs
            </span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value))
                setCurrentPage(1)
              }}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm min-h-[44px] sm:min-h-auto"
            >
              <option value={10}>10 per page</option>
              <option value={15}>15 per page</option>
              <option value={20}>20 per page</option>
            </select>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full lg:w-auto">
            <button
              onClick={handleExportCSV}
              className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm w-full sm:w-auto min-h-[44px] sm:min-h-auto"
            >
              <FileText size={16} className="flex-shrink-0" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 text-sm w-full sm:w-auto min-h-[44px] sm:min-h-auto"
            >
              <FileText size={16} className="flex-shrink-0" />
              <span>Export PDF</span>
            </button>
          </div>
        </div>

        {/* Desktop Table */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full min-w-[800px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={handleSort}
                    className="flex items-center gap-1 hover:text-gray-700 min-h-[44px] lg:min-h-auto"
                  >
                    Timestamp
                    <span className="text-gray-400">↕</span>
                  </button>
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Module
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedLogs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-900">
                    <div className="font-medium">{formatTimestamp(log.timestamp)}</div>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{log.user}</div>
                      <div className="text-sm text-gray-500 break-all">{log.userEmail}</div>
                    </div>
                  </td>
                  <td className="px-4 sm:px-6 py-4">
                    <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {log.role}
                    </span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-900 max-w-xs">
                    <div className="line-clamp-2">{log.action}</div>
                  </td>
                  <td className="px-4 sm:px-6 py-4 text-sm text-gray-900">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700">
                      {log.module}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card Layout */}
        <div className="lg:hidden">
          {paginatedLogs.map((log) => (
            <div key={log.id} className="border-b border-gray-200 p-4 hover:bg-gray-50 transition-colors">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0 pr-3">
                  <div className="text-sm font-medium text-gray-900 mb-1">{log.user}</div>
                  <div className="text-xs text-gray-500 break-all">{log.userEmail}</div>
                </div>
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                  <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                    {log.role}
                  </span>
                  <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700">
                    {log.module}
                  </span>
                </div>
              </div>
              
              <div className="text-sm text-gray-900 mb-3 leading-relaxed">
                {log.action}
              </div>
              
              <div className="text-xs text-gray-500 font-medium">
                {formatTimestamp(log.timestamp)}
              </div>
            </div>
          ))}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 sm:px-6 py-4 border-t border-gray-200">
            <div className="flex items-center gap-2 order-2 sm:order-1">
              <button
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-3 sm:py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] sm:min-h-auto"
              >
                <span>←</span>
                <span>Previous</span>
              </button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  let pageNum: number
                  if (totalPages <= 5) {
                    pageNum = i + 1
                  } else if (currentPage <= 3) {
                    pageNum = i + 1
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i
                  } else {
                    pageNum = currentPage - 2 + i
                  }
                  
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`px-3 sm:px-4 py-3 sm:py-2 text-sm rounded-md min-h-[44px] sm:min-h-auto ${
                        currentPage === pageNum
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-700 hover:bg-gray-50 border border-gray-300'
                      }`}
                    >
                      {pageNum}
                    </button>
                  )
                })}
                {totalPages > 5 && currentPage < totalPages - 2 && (
                  <>
                    <span className="px-2 text-gray-500 text-sm">...</span>
                    <button
                      onClick={() => setCurrentPage(totalPages)}
                      className={`px-3 sm:px-4 py-3 sm:py-2 text-sm rounded-md min-h-[44px] sm:min-h-auto ${
                        currentPage === totalPages
                          ? 'bg-blue-500 text-white'
                          : 'text-gray-700 hover:bg-gray-50 border border-gray-300'
                      }`}
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center justify-center gap-2 px-3 sm:px-4 py-3 sm:py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] sm:min-h-auto"
              >
                <span>Next</span>
                <span>→</span>
              </button>
            </div>
            
            <div className="text-sm text-gray-700 order-1 sm:order-2">
              Page {currentPage} of {totalPages}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}


