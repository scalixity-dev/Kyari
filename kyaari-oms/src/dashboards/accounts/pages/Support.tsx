import { useState, useEffect, useRef } from 'react'
import { Plus, Send, Paperclip } from 'lucide-react'
import { CustomDropdown } from '../../../components'

type IssueType = 'Invoice Mismatch' | 'Duplicate Entry' | 'Payment Pending' | 'Payment Delay' | 'Others'
type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent'
type TicketStatus = 'Open' | 'In Progress' | 'Resolved'

type Message = {
  id: string
  sender: 'admin' | 'accounts'
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
    id: 'TKT-A001', 
    issueTitle: 'Invoice mismatch for Order #12345',
    issueType: 'Invoice Mismatch', 
    priority: 'High',
    status: 'Open',
    assignedTo: 'Admin Support',
    createdAt: '2025-09-28', 
    updatedAt: '2025-09-28',
    messages: [
      { 
        id: 'msg-1', 
        sender: 'accounts', 
        senderName: 'Accounts Team', 
        text: 'There is a mismatch between the PO amount and the invoice received from vendor GreenLeaf Co for Order #12345. PO shows ₹50,000 but invoice shows ₹52,000.', 
        timestamp: 'Sep 28, 2025 10:30 AM' 
      },
    ]
  },
  { 
    id: 'TKT-A002', 
    issueTitle: 'Duplicate invoice entry detected',
    issueType: 'Duplicate Entry',
    priority: 'Urgent',
    status: 'In Progress',
    assignedTo: 'Admin Support',
    createdAt: '2025-09-27', 
    updatedAt: '2025-09-29',
    messages: [
      { 
        id: 'msg-2', 
        sender: 'accounts', 
        senderName: 'Accounts Team', 
        text: 'Found duplicate invoice INV-8901 for the same order #67890. Both invoices are showing in the system.', 
        timestamp: 'Sep 27, 2025 02:15 PM' 
      },
      { 
        id: 'msg-3', 
        sender: 'admin', 
        senderName: 'Admin Support', 
        text: 'Thanks for reporting. I am checking the database for duplicate entries. Will resolve this shortly.', 
        timestamp: 'Sep 27, 2025 03:45 PM' 
      },
      { 
        id: 'msg-4', 
        sender: 'accounts', 
        senderName: 'Accounts Team', 
        text: 'Please prioritize this. We need to process payment by end of week.', 
        timestamp: 'Sep 29, 2025 09:00 AM' 
      },
    ]
  },
  { 
    id: 'TKT-A003', 
    issueTitle: 'Payment stuck in pending status',
    issueType: 'Payment Pending',
    priority: 'High',
    status: 'In Progress',
    assignedTo: 'Admin Support',
    createdAt: '2025-09-26', 
    updatedAt: '2025-09-29',
    messages: [
      { 
        id: 'msg-5', 
        sender: 'accounts', 
        senderName: 'Accounts Team', 
        text: 'Payment for Invoice #INV-7654 has been stuck in pending status for 3 days. Can you please check?', 
        timestamp: 'Sep 26, 2025 11:20 AM' 
      },
      { 
        id: 'msg-6', 
        sender: 'admin', 
        senderName: 'Admin Support', 
        text: 'Looking into the payment gateway logs. Will update you within 2 hours.', 
        timestamp: 'Sep 26, 2025 12:00 PM' 
      },
    ]
  },
  { 
    id: 'TKT-A004', 
    issueTitle: 'Payment delay clarification needed',
    issueType: 'Payment Delay',
    priority: 'Medium',
    status: 'Resolved',
    assignedTo: 'Admin Support',
    createdAt: '2025-09-20', 
    updatedAt: '2025-09-22',
    messages: [
      { 
        id: 'msg-7', 
        sender: 'accounts', 
        senderName: 'Accounts Team', 
        text: 'Vendor is asking about payment delay for Invoice #INV-5432. Payment was due on Sept 18. Please advise.', 
        timestamp: 'Sep 20, 2025 03:30 PM' 
      },
      { 
        id: 'msg-8', 
        sender: 'admin', 
        senderName: 'Admin Support', 
        text: 'Checked with finance. Payment will be released tomorrow. You can inform the vendor.', 
        timestamp: 'Sep 21, 2025 10:15 AM' 
      },
      { 
        id: 'msg-9', 
        sender: 'accounts', 
        senderName: 'Accounts Team', 
        text: 'Payment has been released. Closing this ticket. Thank you!', 
        timestamp: 'Sep 22, 2025 02:45 PM' 
      },
    ]
  },
  { 
    id: 'TKT-A005', 
    issueTitle: 'Invoice format not supported',
    issueType: 'Others',
    priority: 'Low',
    status: 'Resolved',
    assignedTo: 'Admin Support',
    createdAt: '2025-09-15', 
    updatedAt: '2025-09-16',
    messages: [
      { 
        id: 'msg-10', 
        sender: 'accounts', 
        senderName: 'Accounts Team', 
        text: 'Received an invoice in a non-standard format from vendor. Cannot process it in current system.', 
        timestamp: 'Sep 15, 2025 09:00 AM',
        attachments: [{ name: 'invoice_sample.pdf', url: '#' }]
      },
      { 
        id: 'msg-11', 
        sender: 'admin', 
        senderName: 'Admin Support', 
        text: 'I have updated the system to accept this format. You can try uploading again.', 
        timestamp: 'Sep 16, 2025 11:30 AM' 
      },
      { 
        id: 'msg-12', 
        sender: 'accounts', 
        senderName: 'Accounts Team', 
        text: 'Works perfectly now. Thanks for the quick fix!', 
        timestamp: 'Sep 16, 2025 12:00 PM' 
      },
    ]
  },
]

