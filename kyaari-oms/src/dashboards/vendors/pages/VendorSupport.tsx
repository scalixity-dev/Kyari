import { useState, useEffect, useRef } from 'react'
import { Plus, Send, Paperclip, Clock, AlertTriangle, CheckSquare } from 'lucide-react'
import { CustomDropdown, KPICard } from '../../../components'

type IssueType = 'Invoice Mismatch' | 'Duplicate Entry' | 'Payment Pending' | 'Payment Delay' | 'Others'
type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent'
type TicketStatus = 'Open' | 'In Progress' | 'Resolved'

type Message = {
  id: string
  sender: 'vendor' | 'admin'
  senderName: string
  text: string
  timestamp: string
  attachments?: { name: string; url: string }[]
}

type Ticket = {
  id: string
  issueTitle: string
  issueType: IssueType
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
  'In Progress': { bg: '#DBEAFE', color: '#1E3A8A', border: '#BFDBFE' },
  Resolved: { bg: '#D1FAE5', color: '#065F46', border: '#A7F3D0' },
}

const INITIAL_TICKETS: Ticket[] = [
  { 
    id: 'TKT-V001', 
    issueTitle: 'Payment delay for Invoice #INV-8895',
    issueType: 'Payment Delay', 
    priority: 'High',
    status: 'Open',
    assignedTo: 'Admin Support',
    createdAt: '2025-09-25', 
    updatedAt: '2025-09-25',
    messages: [
      { 
        id: 'msg-1', 
        sender: 'vendor', 
        senderName: 'Vendor', 
        text: 'Payment for Invoice #INV-8895 still pending. Please advise expected release date.', 
        timestamp: 'Sep 25, 2025 10:01 AM' 
      },
      { 
        id: 'msg-2', 
        sender: 'admin', 
        senderName: 'Admin Support', 
        text: 'Acknowledged. Checking with finance and will update shortly.', 
        timestamp: 'Sep 25, 2025 10:32 AM' 
      },
    ]
  },
  { 
    id: 'TKT-V002', 
    issueTitle: 'Dispatch label not generated for ORD-12320',
    issueType: 'Others', 
    priority: 'Medium',
    status: 'In Progress',
    assignedTo: 'Admin Support',
    createdAt: '2025-09-21', 
    updatedAt: '2025-09-21',
    messages: [
      { id: 'msg-3', sender: 'vendor', senderName: 'Vendor', text: 'Label not generated for ORD-12320.', timestamp: 'Sep 21, 2025 08:42 AM' },
      { id: 'msg-4', sender: 'admin', senderName: 'Admin Support', text: 'Raised to Operations. Awaiting update.', timestamp: 'Sep 21, 2025 09:05 AM' },
    ]
  },
  { 
    id: 'TKT-V003', 
    issueTitle: 'Invoice INV-8890 rejected',
    issueType: 'Invoice Mismatch', 
    priority: 'Low',
    status: 'Resolved',
    assignedTo: 'Admin Support',
    createdAt: '2025-09-22', 
    updatedAt: '2025-09-22',
    messages: [
      { id: 'msg-5', sender: 'vendor', senderName: 'Vendor', text: 'Invoice INV-8890 shows rejected.', timestamp: 'Sep 22, 2025 11:01 AM' },
      { id: 'msg-6', sender: 'admin', senderName: 'Admin Support', text: 'Corrected tax code. Please re-check.', timestamp: 'Sep 22, 2025 02:11 PM' },
    ]
  },
]

