import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Send, Paperclip, FileText, AlertTriangle, CheckSquare, Clock, Calendar as CalendarIcon } from 'lucide-react'
import { CustomDropdown, KPICard } from '../../../components'
import { Calendar } from '../../../components/ui/calendar'
import { format } from 'date-fns'

type IssueType = 'Order Discrepancy' | 'Vendor Delay' | 'System Error' | 'Payment Mismatch' | 'Other'
type TicketPriority = 'Low' | 'Medium' | 'High'
type TicketStatus = 'Open' | 'In Progress' | 'Resolved' | 'Closed'

type Message = {
  id: string
  sender: 'admin' | 'ops'
  senderName: string
  text: string
  timestamp: string
  attachments?: { name: string; url: string }[]
}

type Ticket = {
  id: string
  issueType: IssueType
  description: string
  priority: TicketPriority
  status: TicketStatus
  createdAt: string
  updatedAt: string
  messages?: Message[]
}

const PRIORITY_STYLES: Record<TicketPriority, { bg: string; color: string; border: string }> = {
  Low: { bg: '#E5E7EB', color: '#111827', border: '#D1D5DB' },
  Medium: { bg: '#FEF9C3', color: '#92400E', border: '#FEF08A' },
  High: { bg: '#FEE2E2', color: '#DC2626', border: '#FECACA' }
}

const STATUS_STYLES: Record<TicketStatus, { bg: string; color: string; border: string }> = {
  Open: { bg: '#FEF9C3', color: '#92400E', border: '#FEF08A' },
  'In Progress': { bg: '#DBEAFE', color: '#1E3A8A', border: '#BFDBFE' },
  Resolved: { bg: '#D1FAE5', color: '#065F46', border: '#A7F3D0' },
  Closed: { bg: '#F3F4F6', color: '#374151', border: '#E5E7EB' }
}


const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'OPS-1001',
    issueType: 'Order Discrepancy',
    description: 'Mismatch between ordered and received quantities for order #OR-78901',
    priority: 'High',
    status: 'Open',
    createdAt: '2025-09-27',
    updatedAt: '2025-09-27',
    messages: [
      {
        id: 'm1',
        sender: 'ops',
        senderName: 'Ops Team',
        text: 'Discrepancy identified at receiving dock. Vendor confirmation pending.',
        timestamp: 'Sep 27, 2025 10:20 AM'
      }
    ]
  },
  {
    id: 'OPS-1002',
    issueType: 'Vendor Delay',
    description: 'Vendor ETA pushed by 2 days for PO #PO-55672',
    priority: 'Medium',
    status: 'In Progress',
    createdAt: '2025-09-26',
    updatedAt: '2025-09-29',
    messages: [
      {
        id: 'm2',
        sender: 'admin',
        senderName: 'Admin Support',
        text: 'We are contacting the vendor to expedite.',
        timestamp: 'Sep 29, 2025 09:30 AM'
      }
    ]
  },
  {
    id: 'OPS-1003',
    issueType: 'System Error',
    description: 'Barcode scanner intermittently failing during GRN process',
    priority: 'Low',
    status: 'Resolved',
    createdAt: '2025-09-20',
    updatedAt: '2025-09-22'
  }
]

