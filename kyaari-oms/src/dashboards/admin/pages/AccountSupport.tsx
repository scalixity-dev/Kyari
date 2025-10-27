import { useMemo, useState, useEffect, useRef } from 'react'
import { Plus, Send, Paperclip, FileText, AlertTriangle, CheckSquare, Clock, Calendar as CalendarIcon } from 'lucide-react'
import { CustomDropdown, KPICard, Pagination, CSVPDFExportButton } from '../../../components'
import { Calendar } from '../../../components/ui/calendar'
import { format } from 'date-fns'

type IssueType = 'Payment Delay' | 'Invoice Missing' | 'Reconciliation Error' | 'Credit Note' | 'Others'
type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent'
type TicketStatus = 'Open' | 'In-progress' | 'Escalated' | 'Resolved' | 'Closed'

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
  invoiceId: string
  vendor: string
  issue: IssueType
  priority: TicketPriority
  status: TicketStatus
  amount?: number
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


const INITIAL_TICKETS: Ticket[] = [
  { 
    id: 'ACT-7001', 
    invoiceId: 'INV-32014', 
    vendor: 'GreenLeaf Co', 
    issue: 'Payment Delay', 
    priority: 'High', 
    status: 'Open', 
    amount: 45230, 
    assignedTo: 'Anita', 
    createdAt: '2025-09-20', 
    updatedAt: '2025-09-20',
    messages: [
      { id: 'msg-1', sender: 'vendor', senderName: 'GreenLeaf Co', text: 'Payment for Invoice #INV-32014 is overdue. Please process immediately.', timestamp: '2025-09-20 10:00 AM' },
      { id: 'msg-2', sender: 'admin', senderName: 'Anita', text: 'Thank you for reaching out. Checking with finance team and will update you shortly.', timestamp: '2025-09-20 11:30 AM' },
    ]
  },
  { 
    id: 'ACT-7002', 
    invoiceId: 'INV-31977', 
    vendor: 'Urban Roots', 
    issue: 'Invoice Missing', 
    priority: 'Urgent', 
    status: 'Escalated', 
    amount: 12150, 
    assignedTo: 'Rahul', 
    createdAt: '2025-09-18', 
    updatedAt: '2025-09-21',
    messages: [
      { id: 'msg-3', sender: 'vendor', senderName: 'Urban Roots', text: 'Invoice #INV-31977 is missing from the system. Cannot track payment status.', timestamp: '2025-09-18 09:15 AM' },
      { id: 'msg-4', sender: 'admin', senderName: 'Rahul', text: 'We are investigating this issue. This has been escalated to accounts team.', timestamp: '2025-09-18 02:45 PM' },
      { id: 'msg-5', sender: 'vendor', senderName: 'Urban Roots', text: 'Any updates on this? We need this resolved urgently.', timestamp: '2025-09-21 10:00 AM' },
    ]
  },
  { 
    id: 'ACT-7003', 
    invoiceId: 'INV-31888', 
    vendor: 'Plantify', 
    issue: 'Reconciliation Error', 
    priority: 'Medium', 
    status: 'In-progress', 
    amount: 7800, 
    assignedTo: 'Kiran', 
    createdAt: '2025-09-19', 
    updatedAt: '2025-09-22',
    messages: [
      { id: 'msg-6', sender: 'vendor', senderName: 'Plantify', text: 'There is a mismatch in the invoice amount. Please verify.', timestamp: '2025-09-19 03:30 PM' },
      { id: 'msg-7', sender: 'admin', senderName: 'Kiran', text: 'Looking into this. Will cross-check with order details.', timestamp: '2025-09-22 11:00 AM' },
    ]
  },
  { 
    id: 'ACT-7004', 
    invoiceId: 'INV-31756', 
    vendor: 'Clay Works', 
    issue: 'Credit Note', 
    priority: 'Low', 
    status: 'Resolved', 
    amount: 0, 
    assignedTo: 'Meera', 
    createdAt: '2025-09-10', 
    updatedAt: '2025-09-15',
    messages: [
      { id: 'msg-8', sender: 'vendor', senderName: 'Clay Works', text: 'Need credit note for returned items.', timestamp: '2025-09-10 02:00 PM' },
      { id: 'msg-9', sender: 'admin', senderName: 'Meera', text: 'Credit note has been issued and sent to your registered email.', timestamp: '2025-09-15 04:30 PM' },
      { id: 'msg-10', sender: 'vendor', senderName: 'Clay Works', text: 'Received. Thank you!', timestamp: '2025-09-15 05:00 PM' },
    ]
  },
  { 
    id: 'ACT-7005', 
    invoiceId: 'INV-32044', 
    vendor: 'EcoGarden Solutions', 
    issue: 'Others', 
    priority: 'High', 
    status: 'Open', 
    amount: 15990, 
    assignedTo: 'Arjun', 
    createdAt: '2025-09-25', 
    updatedAt: '2025-09-25',
    messages: [
      { id: 'msg-11', sender: 'vendor', senderName: 'EcoGarden Solutions', text: 'Need clarification on payment terms for Invoice #INV-32044.', timestamp: '2025-09-25 09:30 AM' },
    ]
  },
]

