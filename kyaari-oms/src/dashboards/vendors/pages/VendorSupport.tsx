import { useState, useEffect, useRef } from 'react'
import { Plus, Send, Paperclip, Clock, AlertTriangle, CheckSquare, Calendar as CalendarIcon } from 'lucide-react'
import { CustomDropdown, KPICard, CSVPDFExportButton } from '../../../components'
import { Calendar } from '../../../components/ui/calendar'
import { Pagination } from '../../../components/ui/Pagination'
import { format } from 'date-fns'
import { TicketApi, type TicketListItem } from '../../../services/ticketApi'

type IssueType = 'Invoice Mismatch' | 'Duplicate Entry' | 'Payment Pending' | 'Payment Delay' | 'Others'
type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED'

type Message = {
  id: string
  sender: 'vendor' | 'admin'
  senderName: string
  text: string
  timestamp: string
  attachments?: { name: string; url: string }[]
}

// Update to match the API structure
type Ticket = {
  id: string
  ticketNumber: string
  status: TicketStatus
  priority: TicketPriority
  createdAt: string
  updatedAt: string
  goodsReceiptNote?: {
    id: string
    dispatch?: {
      vendor: { companyName: string; user?: { email?: string } }
      items: Array<{ assignedOrderItem: { orderItem: { order: { orderNumber?: string; clientOrderId?: string } } } }>
    }
  }
  _count?: { comments: number; attachments: number }
  // Additional fields for backward compatibility with UI
  issueTitle?: string
  issueType?: IssueType
  assignedTo?: string
  messages?: Message[]
}

const PRIORITY_STYLES: Record<TicketPriority, { bg: string; color: string; border: string }> = {
  LOW: { bg: '#E5E7EB', color: '#111827', border: '#D1D5DB' },
  MEDIUM: { bg: '#FEF9C3', color: '#92400E', border: '#FEF08A' },
  HIGH: { bg: '#FFEDD5', color: '#9A3412', border: '#FED7AA' },
  URGENT: { bg: '#FEE2E2', color: '#DC2626', border: '#FECACA' },
}

const STATUS_STYLES: Record<TicketStatus, { bg: string; color: string; border: string }> = {
  OPEN: { bg: '#FEF9C3', color: '#92400E', border: '#FEF08A' },
  IN_PROGRESS: { bg: '#DBEAFE', color: '#1E3A8A', border: '#BFDBFE' },
  RESOLVED: { bg: '#D1FAE5', color: '#065F46', border: '#A7F3D0' },
  CLOSED: { bg: '#E5E7EB', color: '#111827', border: '#D1D5DB' },
}