export default function Support() {
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS)

  // filters
  const [filterStatus, setFilterStatus] = useState<TicketStatus | ''>('')
  const [filterPriority, setFilterPriority] = useState<TicketPriority | ''>('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [dateFromDate, setDateFromDate] = useState<Date | undefined>(undefined)
  const [dateToDate, setDateToDate] = useState<Date | undefined>(undefined)
  const [showFromCalendar, setShowFromCalendar] = useState(false)
  const [showToCalendar, setShowToCalendar] = useState(false)
  const [search, setSearch] = useState('')
  
  const fromCalendarRef = useRef<HTMLDivElement>(null)
  const toCalendarRef = useRef<HTMLDivElement>(null)

  // modal + drawer
  const [showNewTicket, setShowNewTicket] = useState(false)
  const [drawerTicket, setDrawerTicket] = useState<Ticket | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // new ticket draft
  const [draftIssue, setDraftIssue] = useState<IssueType | ''>('')
  const [draftPriority, setDraftPriority] = useState<TicketPriority | ''>('')
  const [draftDescription, setDraftDescription] = useState('')
  const [draftFile, setDraftFile] = useState<File | null>(null)

  // chat
  const [messageText, setMessageText] = useState('')
  const [chatAttachment, setChatAttachment] = useState<File | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // metrics
  const openTickets = useMemo(() => tickets.filter(t => t.status === 'Open').length, [tickets])
  const inProgressTickets = useMemo(() => tickets.filter(t => t.status === 'In Progress').length, [tickets])
  const resolvedTickets = useMemo(() => tickets.filter(t => t.status === 'Resolved').length, [tickets])

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      if (filterStatus && t.status !== filterStatus) return false
      if (filterPriority && t.priority !== filterPriority) return false
      if (filterDateFrom && t.createdAt < filterDateFrom) return false
      if (filterDateTo && t.createdAt > filterDateTo) return false
      if (search) {
        const s = search.toLowerCase()
        if (!(t.id.toLowerCase().includes(s) || t.description.toLowerCase().includes(s))) return false
      }
      return true
    })
  }, [tickets, filterStatus, filterPriority, filterDateFrom, filterDateTo, search])

  function resetFilters() {
    setFilterStatus('')
    setFilterPriority('')
    setFilterDateFrom('')
    setFilterDateTo('')
    setDateFromDate(undefined)
    setDateToDate(undefined)
    setSearch('')
  }

  function addTicket() {
    if (!draftIssue || !draftPriority || !draftDescription) {
      alert('Please fill all required fields')
      return
    }
    const now = new Date()
    const idNumber = 1000 + tickets.length + 1
    const newTicket: Ticket = {
      id: `OPS-${idNumber}`,
      issueType: draftIssue as IssueType,
      description: draftDescription,
      priority: draftPriority as TicketPriority,
      status: 'Open',
      createdAt: now.toISOString().split('T')[0],
      updatedAt: now.toISOString().split('T')[0],
      messages: [
        {
          id: `msg-${Date.now()}`,
          sender: 'ops',
          senderName: 'Ops Team',
          text: draftDescription,
          timestamp: now.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }),
          attachments: draftFile ? [{ name: draftFile.name, url: '#' }] : undefined
        }
      ]
    }
    setTickets(prev => [newTicket, ...prev])
    setShowNewTicket(false)
    setDraftIssue('')
    setDraftPriority('')
    setDraftDescription('')
    setDraftFile(null)
  }

  function markClosed(t: Ticket) {
    setTickets(prev => prev.map(x => x.id === t.id ? { ...x, status: 'Closed', updatedAt: new Date().toISOString().split('T')[0] } : x))
  }

  function sendMessage() {
    if (!messageText.trim() || !drawerTicket) return

    const now = new Date()
    const timestamp = now.toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true
    })

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      sender: 'ops',
      senderName: 'Ops Team',
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

    setDrawerTicket(prev => prev ? { ...prev, messages: [...(prev.messages || []), newMessage] } : null)
    setMessageText('')
    setChatAttachment(null)
  }

  function closeDrawer() {
    setIsDrawerOpen(false)
    setMessageText('')
    setChatAttachment(null)
    setTimeout(() => setDrawerTicket(null), 300)
  }

  useEffect(() => {
    if (drawerTicket) {
      const id = requestAnimationFrame(() => setIsDrawerOpen(true))
      return () => cancelAnimationFrame(id)
    }
    return undefined
  }, [drawerTicket])

  useEffect(() => {
    if (chatEndRef.current) chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
  }, [drawerTicket?.messages])

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
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

  return (
    <div className="p-4 sm:p-6 lg:p-9 bg-[color:var(--color-sharktank-bg)] min-h-[calc(100vh-4rem)] font-sans w-full overflow-x-hidden">
      {/* Header */}
      <div className="mb-4 sm:mb-6 lg:mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-[var(--color-heading)]">Operations Support</h2>
          <button
            onClick={() => setShowNewTicket(true)}
            className="bg-accent text-button-text rounded-full px-4 sm:px-5 py-2.5 min-h-[44px] border border-transparent flex items-center justify-center gap-2 whitespace-nowrap flex-shrink-0 w-full sm:w-auto"
          >
            <Plus size={18} className="sm:w-4 sm:h-4" />
            <span className="text-sm sm:text-base">Raise New Ticket</span>
          </button>
        </div>

        {/* Analytics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 pt-6 sm:pt-8 pb-4 sm:pb-6 gap-6 sm:gap-8 xl:gap-6">
          <KPICard 
            title="Open Tickets" 
            value={openTickets}
            subtitle={`${openTickets} pending`}
            icon={<FileText size={32} />}
          />
          <KPICard 
            title="In Progress" 
            value={inProgressTickets}
            subtitle="Active tickets"
            icon={<AlertTriangle size={32} />}
          />
          <KPICard 
            title="Resolved" 
            value={resolvedTickets}
            subtitle={`${resolvedTickets} completed`}
            icon={<CheckSquare size={32} />}
          />
          <KPICard 
            title="Avg Resolution Time" 
            value="4.2 hrs"
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
              value={filterStatus}
              onChange={(value) => setFilterStatus(value as TicketStatus | '')}
              options={[
                { value: '', label: 'Status' },
                { value: 'Open', label: 'Open' },
                { value: 'In Progress', label: 'In Progress' },
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
                { value: 'High', label: 'High' }
              ]}
              placeholder="Priority"
              className="w-full"
            />
            <div className="relative" ref={fromCalendarRef}>
              <button
                type="button"
                onClick={() => {
                  setShowFromCalendar(!showFromCalendar)
                  setShowToCalendar(false)
                }}
                className="w-full px-3 py-2 min-h-[44px] border border-gray-300 rounded-xl hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200 flex items-center justify-between text-left"
              >
                <span className={dateFromDate ? 'text-gray-900 truncate text-sm' : 'text-gray-500 text-sm'}>
                  {dateFromDate ? format(dateFromDate, 'PPP') : 'From date'}
                </span>
                <CalendarIcon className="h-4 w-4 text-gray-500 flex-shrink-0 ml-2" />
              </button>
              {showFromCalendar && (
                <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-md shadow-lg w-full min-w-[280px]">
                  <Calendar
                    mode="single"
                    selected={dateFromDate}
                    onSelect={(date) => {
                      setDateFromDate(date)
                      setFilterDateFrom(date ? format(date, 'yyyy-MM-dd') : '')
                      setShowFromCalendar(false)
                    }}
                    initialFocus
                    disabled={(date) => dateToDate ? date > dateToDate : false}
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
                className="w-full px-3 py-2 min-h-[44px] border border-gray-300 rounded-xl hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200 flex items-center justify-between text-left"
              >
                <span className={dateToDate ? 'text-gray-900 truncate text-sm' : 'text-gray-500 text-sm'}>
                  {dateToDate ? format(dateToDate, 'PPP') : 'To date'}
                </span>
                <CalendarIcon className="h-4 w-4 text-gray-500 flex-shrink-0 ml-2" />
              </button>
              {showToCalendar && (
                <div className="absolute z-50 mt-2 bg-white border border-gray-200 rounded-md shadow-lg w-full min-w-[280px]">
                  <Calendar
                    mode="single"
                    selected={dateToDate}
                    onSelect={(date) => {
                      setDateToDate(date)
                      setFilterDateTo(date ? format(date, 'yyyy-MM-dd') : '')
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
          {/* Second row: Search and Reset */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <input 
              placeholder="Search ticket / description" 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              className="px-3 py-2 min-h-[44px] rounded-xl border border-gray-300 w-full sm:flex-1 hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200" 
            />
            <button 
              onClick={resetFilters} 
              className="bg-white text-secondary border border-secondary rounded-full px-4 py-2 min-h-[44px] w-full sm:w-auto hover:bg-secondary hover:text-white transition-colors duration-200 whitespace-nowrap"
            >
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      {/* Table - Desktop view */}
      <div className="hidden md:block rounded-xl shadow-md overflow-hidden border border-white/10 bg-white/70">
        <div className="overflow-x-auto">
          {/* Table head bar */}
          <div className="bg-[#C3754C] text-white min-w-max">
            <div className="flex gap-2 md:gap-3 lg:gap-4 px-3 md:px-4 lg:px-6 py-4 md:py-4 lg:py-5 font-heading font-bold text-sm md:text-base lg:text-[18px] leading-[100%] tracking-[0]">
              <div className="w-24 text-center flex-shrink-0">Ticket ID</div>
              <div className="w-40 text-center flex-shrink-0">Issue Type</div>
              <div className="w-64 text-center flex-shrink-0">Description</div>
              <div className="w-24 text-center flex-shrink-0">Priority</div>
              <div className="w-28 text-center flex-shrink-0">Status</div>
              <div className="w-32 text-center flex-shrink-0">Created</div>
              <div className="w-32 text-center flex-shrink-0">Updated</div>
              <div className="flex-1 min-w-[200px] text-center">Actions</div>
            </div>
          </div>

          {/* Body */}
          <div className="bg-white min-w-max">
            <div className="py-2">
              {filteredTickets.length === 0 ? (
                <div className="px-6 py-8 text-center text-gray-500">No tickets match current filters.</div>
              ) : (
                filteredTickets.map((t) => (
                  <div key={t.id} className="flex gap-2 md:gap-3 lg:gap-4 px-3 md:px-4 lg:px-6 py-3 md:py-4 items-center hover:bg-gray-50">
                    <div className="w-24 text-xs md:text-sm font-medium text-gray-800 text-center flex-shrink-0">{t.id}</div>
                    <div className="w-40 text-xs md:text-sm text-gray-700 text-center truncate flex-shrink-0">{t.issueType}</div>
                    <div className="w-64 text-xs md:text-sm text-gray-700 text-center truncate flex-shrink-0" title={t.description}>{t.description}</div>
                    <div className="w-24 flex items-center justify-center flex-shrink-0">
                      {(() => {
                        const st = PRIORITY_STYLES[t.priority]
                        return (
                          <span className="inline-block px-2 py-1 rounded-md text-xs font-semibold border whitespace-nowrap" style={{ backgroundColor: st.bg, color: st.color, borderColor: st.border }}>
                            {t.priority}
                          </span>
                        )
                      })()}
                    </div>
                    <div className="w-28 flex items-center justify-center flex-shrink-0">
                      {(() => {
                        const st = STATUS_STYLES[t.status]
                        return (
                          <span className="inline-block px-2 py-1 rounded-md text-xs font-semibold border whitespace-nowrap" style={{ backgroundColor: st.bg, color: st.color, borderColor: st.border }}>
                            {t.status}
                          </span>
                        )
                      })()}
                    </div>
                    <div className="w-32 text-xs text-gray-500 text-center whitespace-nowrap flex-shrink-0">{t.createdAt}</div>
                    <div className="w-32 text-xs text-gray-500 text-center whitespace-nowrap flex-shrink-0">{t.updatedAt}</div>
                    <div className="flex-1 min-w-[200px] flex gap-1 justify-center">
                      <button onClick={() => setDrawerTicket(t)} className="bg-white text-secondary border border-secondary rounded-full px-2 py-1 text-xs hover:bg-secondary hover:text-white transition-colors whitespace-nowrap">View</button>
                      <button onClick={() => markClosed(t)} className="bg-white text-green-600 border border-green-600 rounded-full px-2 py-1 text-xs hover:bg-green-600 hover:text-white transition-colors whitespace-nowrap">Close</button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Card View - Mobile */}
      <div className="md:hidden space-y-3 sm:space-y-4">
        {filteredTickets.length > 0 ? (
          filteredTickets.map(t => (
            <div key={t.id} className="bg-white rounded-xl p-3 sm:p-4 shadow-sm border border-gray-200">
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-secondary text-sm sm:text-base truncate">{t.id}</div>
                  <div className="text-xs sm:text-sm text-gray-600 mt-0.5 truncate">{t.issueType}</div>
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
                  <span className="text-gray-500 flex-shrink-0">Description:</span>
                  <span className="font-medium truncate text-right" title={t.description}>{t.description}</span>
                </div>
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
                <button onClick={() => markClosed(t)} className="bg-white text-green-600 border border-green-600 rounded-full px-2 sm:px-3 py-2 min-h-[40px] sm:min-h-[44px] text-xs sm:text-sm font-medium hover:bg-green-600 hover:text-white transition-colors">Close</button>
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl p-4 sm:p-5 max-h-[90vh] overflow-y-auto">
            <div className="mb-3">
              <h3 className="font-heading text-secondary font-normal text-lg sm:text-xl">Raise New Ticket</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-secondary">Issue Type</label>
                <CustomDropdown
                  value={draftIssue}
                  onChange={(value) => setDraftIssue(value as IssueType | '')}
                  options={[
                    { value: '', label: 'Select Issue' },
                    { value: 'Order Discrepancy', label: 'Order Discrepancy' },
                    { value: 'Vendor Delay', label: 'Vendor Delay' },
                    { value: 'System Error', label: 'System Error' },
                    { value: 'Payment Mismatch', label: 'Payment Mismatch' },
                    { value: 'Other', label: 'Other' }
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
                    { value: 'High', label: 'High' }
                  ]}
                  placeholder="Select Priority"
                />
              </div>
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-sm font-medium mb-1 text-secondary">Attachments (optional)</label>
                <input 
                  type="file" 
                  onChange={e => setDraftFile(e.target.files?.[0] || null)} 
                  className="w-full px-2.5 py-2 rounded-lg border border-gray-300 text-sm hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200" 
                />
                {draftFile && (
                  <div className="mt-1 text-xs text-gray-600">Selected: {draftFile.name}</div>
                )}
              </div>
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-sm font-medium mb-1 text-secondary">Description</label>
                <textarea value={draftDescription} onChange={e => setDraftDescription(e.target.value)} rows={4} placeholder="Describe the issue in detail..." className="w-full px-2.5 py-2 rounded-lg border border-gray-300 text-sm hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200 resize-none" />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
              <button onClick={() => setShowNewTicket(false)} className="bg-white text-secondary border border-secondary rounded-full px-3.5 py-2 text-sm w-full sm:w-auto">Cancel</button>
              <button onClick={addTicket} className="bg-accent text-button-text rounded-full px-3.5 py-2 text-sm w-full sm:w-auto">Submit</button>
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
            <div className="p-4 sm:p-5 border-b flex-shrink-0">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-xs text-gray-500">Ticket</div>
                  <div className="text-lg sm:text-xl font-semibold text-secondary">{drawerTicket.id}</div>
                </div>
                <button onClick={closeDrawer} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">✕</button>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-500">Issue Type</div>
                    <div className="font-medium text-sm">{drawerTicket.issueType}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Priority</div>
                    <div>
                      {(() => {
                        const st = PRIORITY_STYLES[drawerTicket.priority]
                        return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border" style={{ backgroundColor: st.bg, color: st.color, borderColor: st.border }}>{drawerTicket.priority}</span>
                      })()}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Status</div>
                    <div>
                      {(() => {
                        const st = STATUS_STYLES[drawerTicket.status]
                        return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border" style={{ backgroundColor: st.bg, color: st.color, borderColor: st.border }}>{drawerTicket.status}</span>
                      })()}
                    </div>
                  </div>
                </div>

                <div>
                  <div className="text-xs text-gray-500">Description</div>
                  <div className="text-sm leading-relaxed">{drawerTicket.description}</div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-500">Created</div>
                    <div className="font-medium text-sm">{drawerTicket.createdAt}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Updated</div>
                    <div className="font-medium text-sm">{drawerTicket.updatedAt}</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button onClick={() => markClosed(drawerTicket)} className="bg-accent text-button-text rounded-full px-3 py-1.5 text-sm hover:opacity-90 transition-opacity">Mark as Closed</button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-gray-50">
              <div className="text-sm font-medium text-gray-700 mb-3">Conversation</div>
              <div className="space-y-3">
                {drawerTicket.messages && drawerTicket.messages.length > 0 ? (
                  drawerTicket.messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender === 'ops' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] sm:max-w-[75%] ${msg.sender === 'ops' ? 'bg-blue-600 text-white' : 'bg-white text-gray-800'} rounded-2xl p-3 shadow-sm`}>
                        <div className={`text-xs mb-1 ${msg.sender === 'ops' ? 'text-blue-100' : 'text-gray-500'}`}>
                          {msg.senderName} • {msg.timestamp}
                        </div>
                        <div className="text-sm leading-relaxed">{msg.text}</div>
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {msg.attachments.map((att, idx) => (
                              <div key={idx} className={`text-xs flex items-center gap-1 ${msg.sender === 'ops' ? 'text-blue-100' : 'text-blue-600'}`}>
                                <Paperclip size={12} />
                                <span className="truncate">{att.name}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-gray-400 text-sm py-8">No messages yet. Start the conversation!</div>
                )}
                <div ref={chatEndRef} />
              </div>
            </div>

            {/* Chat Input */}
            <div className="p-3 sm:p-4 border-t bg-white flex-shrink-0">
              {chatAttachment && (
                <div className="mb-2 px-3 py-2 bg-gray-100 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-700 min-w-0">
                    <Paperclip size={14} className="flex-shrink-0" />
                    <span className="truncate">{chatAttachment.name}</span>
                  </div>
                  <button onClick={() => setChatAttachment(null)} className="text-gray-500 hover:text-gray-700 ml-2 flex-shrink-0">✕</button>
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
                  className="flex-shrink-0 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  title="Attach file"
                >
                  <Paperclip size={16} />
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
                  className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  rows={2}
                />
                <button
                  onClick={sendMessage}
                  disabled={!messageText.trim()}
                  className="flex-shrink-0 p-2 bg-accent text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Send message"
                >
                  <Send size={16} />
                </button>
              </div>
              <div className="text-xs text-gray-500 mt-2 hidden sm:block">Press Enter to send, Shift+Enter for new line</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


