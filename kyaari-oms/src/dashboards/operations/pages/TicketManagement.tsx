import React, { useState, useEffect, useRef } from 'react'
import { AlertTriangle, Eye, X, CheckSquare, Clock, Calendar as CalendarIcon, FileText, Paperclip, Edit } from 'lucide-react'
import { CustomDropdown, KPICard, CSVPDFExportButton } from '../../../components'
import { Pagination } from '../../../components/ui/Pagination'
import { Calendar } from '../../../components/ui/calendar'
import { format } from 'date-fns'
import { TicketApi, type TicketListItem, type TicketComment } from '../../../services/ticketApi'
import TicketChatPanel from '../../../components/tickets/TicketChatPanel'

interface Ticket {
  id: string
  ticketNumber: string
  orderId: string
  orderNumber: string
  vendor: {
    name: string
    id: string
    email: string
  }
  issueType: 'qty-mismatch' | 'damaged' | 'missing-item'
  issueDescription: string
  status: 'open' | 'under-review' | 'resolved'
  raisedOn: string
  lastUpdated: string
  raisedBy: string
  assignedTo?: string
  comments: Comment[]
  attachments: Attachment[]
  priority: 'low' | 'medium' | 'high'
}

interface Comment {
  id: string
  author: string
  message: string
  timestamp: string
  type: 'internal' | 'vendor-response'
}

interface Attachment {
  id: string
  fileName: string
  fileType: string
  uploadedBy: string
  uploadedAt: string
  url?: string
}

// Remove mock data; will load from API

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'open':
      return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border" style={{ backgroundColor: '#FEE2E2', color: '#991B1B', borderColor: '#EF4444' }}>Open</span>
    case 'under-review':
      return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border" style={{ backgroundColor: '#FEF3C7', color: '#92400E', borderColor: '#F59E0B' }}>Under Review</span>
    case 'resolved':
      return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border" style={{ backgroundColor: '#D1FAE5', color: '#065F46', borderColor: '#10B981' }}>Resolved</span>
    default:
      return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border" style={{ backgroundColor: '#F3F4F6', color: '#374151', borderColor: '#9CA3AF' }}>{status}</span>
  }
}

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case 'high':
      return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border" style={{ backgroundColor: '#FEE2E2', color: '#991B1B', borderColor: '#EF4444' }}>High</span>
    case 'medium':
      return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border" style={{ backgroundColor: '#FEF3C7', color: '#92400E', borderColor: '#F59E0B' }}>Medium</span>
    case 'low':
      return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border" style={{ backgroundColor: '#D1FAE5', color: '#065F46', borderColor: '#10B981' }}>Low</span>
    default:
      return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border" style={{ backgroundColor: '#F3F4F6', color: '#374151', borderColor: '#9CA3AF' }}>{priority}</span>
  }
}

const getIssueTypeLabel = (issueType: string) => {
  switch (issueType) {
    case 'qty-mismatch':
      return 'Quantity Mismatch'
    case 'damaged':
      return 'Damaged Items'
    case 'missing-item':
      return 'Missing Item'
    default:
      return issueType
  }
}

