import { useMemo, useState, useEffect, useRef } from 'react'
import { Plus, Send, Paperclip } from 'lucide-react'
import { Link } from 'react-router-dom'
import { CustomDropdown } from '../../../components'

type IssueType = 'Mismatch' | 'Missing Item' | 'Damaged Item' | 'Escalation' | 'Others'
type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent'
type TicketStatus = 'Open' | 'Under Review' | 'Escalated' | 'Resolved' | 'Closed'

type Message = {
  id: string
  sender: 'admin' | 'store'
  senderName: string
  text: string
  timestamp: string
  attachments?: { name: string; url: string }[]
}

type Ticket = {
  id: string
  orderId: string
  store: string
  issue: IssueType
  priority: TicketPriority
  status: TicketStatus
  assignedTo: string
  createdAt: string
  updatedAt: string
  attachments?: string[]
  description?: string
  slaHours: number
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
  'Under Review': { bg: '#DBEAFE', color: '#1E3A8A', border: '#BFDBFE' },
  Escalated: { bg: '#FEE2E2', color: '#B91C1C', border: '#FECACA' },
  Resolved: { bg: '#D1FAE5', color: '#065F46', border: '#A7F3D0' },
  Closed: { bg: '#E5E7EB', color: '#111827', border: '#D1D5DB' },
}

const INITIAL_TICKETS: Ticket[] = [
  { 
    id: 'OPS-8001', 
    orderId: 'ORD-120045', 
    store: 'Koramangala BLR', 
    issue: 'Mismatch', 
    priority: 'High', 
    status: 'Open', 
    assignedTo: 'Ravi', 
    createdAt: '2025-09-20', 
    updatedAt: '2025-09-20', 
    description: 'Qty mismatch between manifest and delivery.', 
    slaHours: 24,
    messages: [
      { id: 'msg-1', sender: 'store', senderName: 'Koramangala BLR', text: 'Received 10 planters but manifest shows 12. Please verify.', timestamp: '2025-09-20 11:00 AM' },
      { id: 'msg-2', sender: 'admin', senderName: 'Ravi', text: 'Looking into this discrepancy. Checking with warehouse team.', timestamp: '2025-09-20 02:30 PM' },
    ]
  },
  { 
    id: 'OPS-8002', 
    orderId: 'ORD-120081', 
    store: 'HSR BLR', 
    issue: 'Missing Item', 
    priority: 'Urgent', 
    status: 'Escalated', 
    assignedTo: 'Priya', 
    createdAt: '2025-09-18', 
    updatedAt: '2025-09-21', 
    description: 'One planter missing from shipment.', 
    slaHours: 12,
    messages: [
      { id: 'msg-3', sender: 'store', senderName: 'HSR BLR', text: 'One large ceramic planter is missing from Order #ORD-120081.', timestamp: '2025-09-18 09:00 AM' },
      { id: 'msg-4', sender: 'admin', senderName: 'Priya', text: 'This has been escalated. We are arranging replacement immediately.', timestamp: '2025-09-18 10:15 AM' },
      { id: 'msg-5', sender: 'store', senderName: 'HSR BLR', text: 'Customer is waiting. Please expedite.', timestamp: '2025-09-21 09:30 AM' },
    ]
  },
  { 
    id: 'OPS-8003', 
    orderId: 'ORD-119988', 
    store: 'Powai MUM', 
    issue: 'Damaged Item', 
    priority: 'Medium', 
    status: 'Under Review', 
    assignedTo: 'Naresh', 
    createdAt: '2025-09-19', 
    updatedAt: '2025-09-22', 
    description: 'Cracked ceramic pot received.', 
    slaHours: 36,
    messages: [
      { id: 'msg-6', sender: 'store', senderName: 'Powai MUM', text: 'Received ceramic pot with visible cracks. Cannot sell this to customer.', timestamp: '2025-09-19 03:00 PM' },
      { id: 'msg-7', sender: 'admin', senderName: 'Naresh', text: 'Please send photos. We will process replacement or refund.', timestamp: '2025-09-22 10:45 AM' },
    ]
  },
  { 
    id: 'OPS-8004', 
    orderId: 'ORD-119701', 
    store: 'Wakad PUN', 
    issue: 'Escalation', 
    priority: 'Low', 
    status: 'Resolved', 
    assignedTo: 'Anita', 
    createdAt: '2025-09-10', 
    updatedAt: '2025-09-15', 
    description: 'Store escalated due to repeated delays.', 
    slaHours: 48,
    messages: [
      { id: 'msg-8', sender: 'store', senderName: 'Wakad PUN', text: 'This is the third delayed delivery this month. Need resolution.', timestamp: '2025-09-10 11:00 AM' },
      { id: 'msg-9', sender: 'admin', senderName: 'Anita', text: 'We apologize for the inconvenience. Implementing better logistics tracking.', timestamp: '2025-09-10 04:00 PM' },
      { id: 'msg-10', sender: 'admin', senderName: 'Anita', text: 'Issue has been resolved. New SOP in place to prevent future delays.', timestamp: '2025-09-15 02:00 PM' },
    ]
  },
  { 
    id: 'OPS-8005', 
    orderId: 'ORD-120101', 
    store: 'Whitefield BLR', 
    issue: 'Others', 
    priority: 'High', 
    status: 'Open', 
    assignedTo: 'Arjun', 
    createdAt: '2025-09-25', 
    updatedAt: '2025-09-25', 
    description: 'General operational discrepancy.', 
    slaHours: 24,
    messages: [
      { id: 'msg-11', sender: 'store', senderName: 'Whitefield BLR', text: 'Multiple items in wrong packaging. Need clarification on SKUs.', timestamp: '2025-09-25 01:00 PM' },
    ]
  },
]

