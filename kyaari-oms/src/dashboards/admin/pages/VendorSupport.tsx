import { useMemo, useState, useEffect, useRef } from 'react'
import { Plus, Send, Paperclip, FileText, AlertTriangle, CheckSquare, Clock, Calendar as CalendarIcon } from 'lucide-react'
import { CustomDropdown, KPICard, Pagination, CSVPDFExportButton } from '../../../components'
import { Calendar } from '../../../components/ui/calendar'
import { format } from 'date-fns'
import { io, Socket } from 'socket.io-client'
import { TokenManager } from '../../../services/api'
import { sendTicketMessage } from '../../../utils/ticketMessaging'
import { TicketApi, type TicketListItem } from '../../../services/ticketApi'

type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent'
type TicketStatus = 'Open' | 'In-progress' | 'Escalated' | 'Resolved' | 'Closed'

// Helper to map backend status to UI status
const mapStatusToUI = (backendStatus: string): TicketStatus => {
  const map: Record<string, TicketStatus> = {
    'OPEN': 'Open',
    'IN_PROGRESS': 'In-progress',
    'RESOLVED': 'Resolved',
    'CLOSED': 'Closed'
  }
  return map[backendStatus] || 'Open'
}

// Helper to map backend priority to UI priority
const mapPriorityToUI = (backendPriority: string): TicketPriority => {
  const map: Record<string, TicketPriority> = {
    'LOW': 'Low',
    'MEDIUM': 'Medium',
    'HIGH': 'High',
    'URGENT': 'Urgent'
  }
  return map[backendPriority] || 'Medium'
}

type Message = {
  id: string
  sender: 'admin' | 'vendor'
  senderName: string
  text: string
  timestamp: string
  attachments?: { name: string; url: string }[]
}

type Ticket = {
  id: string
  ticketNumber: string
  vendor: string
  priority: TicketPriority
  status: TicketStatus
  assignedTo: string
  createdAt: string
  updatedAt: string
  messages?: Message[]
}

const PRIORITY_STYLES: Record<TicketPriority, { bg: string; color: string; border: string }> = {
  Low: { bg: '#E5E7EB', color: '#111827', border: '#D1D5DB' },
  Medium: { bg: '#FEF9C3', color: '#92400E', border: '#FEF08A' },
  High: { bg: '#FFEDD5', color: '#9A3412', border: '#FED7AA' },
  Urgent: { bg: '#FEE2E2', color: '#DC2626', border: '#FECACA' },
}

const STATUS_STYLES: Record<TicketStatus, { bg: string; color: string; border: string }> = {
  Open: { bg: '#FEF9C3', color: '#92400E', border: '#FEF08A' },
  'In-progress': { bg: '#DBEAFE', color: '#1E3A8A', border: '#BFDBFE' },
  Escalated: { bg: '#FEE2E2', color: '#B91C1C', border: '#FECACA' },
  Resolved: { bg: '#D1FAE5', color: '#065F46', border: '#A7F3D0' },
  Closed: { bg: '#E5E7EB', color: '#111827', border: '#D1D5DB' },
}