export default function TicketManagement() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filters, setFilters] = useState({
    status: 'all',
    vendor: '',
    fromDate: '',
    toDate: '',
    ticket: ''
  })
  const [fromDateCalendar, setFromDateCalendar] = useState<Date | undefined>()
  const [toDateCalendar, setToDateCalendar] = useState<Date | undefined>()
  const [showFromDateCalendar, setShowFromDateCalendar] = useState(false)
  const [showToDateCalendar, setShowToDateCalendar] = useState(false)
  const fromDateCalendarRef = useRef<HTMLDivElement>(null)
  const toDateCalendarRef = useRef<HTMLDivElement>(null)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [updateStatusModalOpen, setUpdateStatusModalOpen] = useState(false)
  const [commentModalOpen, setCommentModalOpen] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [newStatus, setNewStatus] = useState<'open' | 'under-review' | 'resolved'>('open')
  const [newAttachment, setNewAttachment] = useState<File | null>(null)
  const [pagination, setPagination] = useState<{ page: number; limit: number; total: number }>({ page: 1, limit: 20, total: 0 })
  const [viewingAttachment, setViewingAttachment] = useState<{ url: string; type: 'image' | 'pdf' | 'unknown'; name: string } | null>(null)
  
  // Chat-related state
  const [chatPanelOpen, setChatPanelOpen] = useState(false)

  // pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const mapApiTicketToUI = (t: TicketListItem): Ticket => {
    const orderIdentifiers: string[] = []
    const items = t.goodsReceiptNote?.dispatch?.items || []
    items.forEach(i => {
      const ord = i.assignedOrderItem.orderItem.order
      if (ord.orderNumber) orderIdentifiers.push(ord.orderNumber)
      else if (ord.clientOrderId) orderIdentifiers.push(ord.clientOrderId)
    })
    const orderNumber = orderIdentifiers[0] || 'N/A'
    const vendorName = t.goodsReceiptNote?.dispatch?.vendor.companyName || 'N/A'
    const vendorEmail = t.goodsReceiptNote?.dispatch?.vendor.user?.email || ''

    const statusMap: Record<string, Ticket['status']> = {
      OPEN: 'open',
      IN_PROGRESS: 'under-review',
      RESOLVED: 'resolved',
      CLOSED: 'resolved',
    }

    const priorityMap: Record<string, Ticket['priority']> = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      URGENT: 'high',
    }

    return {
      id: t.id,
      ticketNumber: t.ticketNumber,
      orderId: t.goodsReceiptNote?.id || t.id,
      orderNumber,
      vendor: { name: vendorName, id: t.id, email: vendorEmail },
      issueType: 'qty-mismatch',
      issueDescription: t._count?.comments ? `${t._count.comments} comment(s)` : 'Ticket',
      status: statusMap[t.status] || 'open',
      raisedOn: t.createdAt.split('T')[0],
      lastUpdated: t.updatedAt.split('T')[0],
      raisedBy: 'Operations',
      priority: priorityMap[t.priority] || 'medium',
      comments: [],
      attachments: [],
    }
  }

  const fetchTickets = React.useCallback(async () => {
    try {
      setIsLoading(true)
      const res = await TicketApi.list({
        status: filters.status === 'all' ? undefined : filters.status as 'open' | 'under-review' | 'resolved' | 'closed' | undefined,
        vendor: filters.vendor || undefined,
        dateFrom: filters.fromDate || undefined,
        dateTo: filters.toDate || undefined,
        page: pagination.page,
        limit: pagination.limit,
      })
      const apiTickets = res.data.tickets
      const mapped = apiTickets.map(mapApiTicketToUI)
      setTickets(mapped)
      setFilteredTickets(mapped)
      setPagination(res.data.pagination)
    } catch (e) {
      console.error('Failed to load tickets', e)
    } finally {
      setIsLoading(false)
    }
  }, [filters.status, filters.vendor, filters.fromDate, filters.toDate, pagination.page, pagination.limit])

  useEffect(() => {
    fetchTickets()
  }, [fetchTickets])


  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fromDateCalendarRef.current && !fromDateCalendarRef.current.contains(event.target as Node)) {
        setShowFromDateCalendar(false)
      }
      if (toDateCalendarRef.current && !toDateCalendarRef.current.contains(event.target as Node)) {
        setShowToDateCalendar(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Apply filters
  React.useEffect(() => {
    let filtered = tickets

    if (filters.status !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === filters.status)
    }

    if (filters.vendor) {
      filtered = filtered.filter(ticket => 
        ticket.vendor.name.toLowerCase().includes(filters.vendor.toLowerCase())
      )
    }

    if (filters.fromDate) {
      filtered = filtered.filter(ticket => ticket.raisedOn >= filters.fromDate)
    }

    if (filters.toDate) {
      filtered = filtered.filter(ticket => ticket.raisedOn <= filters.toDate)
    }

    if (filters.ticket) {
      const q = filters.ticket.toLowerCase()
      filtered = filtered.filter(ticket => ticket.ticketNumber.toLowerCase().includes(q))
    }

    setFilteredTickets(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }, [filters, tickets])

  // Pagination calculations
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = Math.min(startIndex + itemsPerPage, filteredTickets.length)
  const paginatedTickets = filteredTickets.slice(startIndex, endIndex)

  // Build vendor dropdown options from loaded tickets
  const vendorOptions = React.useMemo(() => {
    const names = Array.from(new Set(tickets.map(t => t.vendor.name).filter(Boolean)))
    return [
      { value: '', label: 'All Vendors' },
      ...names.map(name => ({ value: name, label: name }))
    ]
  }, [tickets])

  const handleViewDetails = async (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setDetailsModalOpen(true)
    try {
      const res = await TicketApi.getComments(ticket.id)
      const comments = res.data as unknown as TicketComment[]
      // Map comments to UI shape
      const mapped: Comment[] = comments.map(c => ({
        id: c.id,
        author: c.user?.name || 'User',
        message: c.content,
        timestamp: format(new Date(c.createdAt), 'yyyy-MM-dd HH:mm'),
        type: 'internal'
      }))
      // Also load attachments
      const att = await TicketApi.listAttachments(ticket.id)
      const attachments = att.data.map((a) => ({
        id: a.id,
        fileName: a.fileName,
        fileType: a.fileType,
        uploadedBy: a.uploadedBy,
        uploadedAt: format(new Date(a.uploadedAt), 'yyyy-MM-dd HH:mm'),
        url: a.url,
      })) as Attachment[]
      const enriched = { ...ticket, comments: mapped, attachments }
      setSelectedTicket(enriched)
      setTickets(prev => prev.map(t => t.id === ticket.id ? enriched : t))
    } catch (e) {
      console.error('Failed to load comments', e)
    }
  }

  const handleUpdateStatus = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setNewStatus(ticket.status)
    setUpdateStatusModalOpen(true)
  }

  const handleAddComment = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setNewComment('')
    setNewAttachment(null)
    setCommentModalOpen(true)
  }

  const handleOpenChat = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setChatPanelOpen(true)
  }

  const submitStatusUpdate = () => {
    if (selectedTicket) {
      setTickets(tickets.map(ticket => 
        ticket.id === selectedTicket.id 
          ? { 
              ...ticket, 
              status: newStatus,
              lastUpdated: new Date().toISOString().split('T')[0]
            }
          : ticket
      ))
      setUpdateStatusModalOpen(false)
      setSelectedTicket(null)
    }
  }

  const submitComment = async () => {
    if (selectedTicket && newComment.trim()) {
      try {
        // If file selected, upload first
        if (newAttachment) {
          await TicketApi.uploadAttachment(selectedTicket.id, newAttachment)
        }
        await TicketApi.addComment(selectedTicket.id, newComment)
        // Reload comments after posting
        const res = await TicketApi.getComments(selectedTicket.id)
        const comments = res.data as unknown as TicketComment[]
        const mapped: Comment[] = comments.map(c => ({
          id: c.id,
          author: c.user?.name || 'User',
          message: c.content,
          timestamp: format(new Date(c.createdAt), 'yyyy-MM-dd HH:mm'),
          type: 'internal'
        }))
        setTickets(prev => prev.map(t => t.id === selectedTicket.id ? { ...t, comments: mapped, lastUpdated: new Date().toISOString().split('T')[0] } : t))
        setSelectedTicket(prev => prev ? { ...prev, comments: mapped } : prev)
        setCommentModalOpen(false)
        setSelectedTicket(null)
        setNewComment('')
        setNewAttachment(null)
      } catch (e) {
        console.error('Failed to add comment', e)
      }
    }
  }

  const openTickets = tickets.filter(ticket => ticket.status === 'open').length
  const underReviewTickets = tickets.filter(ticket => ticket.status === 'under-review').length
  const resolvedTickets = tickets.filter(ticket => ticket.status === 'resolved').length

  const handleExportCSV = () => {
    const csvContent = [
      ['Ticket ID', 'Order ID', 'Vendor Name', 'Vendor Email', 'Issue Type', 'Issue Description', 'Status', 'Priority', 'Raised On', 'Last Updated', 'Raised By'],
      ...filteredTickets.map(ticket => [
        ticket.ticketNumber,
        ticket.orderNumber,
        ticket.vendor.name,
        ticket.vendor.email,
        getIssueTypeLabel(ticket.issueType),
        ticket.issueDescription,
        ticket.status,
        ticket.priority,
        ticket.raisedOn,
        ticket.lastUpdated,
        ticket.raisedBy
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `tickets_export_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleExportPDF = () => {
    // For now, we'll export as CSV since PDF generation would require additional libraries
    // In a real implementation, you might use libraries like jsPDF or html2canvas
    handleExportCSV()
  }

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-[var(--color-sharktank-bg)] min-h-[calc(100vh-4rem)] font-sans w-full overflow-x-hidden">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-heading)] mb-2">
          Ticket Management
        </h1>
        <p className="text-sm sm:text-base text-[var(--color-primary)]">
          Manage and resolve vendor tickets and issues
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8 mt-8 sm:mt-12">
        <KPICard
          title="Open Tickets"
          value={openTickets}
          icon={<AlertTriangle size={32} />}
        />
        <KPICard
          title="Under Review"
          value={underReviewTickets}
          icon={<Clock size={32} />}
        />
        <KPICard
          title="Resolved Tickets"
          value={resolvedTickets}
          icon={<CheckSquare size={32} />}
        />
      </div>

      {/* Tickets Heading */}
      <div className="mb-3 sm:mb-4 flex items-center justify-between">
        <h2 className="text-base sm:text-lg md:text-xl font-semibold text-[var(--color-heading)]">All Tickets</h2>
        <CSVPDFExportButton
          onExportCSV={handleExportCSV}
          onExportPDF={handleExportPDF}
          label="Export"
        />
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 md:p-6 pb-3 sm:pb-4 mb-4 sm:mb-6">
        {/* Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-4">
          {/* Search Ticket */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Ticket#</label>
            <input
              type="text"
              value={filters.ticket}
              onChange={(e) => setFilters({ ...filters, ticket: e.target.value })}
              placeholder="Search ticket number"
              className="w-full px-3 py-2.5 sm:py-3 text-sm border border-gray-300 rounded-md hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200 min-h-[44px] sm:min-h-auto"
            />
          </div>

          {/* Search Vendor */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Vendor#</label>
            <CustomDropdown
              value={filters.vendor}
              onChange={(value) => setFilters({ ...filters, vendor: value || '' })}
              options={vendorOptions}
              placeholder="All Vendors"
            />
          </div>

          {/* From Date */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">From Date</label>
            <div className="relative" ref={fromDateCalendarRef}>
              <button
                type="button"
                onClick={() => setShowFromDateCalendar(!showFromDateCalendar)}
                className="w-full px-3 py-2.5 sm:py-3 text-xs sm:text-sm border border-gray-300 rounded-md hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200 min-h-[44px] sm:min-h-auto flex items-center justify-between text-left"
              >
                <span className={fromDateCalendar ? 'text-gray-900 truncate' : 'text-gray-500'}>
                  {fromDateCalendar ? format(fromDateCalendar, 'dd/MM/yyyy') : 'Select date'}
                </span>
                <CalendarIcon className="h-4 w-4 text-gray-500 flex-shrink-0 ml-2" />
              </button>
              {showFromDateCalendar && (
                <div className="absolute z-50 mt-2 right-0 bg-white border border-gray-200 rounded-md shadow-lg w-full min-w-[280px]">
                  <Calendar
                    mode="single"
                    selected={fromDateCalendar}
                    onSelect={(date) => {
                      setFromDateCalendar(date)
                      setFilters({...filters, fromDate: date ? format(date, 'yyyy-MM-dd') : ''})
                      setShowFromDateCalendar(false)
                    }}
                    initialFocus
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </div>

          {/* To Date */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">To Date</label>
            <div className="relative" ref={toDateCalendarRef}>
              <button
                type="button"
                onClick={() => setShowToDateCalendar(!showToDateCalendar)}
                className="w-full px-3 py-2.5 sm:py-3 text-xs sm:text-sm border border-gray-300 rounded-md hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200 min-h-[44px] sm:min-h-auto flex items-center justify-between text-left"
              >
                <span className={toDateCalendar ? 'text-gray-900 truncate' : 'text-gray-500'}>
                  {toDateCalendar ? format(toDateCalendar, 'dd/MM/yyyy') : 'Select date'}
                </span>
                <CalendarIcon className="h-4 w-4 text-gray-500 flex-shrink-0 ml-2" />
              </button>
              {showToDateCalendar && (
                <div className="absolute z-50 mt-2 right-0 bg-white border border-gray-200 rounded-md shadow-lg w-full min-w-[280px]">
                  <Calendar
                    mode="single"
                    selected={toDateCalendar}
                    onSelect={(date) => {
                      setToDateCalendar(date)
                      setFilters({...filters, toDate: date ? format(date, 'yyyy-MM-dd') : ''})
                      setShowToDateCalendar(false)
                    }}
                    initialFocus
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">Status</label>
            <CustomDropdown
              value={filters.status === 'all' ? '' : filters.status}
              onChange={(value) => setFilters({...filters, status: value || 'all'})}
              options={[
                { value: '', label: 'All Statuses' },
                { value: 'open', label: 'Open' },
                { value: 'under-review', label: 'Under Review' },
                { value: 'resolved', label: 'Resolved' }
              ]}
              placeholder="All Statuses"
            />
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4">
          <div className="flex flex-row items-center gap-2 w-full sm:w-auto">
            <button
              onClick={() => {
                setFilters({ status: 'all', vendor: '', fromDate: '', toDate: '', ticket: '' })
                setFromDateCalendar(undefined)
                setToDateCalendar(undefined)
              }}
              className="w-full sm:w-[140px] px-4 py-2.5 sm:py-2 bg-white text-secondary border border-secondary rounded-2xl font-medium hover:bg-secondary hover:text-white transition-colors duration-200 text-sm min-h-[44px] sm:min-h-auto cursor-pointer"
            >
              Reset
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="bg-white rounded-xl p-12 text-center">
          <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading tickets...</p>
        </div>
      )}

      {/* Tickets Table */}
      {!isLoading && (
      <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[800px] border-collapse">
            <thead>
              <tr style={{ background: 'var(--color-accent)' }}>
                <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Ticket ID</th>
                <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Order ID</th>
                <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Vendor</th>
                <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Issue</th>
                <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Status</th>
                <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Raised On</th>
                <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Last Updated</th>
                <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {paginatedTickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold text-secondary">{ticket.ticketNumber}</div>
                      {getPriorityBadge(ticket.priority)}
                    </div>
                  </td>
                  <td className="p-3 font-semibold text-secondary">{ticket.orderNumber}</td>
                  <td className="p-3">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{ticket.vendor.name}</div>
                      <div className="text-xs text-gray-500">{ticket.vendor.email}</div>
                    </div>
                  </td>
                  <td className="p-3">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{getIssueTypeLabel(ticket.issueType)}</div>
                      <div className="text-xs text-gray-500 max-w-xs truncate">{ticket.issueDescription}</div>
                    </div>
                  </td>
                  <td className="p-3">
                    {getStatusBadge(ticket.status)}
                  </td>
                  <td className="p-3 text-sm text-gray-600">
                    {ticket.raisedOn}
                  </td>
                  <td className="p-3 text-sm text-gray-600">
                    {ticket.lastUpdated}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleViewDetails(ticket)}
                        className="bg-blue-500 text-white rounded-md px-2.5 py-1.5 text-xs hover:bg-blue-600 flex items-center gap-1"
                      >
                        <Eye size={12} />
                        View
                      </button>
                      {ticket.status !== 'resolved' && (
                        <button
                          onClick={() => handleUpdateStatus(ticket)}
                          className="bg-yellow-500 text-white rounded-md px-2.5 py-1.5 text-xs hover:bg-yellow-600 flex items-center gap-1"
                        >
                          <Edit size={12} />
                          Update
                        </button>
                      )}
                      <button
                        onClick={() => handleAddComment(ticket)}
                        className="bg-green-500 text-white rounded-md px-2.5 py-1.5 text-xs hover:bg-green-600 flex items-center gap-1"
                      >
                        <FileText size={12} />
                        Comment
                      </button>
                      <button
                        onClick={() => handleOpenChat(ticket)}
                        className="bg-purple-500 text-white rounded-md px-2.5 py-1.5 text-xs hover:bg-purple-600 flex items-center gap-1"
                      >
                        <FileText size={12} />
                        Chat
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View - Visible only on Mobile */}
        <div className="lg:hidden space-y-3 p-4">
          {paginatedTickets.map((ticket) => (
            <div key={ticket.id} className="rounded-xl p-4 border border-gray-200 bg-white">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-secondary text-lg">{ticket.ticketNumber}</h3>
                    {getPriorityBadge(ticket.priority)}
                  </div>
                  <div className="text-xs text-gray-500">{ticket.orderNumber}</div>
                </div>
                {getStatusBadge(ticket.status)}
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                <div>
                  <span className="text-gray-500 block">Vendor</span>
                  <span className="font-medium">{ticket.vendor.name}</span>
                  <div className="text-xs text-gray-500">{ticket.vendor.email}</div>
                </div>
                <div>
                  <span className="text-gray-500 block">Issue</span>
                  <span className="font-medium">{getIssueTypeLabel(ticket.issueType)}</span>
                  <div className="text-xs text-gray-600 line-clamp-2">{ticket.issueDescription}</div>
                </div>
                <div>
                  <span className="text-gray-500 block">Raised</span>
                  <span className="font-medium">{ticket.raisedOn}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Updated</span>
                  <span className="font-medium">{ticket.lastUpdated}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleViewDetails(ticket)}
                  className="bg-blue-500 text-white rounded-md px-2.5 py-1.5 text-xs hover:bg-blue-600 flex items-center gap-1"
                >
                  <Eye size={12} />
                  View
                </button>
                {ticket.status !== 'resolved' && (
                  <button
                    onClick={() => handleUpdateStatus(ticket)}
                    className="bg-yellow-500 text-white rounded-md px-2.5 py-1.5 text-xs hover:bg-yellow-600 flex items-center gap-1"
                  >
                    <Edit size={12} />
                    Update
                  </button>
                )}
                <button
                  onClick={() => handleAddComment(ticket)}
                  className="bg-green-500 text-white rounded-md px-2.5 py-1.5 text-xs hover:bg-green-600 flex items-center gap-1"
                >
                  <FileText size={12} />
                  Comment
                </button>
                <button
                  onClick={() => handleOpenChat(ticket)}
                  className="bg-purple-500 text-white rounded-md px-2.5 py-1.5 text-xs hover:bg-purple-600 flex items-center gap-1"
                >
                  <FileText size={12} />
                  Chat
                </button>
              </div>
            </div>
          ))}
        </div>

        {filteredTickets.length === 0 && (
          <div className="bg-white rounded-xl p-12 text-center">
            <p className="text-gray-500">No tickets found matching the current filters.</p>
          </div>
        )}
        
        {/* Pagination */}
        {filteredTickets.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredTickets.length}
            startIndex={startIndex}
            endIndex={endIndex}
            onPageChange={setCurrentPage}
            itemLabel="tickets"
            variant="desktop"
          />
        )}
      </div>
      )}

      {/* View Details Modal */}
      {detailsModalOpen && selectedTicket && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-[var(--color-heading)]">Ticket Details</h3>
              <button 
                onClick={() => setDetailsModalOpen(false)} 
                className="text-gray-400 hover:text-gray-600 p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
              <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">Ticket Information</h4>
                <div className="space-y-2">
                  <p className="text-xs sm:text-sm"><span className="font-medium">Ticket ID:</span> {selectedTicket.ticketNumber}</p>
                  <p className="text-xs sm:text-sm"><span className="font-medium">Order ID:</span> {selectedTicket.orderNumber}</p>
                  <p className="text-xs sm:text-sm"><span className="font-medium">Issue Type:</span> {getIssueTypeLabel(selectedTicket.issueType)}</p>
                  <p className="text-xs sm:text-sm flex items-center gap-2"><span className="font-medium">Priority:</span> {getPriorityBadge(selectedTicket.priority)}</p>
                  <p className="text-xs sm:text-sm flex items-center gap-2"><span className="font-medium">Status:</span> {getStatusBadge(selectedTicket.status)}</p>
                  <p className="text-xs sm:text-sm"><span className="font-medium">Raised By:</span> {selectedTicket.raisedBy}</p>
                  {selectedTicket.assignedTo && (
                    <p className="text-xs sm:text-sm"><span className="font-medium">Assigned To:</span> {selectedTicket.assignedTo}</p>
                  )}
                </div>
              </div>
              
              <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">Vendor Information</h4>
                <div className="space-y-2">
                  <p className="text-xs sm:text-sm"><span className="font-medium">Name:</span> {selectedTicket.vendor.name}</p>
                  <p className="text-xs sm:text-sm"><span className="font-medium">Email:</span> {selectedTicket.vendor.email}</p>
                  <p className="text-xs sm:text-sm"><span className="font-medium">Vendor ID:</span> {selectedTicket.vendor.id}</p>
                </div>
              </div>
            </div>

            <div className="mb-4 sm:mb-6">
              <h4 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">Issue Description</h4>
              <p className="text-xs sm:text-sm text-gray-700 p-3 sm:p-4 bg-gray-50 rounded-lg">{selectedTicket.issueDescription}</p>
            </div>

            {selectedTicket.attachments.length > 0 && (
              <div className="mb-4 sm:mb-6">
                <h4 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">Attachments</h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {selectedTicket.attachments.map((attachment) => {
                    const isImage = /image\/(png|jpe?g|webp|gif|bmp)/i.test(attachment.fileType)
                    const isPdf = /application\/pdf/i.test(attachment.fileType)
                    return (
                      <div key={attachment.id} className="bg-gray-50 rounded-lg border border-gray-200 p-2">
                        <div className="aspect-video bg-white rounded flex items-center justify-center overflow-hidden">
                          {isImage && attachment.url ? (
                            <img src={attachment.url} alt={attachment.fileName} className="object-contain max-h-40" />
                          ) : (
                            <div className="text-xs text-gray-500 flex items-center gap-2"><Paperclip size={16} /> {attachment.fileName}</div>
                          )}
                        </div>
                        <div className="mt-2 flex items-center justify-between">
                          <div className="text-[10px] text-gray-500 truncate max-w-[65%]" title={attachment.fileName}>{attachment.fileName}</div>
                          {attachment.url && (
                            <button
                              type="button"
                              onClick={() => setViewingAttachment({ url: attachment.url!, type: isPdf ? 'pdf' : (isImage ? 'image' : 'unknown'), name: attachment.fileName })}
                              className="text-[10px] text-[var(--color-accent)] hover:underline"
                            >
                              {isPdf ? 'Open PDF' : 'Open'}
                            </button>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <div className="mb-4 sm:mb-6">
              <h4 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">Comments History</h4>
              <div className="space-y-3 sm:space-y-4 max-h-60 overflow-y-auto">
                {selectedTicket.comments.map((comment) => (
                  <div key={comment.id} className={`p-3 sm:p-4 rounded-lg ${
                    comment.type === 'internal' ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-green-50 border-l-4 border-green-500'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-1">
                      <span className="text-xs sm:text-sm font-medium">{comment.author}</span>
                      <span className="text-xs text-gray-500">{comment.timestamp}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-700">{comment.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attachment Viewer Modal */}
      {viewingAttachment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-2 sm:p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[95vh] flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
              <h3 className="text-base sm:text-lg font-semibold text-[var(--color-heading)] truncate">{viewingAttachment.name}</h3>
              <button onClick={() => setViewingAttachment(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X size={20} />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-3 sm:p-4 bg-gray-50">
              <div className="flex items-start justify-center min-h-full">
                {viewingAttachment.type === 'image' && (
                  <img src={viewingAttachment.url} alt={viewingAttachment.name} className="max-w-full h-auto rounded-md shadow bg-white" />
                )}
                {viewingAttachment.type === 'pdf' && (
                  <iframe src={viewingAttachment.url} title={viewingAttachment.name} className="w-full min-h-[600px] bg-white rounded-md shadow" />
                )}
                {viewingAttachment.type === 'unknown' && (
                  <div className="text-center p-8 text-gray-600 text-sm">
                    Preview not available. <a href={viewingAttachment.url} target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent)] hover:underline">Download</a>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {updateStatusModalOpen && selectedTicket && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-[var(--color-heading)]">Update Status</h3>
              <button 
                onClick={() => setUpdateStatusModalOpen(false)} 
                className="text-gray-400 hover:text-gray-600 p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-600 mb-2">Ticket: <span className="font-medium">{selectedTicket.ticketNumber}</span></p>
              <p className="text-xs sm:text-sm text-gray-600 mb-2">Current Status: {getStatusBadge(selectedTicket.status)}</p>
            </div>

            <div className="mb-4 sm:mb-6">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                New Status
              </label>
              <CustomDropdown
                value={newStatus}
                onChange={(value) => setNewStatus(value as 'open' | 'under-review' | 'resolved')}
                options={[
                  { value: 'open', label: 'Open' },
                  { value: 'under-review', label: 'Under Review' },
                  { value: 'resolved', label: 'Resolved' }
                ]}
              />
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                onClick={() => setUpdateStatusModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors min-h-[44px] text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={submitStatusUpdate}
                className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors min-h-[44px] text-sm sm:text-base"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Comment Modal */}
      {commentModalOpen && selectedTicket && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-[var(--color-heading)]">Add Comment</h3>
              <button 
                onClick={() => setCommentModalOpen(false)} 
                className="text-gray-400 hover:text-gray-600 p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-600 mb-2">Ticket: <span className="font-medium">{selectedTicket.ticketNumber}</span></p>
              <p className="text-xs sm:text-sm text-gray-600">Vendor: <span className="font-medium">{selectedTicket.vendor.name}</span></p>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Comment *
                </label>
                <textarea
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent min-h-[100px] text-sm sm:text-base"
                  rows={4}
                  placeholder="Add your comment or update..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Attach File (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-gray-400 transition-colors">
                  <div className="mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                    <Paperclip className="text-gray-400" size={40} />
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 mb-2">
                    <label htmlFor="attachment-upload" className="cursor-pointer text-[var(--color-accent)] hover:underline">
                      Click to upload
                    </label>
                    <span> or drag and drop</span>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                  <input
                    id="attachment-upload"
                    type="file"
                    className="hidden"
                    accept=".png,.jpg,.jpeg,.pdf"
                    onChange={(e) => setNewAttachment(e.target.files?.[0] || null)}
                  />
                  {newAttachment && (
                    <p className="mt-2 text-xs sm:text-sm text-green-600 truncate px-2">
                      Selected: {newAttachment.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 mt-4 sm:mt-6">
              <button
                onClick={() => setCommentModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors min-h-[44px] text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={submitComment}
                disabled={!newComment.trim()}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] text-sm sm:text-base"
              >
                Add Comment
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Chat Panel */}
      {selectedTicket && (
        <TicketChatPanel
          ticketId={selectedTicket.id}
          isOpen={chatPanelOpen}
          onClose={() => setChatPanelOpen(false)}
          ticketData={{
            ticketNumber: selectedTicket.ticketNumber,
            title: selectedTicket.issueDescription,
            status: selectedTicket.status,
            priority: selectedTicket.priority
          }}
        />
      )}
    </div>
  )
}