export default function OpsSupport() {
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS)

  const [filterIssue, setFilterIssue] = useState<IssueType | ''>('')
  const [filterStatus, setFilterStatus] = useState<TicketStatus | ''>('')
  const [filterPriority, setFilterPriority] = useState<TicketPriority | ''>('')
  const [filterDate, setFilterDate] = useState('')
  const [search, setSearch] = useState('')

  const [showNewTicket, setShowNewTicket] = useState(false)
  const [drawerTicket, setDrawerTicket] = useState<Ticket | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  const [draftOrderId, setDraftOrderId] = useState('')
  const [draftStore, setDraftStore] = useState('')
  const [draftIssue, setDraftIssue] = useState<IssueType | ''>('')
  const [draftPriority, setDraftPriority] = useState<TicketPriority | ''>('')
  const [draftDescription, setDraftDescription] = useState('')
  const [draftFile, setDraftFile] = useState<File | null>(null)

  // chat
  const [messageText, setMessageText] = useState('')
  const [chatAttachment, setChatAttachment] = useState<File | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const stores = useMemo(() => Array.from(new Set(tickets.map(t => t.store))).sort(), [tickets])

  const openOpsTickets = tickets.filter(t => t.status === 'Open' || t.status === 'Under Review').length
  const storeMismatchReports = tickets.filter(t => t.issue === 'Mismatch').length
  const escalatedCases = tickets.filter(t => t.status === 'Escalated').length
  const avgResolutionDays = 2.1

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      if (filterIssue && t.issue !== filterIssue) return false
      if (filterStatus && t.status !== filterStatus) return false
      if (filterPriority && t.priority !== filterPriority) return false
      if (filterDate && t.createdAt !== filterDate) return false
      if (search) {
        const q = search.toLowerCase()
        const hit = t.id.toLowerCase().includes(q) || t.orderId.toLowerCase().includes(q) || t.store.toLowerCase().includes(q)
        if (!hit) return false
      }
      return true
    })
  }, [tickets, filterIssue, filterStatus, filterPriority, filterDate, search])

  function resetFilters() {
    setFilterIssue('')
    setFilterStatus('')
    setFilterPriority('')
    setFilterDate('')
    setSearch('')
  }

  function addTicket() {
    if (!draftOrderId || !draftStore || !draftIssue || !draftPriority || !draftDescription) {
      alert('Please fill all required fields')
      return
    }
    const newTicket: Ticket = {
      id: `OPS-${8000 + tickets.length + 1}`,
      orderId: draftOrderId,
      store: draftStore,
      issue: draftIssue as IssueType,
      priority: draftPriority as TicketPriority,
      status: 'Open',
      assignedTo: '-',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      description: draftDescription,
      attachments: draftFile ? [draftFile.name] : [],
      slaHours: draftPriority === 'Urgent' ? 12 : draftPriority === 'High' ? 24 : draftPriority === 'Medium' ? 36 : 48,
    }
    setTickets(prev => [newTicket, ...prev])
    setShowNewTicket(false)
    setDraftOrderId('')
    setDraftStore('')
    setDraftIssue('')
    setDraftPriority('')
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

// function closeTicket(t: Ticket) {
//   setTickets(prev => prev.map(x => x.id === t.id ? { ...x, status: 'Closed', updatedAt: new Date().toISOString().split('T')[0] } : x))
// }

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

  useEffect(() => {
    const interval = setInterval(() => {
      setTickets(prev => {
        const now = new Date().getTime()
        return prev.map(t => {
          if (t.status === 'Open' || t.status === 'Under Review') {
            const created = new Date(t.createdAt + 'T00:00:00').getTime()
            const elapsedHours = (now - created) / (1000 * 60 * 60)
            if (elapsedHours > t.slaHours) {
              return { ...t, status: 'Escalated', updatedAt: new Date().toISOString().split('T')[0] }
            }
          }
          return t
        })
      })
    }, 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (drawerTicket) {
      const rafId = requestAnimationFrame(() => setIsDrawerOpen(true))
      return () => cancelAnimationFrame(rafId)
    }
    return undefined
  }, [drawerTicket])

  function closeDrawer() {
    setIsDrawerOpen(false)
    setMessageText('')
    setChatAttachment(null)
    setTimeout(() => setDrawerTicket(null), 300)
  }

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' })
    }
  }, [drawerTicket?.messages])

  return (
    <div className="p-3 sm:p-4 md:p-6 font-sans text-primary" style={{ background: 'transparent' }}>
      <div className="flex items-start justify-between gap-3 mb-4 sm:mb-5">
        <div className="flex-1 min-w-0">
          <h2 className="font-heading text-secondary text-xl sm:text-2xl font-semibold">OPS Support</h2>
          <div className="text-sm text-gray-600 mt-1">Manage operational discrepancies, store tickets, and escalations.</div>
        </div>
        <button
          onClick={() => setShowNewTicket(true)}
          className="bg-accent text-button-text rounded-full px-4 py-2.5 min-h-[44px] border border-transparent flex items-center gap-2 whitespace-nowrap flex-shrink-0"
        >
          <Plus size={16} />
          <span>Raise New Ticket</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-5">
        <div className="rounded-2xl p-4 shadow-md bg-white">
          <div className="text-sm text-gray-600">Open Ops Tickets</div>
          <div className="text-2xl sm:text-3xl font-semibold text-secondary mt-1">{openOpsTickets}</div>
        </div>
        <div className="rounded-2xl p-4 shadow-md bg-amber-50">
          <div className="text-sm text-gray-700">Store Mismatch Reports</div>
          <div className="text-2xl sm:text-3xl font-semibold text-amber-700 mt-1">{storeMismatchReports}</div>
        </div>
        <div className="rounded-2xl p-4 shadow-md bg-red-50">
          <div className="text-sm text-gray-700">Escalated Cases</div>
          <div className="text-2xl sm:text-3xl font-semibold text-red-600 mt-1">{escalatedCases}</div>
        </div>
        <div className="rounded-2xl p-4 shadow-md bg-blue-50">
          <div className="text-sm text-gray-700">Avg Resolution Time (Days)</div>
          <div className="text-2xl sm:text-3xl font-semibold text-blue-700 mt-1">{avgResolutionDays}</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-2 sm:gap-3 items-stretch sm:items-center mb-4 bg-white border border-secondary/20 rounded-xl p-3">
        <CustomDropdown
          value={filterIssue}
          onChange={(value) => setFilterIssue(value as IssueType | '')}
          options={[
            { value: '', label: 'Issue Type' },
            { value: 'Mismatch', label: 'Mismatch' },
            { value: 'Missing Item', label: 'Missing Item' },
            { value: 'Damaged Item', label: 'Damaged Item' },
            { value: 'Escalation', label: 'Escalation' },
            { value: 'Others', label: 'Others' }
          ]}
          placeholder="Issue Type"
          className="w-full sm:w-auto"
        />
        <CustomDropdown
          value={filterStatus}
          onChange={(value) => setFilterStatus(value as TicketStatus | '')}
          options={[
            { value: '', label: 'Status' },
            { value: 'Open', label: 'Open' },
            { value: 'Under Review', label: 'Under Review' },
            { value: 'Escalated', label: 'Escalated' },
            { value: 'Resolved', label: 'Resolved' },
            { value: 'Closed', label: 'Closed' }
          ]}
          placeholder="Status"
          className="w-full sm:w-auto"
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
          className="w-full sm:w-auto"
        />
        <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="px-3 py-2 min-h-[44px] rounded-xl border border-gray-300 w-full sm:w-auto" />
        <input placeholder="Search ticket / order / store" value={search} onChange={e => setSearch(e.target.value)} className="px-3 py-2 min-h-[44px] rounded-xl border border-gray-300 w-full sm:flex-1 sm:min-w-[220px]" />
        <button onClick={resetFilters} className="bg-white text-secondary border border-secondary rounded-full px-4 py-2 min-h-[44px] w-full sm:w-auto">Reset</button>
      </div>

      {/* Table - Desktop view (hidden on mobile) */}
      <div className="hidden md:block bg-header-bg rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 whitespace-nowrap">
          <thead>
            <tr className="bg-white">
              {['Ticket ID','Store Name','Order ID','Issue Type','Priority','Status','Assigned To','Created Date','Actions'].map(h => (
                <th key={h} className="text-left p-3 font-heading text-secondary font-normal whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredTickets.map((t, idx) => (
              <tr key={t.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-header-bg'}>
                <td className="p-3 whitespace-nowrap">{t.id}</td>
                <td className="p-3 whitespace-nowrap">{t.store}</td>
                <td className="p-3 whitespace-nowrap">
                  <Link to={`/admin/orders/${t.orderId}`} className="underline text-blue-700">{t.orderId}</Link>
                </td>
                <td className="p-3 whitespace-nowrap">{t.issue}</td>
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
                <td className="p-3 whitespace-nowrap">{t.createdAt}</td>
                <td className="p-3 whitespace-nowrap">
                  <div className="flex gap-2">
                    <button onClick={() => setDrawerTicket(t)} className="bg-white text-secondary border border-secondary rounded-full px-2.5 py-1.5 text-sm">View</button>
                    <button onClick={() => assignTicket(t)} className="bg-white text-secondary border border-secondary rounded-full px-2.5 py-1.5 text-sm">Assign</button>
                    <button onClick={() => setTickets(prev => prev.map(x => x.id === t.id ? { ...x, status: 'Under Review', updatedAt: new Date().toISOString().split('T')[0] } : x))} className="bg-white text-secondary border border-secondary rounded-full px-2.5 py-1.5 text-sm">Review</button>
                    <button onClick={() => resolveTicket(t)} className="bg-white text-secondary border border-secondary rounded-full px-2.5 py-1.5 text-sm">Resolve</button>
                    <button onClick={() => escalateTicket(t)} className="bg-white text-red-600 border border-red-600 rounded-full px-2.5 py-1.5 text-sm">Escalate</button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredTickets.length === 0 && (
              <tr>
                <td colSpan={9} className="p-6 text-center text-gray-500">No tickets match current filters.</td>
              </tr>
            )}
          </tbody>
          </table>
        </div>
      </div>

      {/* Card View - Mobile (visible on mobile and tablet) */}
      <div className="md:hidden space-y-3">
        {filteredTickets.length > 0 ? (
          filteredTickets.map(t => (
            <div key={t.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-200">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-secondary text-base">{t.id}</div>
                  <div className="text-sm text-gray-600 mt-0.5">{t.store}</div>
                  <div className="text-sm text-blue-700 mt-0.5">
                    <Link to={`/admin/orders/${t.orderId}`} className="underline">{t.orderId}</Link>
                  </div>
                </div>
                <div className="flex gap-1.5 flex-shrink-0 ml-2">
                  {(() => {
                    const st = PRIORITY_STYLES[t.priority]
                    return (
                      <span className="inline-block px-2 py-1 rounded-full text-xs font-semibold border" style={{ backgroundColor: st.bg, color: st.color, borderColor: st.border }}>
                        {t.priority}
                      </span>
                    )
                  })()}
                </div>
              </div>

              <div className="space-y-2 mb-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Issue:</span>
                  <span className="font-medium text-right">{t.issue}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Status:</span>
                  {(() => {
                    const st = STATUS_STYLES[t.status]
                    return (
                      <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border" style={{ backgroundColor: st.bg, color: st.color, borderColor: st.border }}>
                        {t.status}
                      </span>
                    )
                  })()}
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Assigned To:</span>
                  <span className="font-medium text-right">{t.assignedTo}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">SLA:</span>
                  <span className="font-medium text-right">{t.slaHours} hrs</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Created:</span>
                  <span className="font-medium text-right">{t.createdAt}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-3 border-t border-gray-100">
                <button onClick={() => setDrawerTicket(t)} className="bg-white text-secondary border border-secondary rounded-full px-3 py-2 min-h-[44px] text-sm">View</button>
                <button onClick={() => assignTicket(t)} className="bg-white text-secondary border border-secondary rounded-full px-3 py-2 min-h-[44px] text-sm">Assign</button>
                <button onClick={() => setTickets(prev => prev.map(x => x.id === t.id ? { ...x, status: 'Under Review', updatedAt: new Date().toISOString().split('T')[0] } : x))} className="bg-white text-blue-600 border border-blue-600 rounded-full px-3 py-2 min-h-[44px] text-sm">Review</button>
                <button onClick={() => resolveTicket(t)} className="bg-white text-green-600 border border-green-600 rounded-full px-3 py-2 min-h-[44px] text-sm">Resolve</button>
              </div>
              <div className="mt-2">
                <button onClick={() => escalateTicket(t)} className="bg-white text-red-600 border border-red-600 rounded-full px-3 py-2 min-h-[44px] text-sm w-full">Escalate</button>
              </div>
            </div>
          ))
        ) : (
          <div className="bg-white rounded-xl p-6 text-center text-gray-500">
            No tickets match current filters.
          </div>
        )}
      </div>

      {showNewTicket && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-white w-full max-w-[780px] rounded-2xl p-4 sm:p-5 max-h-[90vh] overflow-y-auto">
            <div className="mb-3">
              <h3 className="font-heading text-secondary font-normal text-lg sm:text-xl">Raise New Ticket</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Order ID</label>
                <input value={draftOrderId} onChange={e => setDraftOrderId(e.target.value)} placeholder="ORD-xxxxx" className="w-full px-2.5 py-2 min-h-[44px] rounded-lg border border-gray-300" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Store Name</label>
                <select value={draftStore} onChange={e => setDraftStore(e.target.value)} className="w-full px-2.5 py-2 min-h-[44px] rounded-lg border border-gray-300">
                  <option value="">Select Store</option>
                  {stores.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Issue Type</label>
                <select value={draftIssue} onChange={e => setDraftIssue(e.target.value as IssueType | '')} className="w-full px-2.5 py-2 min-h-[44px] rounded-lg border border-gray-300">
                  <option value="">Select Issue</option>
                  {(['Mismatch','Missing Item','Damaged Item','Escalation','Others'] as IssueType[]).map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select value={draftPriority} onChange={e => setDraftPriority(e.target.value as TicketPriority | '')} className="w-full px-2.5 py-2 min-h-[44px] rounded-lg border border-gray-300">
                  <option value="">Select Priority</option>
                  {(['Low','Medium','High','Urgent'] as TicketPriority[]).map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-sm font-medium mb-1">Attachments</label>
                <input 
                  type="file" 
                  accept="image/*,application/pdf"
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
            className={`absolute top-0 right-0 h-full w-full sm:w-[500px] bg-white shadow-xl flex flex-col transform transition-transform duration-300 ease-out ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 border-b flex-shrink-0">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-xs text-gray-500">Ticket</div>
                  <div className="text-lg sm:text-xl font-semibold text-secondary">{drawerTicket.id}</div>
                </div>
                <button onClick={closeDrawer} className="text-gray-500 hover:text-gray-700 text-2xl leading-none min-h-[44px] min-w-[44px] flex items-center justify-center">✕</button>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-500">Order ID</div>
                    <div className="font-medium text-sm">
                      <Link to={`/admin/orders/${drawerTicket.orderId}`} className="underline text-blue-700">{drawerTicket.orderId}</Link>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Store</div>
                    <div className="font-medium text-sm">{drawerTicket.store}</div>
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
                  <div>
                    <div className="text-xs text-gray-500">Assigned To</div>
                    <div className="font-medium text-sm">{drawerTicket.assignedTo}</div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-500">SLA</div>
                    <div className="font-medium text-sm">{drawerTicket.slaHours} hrs</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Created / Updated</div>
                    <div className="font-medium text-sm">{drawerTicket.createdAt} / {drawerTicket.updatedAt}</div>
                  </div>
                </div>

                {drawerTicket.description && (
                  <div>
                    <div className="text-xs text-gray-500 mb-1">Description</div>
                    <div className="text-sm">{drawerTicket.description}</div>
                  </div>
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-2 mt-4">
                <button onClick={() => escalateTicket(drawerTicket)} className="bg-white text-red-600 border border-red-600 rounded-full px-3 py-1.5 min-h-[44px] text-sm hover:bg-red-50 transition-colors">Escalate</button>
                <button onClick={() => resolveTicket(drawerTicket)} className="bg-accent text-button-text rounded-full px-3 py-1.5 min-h-[44px] text-sm hover:opacity-90 transition-opacity">Resolve</button>
              </div>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-gray-50">
              <div className="text-sm font-medium text-gray-700 mb-3">Chat</div>
              <div className="space-y-3">
                {drawerTicket.messages && drawerTicket.messages.length > 0 ? (
                  drawerTicket.messages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] sm:max-w-[75%] ${msg.sender === 'admin' ? 'bg-blue-600 text-white' : 'bg-white text-gray-800'} rounded-2xl p-3 shadow-sm`}>
                        <div className={`text-xs mb-1 ${msg.sender === 'admin' ? 'text-blue-100' : 'text-gray-500'}`}>
                          {msg.senderName} • {msg.timestamp}
                        </div>
                        <div className="text-sm leading-relaxed break-words">{msg.text}</div>
                        {msg.attachments && msg.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {msg.attachments.map((att, idx) => (
                              <div key={idx} className={`text-xs flex items-center gap-1 ${msg.sender === 'admin' ? 'text-blue-100' : 'text-blue-600'}`}>
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
                  <button onClick={() => setChatAttachment(null)} className="text-gray-500 hover:text-gray-700 ml-2 flex-shrink-0 min-h-[44px] min-w-[44px] flex items-center justify-center">✕</button>
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
                  className="flex-shrink-0 p-2.5 min-h-[44px] min-w-[44px] text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors flex items-center justify-center"
                  title="Attach file"
                >
                  <Paperclip size={18} />
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
                  className="flex-shrink-0 p-2.5 min-h-[44px] min-w-[44px] bg-accent text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                  title="Send message"
                >
                  <Send size={18} />
                </button>
              </div>
              <div className="text-xs text-gray-500 mt-2">Press Enter to send, Shift+Enter for new line</div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


