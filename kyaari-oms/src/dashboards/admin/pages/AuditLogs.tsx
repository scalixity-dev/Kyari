import { useState, useMemo, useEffect, useRef } from 'react'
import { Calendar as CalendarIcon } from 'lucide-react'
import { CustomDropdown, CSVPDFExportButton, Pagination } from '../../../components'
import { Calendar } from '../../../components/ui/calendar'
import { format } from 'date-fns'

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
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>()
  const [showFromCalendar, setShowFromCalendar] = useState(false)
  const [showToCalendar, setShowToCalendar] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(10)
  const [sortBy] = useState<'timestamp'>('timestamp')
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc')
  
  const fromCalendarRef = useRef<HTMLDivElement>(null)
  const toCalendarRef = useRef<HTMLDivElement>(null)

  // Close calendars when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fromCalendarRef.current && !fromCalendarRef.current.contains(event.target as Node)) {
        setShowFromCalendar(false)
      }
      if (toCalendarRef.current && !toCalendarRef.current.contains(event.target as Node)) {
        setShowToCalendar(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Filter and sort data
  const filteredAndSortedLogs = useMemo(() => {
    const filtered = mockAuditLogs.filter(log => {
      const matchesUser = !filters.user || 
        log.user.toLowerCase().includes(filters.user.toLowerCase()) ||
        log.userEmail.toLowerCase().includes(filters.user.toLowerCase())
      const matchesRole = !filters.role || log.role === filters.role
      const matchesModule = !filters.module || log.module === filters.module
      const matchesDateFrom = !dateFrom || new Date(log.timestamp) >= dateFrom
      const matchesDateTo = !dateTo || new Date(log.timestamp) <= dateTo
      
      return matchesUser && matchesRole && matchesModule && matchesDateFrom && matchesDateTo
    })

    // Sort data
    filtered.sort((a, b) => {
      const aValue = new Date(a[sortBy]).getTime()
      const bValue = new Date(b[sortBy]).getTime()
      return sortOrder === 'asc' ? aValue - bValue : bValue - aValue
    })

    return filtered
  }, [filters, dateFrom, dateTo, sortBy, sortOrder])

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
    setDateFrom(undefined)
    setDateTo(undefined)
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
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen overflow-x-auto bg-[var(--color-sharktank-bg)] font-sans w-full overflow-x-hidden">
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
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 pb-4 mb-6 sm:mb-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">User</label>
            <input
              type="text"
              value={filters.user}
              onChange={(e) => handleFilterChange('user', e.target.value)}
              placeholder="Search by name or email"
              className="w-full px-3 py-3 text-sm border border-gray-300 rounded-md hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200 min-h-[44px] sm:min-h-auto mb-2"
            />
            
            {/* Filter action buttons (slimmer on sm+) */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                className="w-full sm:w-[140px] px-4 py-3 sm:py-2 rounded-md text-white font-medium text-sm min-h-[44px] sm:min-h-auto"
                style={{ backgroundColor: '#C3754C', color: '#F5F3E7' }}
              >
                Apply
              </button>
              <button
                onClick={handleResetFilters}
                className="w-full sm:w-[140px] px-4 py-3 sm:py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 text-sm min-h-[44px] sm:min-h-auto"
                style={{ borderColor: '#1D4D43', color: '#1D4D43' }}
              >
                Reset
              </button>
            </div>
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
              <div className="relative" ref={fromCalendarRef}>
                <button
                  type="button"
                  onClick={() => {
                    setShowFromCalendar(!showFromCalendar)
                    setShowToCalendar(false)
                  }}
                  className="w-full px-3 py-3 text-sm border border-gray-300 rounded-md hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200 min-h-[44px] sm:min-h-auto flex items-center justify-between text-left"
                >
                  <span className={dateFrom ? "text-gray-900" : "text-gray-500"}>
                    {dateFrom ? format(dateFrom, "PPP") : "From date"}
                  </span>
                  <CalendarIcon className="h-4 w-4 text-gray-500" />
                </button>
                {showFromCalendar && (
                  <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-md shadow-lg w-full">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={(date) => {
                        setDateFrom(date)
                        setShowFromCalendar(false)
                      }}
                      initialFocus
                      className="w-full"
                    />
                  </div>
                )}
              </div>
              <div className="relative" ref={toCalendarRef}>
                <button
                  type="button"
                  onClick={() => {
                    setShowToCalendar(!showToCalendar)
                    setShowFromCalendar(false)
                  }}
                  className="w-full px-3 py-3 text-sm border border-gray-300 rounded-md hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200 min-h-[44px] sm:min-h-auto flex items-center justify-between text-left"
                >
                  <span className={dateTo ? "text-gray-900" : "text-gray-500"}>
                    {dateTo ? format(dateTo, "PPP") : "To date"}
                  </span>
                  <CalendarIcon className="h-4 w-4 text-gray-500" />
                </button>
                {showToCalendar && (
                  <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-md shadow-lg w-full">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={(date) => {
                        setDateTo(date)
                        setShowToCalendar(false)
                      }}
                      initialFocus
                      disabled={(date) => dateFrom ? date < dateFrom : false}
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Controls (separate) */}
      <div className="flex justify-end gap-3 mb-4">
        <CSVPDFExportButton
          onExportCSV={handleExportCSV}
          onExportPDF={handleExportPDF}
        />
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-[var(--color-accent)]">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider whitespace-nowrap">
                <button
                  onClick={handleSort}
                  className="flex items-center gap-1 hover:text-gray-200"
                >
                  Timestamp
                  <span className="text-gray-300">↕</span>
                </button>
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider whitespace-nowrap">
                User
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider whitespace-nowrap">
                Role
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider whitespace-nowrap">
                Action
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-white uppercase tracking-wider whitespace-nowrap">
                Module
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedLogs.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">
                  No audit logs found
                </td>
              </tr>
            ) : (
              paginatedLogs.map((log, index) => (
                <tr key={log.id} className={index % 2 === 0 ? 'bg-white hover:bg-gray-50' : 'bg-gray-50 hover:bg-gray-100'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {formatTimestamp(log.timestamp)}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="font-medium">{log.user}</div>
                    <div className="text-gray-500">{log.userEmail}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                      {log.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {log.action}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <span className="inline-flex px-2 py-1 text-xs font-medium rounded bg-gray-100 text-gray-700">
                      {log.module}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={filteredAndSortedLogs.length}
        startIndex={(currentPage - 1) * itemsPerPage}
        endIndex={Math.min(currentPage * itemsPerPage, filteredAndSortedLogs.length)}
        onPageChange={setCurrentPage}
        itemLabel="logs"
      />
    </div>
  )
}