export default function VendorSupport() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Fetch tickets from API
  useEffect(() => {
    const fetchTickets = async () => {
      try {
        setIsLoading(true)
        const response = await TicketApi.list({
          status: 'all',
          page: 1,
          limit: 100
        })
        
        if (response.success) {
          // Transform API data to match UI expectations
          const transformedTickets: Ticket[] = response.data.tickets.map((apiTicket: TicketListItem) => ({
            id: apiTicket.id,
            ticketNumber: apiTicket.ticketNumber,
            status: apiTicket.status,
            priority: apiTicket.priority,
            createdAt: apiTicket.createdAt,
            updatedAt: apiTicket.updatedAt,
            goodsReceiptNote: apiTicket.goodsReceiptNote,
            _count: apiTicket._count,
            // Derive UI fields from API data
            issueTitle: `Ticket ${apiTicket.ticketNumber}`,
            assignedTo: 'Support Team',
            messages: []
          }))
          
          setTickets(transformedTickets)
        }
      } catch (error) {
        console.error('Failed to fetch tickets:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTickets()
  }, [])

  // filters
  const [filterIssue, setFilterIssue] = useState<IssueType | ''>('')
  const [filterStatus, setFilterStatus] = useState<TicketStatus | ''>('')
  const [filterPriority, setFilterPriority] = useState<TicketPriority | ''>('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [dateFromDate, setDateFromDate] = useState<Date | undefined>()
  const [dateToDate, setDateToDate] = useState<Date | undefined>()
  const [showFromCalendar, setShowFromCalendar] = useState(false)
  const [showToCalendar, setShowToCalendar] = useState(false)
  const fromCalendarRef = useRef<HTMLDivElement>(null)
  const toCalendarRef = useRef<HTMLDivElement>(null)
  const [search, setSearch] = useState('')

  // modal + drawer
  const [showNewTicket, setShowNewTicket] = useState(false)
  const [drawerTicket, setDrawerTicket] = useState<Ticket | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // new ticket draft
  const [draftIssueTitle, setDraftIssueTitle] = useState('')
  const [draftIssue, setDraftIssue] = useState<IssueType | ''>('')
  const [draftPriority, setDraftPriority] = useState<TicketPriority | ''>('')
  const [draftDescription, setDraftDescription] = useState('')
  const [draftFile, setDraftFile] = useState<File | null>(null)

  // chat
  const [messageText, setMessageText] = useState('')
  const [chatAttachment, setChatAttachment] = useState<File | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // pagination
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  // analytics
  const openTickets = tickets.filter(t => t.status === 'OPEN').length
  const inProgressTickets = tickets.filter(t => t.status === 'IN_PROGRESS').length
  const resolvedThisWeek = tickets.filter(t => t.status === 'RESOLVED').length
  const avgResolutionHours = 4.2

  const filteredTickets = tickets.filter(t => {
    if (filterIssue && t.issueType !== filterIssue) return false
    if (filterStatus && t.status !== filterStatus) return false
    if (filterPriority && t.priority !== filterPriority) return false
    
    // Date range filter
    if (dateFrom || dateTo) {
      const ticketDate = new Date(t.createdAt)
      if (dateFrom) {
        const fromDate = new Date(dateFrom + 'T00:00:00')
        if (ticketDate < fromDate) return false
      }
      if (dateTo) {
        const toDate = new Date(dateTo + 'T23:59:59')
        if (ticketDate > toDate) return false
      }
    }
    
    if (search && !(t.id.toLowerCase().includes(search.toLowerCase()) || (t.issueTitle?.toLowerCase().includes(search.toLowerCase())))) return false
    return true
  })

  // Calculate pagination
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const paginatedTickets = filteredTickets.slice(startIndex, endIndex)

  function resetFilters() {
    setFilterIssue('')
    setFilterStatus('')
    setFilterPriority('')
    setDateFrom('')
    setDateTo('')
    setDateFromDate(undefined)
    setDateToDate(undefined)
    setSearch('')
    setCurrentPage(1)
  }

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [filterIssue, filterStatus, filterPriority, dateFrom, dateTo, search])

  function addTicket() {
    if (!draftIssueTitle || !draftIssue || !draftPriority || !draftDescription) {
      alert('Please fill all required fields')
      return
    }
    const newTicket: Ticket = {
      id: `TKT-V${String(4 + tickets.length).padStart(3, '0')}`,
      ticketNumber: `TKT-V${String(4 + tickets.length).padStart(3, '0')}`,
      issueTitle: draftIssueTitle,
      issueType: draftIssue as IssueType,
      priority: draftPriority as TicketPriority,
      status: 'OPEN',
      assignedTo: '-',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      messages: [{
        id: `msg-${Date.now()}`,
        sender: 'vendor',
        senderName: 'Vendor',
        text: draftDescription,
        timestamp: new Date().toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }),
        attachments: draftFile ? [{ name: draftFile.name, url: '#' }] : undefined
      }]
    }
    setTickets(prev => [newTicket, ...prev])
    setShowNewTicket(false)
    setDraftIssueTitle('')
    setDraftIssue('')
    setDraftPriority('')
    setDraftDescription('')
    setDraftFile(null)
  }

  function resolveTicket(t: Ticket) {
    setTickets(prev => prev.map(x => x.id === t.id ? { ...x, status: 'RESOLVED' as TicketStatus, updatedAt: new Date().toISOString().split('T')[0] } : x))
  }

  function sendMessage() {
    if (!messageText.trim() || !drawerTicket) return

    const now = new Date()
    const timestamp = now.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric',
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      sender: 'vendor',
      senderName: 'Vendor',
      text: messageText,
      timestamp,
      attachments: chatAttachment ? [{ name: chatAttachment.name, url: '#' }] : undefined
    }

    setTickets(prev => prev.map(ticket => {
      if (ticket.id === drawerTicket.id) {
        return {
          ...ticket,
          messages: [...(ticket.messages || []), newMessage],
          updatedAt: now.toISOString().split('T')[0]
        }
      }
      return ticket
    }))

    setDrawerTicket(prev => prev ? {
      ...prev,
      messages: [...(prev.messages || []), newMessage]
    } : null)

    setMessageText('')
    setChatAttachment(null)
  }

  // Animate drawer open/close
  function closeDrawer() {
    setIsDrawerOpen(false)
    setMessageText('')
    setChatAttachment(null)
    setTimeout(() => setDrawerTicket(null), 300)
  }
  
  useEffect(() => {
    if (drawerTicket) {
      const rafId = requestAnimationFrame(() => setIsDrawerOpen(true))
      return () => cancelAnimationFrame(rafId)
    }
    return undefined
  }, [drawerTicket])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [drawerTicket?.messages])

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

  const handleExportCSV = () => {
    const csvContent = [
      ['Ticket ID', 'Issue Title', 'Issue Type', 'Priority', 'Status', 'Assigned To', 'Created Date', 'Updated Date'],
      ...filteredTickets.map(ticket => [
        ticket.id,
        ticket.issueTitle,
        ticket.issueType,
        ticket.priority,
        ticket.status,
        ticket.assignedTo,
        ticket.createdAt,
        ticket.updatedAt
      ])
    ].map(row => row.map(field => `"${field}"`).join(',')).join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `vendor_support_tickets_export_${format(new Date(), 'yyyy-MM-dd_HH-mm-ss')}.csv`)
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
    <div className="py-4 px-4 sm:px-6 md:px-8 lg:px-9 sm:py-6 lg:py-8 min-h-[calc(100vh-4rem)] font-sans w-full overflow-x-hidden" style={{ background: 'var(--color-sharktank-bg)' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 lg:mb-10 gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-heading)] mb-2">
            Vendor Support
          </h1>
          <p className="text-sm sm:text-base text-[var(--color-primary)]">
            Get help and support for your operations
          </p>
        </div>
        <button
          onClick={() => setShowNewTicket(true)}
          className="bg-accent text-button-text rounded-xl px-4 py-2.5 border border-transparent flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px] sm:min-h-auto"
        >
          <Plus size={16} />
          <span>Raise New Ticket</span>
        </button>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <span className="ml-3 text-gray-600">Loading tickets...</span>
        </div>
      ) : (
        <>
          {/* Analytics Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-4 mb-6 pt-6 sm:pt-8 pb-4 sm:pb-6">
        <KPICard
          title="Open Tickets"
          value={openTickets}
          subtitle="Awaiting response"
          icon={<Clock size={32} />}
        />
        <KPICard
          title="In Progress"
          value={inProgressTickets}
          subtitle="Being resolved"
          icon={<AlertTriangle size={32} />}
        />
        <KPICard
          title="Resolved This Week"
          value={resolvedThisWeek}
          subtitle="Completed tickets"
          icon={<CheckSquare size={32} />}
        />
        <KPICard
          title="Avg Resolution Time"
          value={`${avgResolutionHours} hrs`}
          subtitle="Average time"
          icon={<Clock size={32} />}
        />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 mb-6 bg-white border border-secondary/20 rounded-xl p-3 sm:p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <CustomDropdown
            value={filterIssue}
            onChange={(value) => setFilterIssue(value as IssueType | '')}
            options={[
              { value: '', label: 'Issue Type' },
              { value: 'Invoice Mismatch', label: 'Invoice Mismatch' },
              { value: 'Duplicate Entry', label: 'Duplicate Entry' },
              { value: 'Payment Pending', label: 'Payment Pending' },
              { value: 'Payment Delay', label: 'Payment Delay' },
              { value: 'Others', label: 'Others' }
            ]}
            placeholder="Issue Type"
            className="min-w-0"
          />
          <CustomDropdown
            value={filterStatus}
            onChange={(value) => setFilterStatus(value as TicketStatus | '')}
            options={[
              { value: '', label: 'Status' },
              { value: 'Open', label: 'Open' },
              { value: 'In Progress', label: 'In Progress' },
              { value: 'Resolved', label: 'Resolved' }
            ]}
            placeholder="Status"
            className="min-w-0"
          />
          <CustomDropdown
            value={filterPriority}
            onChange={(value) => setFilterPriority(value as TicketPriority | '')}
            options={[
              { value: '', label: 'Priority' },
              { value: 'Low', label: 'Low' },
              { value: 'Medium', label: 'Medium' },
              { value: 'High', label: 'High' },
              { value: 'Urgent', label: 'Urgent' }
            ]}
            placeholder="Priority"
            className="min-w-0"
          />
          <div className="flex flex-col gap-2">
            <div className="relative" ref={fromCalendarRef}>
              <button
                type="button"
                onClick={() => {
                  setShowFromCalendar(!showFromCalendar)
                  setShowToCalendar(false)
                }}
                className="w-full px-3 py-2.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-xl hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200 min-h-[44px] sm:min-h-auto flex items-center justify-between text-left"
              >
                <span className={dateFromDate ? 'text-gray-900 truncate' : 'text-gray-500'}>
                  {dateFromDate ? format(dateFromDate, 'PPP') : 'From date'}
                </span>
                <CalendarIcon className="h-4 w-4 text-gray-500 flex-shrink-0 ml-2" />
              </button>
              {showFromCalendar && (
                <div className="absolute z-50 mt-2 right-0 bg-white border border-gray-200 rounded-md shadow-lg w-full min-w-[280px]">
                  <Calendar
                    mode="single"
                    selected={dateFromDate}
                    onSelect={(date) => {
                      setDateFromDate(date)
                      setDateFrom(date ? format(date, 'yyyy-MM-dd') : '')
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
                className="w-full px-3 py-2.5 sm:py-2 text-xs sm:text-sm border border-gray-300 rounded-xl hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200 min-h-[44px] sm:min-h-auto flex items-center justify-between text-left"
              >
                <span className={dateToDate ? 'text-gray-900 truncate' : 'text-gray-500'}>
                  {dateToDate ? format(dateToDate, 'PPP') : 'To date'}
                </span>
                <CalendarIcon className="h-4 w-4 text-gray-500 flex-shrink-0 ml-2" />
              </button>
              {showToCalendar && (
                <div className="absolute z-50 mt-2 right-0 bg-white border border-gray-200 rounded-md shadow-lg w-full min-w-[280px]">
                  <Calendar
                    mode="single"
                    selected={dateToDate}
                    onSelect={(date) => {
                      setDateToDate(date)
                      setDateTo(date ? format(date, 'yyyy-MM-dd') : '')
                      setShowToCalendar(false)
                    }}
                    initialFocus
                    disabled={(date) => dateFromDate ? date < dateFromDate : false}
                    className="w-full"
                  />
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input 
            placeholder="Search ticket / issue" 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            className="px-3 py-2.5 sm:py-2 rounded-xl border border-gray-300 text-xs sm:text-sm flex-1 hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200 min-h-[44px] sm:min-h-auto" 
          />
          <button 
            onClick={resetFilters} 
            className="bg-white text-secondary border border-secondary rounded-2xl px-4 py-2.5 sm:py-2 text-xs sm:text-sm whitespace-nowrap hover:bg-secondary hover:text-white transition-colors duration-200 min-h-[44px] sm:min-h-auto cursor-pointer"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Vendor Support Tickets heading */}
      <div className="mb-3 sm:mb-4 flex items-center justify-between">
        <h2 className="text-base sm:text-lg md:text-xl font-semibold text-secondary">All Support Tickets</h2>
        <CSVPDFExportButton
          onExportCSV={handleExportCSV}
          onExportPDF={handleExportPDF}
          label="Export"
        />
      </div>

      {/* Desktop/Tablet Table - Horizontal Scroll */}
      <div className="hidden md:block rounded-lg overflow-hidden border border-gray-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] border-separate border-spacing-0 bg-white">
            <thead>
              <tr className="" style={{ background: 'var(--color-accent)' }}>
                {['Ticket ID','Issue Title','Issue Type','Priority','Status','Assigned To','Created / Updated','Actions'].map(h => (
                  <th key={h} className="text-left p-3 font-heading font-normal text-sm whitespace-nowrap sticky top-0" style={{ color: 'var(--color-button-text)', background: 'var(--color-accent)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginatedTickets.map((t) => (
                <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50 bg-white transition-colors">
                  <td className="p-3 font-semibold text-secondary text-sm whitespace-nowrap">{t.id}</td>
                  <td className="p-3 text-sm min-w-[200px] max-w-[300px]" title={t.issueTitle}>
                    <div className="truncate">{t.issueTitle}</div>
                  </td>
                  <td className="p-3 text-sm whitespace-nowrap">{t.issueType}</td>
                  <td className="p-3 whitespace-nowrap">
                    {(() => {
                      const st = PRIORITY_STYLES[t.priority]
                      return (
                        <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border" style={{ backgroundColor: st.bg, color: st.color, borderColor: st.border }}>
                          {t.priority}
                        </span>
                      )
                    })()}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {(() => {
                      const st = STATUS_STYLES[t.status]
                      return (
                        <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border" style={{ backgroundColor: st.bg, color: st.color, borderColor: st.border }}>
                          {t.status}
                        </span>
                      )
                    })()}
                  </td>
                  <td className="p-3 text-sm whitespace-nowrap">{t.assignedTo}</td>
                  <td className="p-3 text-sm whitespace-nowrap">{t.createdAt} / {t.updatedAt}</td>
                  <td className="p-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => setDrawerTicket(t)} className="bg-[var(--color-accent)] text-[var(--color-button-text)] rounded-md px-2.5 py-1.5 text-xs hover:brightness-95 whitespace-nowrap cursor-pointer">View</button>
                      <button onClick={() => resolveTicket(t)} className="bg-blue-500 text-white rounded-md px-2.5 py-1.5 text-xs hover:bg-blue-600 whitespace-nowrap cursor-pointer">Resolve</button>
                    </div>
                  </td>
                </tr>
              ))}
              {paginatedTickets.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-gray-500 text-sm">No tickets match current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {filteredTickets.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredTickets.length}
            startIndex={startIndex}
            endIndex={Math.min(endIndex, filteredTickets.length)}
            onPageChange={setCurrentPage}
            itemLabel="tickets"
            variant="desktop"
          />
        )}
        {/* Scroll hint for smaller screens */}
        <div className="mt-2 text-xs text-gray-500 text-center md:block lg:hidden">
          ← Scroll horizontally to view all columns →
        </div>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-3">
        {paginatedTickets.length === 0 ? (
          <div className="rounded-xl p-4 border border-gray-200 bg-white text-center text-gray-500 text-sm">No tickets match current filters.</div>
        ) : (
          paginatedTickets.map((t) => (
            <div key={t.id} className="rounded-xl p-4 border border-gray-200 bg-white shadow-sm">
              <div className="flex items-start justify-between mb-3 gap-3">
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-secondary text-base sm:text-lg">{t.id}</h3>
                </div>
                <div className="flex-shrink-0">
                  {(() => {
                    const st = STATUS_STYLES[t.status]
                    return (
                      <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border" style={{ backgroundColor: st.bg, color: st.color, borderColor: st.border }}>
                        {t.status}
                      </span>
                    )
                  })()}
                </div>
              </div>

              <div className="mb-3">
                <p className="text-sm text-gray-600 line-clamp-2">{t.issueTitle}</p>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4 text-sm">
                <div>
                  <span className="text-gray-500 block text-xs">Issue Type</span>
                  <span className="font-medium text-gray-900">{t.issueType}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-xs">Priority</span>
                  <div className="mt-1">
                    {(() => {
                      const st = PRIORITY_STYLES[t.priority]
                      return (
                        <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border" style={{ backgroundColor: st.bg, color: st.color, borderColor: st.border }}>
                          {t.priority}
                        </span>
                      )
                    })()}
                  </div>
                </div>
                <div>
                  <span className="text-gray-500 block text-xs">Assigned To</span>
                  <span className="font-medium text-gray-900">{t.assignedTo}</span>
                </div>
                <div>
                  <span className="text-gray-500 block text-xs">Created</span>
                  <span className="font-medium text-gray-900">{t.createdAt}</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <button 
                  onClick={() => setDrawerTicket(t)} 
                  className="bg-[var(--color-accent)] text-[var(--color-button-text)] rounded-md px-3 py-2 text-xs font-medium hover:brightness-95 transition-all flex-1 sm:flex-initial"
                >
                  View
                </button>
                <button 
                  onClick={() => resolveTicket(t)} 
                  className="bg-blue-500 text-white rounded-md px-3 py-2 text-xs font-medium hover:bg-blue-600 transition-all flex-1 sm:flex-initial"
                >
                  Resolve
                </button>
              </div>
            </div>
          ))
        )}
        {filteredTickets.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredTickets.length}
            startIndex={startIndex}
            endIndex={Math.min(endIndex, filteredTickets.length)}
            onPageChange={setCurrentPage}
            itemLabel="tickets"
            variant="mobile"
          />
        )}
      </div>

      {/* Raise Ticket Modal */}
      {showNewTicket && (
        <div className="fixed inset-0 bg-black/40 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white w-full max-w-2xl rounded-t-2xl sm:rounded-2xl p-4 sm:p-6 max-h-[90vh] overflow-y-auto animate-slide-up sm:animate-none">
            <div className="mb-4 sm:mb-5">
              <h3 className="font-heading text-secondary font-normal text-base sm:text-lg md:text-xl">Raise New Ticket</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-xs sm:text-sm font-medium mb-1.5 text-secondary">Issue Title</label>
                <input 
                  value={draftIssueTitle} 
                  onChange={e => setDraftIssueTitle(e.target.value)} 
                  placeholder="Brief description of the issue" 
                  className="w-full px-3 py-2.5 sm:py-2 rounded-lg border border-gray-300 text-xs sm:text-sm hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200 min-h-[44px] sm:min-h-auto" 
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1.5 text-secondary">Issue Type</label>
                <CustomDropdown
                  value={draftIssue}
                  onChange={(value) => setDraftIssue(value as IssueType | '')}
                  options={[
                    { value: '', label: 'Select Issue' },
                    { value: 'Invoice Mismatch', label: 'Invoice Mismatch' },
                    { value: 'Duplicate Entry', label: 'Duplicate Entry' },
                    { value: 'Payment Pending', label: 'Payment Pending' },
                    { value: 'Payment Delay', label: 'Payment Delay' },
                    { value: 'Others', label: 'Others' }
                  ]}
                  placeholder="Select Issue"
                />
              </div>
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1.5 text-secondary">Priority</label>
                <CustomDropdown
                  value={draftPriority}
                  onChange={(value) => setDraftPriority(value as TicketPriority | '')}
                  options={[
                    { value: '', label: 'Select Priority' },
                    { value: 'Low', label: 'Low' },
                    { value: 'Medium', label: 'Medium' },
                    { value: 'High', label: 'High' },
                    { value: 'Urgent', label: 'Urgent' }
                  ]}
                  placeholder="Select Priority"
                />
              </div>
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-xs sm:text-sm font-medium mb-1.5 text-secondary">Attachments (Invoice/Screenshots)</label>
                <input 
                  type="file" 
                  onChange={e => setDraftFile(e.target.files?.[0] || null)} 
                  className="w-full px-3 py-2.5 sm:py-2 rounded-lg border border-gray-300 text-xs sm:text-sm hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200 min-h-[44px] sm:min-h-auto" 
                />
                {draftFile && (
                  <div className="mt-1.5 text-xs text-gray-600 truncate">Selected: {draftFile.name}</div>
                )}
              </div>
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-xs sm:text-sm font-medium mb-1.5 text-secondary">Description</label>
                <textarea 
                  value={draftDescription} 
                  onChange={e => setDraftDescription(e.target.value)} 
                  rows={4} 
                  placeholder="Describe the issue in detail..." 
                  className="w-full px-3 py-2.5 sm:py-2 rounded-lg border border-gray-300 text-xs sm:text-sm hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200 resize-none" 
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-4 sm:mt-5">
              <button 
                onClick={() => setShowNewTicket(false)} 
                className="bg-white text-secondary border border-secondary rounded-full px-4 py-2.5 sm:py-2 text-xs sm:text-sm w-full sm:w-auto min-h-[44px] sm:min-h-auto hover:bg-secondary hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={addTicket} 
                className="bg-accent text-button-text rounded-full px-4 py-2.5 sm:py-2 text-xs sm:text-sm w-full sm:w-auto min-h-[44px] sm:min-h-auto hover:opacity-90 transition-opacity"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Detail Drawer with Chat */}
      {drawerTicket && (
        <div className="fixed inset-0 z-50">
          <div
            className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ease-out ${isDrawerOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={closeDrawer}
          />
          <div
            className={`absolute bottom-0 sm:top-0 sm:right-0 h-[90vh] sm:h-full w-full sm:w-[500px] bg-white shadow-xl flex flex-col transform transition-transform duration-300 ease-out ${isDrawerOpen ? 'translate-y-0 sm:translate-x-0' : 'translate-y-full sm:translate-y-0 sm:translate-x-full'} rounded-t-2xl sm:rounded-t-none`}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b flex-shrink-0 sticky top-0 bg-white z-10">
              <div className="flex items-start justify-between mb-3 sm:mb-4">
                <div>
                  <div className="text-xs text-gray-500">Ticket</div>
                  <div className="text-base sm:text-lg md:text-xl font-semibold text-secondary">{drawerTicket.id}</div>
                </div>
                <button onClick={closeDrawer} className="text-gray-500 hover:text-gray-700 text-2xl leading-none p-1 -mt-1 -mr-1">✕</button>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Issue Title</div>
                    <div className="font-medium text-xs sm:text-sm break-words">{drawerTicket.issueTitle}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Issue Type</div>
                    <div className="font-medium text-xs sm:text-sm">{drawerTicket.issueType}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Priority</div>
                    <div>
                      {(() => {
                        const st = PRIORITY_STYLES[drawerTicket.priority]
                        return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border" style={{ backgroundColor: st.bg, color: st.color, borderColor: st.border }}>{drawerTicket.priority}</span>
                      })()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Status</div>
                    <div>
                      {(() => {
                        const st = STATUS_STYLES[drawerTicket.status]
                        return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border" style={{ backgroundColor: st.bg, color: st.color, borderColor: st.border }}>{drawerTicket.status}</span>
                      })()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Assigned To</div>
                    <div className="font-medium text-xs sm:text-sm">{drawerTicket.assignedTo}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Created / Updated</div>
                    <div className="font-medium text-xs sm:text-sm">{drawerTicket.createdAt} / {drawerTicket.updatedAt}</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button 
                  onClick={() => resolveTicket(drawerTicket)} 
                  className="bg-accent text-button-text rounded-full px-4 py-2 text-xs sm:text-sm hover:opacity-90 transition-opacity min-h-[40px] sm:min-h-auto"
                >
                  Mark as Resolved
                </button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-gray-50">
              <div className="text-xs sm:text-sm font-medium text-gray-700 mb-3">Conversation</div>
              <div className="space-y-3">
                {drawerTicket.messages && drawerTicket.messages.length > 0 ? (
                  drawerTicket.messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender === 'vendor' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] sm:max-w-[80%] md:max-w-[75%] ${msg.sender === 'vendor' ? 'bg-blue-600 text-white' : 'bg-white text-gray-800'} rounded-2xl p-3 shadow-sm`}>
                        <div className={`text-xs mb-1 ${msg.sender === 'vendor' ? 'text-blue-100' : 'text-gray-500'}`}>
                          {msg.senderName} • {msg.timestamp}
                        </div>
                        <div className="text-xs sm:text-sm leading-relaxed break-words">{msg.text}</div>
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {msg.attachments.map((att, idx) => (
                              <div key={idx} className={`text-xs flex items-center gap-1 ${msg.sender === 'vendor' ? 'text-blue-100' : 'text-blue-600'}`}>
                                <Paperclip size={12} className="flex-shrink-0" />
                                <span className="truncate">{att.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-400 text-xs sm:text-sm py-8">No messages yet. Start the conversation!</div>
                )}
                <div ref={chatEndRef} />
              </div>
            </div>

            {/* Chat Input */}
            <div className="p-3 sm:p-4 border-t bg-white flex-shrink-0 sticky bottom-0">
              {chatAttachment && (
                <div className="mb-2 px-3 py-2 bg-gray-100 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700 min-w-0">
                    <Paperclip size={14} className="flex-shrink-0" />
                    <span className="truncate">{chatAttachment.name}</span>
                  </div>
                  <button onClick={() => setChatAttachment(null)} className="text-gray-500 hover:text-gray-700 ml-2 flex-shrink-0 p-1">✕</button>
                </div>
              )}
              <div className="flex items-end gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  className="hidden"
                  onChange={(e) => setChatAttachment(e.target.files?.[0] || null)}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-shrink-0 p-2.5 sm:p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors min-h-[40px] sm:min-h-auto"
                  title="Attach file"
                >
                  <Paperclip size={18} className="sm:w-4 sm:h-4" />
                </button>
                <textarea
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  placeholder="Type your message..."
                  className="flex-1 min-w-0 px-3 py-2.5 sm:py-2 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                  rows={2}
                />
                <button
                  onClick={sendMessage}
                  disabled={!messageText.trim()}
                  className="flex-shrink-0 p-2.5 sm:p-2 bg-accent text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed min-h-[40px] sm:min-h-auto"
                  title="Send message"
                >
                  <Send size={18} className="sm:w-4 sm:h-4" />
                </button>
              </div>
              <div className="text-xs text-gray-500 mt-2 hidden sm:block">Press Enter to send, Shift+Enter for new line</div>
            </div>
          </div>
        </div>
      )}
        </>
      )}
    </div>
  )
}