export default function AccountSupport() {
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS)

  // filters
  const [filterIssue, setFilterIssue] = useState<IssueType | ''>('')
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
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  
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

  // new ticket draft
  const [draftInvoiceId, setDraftInvoiceId] = useState('')
  const [draftVendor, setDraftVendor] = useState('')
  const [draftIssue, setDraftIssue] = useState<IssueType | ''>('')
  const [draftPriority, setDraftPriority] = useState<TicketPriority | ''>('')
  const [draftAmount, setDraftAmount] = useState<number | ''>('')
  const [draftDescription, setDraftDescription] = useState('')
  const [draftFile, setDraftFile] = useState<File | null>(null)

  // chat
  const [messageText, setMessageText] = useState('')
  const [chatAttachment, setChatAttachment] = useState<File | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const vendors = useMemo(() => Array.from(new Set(tickets.map(t => t.vendor))).sort(), [tickets])

  // analytics
  const pendingPayments = tickets.filter(t => t.issue === 'Payment Delay' && (t.status === 'Open' || t.status === 'In-progress' || t.status === 'Escalated')).length
  const invoiceDiscrepancies = tickets.filter(t => t.issue === 'Reconciliation Error' || t.issue === 'Invoice Missing').length
  const resolvedThisMonth = tickets.filter(t => t.status === 'Resolved').length
  const avgResolutionDays = 2.6

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      if (filterIssue && t.issue !== filterIssue) return false
      if (filterStatus && t.status !== filterStatus) return false
      if (filterPriority && t.priority !== filterPriority) return false
      if (dateFrom && new Date(t.createdAt) < dateFrom) return false
      if (dateTo && new Date(t.createdAt) > dateTo) return false
      if (search) {
        const q = search.toLowerCase()
        const hit = t.id.toLowerCase().includes(q) || t.invoiceId.toLowerCase().includes(q) || t.vendor.toLowerCase().includes(q)
        if (!hit) return false
      }
      return true
    })
  }, [tickets, filterIssue, filterStatus, filterPriority, dateFrom, dateTo, search])

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
  }, [filterIssue, filterStatus, filterPriority, dateFrom, dateTo, search])

  function handleExportCSV() {
    const headers = ['Ticket ID', 'Invoice ID', 'Vendor', 'Issue Type', 'Priority', 'Status', 'Amount', 'Assigned To', 'Created', 'Updated']
    const csvContent = [headers.join(','), ...filteredTickets.map(t => [t.id, t.invoiceId, `"${t.vendor}"`, t.issue, t.priority, t.status, typeof t.amount === 'number' ? t.amount : '', t.assignedTo, t.createdAt, t.updatedAt].join(','))].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `account-support-tickets-${new Date().toISOString().split('T')[0]}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    // Revoke the object URL after a short delay to prevent memory leaks
    setTimeout(() => URL.revokeObjectURL(url), 100)
  }

  function handleExportPDF() {
    let content = 'Account Support Tickets Report\n'
    content += `Generated: ${new Date().toLocaleString()}\n`
    content += '='.repeat(80) + '\n\n'
    content += `Total Tickets: ${filteredTickets.length}\n\n`
    content += filteredTickets.map(t => `Ticket: ${t.id}\nInvoice: ${t.invoiceId}\nVendor: ${t.vendor}\nIssue: ${t.issue}\nPriority: ${t.priority}\nStatus: ${t.status}\nAmount: ${typeof t.amount === 'number' ? `₹${t.amount.toLocaleString('en-IN')}` : '-'}\nAssigned To: ${t.assignedTo}\nCreated: ${t.createdAt}\nUpdated: ${t.updatedAt}\n${'-'.repeat(80)}\n`).join('\n')
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `account-support-tickets-${new Date().toISOString().split('T')[0]}.txt`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    // Revoke the object URL after a short delay to prevent memory leaks
    setTimeout(() => URL.revokeObjectURL(url), 100)
  }

  function resetFilters() {
    setFilterIssue('')
    setFilterStatus('')
    setFilterPriority('')
    setDateFrom(undefined)
    setDateTo(undefined)
    setSearch('')
  }

  function addTicket() {
    if (!draftInvoiceId || !draftVendor || !draftIssue || !draftPriority || !draftDescription) {
      alert('Please fill all required fields')
      return
    }
    const newTicket: Ticket = {
      id: `ACT-${7000 + tickets.length + 1}`,
      invoiceId: draftInvoiceId,
      vendor: draftVendor,
      issue: draftIssue as IssueType,
      priority: draftPriority as TicketPriority,
      status: 'Open',
      amount: typeof draftAmount === 'number' ? draftAmount : undefined,
      assignedTo: '-',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    }
    setTickets(prev => [newTicket, ...prev])
    setShowNewTicket(false)
    setDraftInvoiceId('')
    setDraftVendor('')
    setDraftIssue('')
    setDraftPriority('')
    setDraftAmount('')
    setDraftDescription('')
    setDraftFile(null)
  }

  function assignTicket(t: Ticket) {
    const name = prompt('Assign to (name):', t.assignedTo || '')
    if (name === null) return
    setTickets(prev => prev.map(x => x.id === t.id ? { ...x, assignedTo: name || '-', updatedAt: new Date().toISOString().split('T')[0] } : x))
  }

  function resolveTicket(t: Ticket) {
    setTickets(prev => prev.map(x => x.id === t.id ? { ...x, status: 'Resolved', updatedAt: new Date().toISOString().split('T')[0] } : x))
  }

  function closeTicket(t: Ticket) {
    setTickets(prev => prev.map(x => x.id === t.id ? { ...x, status: 'Closed', updatedAt: new Date().toISOString().split('T')[0] } : x))
  }

  function escalateTicket(t: Ticket) {
    setTickets(prev => prev.map(x => x.id === t.id ? { ...x, status: 'Escalated', updatedAt: new Date().toISOString().split('T')[0] } : x))
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
      sender: 'admin',
      senderName: drawerTicket.assignedTo || 'Admin',
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

    // Update the drawer ticket to reflect the new message
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

  return (
    <div className="p-4 sm:p-6 lg:p-9 bg-[color:var(--color-sharktank-bg)] min-h-[calc(100vh-4rem)] font-sans w-full overflow-x-hidden">
      {/* Header */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-heading mb-2">Account Support</h1>
            <p className="text-sm sm:text-base text-gray-600">Manage payment and invoice-related tickets</p>
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
            title="Pending Payment Tickets" 
            value={pendingPayments}
            subtitle={`${pendingPayments} pending`}
            icon={<FileText size={32} />}
          />
          <KPICard 
            title="Invoice Discrepancy Cases" 
            value={invoiceDiscrepancies}
            subtitle="Needs attention"
            icon={<AlertTriangle size={32} />}
          />
          <KPICard 
            title="Resolved This Month" 
            value={resolvedThisMonth}
            subtitle={`${resolvedThisMonth} completed`}
            icon={<CheckSquare size={32} />}
          />
          <KPICard 
            title="Avg Resolution Time" 
            value={`${avgResolutionDays} days`}
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
              value={filterIssue}
              onChange={(value) => setFilterIssue(value as IssueType | '')}
              options={[
                { value: '', label: 'Issue Type' },
                { value: 'Payment Delay', label: 'Payment Delay' },
                { value: 'Invoice Missing', label: 'Invoice Missing' },
                { value: 'Reconciliation Error', label: 'Reconciliation Error' },
                { value: 'Credit Note', label: 'Credit Note' },
                { value: 'Others', label: 'Others' }
              ]}
              placeholder="Issue Type"
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
              placeholder="Search ticket / invoice / vendor" 
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
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr className="" style={{ background: 'var(--color-accent)' }}>
                <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>
                  Ticket ID
                </th>
                <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>
                  Invoice ID
                </th>
              <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>
                Vendor Name
              </th>
              <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>
                Issue Type
              </th>
              <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>
                Amount
              </th>
              <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>
                Priority
              </th>
              <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>
                Status
              </th>
              <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>
                Assigned To
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
                <td colSpan={10} className="p-6 text-center text-gray-500">
                  No tickets match current filters.
                </td>
              </tr>
            ) : (
              paginatedTickets.map((t) => (
                <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50 bg-white transition-colors">
                  <td className="p-3 font-semibold text-[var(--color-secondary)]">{t.id}</td>
                  <td className="p-3 text-sm text-gray-700">{t.invoiceId}</td>
                  <td className="p-3 text-sm text-gray-700">{t.vendor}</td>
                  <td className="p-3 text-sm text-gray-700">{t.issue}</td>
                  <td className="p-3 text-sm font-medium text-gray-900">
                    {typeof t.amount === 'number' ? `₹${t.amount.toLocaleString('en-IN')}` : '-'}
                  </td>
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
                  <td className="p-3 text-sm text-gray-700">{t.assignedTo}</td>
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
                        onClick={() => assignTicket(t)} 
                        className="bg-blue-500 text-white rounded-md px-2.5 py-1.5 text-xs hover:bg-blue-600"
                      >
                        Assign
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
      </div>

      {/* Card View - Mobile */}
      <div className="lg:hidden space-y-3">
        {paginatedTickets.length > 0 ? (
          paginatedTickets.map(t => (
            <div key={t.id} className="rounded-xl p-4 border border-gray-200 bg-white">
              <div className="flex items-start justify-between mb-3">
                <div className="min-w-0 flex-1">
                  <h4 className="font-semibold text-[var(--color-secondary)] text-lg">{t.id}</h4>
                  <p className="text-sm text-gray-600 mt-0.5">{t.invoiceId}</p>
                  <p className="text-sm text-gray-800 mt-0.5 font-medium">{t.vendor}</p>
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
                  <span className="text-gray-500 block">Issue Type</span>
                  <span className="font-medium">{t.issue}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Amount</span>
                  <span className="font-medium">{typeof t.amount === 'number' ? `₹${t.amount.toLocaleString('en-IN')}` : '-'}</span>
                </div>
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
                  <span className="text-gray-500 block">Assigned To</span>
                  <span className="font-medium">{t.assignedTo}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Created</span>
                  <span className="font-medium">{t.createdAt}</span>
                </div>
                <div>
                  <span className="text-gray-500 block">Updated</span>
                  <span className="font-medium">{t.updatedAt}</span>
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
                  onClick={() => assignTicket(t)} 
                  className="bg-blue-500 text-white rounded-md px-2.5 py-1.5 text-xs hover:bg-blue-600"
                >
                  Assign
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

      {showNewTicket && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-3 sm:p-4 md:p-6">
          <div className="bg-white w-full max-w-[90vw] sm:max-w-[780px] rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 max-h-[90vh] overflow-y-auto">
            <div className="mb-3 sm:mb-4">
              <h3 className="font-heading text-secondary font-semibold text-base sm:text-lg md:text-xl">Raise New Ticket</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Invoice ID</label>
                <input value={draftInvoiceId} onChange={e => setDraftInvoiceId(e.target.value)} placeholder="INV-xxxxx" className="w-full px-2.5 py-2 min-h-[44px] rounded-lg border border-gray-300" />
              </div>
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
                <label className="block text-sm font-medium mb-1 text-secondary">Issue Type</label>
                <CustomDropdown
                  value={draftIssue}
                  onChange={(value) => setDraftIssue(value as IssueType | '')}
                  options={[
                    { value: '', label: 'Select Issue' },
                    { value: 'Payment Delay', label: 'Payment Delay' },
                    { value: 'Invoice Missing', label: 'Invoice Missing' },
                    { value: 'Reconciliation Error', label: 'Reconciliation Error' },
                    { value: 'Credit Note', label: 'Credit Note' },
                    { value: 'Others', label: 'Others' }
                  ]}
                  placeholder="Select Issue"
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
                <label className="block text-sm font-medium mb-1">Amount (optional)</label>
                <input type="number" value={draftAmount} onChange={e => setDraftAmount(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0" className="w-full px-2.5 py-2 min-h-[44px] rounded-lg border border-gray-300" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Upload Supporting Document</label>
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
                  <div className="text-base sm:text-lg md:text-xl font-semibold text-secondary truncate">{drawerTicket.id}</div>
                </div>
                <button onClick={closeDrawer} className="text-gray-500 hover:text-gray-700 text-xl sm:text-2xl leading-none min-h-[44px] min-w-[44px] flex items-center justify-center flex-shrink-0">✕</button>
              </div>

              <div className="space-y-2 sm:space-y-3">
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div>
                    <div className="text-xs text-gray-500">Invoice ID</div>
                    <div className="font-medium text-sm">{drawerTicket.invoiceId}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Vendor</div>
                    <div className="font-medium text-sm">{drawerTicket.vendor}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Issue</div>
                    <div className="font-medium text-sm">{drawerTicket.issue}</div>
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
                  <div>
                    <div className="text-xs text-gray-500">Amount</div>
                    <div className="font-medium text-sm">{typeof drawerTicket.amount === 'number' ? `₹${drawerTicket.amount.toLocaleString('en-IN')}` : '-'}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div>
                    <div className="text-xs text-gray-500">Assigned To</div>
                    <div className="font-medium text-xs sm:text-sm truncate">{drawerTicket.assignedTo}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">SLA</div>
                    <div className="font-medium text-xs sm:text-sm">48 hrs</div>
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
                  onChange={(e) => setChatAttachment(e.target.files?.[0] || null)}
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
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