export default function AccountsSupport() {
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
      id: `TKT-A${String(6 + tickets.length).padStart(3, '0')}`,
      issueTitle: draftIssueTitle,
      issueType: draftIssue as IssueType,
      priority: draftPriority as TicketPriority,
      status: 'Open',
      assignedTo: '-',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      messages: [{
        id: `msg-${Date.now()}`,
        sender: 'accounts',
        senderName: 'Accounts Team',
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
      sender: 'accounts',
      senderName: 'Accounts Team',
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
    <div className="p-3 sm:p-6 font-sans text-primary" style={{ background: 'transparent' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-5 gap-3">
        <h2 className="font-heading text-secondary text-xl sm:text-2xl font-semibold">Account Support</h2>
        <button
          onClick={() => setShowNewTicket(true)}
          className="bg-accent text-button-text rounded-full px-4 py-2.5 border border-transparent flex items-center justify-center gap-2 w-full sm:w-auto"
        >
          <Plus size={16} />
          <span>Raise New Ticket</span>
        </button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5">
        <div className="rounded-2xl p-3 sm:p-4 shadow-md bg-white">
          <div className="text-xs sm:text-sm text-gray-600">Open Tickets</div>
          <div className="text-2xl sm:text-3xl font-semibold text-secondary mt-1">{openTickets}</div>
        </div>
        <div className="rounded-2xl p-3 sm:p-4 shadow-md bg-amber-50">
          <div className="text-xs sm:text-sm text-gray-700">In Progress</div>
          <div className="text-2xl sm:text-3xl font-semibold text-amber-700 mt-1">{inProgressTickets}</div>
        </div>
        <div className="rounded-2xl p-3 sm:p-4 shadow-md bg-green-50">
          <div className="text-xs sm:text-sm text-gray-700">Resolved This Week</div>
          <div className="text-2xl sm:text-3xl font-semibold text-green-700 mt-1">{resolvedThisWeek}</div>
        </div>
        <div className="rounded-2xl p-3 sm:p-4 shadow-md bg-blue-50">
          <div className="text-xs sm:text-sm text-gray-700">Avg Resolution Time</div>
          <div className="text-2xl sm:text-3xl font-semibold text-blue-700 mt-1">{avgResolutionHours} hrs</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 items-stretch sm:items-center mb-4 bg-white border border-secondary/20 rounded-xl p-3">
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
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
            className="min-w-0 flex-1 sm:flex-none"
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
            className="min-w-0 flex-1 sm:flex-none"
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
            className="min-w-0 flex-1 sm:flex-none"
          />
          <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-300 text-sm min-w-0 flex-1 sm:flex-none hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200" />
        </div>
        <div className="flex gap-3 flex-1 sm:flex-none">
          <input placeholder="Search ticket / issue" value={search} onChange={e => setSearch(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-300 text-sm flex-1 hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200" />
          <button onClick={resetFilters} className="bg-white text-secondary border border-secondary rounded-full px-4 py-2 text-sm whitespace-nowrap hover:bg-secondary hover:text-white transition-colors duration-200">Reset</button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-header-bg rounded-xl">
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 whitespace-nowrap">
          <thead>
            <tr className="bg-white">
              {['Ticket ID','Issue Title','Issue Type','Priority','Status','Assigned To','Created / Updated','Actions'].map(h => (
                <th key={h} className="text-left p-3 font-heading text-secondary font-normal whitespace-nowrap">{h}</th>
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
            <div className="p-6 text-center text-gray-500">No tickets match current filters.</div>
          ) : (
            <div className="p-3 space-y-3">
              {filteredTickets.map((t) => (
                <div key={t.id} className="bg-white rounded-lg p-4 shadow-sm border">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-secondary text-sm">{t.id}</h3>
                      <p className="text-xs text-gray-600 mt-1">{t.issueTitle}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => setDrawerTicket(t)} className="bg-white text-secondary border border-secondary rounded-full px-2 py-1 text-xs">View</button>
                      <button onClick={() => resolveTicket(t)} className="bg-white text-secondary border border-secondary rounded-full px-2 py-1 text-xs">Resolve</button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <div>
                      <div className="text-xs text-gray-500">Issue Type</div>
                      <div className="text-sm font-medium">{t.issueType}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Assigned To</div>
                      <div className="text-sm font-medium">{t.assignedTo}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
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
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl p-4 sm:p-5 max-h-[90vh] overflow-y-auto">
            <div className="mb-3">
              <h3 className="font-heading text-secondary font-normal text-lg sm:text-xl">Raise New Ticket</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-sm font-medium mb-1 text-secondary">Issue Title</label>
                <input value={draftIssueTitle} onChange={e => setDraftIssueTitle(e.target.value)} placeholder="Brief description of the issue" className="w-full px-2.5 py-2 rounded-lg border border-gray-300 text-sm hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-secondary">Issue Type</label>
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
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-sm font-medium mb-1 text-secondary">Attachments (Invoice/Screenshots)</label>
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
                    <div className="text-xs text-gray-500">Issue Title</div>
                    <div className="font-medium text-sm">{drawerTicket.issueTitle}</div>
                  </div>
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-500">Assigned To</div>
                    <div className="font-medium text-sm">{drawerTicket.assignedTo}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Created / Updated</div>
                    <div className="font-medium text-sm">{drawerTicket.createdAt} / {drawerTicket.updatedAt}</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button onClick={() => resolveTicket(drawerTicket)} className="bg-accent text-button-text rounded-full px-3 py-1.5 text-sm hover:opacity-90 transition-opacity">Mark as Resolved</button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-gray-50">
              <div className="text-sm font-medium text-gray-700 mb-3">Conversation</div>
              <div className="space-y-3">
                {drawerTicket.messages && drawerTicket.messages.length > 0 ? (
                  drawerTicket.messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender === 'accounts' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[80%] sm:max-w-[75%] ${msg.sender === 'accounts' ? 'bg-blue-600 text-white' : 'bg-white text-gray-800'} rounded-2xl p-3 shadow-sm`}>
                        <div className={`text-xs mb-1 ${msg.sender === 'accounts' ? 'text-blue-100' : 'text-gray-500'}`}>
                          {msg.senderName} • {msg.timestamp}
                        </div>
                        <div className="text-sm leading-relaxed">{msg.text}</div>
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {msg.attachments.map((att, idx) => (
                              <div key={idx} className={`text-xs flex items-center gap-1 ${msg.sender === 'accounts' ? 'text-blue-100' : 'text-blue-600'}`}>
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