export default function VendorSupport() {
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS)

  // filters
  const [filterIssue, setFilterIssue] = useState<IssueType | ''>('')
  const [filterStatus, setFilterStatus] = useState<TicketStatus | ''>('')
  const [filterPriority, setFilterPriority] = useState<TicketPriority | ''>('')
  const [filterDate, setFilterDate] = useState('')
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

  // analytics
  const openTickets = tickets.filter(t => t.status === 'Open').length
  const inProgressTickets = tickets.filter(t => t.status === 'In Progress').length
  const resolvedThisWeek = tickets.filter(t => t.status === 'Resolved').length
  const avgResolutionHours = 4.2

  const filteredTickets = tickets.filter(t => {
    if (filterIssue && t.issueType !== filterIssue) return false
    if (filterStatus && t.status !== filterStatus) return false
    if (filterPriority && t.priority !== filterPriority) return false
    if (filterDate && t.createdAt !== filterDate) return false
    if (search && !(t.id.toLowerCase().includes(search.toLowerCase()) || t.issueTitle.toLowerCase().includes(search.toLowerCase()))) return false
    return true
  })

  function resetFilters() {
    setFilterIssue('')
    setFilterStatus('')
    setFilterPriority('')
    setFilterDate('')
    setSearch('')
  }

  function addTicket() {
    if (!draftIssueTitle || !draftIssue || !draftPriority || !draftDescription) {
      alert('Please fill all required fields')
      return
    }
    const newTicket: Ticket = {
      id: `TKT-V${String(4 + tickets.length).padStart(3, '0')}`,
      issueTitle: draftIssueTitle,
      issueType: draftIssue as IssueType,
      priority: draftPriority as TicketPriority,
      status: 'Open',
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
    setTickets(prev => prev.map(x => x.id === t.id ? { ...x, status: 'Resolved', updatedAt: new Date().toISOString().split('T')[0] } : x))
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

  return (
    <div className="py-4 px-4 sm:px-6 md:px-8 lg:px-9 sm:py-6 lg:py-8 min-h-[calc(100vh-4rem)] font-sans w-full overflow-x-hidden" style={{ background: 'var(--color-sharktank-bg)' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 sm:mb-8 lg:mb-10 gap-3">
        <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-[var(--color-heading)] mb-0 font-[var(--font-heading)]">Vendor Support</h2>
        <button
          onClick={() => setShowNewTicket(true)}
          className="bg-accent text-button-text rounded-xl px-4 py-2.5 border border-transparent flex items-center justify-center gap-2 w-full sm:w-auto min-h-[44px] sm:min-h-auto"
        >
          <Plus size={16} />
          <span>Raise New Ticket</span>
        </button>
      </div>

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
          <input 
            type="date" 
            value={filterDate} 
            onChange={e => setFilterDate(e.target.value)} 
            className="px-3 py-2.5 sm:py-2 rounded-xl border border-gray-300 text-xs sm:text-sm min-w-0 hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200 min-h-[44px] sm:min-h-auto" 
          />
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
            className="bg-white text-secondary border border-secondary rounded-full px-4 py-2.5 sm:py-2 text-xs sm:text-sm whitespace-nowrap hover:bg-secondary hover:text-white transition-colors duration-200 min-h-[44px] sm:min-h-auto"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Vendor Support Tickets heading */}
      <div className="mb-3 sm:mb-4">
        <h2 className="text-base sm:text-lg md:text-xl font-semibold text-secondary">All Support Tickets</h2>
      </div>

      {/* Table */}
      <div className="bg-header-bg rounded-xl overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 whitespace-nowrap">
          <thead>
            <tr style={{ background: 'var(--color-accent)' }}>
              {['Ticket ID','Issue Title','Issue Type','Priority','Status','Assigned To','Created / Updated','Actions'].map(h => (
                <th key={h} className="text-left p-3 font-heading font-normal whitespace-nowrap" style={{ color: 'var(--color-button-text)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredTickets.map((t, idx) => (
              <tr key={t.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-header-bg'}>
                <td className="p-3 whitespace-nowrap">{t.id}</td>
                <td className="p-3 whitespace-nowrap">{t.issueTitle}</td>
                <td className="p-3 whitespace-nowrap">{t.issueType}</td>
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
                <td className="p-3 whitespace-nowrap">{t.assignedTo}</td>
                <td className="p-3 whitespace-nowrap">{t.createdAt} / {t.updatedAt}</td>
                <td className="p-3 whitespace-nowrap">
                  <div className="flex gap-2">
                    <button onClick={() => setDrawerTicket(t)} className="bg-white text-secondary border border-secondary rounded-full px-2.5 py-1.5 text-sm">View</button>
                    <button onClick={() => resolveTicket(t)} className="bg-white text-secondary border border-secondary rounded-full px-2.5 py-1.5 text-sm">Resolve</button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredTickets.length === 0 && (
              <tr>
                <td colSpan={8} className="p-6 text-center text-gray-500">No tickets match current filters.</td>
              </tr>
            )}
          </tbody>
          </table>
        </div>

        {/* Mobile/Tablet Card View */}
        <div className="lg:hidden">
          {filteredTickets.length === 0 ? (
            <div className="p-6 text-center text-gray-500 text-sm">No tickets match current filters.</div>
          ) : (
            <div className="p-3 sm:p-4 space-y-3">
              {filteredTickets.map((t) => (
                <div key={t.id} className="bg-white rounded-lg p-4 shadow-sm">
                  <div className="flex items-start justify-between mb-3 gap-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-secondary text-sm">{t.id}</h3>
                      <p className="text-xs text-gray-600 mt-1 line-clamp-2">{t.issueTitle}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-1.5 flex-shrink-0">
                      <button 
                        onClick={() => setDrawerTicket(t)} 
                        className="bg-white text-secondary border border-secondary rounded-full px-3 py-1.5 text-xs whitespace-nowrap min-h-[36px] sm:min-h-auto hover:bg-secondary hover:text-white transition-colors"
                      >
                        View
                      </button>
                      <button 
                        onClick={() => resolveTicket(t)} 
                        className="bg-white text-secondary border border-secondary rounded-full px-3 py-1.5 text-xs whitespace-nowrap min-h-[36px] sm:min-h-auto hover:bg-secondary hover:text-white transition-colors"
                      >
                        Resolve
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Issue Type</div>
                      <div className="text-xs sm:text-sm font-medium truncate">{t.issueType}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500 mb-1">Assigned To</div>
                      <div className="text-xs sm:text-sm font-medium truncate">{t.assignedTo}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex gap-2 flex-wrap">
                      {(() => {
                        const st = PRIORITY_STYLES[t.priority]
                        return (
                          <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold border" style={{ backgroundColor: st.bg, color: st.color, borderColor: st.border }}>
                            {t.priority}
                          </span>
                        )
                      })()}
                      {(() => {
                        const st = STATUS_STYLES[t.status]
                        return (
                          <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold border" style={{ backgroundColor: st.bg, color: st.color, borderColor: st.border }}>
                            {t.status}
                          </span>
                        )
                      })()}
                    </div>
                    <div className="text-xs text-gray-500">{t.createdAt}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
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
    </div>
  )
}