export default function VendorSupport() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // filters
  const [filterVendor, setFilterVendor] = useState('')
  const [filterStatus, setFilterStatus] = useState<TicketStatus | ''>('')
  const [filterPriority, setFilterPriority] = useState<TicketPriority | ''>('')
  const [dateFrom, setDateFrom] = useState<Date>()
  const [dateTo, setDateTo] = useState<Date>()
  const [showFromCalendar, setShowFromCalendar] = useState(false)
  const [showToCalendar, setShowToCalendar] = useState(false)
  const [search, setSearch] = useState('')

  // pagination
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // modal + drawer
  const [showNewTicket, setShowNewTicket] = useState(false)
  const [drawerTicket, setDrawerTicket] = useState<Ticket | null>(null)
  
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // new ticket draft
  const [draftVendor, setDraftVendor] = useState('')
  const [draftPriority, setDraftPriority] = useState<TicketPriority | ''>('')
  const [draftDescription, setDraftDescription] = useState('')
  const [draftFile, setDraftFile] = useState<File | null>(null)

  // chat
  const [messageText, setMessageText] = useState('')
  const [chatAttachment, setChatAttachment] = useState<File | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const socketRef = useRef<Socket | null>(null)

  // Helper function to transform API tickets to UI tickets
  const transformApiTickets = (apiTickets: TicketListItem[]): Ticket[] => {
    return apiTickets.map((apiTicket: TicketListItem) => {
      const vendorCompany = apiTicket.goodsReceiptNote?.dispatch?.vendor?.companyName
      const vendorUserName = apiTicket.goodsReceiptNote?.dispatch?.vendor?.user?.name
      const vendorUserEmail = apiTicket.goodsReceiptNote?.dispatch?.vendor?.user?.email
      const createdByName = apiTicket.createdBy?.name
      const createdByEmail = apiTicket.createdBy?.email
      const vendorName = vendorCompany || vendorUserName || vendorUserEmail || createdByName || createdByEmail || 'Unknown Vendor'

      return {
        id: apiTicket.id,
        ticketNumber: apiTicket.ticketNumber,
        vendor: vendorName,
        priority: mapPriorityToUI(apiTicket.priority),
        status: mapStatusToUI(apiTicket.status),
        assignedTo: apiTicket.assignee?.name || '-',
        createdAt: format(new Date(apiTicket.createdAt), 'PP p'),
        updatedAt: format(new Date(apiTicket.updatedAt), 'PP p'),
        messages: []
      }
    })
  }

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
          const transformedTickets = transformApiTickets(response.data.tickets)
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

  const vendors = useMemo(() => Array.from(new Set(tickets.map(t => t.vendor))).sort(), [tickets])

  const openCount = tickets.filter(t => t.status === 'Open').length
  const inProgressCount = tickets.filter(t => t.status === 'In-progress').length
  const resolvedThisWeek = tickets.filter(t => t.status === 'Resolved').length
  const avgResolutionHours = 4.2

  // Cleanup socket on unmount
  useEffect(() => {
    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
      }
    }
  }, [])

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      if (filterVendor && t.vendor !== filterVendor) return false
      if (filterStatus && t.status !== filterStatus) return false
      if (filterPriority && t.priority !== filterPriority) return false
      if (dateFrom && new Date(t.createdAt) < dateFrom) return false
      if (dateTo && new Date(t.createdAt) > dateTo) return false
      if (search && !(t.ticketNumber.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase()) || t.vendor.toLowerCase().includes(search.toLowerCase()))) return false
      return true
    })
  }, [tickets, filterVendor, filterStatus, filterPriority, dateFrom, dateTo, search])

  // Pagination calculations
  const totalPages = Math.ceil(filteredTickets.length / pageSize)
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, filteredTickets.length)
  const paginatedTickets = useMemo(() => 
    filteredTickets.slice(startIndex, endIndex),
    [filteredTickets, startIndex, endIndex]
  )

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1)
  }, [tickets, filterVendor, filterStatus, filterPriority, dateFrom, dateTo, search])

  function resetFilters() {
    setFilterVendor('')
    setFilterStatus('')
    setFilterPriority('')
    setDateFrom(undefined)
    setDateTo(undefined)
    setSearch('')
  }

  async function addTicket() {
    if (!draftVendor || !draftPriority || !draftDescription) {
      alert('Please fill all required fields')
      return
    }
    try {
      const payload = {
        title: `Ticket - ${draftVendor || 'Vendor'}`,
        description: draftDescription,
        priority: (draftPriority === 'Low' ? 'LOW' : draftPriority === 'Medium' ? 'MEDIUM' : draftPriority === 'High' ? 'HIGH' : 'URGENT') as 'LOW'|'MEDIUM'|'HIGH'|'URGENT',
      }
      const res = await TicketApi.create(payload)
      if (res.success) {
        const t = res.data
        const newTicket: Ticket = {
          id: t.id,
          ticketNumber: t.ticketNumber,
          vendor: draftVendor,
          priority: mapPriorityToUI(t.priority),
          status: mapStatusToUI(t.status),
          assignedTo: '-',
          createdAt: t.createdAt,
          updatedAt: t.updatedAt,
          messages: []
        }
        setTickets(prev => [newTicket, ...prev])
        setShowNewTicket(false)
        setDraftVendor('')
        setDraftPriority('')
        setDraftDescription('')
        setDraftFile(null)
        // Open drawer and join chat for the new ticket
        setDrawerTicket(newTicket)
        setIsDrawerOpen(true)
      }
    } catch (e) {
      console.error('Failed to create ticket', e)
      alert('Failed to create ticket')
    }
  }

  async function resolveTicket(t: Ticket) {
    try {
      const result = await TicketApi.updateStatus(t.id, 'resolved')
      if (result.success) {
        // Refresh tickets list
        const response = await TicketApi.list({
          status: 'all',
          page: 1,
          limit: 100
        })
        if (response.success) {
          const transformedTickets = transformApiTickets(response.data.tickets)
          setTickets(transformedTickets)
          // Update drawer ticket if it's the same ticket
          if (drawerTicket && drawerTicket.id === t.id) {
            const updated = transformedTickets.find(tk => tk.id === t.id)
            if (updated) {
              setDrawerTicket(updated)
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to resolve ticket:', error)
      alert('Failed to resolve ticket. Please try again.')
    }
  }

  async function closeTicket(t: Ticket) {
    try {
      const result = await TicketApi.updateStatus(t.id, 'closed')
      if (result.success) {
        // Refresh tickets list
        const response = await TicketApi.list({
          status: 'all',
          page: 1,
          limit: 100
        })
        if (response.success) {
          const transformedTickets = transformApiTickets(response.data.tickets)
          setTickets(transformedTickets)
          // Update drawer ticket if it's the same ticket
          if (drawerTicket && drawerTicket.id === t.id) {
            const updated = transformedTickets.find(tk => tk.id === t.id)
            if (updated) {
              setDrawerTicket(updated)
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to close ticket:', error)
      alert('Failed to close ticket. Please try again.')
    }
  }

  function escalateTicket(t: Ticket) {
    setTickets(prev => prev.map(x => x.id === t.id ? { ...x, status: 'Escalated', updatedAt: new Date().toISOString().split('T')[0] } : x))
  }

  async function sendMessage() {
    if (!drawerTicket) return
    
    // Prevent sending messages if ticket is resolved or closed
    const ticketStatus = drawerTicket.status?.toLowerCase()
    if (ticketStatus === 'resolved' || ticketStatus === 'closed') {
      alert('Cannot send messages. This ticket has been resolved or closed.')
      return
    }
    
    const result = await sendTicketMessage({
      ticketId: drawerTicket.id,
      messageText,
      attachment: chatAttachment,
      socket: socketRef.current,
      onCleared: () => {
        setMessageText('')
        setChatAttachment(null)
      },
    })
    if (!result.success && result.error) {
      console.error('Failed to send message:', result.error)
    }
  }

  // Animate drawer open/close
  function closeDrawer() {
    setIsDrawerOpen(false)
    setMessageText('')
    setChatAttachment(null)
    setTimeout(() => setDrawerTicket(null), 300)
  }
  
  useEffect(() => {
    if (!drawerTicket) return

    // Open drawer animation
    const rafId = requestAnimationFrame(() => setIsDrawerOpen(true))

    // Ensure socket connection
    const token = TokenManager.getAccessToken() || ''
    if (!socketRef.current) {
      const SOCKET_URL = (import.meta.env.VITE_API_URL as string) || 'http://localhost:3000'
      socketRef.current = io(SOCKET_URL, {
        path: '/socket.io',
        auth: { token },
        transports: ['websocket', 'polling']
      })

      // Handle incoming new messages
      socketRef.current.on('new_message', (payload: { message: any; ticketId: string }) => {
        const msg = payload.message
        const mapped: Message = {
          id: msg.id,
          sender: (msg.sender?.role === 'VENDOR' ? 'vendor' : 'admin'),
          senderName: msg.sender?.name || 'User',
          text: msg.message || '',
          timestamp: new Date(msg.createdAt).toLocaleString(),
          attachments: Array.isArray(msg.attachments) ? msg.attachments.map((a: { fileName: string; url: string }) => ({ name: a.fileName, url: a.url })) : undefined
        }
        setDrawerTicket(prev => prev ? { ...prev, messages: [...(prev.messages || []), mapped] } : prev)
      })

      // Handle message history on join
      socketRef.current.on('messages_history', (data: { messages: any[] } | any[]) => {
        const list = Array.isArray(data) ? data : (Array.isArray((data as any).messages) ? (data as any).messages : [])
        const mapped = list.map((msg: any): Message => ({
          id: msg.id,
          sender: (msg.sender?.role === 'VENDOR' ? 'vendor' : 'admin'),
          senderName: msg.sender?.name || 'User',
          text: msg.message || '',
          timestamp: new Date(msg.createdAt).toLocaleString(),
          attachments: Array.isArray(msg.attachments) ? msg.attachments.map((a: { fileName: string; url: string }) => ({ name: a.fileName, url: a.url })) : undefined
        }))
        setDrawerTicket(prev => prev ? { ...prev, messages: mapped } : prev)
      })
    }

    // Join ticket room
    console.log('[Admin Chat] Emitting join_ticket', { ticketId: drawerTicket.id, ticketNumber: (drawerTicket as any).ticketNumber })
    socketRef.current.emit('join_ticket', { ticketId: drawerTicket.id })

    return () => {
      cancelAnimationFrame(rafId)
      if (socketRef.current) {
        socketRef.current.emit('leave_ticket', { ticketId: drawerTicket.id })
      }
    }
  }, [drawerTicket])

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [drawerTicket?.messages])

  const handleExportCSV = () => {
    const headers = ['Ticket ID', 'Vendor', 'Priority', 'Status', 'Created', 'Updated']
    const csvContent = [
      headers.join(','),
      ...filteredTickets.map(ticket => [
        ticket.ticketNumber,
        `"${ticket.vendor}"`,
        ticket.priority,
        ticket.status,
        ticket.createdAt,
        ticket.updatedAt
      ].join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vendor-support-tickets-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleExportPDF = () => {
    const content = [
      'VENDOR SUPPORT TICKETS REPORT',
      `Generated: ${new Date().toLocaleString()}`,
      `Total Tickets: ${filteredTickets.length}`,
      '',
      '=== TICKETS ===',
      ...filteredTickets.map(ticket => [
        `Ticket: ${ticket.ticketNumber}`,
        `Vendor: ${ticket.vendor}`,
        `Priority: ${ticket.priority}`,
        `Status: ${ticket.status}`,
        `Assigned To: ${ticket.assignedTo}`,
        `Created: ${ticket.createdAt}`,
        `Updated: ${ticket.updatedAt}`,
        '---'
      ].join('\n'))
    ].join('\n')
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `vendor-support-tickets-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="p-4 sm:p-6 lg:p-9  bg-[color:var(--color-sharktank-bg)] min-h-[calc(100vh-4rem)] font-sans w-full overflow-x-hidden">
      {/* Header */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-heading mb-2">Vendor Support</h1>
            <p className="text-sm sm:text-base text-gray-600">Manage vendor-related tickets and inquiries</p>
          </div>
          <button
            onClick={() => setShowNewTicket(true)}
            className="bg-accent text-button-text rounded-xl px-4 sm:px-5 py-2.5 min-h-[44px] border border-transparent flex items-center justify-center gap-2 whitespace-nowrap flex-shrink-0 w-full sm:w-auto"
          >
            <Plus size={18} className="sm:w-4 sm:h-4" />
            <span className="text-sm sm:text-base">Raise New Ticket</span>
          </button>
        </div>
        
        {/* Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 pt-6 sm:pt-8 pb-4 sm:pb-6 gap-6 sm:gap-8 xl:gap-6">
        <KPICard 
          title="Open Tickets" 
          value={openCount}
          subtitle={`${openCount} pending`}
          icon={<FileText size={32} />}
        />
        <KPICard 
          title="In Progress" 
          value={inProgressCount}
          subtitle={`${inProgressCount} active`}
          icon={<AlertTriangle size={32} />}
        />
        <KPICard 
          title="Resolved This Week" 
          value={resolvedThisWeek}
          subtitle={`${resolvedThisWeek} completed`}
          icon={<CheckSquare size={32} />}
        />
        <KPICard 
          title="Avg Resolution Time" 
          value={`${avgResolutionHours} hrs`}
          subtitle="Response time"
          icon={<Clock size={32} />}
        />
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col gap-3 sm:gap-4 bg-white border border-secondary/20 rounded-xl p-3 sm:p-4">
          {/* First row: Dropdowns */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
            <CustomDropdown
              value={filterVendor}
              onChange={(value) => setFilterVendor(value)}
              options={[
                { value: '', label: 'Vendor Name' },
                ...vendors.map(vendor => ({ value: vendor, label: vendor }))
              ]}
              placeholder="Vendor Name"
              className="w-full"
            />
            <CustomDropdown
              value={filterStatus}
              onChange={(value) => setFilterStatus(value as TicketStatus | '')}
              options={[
                { value: '', label: 'Status' },
                { value: 'Open', label: 'Open' },
                { value: 'In-progress', label: 'In-progress' },
                { value: 'Escalated', label: 'Escalated' },
                { value: 'Resolved', label: 'Resolved' },
                { value: 'Closed', label: 'Closed' }
              ]}
              placeholder="Status"
              className="w-full"
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
              className="w-full"
            />
            <div className="flex flex-col gap-2">
              <div className="relative" ref={fromCalendarRef}>
                <button
                  type="button"
                  onClick={() => {
                    setShowFromCalendar(!showFromCalendar)
                    setShowToCalendar(false)
                  }}
                  className="w-full px-3 py-3 text-sm border border-gray-300 rounded-xl hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200 min-h-[44px] flex items-center justify-between text-left"
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
                  className="w-full px-3 py-3 text-sm border border-gray-300 rounded-xl hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200 min-h-[44px] flex items-center justify-between text-left"
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
          {/* Second row: Search and Reset */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <input 
              placeholder="Search ticket/vendor" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="px-3 py-2 min-h-[44px] rounded-xl border border-gray-300 w-full sm:flex-1 hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200" 
            />
            <button 
              onClick={resetFilters} 
              className="bg-white text-secondary border border-secondary rounded-xl px-4 py-2 min-h-[44px] w-full sm:w-auto hover:bg-secondary hover:text-white transition-colors duration-200 whitespace-nowrap"
            >
              Reset Filters
            </button>
            <CSVPDFExportButton
              onExportCSV={handleExportCSV}
              onExportPDF={handleExportPDF}
              buttonClassName="px-4 py-2 sm:py-2 rounded-xl !rounded-xl w-full sm:w-auto min-h-[44px] !min-h-[44px] sm:!min-h-[44px]"
            />
          </div>
        </div>
      </div>

      {/* Table - Desktop view */}
      <div className="hidden lg:block bg-white rounded-xl overflow-hidden shadow-md border border-gray-100">
        {isLoading ? (
          <div className="p-12 text-center">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading tickets...</p>
          </div>
        ) : (
          <>
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="" style={{ background: 'var(--color-accent)' }}>
                <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>
                  Ticket ID
                </th>
                                 <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>
                   Vendor Name
                 </th>
               <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>
                 Priority
               </th>
              <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>
                Status
              </th>
              <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>
                Created / Updated
              </th>
              <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
                         {paginatedTickets.length === 0 ? (
               <tr>
                 <td colSpan={6} className="p-6 text-center text-gray-500">
                   No tickets match current filters.
                 </td>
               </tr>
             ) : (
                               paginatedTickets.map((t) => (
                  <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50 bg-white transition-colors">
                    <td className="p-3 font-semibold text-[var(--color-secondary)]">{t.ticketNumber}</td>
                    <td className="p-3 text-sm text-gray-700">{t.vendor}</td>
                  <td className="p-3">
                    {(() => {
                      const st = PRIORITY_STYLES[t.priority]
                      return (
                        <span 
                          className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border"
                          style={{ backgroundColor: st.bg, color: st.color, borderColor: st.border }}
                        >
                          {t.priority}
                        </span>
                      )
                    })()}
                  </td>
                  <td className="p-3">
                    {(() => {
                      const st = STATUS_STYLES[t.status]
                      return (
                        <span 
                          className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border"
                          style={{ backgroundColor: st.bg, color: st.color, borderColor: st.border }}
                        >
                          {t.status}
                        </span>
                      )
                    })()}
                  </td>
                  <td className="p-3 text-xs text-gray-500">{t.createdAt} / {t.updatedAt}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <button 
                        onClick={() => setDrawerTicket(t)} 
                        className="bg-[var(--color-accent)] text-[var(--color-button-text)] rounded-md px-2.5 py-1.5 text-xs hover:brightness-95"
                      >
                        View
                      </button>
                      <button 
                        onClick={() => resolveTicket(t)} 
                        className="bg-green-500 text-white rounded-md px-2.5 py-1.5 text-xs hover:bg-green-600"
                      >
                        Resolve
                      </button>
                      <button 
                        onClick={() => closeTicket(t)} 
                        className="bg-red-500 text-white rounded-md px-2.5 py-1.5 text-xs hover:bg-red-600"
                      >
                        Close
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>
        
        {/* Desktop Pagination */}
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
        </>
        )}
      </div>

      {/* Card View - Mobile */}
      <div className="lg:hidden space-y-3">
        {isLoading ? (
          <div className="bg-white rounded-xl p-12 text-center">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-500">Loading tickets...</p>
          </div>
        ) : paginatedTickets.length > 0 ? (
          paginatedTickets.map(t => (
                         <div key={t.id} className="rounded-xl p-4 border border-gray-200 bg-white">
               <div className="flex items-start justify-between mb-3">
                 <div className="min-w-0 flex-1">
                   <h4 className="font-semibold text-[var(--color-secondary)] text-lg">{t.ticketNumber}</h4>
                   <p className="text-sm text-gray-600 mt-0.5">{t.vendor}</p>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {(() => {
                    const st = PRIORITY_STYLES[t.priority]
                    return (
                      <span 
                        className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border"
                        style={{ backgroundColor: st.bg, color: st.color, borderColor: st.border }}
                      >
                        {t.priority}
                      </span>
                    )
                  })()}
                </div>
              </div>

                             <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                 <div>
                   <span className="text-gray-500 block">Status</span>
                  {(() => {
                    const st = STATUS_STYLES[t.status]
                    return (
                      <span 
                        className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border"
                        style={{ backgroundColor: st.bg, color: st.color, borderColor: st.border }}
                      >
                        {t.status}
                      </span>
                    )
                  })()}
                </div>
                <div>
                  <span className="text-gray-500 block">Created</span>
                  <span className="font-medium">{t.createdAt}</span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <button 
                  onClick={() => setDrawerTicket(t)} 
                  className="bg-[var(--color-accent)] text-[var(--color-button-text)] rounded-md px-2.5 py-1.5 text-xs hover:brightness-95"
                >
                  View
                </button>
                <button 
                  onClick={() => resolveTicket(t)} 
                  className="bg-green-500 text-white rounded-md px-2.5 py-1.5 text-xs hover:bg-green-600"
                >
                  Resolve
                </button>
                <button 
                  onClick={() => closeTicket(t)} 
                  className="bg-red-500 text-white rounded-md px-2.5 py-1.5 text-xs hover:bg-red-600"
                >
                  Close
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-xl p-6 border border-gray-200 bg-white text-center text-gray-500">
            No tickets match current filters.
          </div>
        )}
        
        {/* Mobile Pagination */}
        {filteredTickets.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredTickets.length}
            startIndex={startIndex}
            endIndex={endIndex}
            onPageChange={setCurrentPage}
            itemLabel="tickets"
            variant="mobile"
          />
        )}
      </div>

      {/* Card View - Mobile (visible on mobile and tablet) */}
      <div className="md:hidden space-y-3 sm:space-y-4">
        {filteredTickets.length > 0 ? (
          filteredTickets.map(t => (
                         <div key={t.id} className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200">
               <div className="flex items-start justify-between gap-2 mb-3">
                 <div className="min-w-0 flex-1">
                   <div className="font-semibold text-secondary text-sm sm:text-base truncate">{t.ticketNumber}</div>
                   <div className="text-xs sm:text-sm text-gray-600 mt-0.5 truncate">{t.vendor}</div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {(() => {
                    const st = PRIORITY_STYLES[t.priority]
                    return (
                      <span className="inline-block px-1.5 sm:px-2 py-1 rounded-md text-[10px] sm:text-xs font-semibold border whitespace-nowrap" style={{ backgroundColor: st.bg, color: st.color, borderColor: st.border }}>
                        {t.priority}
                      </span>
                    )
                  })()}
                </div>
              </div>

                             <div className="space-y-1.5 sm:space-y-2 mb-3">
                 <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
                   <span className="text-gray-500 flex-shrink-0">Status:</span>
                  {(() => {
                    const st = STATUS_STYLES[t.status]
                    return (
                      <span className="inline-block px-2 sm:px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-semibold border whitespace-nowrap" style={{ backgroundColor: st.bg, color: st.color, borderColor: st.border }}>
                        {t.status}
                      </span>
                    )
                  })()}
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
                  <span className="text-gray-500 flex-shrink-0">Created:</span>
                  <span className="font-medium">{t.createdAt}</span>
                </div>
                <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
                  <span className="text-gray-500 flex-shrink-0">Updated:</span>
                  <span className="font-medium">{t.updatedAt}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100">
                <button onClick={() => setDrawerTicket(t)} className="bg-white text-secondary border border-secondary rounded-full px-2 sm:px-3 py-2 min-h-[40px] sm:min-h-[44px] text-xs sm:text-sm font-medium hover:bg-secondary hover:text-white transition-colors">View</button>
                <button onClick={() => resolveTicket(t)} className="bg-white text-green-600 border border-green-600 rounded-full px-2 sm:px-3 py-2 min-h-[40px] sm:min-h-[44px] text-xs sm:text-sm font-medium hover:bg-green-600 hover:text-white transition-colors">Resolve</button>
                <button onClick={() => closeTicket(t)} className="bg-white text-red-600 border border-red-600 rounded-full px-2 sm:px-3 py-2 min-h-[40px] sm:min-h-[44px] text-xs sm:text-sm font-medium hover:bg-red-600 hover:text-white transition-colors">Close</button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl p-6 text-center text-gray-500 text-sm sm:text-base">
            No tickets match current filters.
          </div>
        )}
      </div>

      {/* Raise Ticket Modal */}
      {showNewTicket && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-3 sm:p-4 md:p-6">
          <div className="bg-white w-full max-w-[90vw] sm:max-w-[680px] rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 max-h-[90vh] overflow-y-auto">
            <div className="mb-3 sm:mb-4">
              <h3 className="font-heading text-secondary font-semibold text-base sm:text-lg md:text-xl">Raise New Ticket</h3>
            </div>

                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
               <div>
                 <label className="block text-sm font-medium mb-1 text-secondary">Vendor Name</label>
                 <CustomDropdown
                   value={draftVendor}
                   onChange={(value) => setDraftVendor(value)}
                   options={[
                     { value: '', label: 'Select Vendor' },
                     ...vendors.map(vendor => ({ value: vendor, label: vendor }))
                   ]}
                   placeholder="Select Vendor"
                 />
               </div>
               <div>
                 <label className="block text-sm font-medium mb-1 text-secondary">Priority</label>
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
              <div>
                <label className="block text-sm font-medium mb-1">Attachments</label>
                <input 
                  type="file" 
                  onChange={e => setDraftFile(e.target.files?.[0] || null)} 
                  className="w-full px-2.5 py-2 min-h-[44px] rounded-lg border border-gray-300" 
                />
                {draftFile && (
                  <div className="mt-1 text-xs text-gray-600">Selected: {draftFile.name}</div>
                )}
              </div>
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea value={draftDescription} onChange={e => setDraftDescription(e.target.value)} rows={4} placeholder="Describe the issue..." className="w-full px-2.5 py-2 rounded-lg border border-gray-300" />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-4">
              <button onClick={() => setShowNewTicket(false)} className="bg-white text-secondary border border-secondary rounded-full px-3.5 py-2 min-h-[44px]">Cancel</button>
              <button onClick={addTicket} className="bg-accent text-button-text rounded-full px-3.5 py-2 min-h-[44px]">Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Detail Drawer */}
      {drawerTicket && (
        <div className="fixed inset-0 z-50">
          <div
            className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ease-out ${isDrawerOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={closeDrawer}
          />
          <div
            className={`absolute top-0 right-0 h-full w-full sm:w-[90vw] md:w-[500px] lg:w-[550px] bg-white shadow-xl flex flex-col transform transition-transform duration-300 ease-out ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
          >
            {/* Header */}
            <div className="p-3 sm:p-4 md:p-5 border-b flex-shrink-0">
                             <div className="flex items-start justify-between gap-2 mb-3 sm:mb-4">
                 <div className="min-w-0 flex-1">
                   <div className="text-xs text-gray-500">Ticket</div>
                   <div className="text-base sm:text-lg md:text-xl font-semibold text-secondary truncate">{drawerTicket.ticketNumber}</div>
                 </div>
                 <button onClick={closeDrawer} className="text-gray-500 hover:text-gray-700 text-xl sm:text-2xl leading-none min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0">✕</button>
               </div>

              <div className="space-y-2 sm:space-y-3">
                                 <div className="grid grid-cols-2 gap-2 sm:gap-3">
                   <div>
                     <div className="text-xs text-gray-500">Vendor</div>
                     <div className="font-medium text-sm">{drawerTicket.vendor}</div>
                   </div>
                   <div>
                     <div className="text-xs text-gray-500">Priority</div>
                    <div>
                      {(() => {
                        const st = PRIORITY_STYLES[drawerTicket.priority]
                        return <span className="inline-block px-2 sm:px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-semibold border" style={{ backgroundColor: st.bg, color: st.color, borderColor: st.border }}>{drawerTicket.priority}</span>
                      })()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Status</div>
                    <div>
                      {(() => {
                        const st = STATUS_STYLES[drawerTicket.status]
                        return <span className="inline-block px-2 sm:px-2.5 py-1 rounded-md text-[10px] sm:text-xs font-semibold border" style={{ backgroundColor: st.bg, color: st.color, borderColor: st.border }}>{drawerTicket.status}</span>
                      })()}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div>
                    <div className="text-xs text-gray-500">SLA</div>
                    <div className="font-medium text-xs sm:text-sm">24 hrs</div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2 mt-3 sm:mt-4">
                <button onClick={() => escalateTicket(drawerTicket)} className="bg-white text-red-600 border border-red-600 rounded-full px-3 sm:px-4 py-2 min-h-[44px] text-xs sm:text-sm font-medium hover:bg-red-50 transition-colors">Escalate</button>
                <button onClick={() => resolveTicket(drawerTicket)} className="bg-accent text-button-text rounded-full px-3 sm:px-4 py-2 min-h-[44px] text-xs sm:text-sm font-medium hover:opacity-90 transition-opacity">Resolve</button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-5 bg-gray-50">
              <div className="text-xs sm:text-sm font-medium text-gray-700 mb-2 sm:mb-3">Chat</div>
              <div className="space-y-2 sm:space-y-3">
                {drawerTicket.messages && drawerTicket.messages.length > 0 ? (
                  drawerTicket.messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[90%] sm:max-w-[85%] md:max-w-[75%] ${msg.sender === 'admin' ? 'bg-blue-600 text-white' : 'bg-white text-gray-800'} rounded-xl sm:rounded-2xl p-2 sm:p-3 shadow-sm`}>
                        <div className={`text-[10px] sm:text-xs mb-1 ${msg.sender === 'admin' ? 'text-blue-100' : 'text-gray-500'}`}>
                          {msg.senderName} • {msg.timestamp}
                        </div>
                        <div className="text-xs sm:text-sm leading-relaxed break-words">{msg.text}</div>
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-1.5 sm:mt-2 space-y-1">
                            {msg.attachments.map((att, idx) => (
                              <div key={idx} className={`text-[10px] sm:text-xs flex items-center gap-1 ${msg.sender === 'admin' ? 'text-blue-100' : 'text-blue-600'}`}>
                                <Paperclip size={10} className="sm:w-3 sm:h-3" />
                                <span className="truncate">{att.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-400 text-xs sm:text-sm py-6 sm:py-8">No messages yet. Start the conversation!</div>
                )}
                <div ref={chatEndRef} />
              </div>
            </div>

            {/* Chat Input */}
            <div className="p-2 sm:p-3 md:p-4 border-t bg-white flex-shrink-0">
              {(() => {
                const ticketStatus = drawerTicket.status?.toLowerCase()
                const isDisabled = ticketStatus === 'resolved' || ticketStatus === 'closed'
                
                if (isDisabled) {
                  return (
                    <div className="px-2 sm:px-3 py-2 sm:py-3 bg-gray-100 rounded-lg border border-gray-300 text-center">
                      <div className="text-xs sm:text-sm font-medium text-gray-700 mb-1">
                        Chat Disabled
                      </div>
                      <div className="text-[10px] sm:text-xs text-gray-500">
                        This ticket has been {ticketStatus}. No new messages can be sent.
                      </div>
                    </div>
                  )
                }
                
                return (
                  <>
                    {chatAttachment && (
                      <div className="mb-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-gray-100 rounded-lg flex items-center justify-between">
                        <div className="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-700 min-w-0">
                          <Paperclip size={12} className="sm:w-3.5 sm:h-3.5 flex-shrink-0" />
                          <span className="truncate">{chatAttachment.name}</span>
                        </div>
                        <button onClick={() => setChatAttachment(null)} className="text-gray-500 hover:text-gray-700 ml-2 flex-shrink-0 min-h-[36px] min-w-[36px] sm:min-h-[44px] sm:min-w-[44px] flex items-center justify-center text-lg">✕</button>
                      </div>
                    )}
                    <div className="flex items-end gap-1 sm:gap-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            // Prevent file attachment if ticket is resolved or closed
                            const currentStatus = drawerTicket.status?.toLowerCase()
                            if (currentStatus === 'resolved' || currentStatus === 'closed') {
                              alert('Cannot attach files. This ticket has been resolved or closed.')
                              if (fileInputRef.current) {
                                fileInputRef.current.value = ''
                              }
                              return
                            }
                            setChatAttachment(file)
                          }
                        }}
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-shrink-0 p-2 sm:p-2.5 min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
                        title="Attach file"
                      >
                        <Paperclip size={16} className="sm:w-[18px] sm:h-[18px]" />
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
                        className="flex-1 min-w-0 px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg sm:rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                        rows={2}
                      />
                      <button
                        onClick={sendMessage}
                        disabled={!messageText.trim()}
                        className="flex-shrink-0 p-2 sm:p-2.5 min-h-[40px] min-w-[40px] sm:min-h-[44px] sm:min-w-[44px] bg-accent text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                        title="Send message"
                      >
                        <Send size={16} className="sm:w-[18px] sm:h-[18px]" />
                      </button>
                    </div>
                    <div className="text-[10px] sm:text-xs text-gray-500 mt-1 sm:mt-2">Press Enter to send, Shift+Enter for new line</div>
                  </>
                )
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


