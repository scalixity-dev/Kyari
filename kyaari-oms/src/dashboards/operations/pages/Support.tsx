import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Send, Paperclip, FileDown } from 'lucide-react'
import { CustomDropdown } from '../../../components'

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
  Open: { bg: '#DBEAFE', color: '#1E3A8A', border: '#BFDBFE' },
  'In Progress': { bg: '#DDD6FE', color: '#5B21B6', border: '#C4B5FD' },
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
  const [search, setSearch] = useState('')

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

  function exportCSV() {
    const headers = ['Ticket ID','Issue Type','Description','Priority','Status','Date Created','Last Updated']
    const rows = filteredTickets.map(t => [
      t.id,
      t.issueType,
      '"' + t.description.replace(/"/g, '""') + '"',
      t.priority,
      t.status,
      t.createdAt,
      t.updatedAt
    ])
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ops-support-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  function exportPDF() {
    // Simple text export standing in for PDF; integrates with jsPDF later if needed
    const lines = filteredTickets.map(t => `${t.id} | ${t.issueType} | ${t.priority} | ${t.status} | ${t.createdAt}`)
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `ops-support-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    window.URL.revokeObjectURL(url)
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

  return (
    <div className="p-4 sm:p-6 md:p-8 font-sans text-primary" style={{ background: 'transparent' }}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-5 gap-3">
        <h2 className="font-heading text-secondary text-xl sm:text-2xl font-semibold">Operations Support</h2>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={exportCSV} className="bg-white text-secondary border border-secondary rounded-full px-3 py-2 flex items-center gap-1 text-sm min-h-[44px]">
            <FileDown size={16} className="flex-shrink-0" /> CSV
          </button>
          <button onClick={exportPDF} className="bg-white text-secondary border border-secondary rounded-full px-3 py-2 flex items-center gap-1 text-sm min-h-[44px]">
            <FileDown size={16} className="flex-shrink-0" /> PDF
          </button>
          <button onClick={() => setShowNewTicket(true)} className="bg-accent text-button-text rounded-full px-4 py-2.5 border border-transparent flex items-center gap-2 min-h-[44px] text-sm sm:text-base">
            <Plus size={16} className="flex-shrink-0" />
            <span>Raise New Ticket</span>
          </button>
        </div>
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <div className="rounded-2xl p-4 shadow-md bg-white">
          <div className="text-xs sm:text-sm text-gray-600">Open Tickets</div>
          <div className="text-2xl sm:text-3xl font-semibold text-secondary mt-1">{openTickets}</div>
        </div>
        <div className="rounded-2xl p-4 shadow-md bg-blue-50">
          <div className="text-xs sm:text-sm text-gray-700">In Progress</div>
          <div className="text-2xl sm:text-3xl font-semibold text-blue-700 mt-1">{inProgressTickets}</div>
        </div>
        <div className="rounded-2xl p-4 shadow-md bg-green-50">
          <div className="text-xs sm:text-sm text-gray-700">Resolved</div>
          <div className="text-2xl sm:text-3xl font-semibold text-green-700 mt-1">{resolvedTickets}</div>
        </div>
        <div className="rounded-2xl p-4 shadow-md bg-white">
          <div className="text-xs sm:text-sm text-gray-600">Avg Resolution Time</div>
          <div className="text-2xl sm:text-3xl font-semibold text-secondary mt-1">4.2 hrs</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center mb-4 bg-white border border-secondary/20 rounded-xl p-3">
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
          className="w-auto"
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
          className="w-auto"
        />
        <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-300 min-h-[44px] text-sm sm:text-base hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200" />
        <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-300 min-h-[44px] text-sm sm:text-base hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200" />
        <input placeholder="Search by Ticket ID or description" value={search} onChange={e => setSearch(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-300 flex-1 min-w-[200px] sm:min-w-[240px] min-h-[44px] text-sm sm:text-base hover:border-accent focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all duration-200" />
        <button onClick={resetFilters} className="bg-white text-secondary border border-secondary rounded-full px-4 py-2 min-h-[44px] text-sm sm:text-base hover:bg-secondary hover:text-white transition-colors duration-200">Reset</button>
      </div>

      {/* Desktop Table */}
      <div className="bg-header-bg rounded-xl hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 whitespace-nowrap">
            <thead>
              <tr className="bg-white">
                {['Ticket ID','Issue Type','Description','Priority','Status','Date Created','Last Updated','Actions'].map(h => (
                  <th key={h} className="text-left p-3 font-heading text-secondary font-normal whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredTickets.map((t, idx) => (
                <tr key={t.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-header-bg'}>
                  <td className="p-3 whitespace-nowrap">{t.id}</td>
                  <td className="p-3 whitespace-nowrap">{t.issueType}</td>
                  <td className="p-3 whitespace-nowrap max-w-[480px] truncate" title={t.description}>{t.description}</td>
                  <td className="p-3 whitespace-nowrap">
                    {(() => {
                      const st = PRIORITY_STYLES[t.priority]
                      return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border" style={{ backgroundColor: st.bg, color: st.color, borderColor: st.border }}>{t.priority}</span>
                    })()}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    {(() => {
                      const st = STATUS_STYLES[t.status]
                      return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border" style={{ backgroundColor: st.bg, color: st.color, borderColor: st.border }}>{t.status}</span>
                    })()}
                  </td>
                  <td className="p-3 whitespace-nowrap">{t.createdAt}</td>
                  <td className="p-3 whitespace-nowrap">{t.updatedAt}</td>
                  <td className="p-3 whitespace-nowrap">
                    <div className="flex gap-2">
                      <button onClick={() => setDrawerTicket(t)} className="bg-white text-secondary border border-secondary rounded-full px-2.5 py-1.5 text-sm">View</button>
                      <button onClick={() => setDrawerTicket(t)} className="bg-white text-secondary border border-secondary rounded-full px-2.5 py-1.5 text-sm">Chat</button>
                      <button onClick={() => markClosed(t)} className="bg-white text-secondary border border-secondary rounded-full px-2.5 py-1.5 text-sm">Close</button>
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
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {filteredTickets.map((t) => (
          <div key={t.id} className="bg-white rounded-xl p-4 shadow-md border border-secondary/20">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="text-xs text-gray-500 mb-0.5">Ticket ID</div>
                <div className="font-semibold text-secondary">{t.id}</div>
              </div>
              <div className="flex gap-2">
                {(() => {
                  const st = PRIORITY_STYLES[t.priority]
                  return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0" style={{ backgroundColor: st.bg, color: st.color, borderColor: st.border }}>{t.priority}</span>
                })()}
                {(() => {
                  const st = STATUS_STYLES[t.status]
                  return <span className="inline-block px-2.5 py-1 rounded-full text-xs font-semibold border flex-shrink-0" style={{ backgroundColor: st.bg, color: st.color, borderColor: st.border }}>{t.status}</span>
                })()}
              </div>
            </div>

            <div className="mb-3">
              <div className="text-xs text-gray-500 mb-0.5">Issue Type</div>
              <div className="text-sm font-medium">{t.issueType}</div>
            </div>

            <div className="mb-3">
              <div className="text-xs text-gray-500 mb-0.5">Description</div>
              <div className="text-sm line-clamp-2" title={t.description}>{t.description}</div>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <div className="text-xs text-gray-500 mb-0.5">Date Created</div>
                <div className="text-sm">{t.createdAt}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-0.5">Last Updated</div>
                <div className="text-sm">{t.updatedAt}</div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <button onClick={() => setDrawerTicket(t)} className="w-full bg-accent text-button-text rounded-full px-4 py-2 text-sm min-h-[44px]">View & Chat</button>
              <button onClick={() => markClosed(t)} className="w-full bg-white text-secondary border border-secondary rounded-full px-4 py-2 text-sm min-h-[44px]">Close Ticket</button>
            </div>
          </div>
        ))}
        {filteredTickets.length === 0 && (
          <div className="bg-white rounded-xl p-6 text-center text-gray-500">No tickets match current filters.</div>
        )}
      </div>

      {/* Raise Ticket Modal */}
      {showNewTicket && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white w-full max-w-[680px] rounded-2xl p-4 sm:p-5 max-h-[90vh] overflow-y-auto">
            <div className="mb-3 sm:mb-4">
              <h3 className="font-heading text-secondary font-normal text-lg sm:text-xl">Raise New Ticket</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium mb-1 text-secondary">Issue Type</label>
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
                <label className="block text-xs sm:text-sm font-medium mb-1 text-secondary">Priority</label>
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
                <label className="block text-xs sm:text-sm font-medium mb-1">Attachments (optional)</label>
                <input type="file" onChange={e => setDraftFile(e.target.files?.[0] || null)} className="w-full px-2.5 py-2 rounded-lg border border-gray-300 text-sm" />
                {draftFile && (
                  <div className="mt-1 text-xs text-gray-600">Selected: {draftFile.name}</div>
                )}
              </div>
              <div className="col-span-1 sm:col-span-2">
                <label className="block text-xs sm:text-sm font-medium mb-1">Description</label>
                <textarea value={draftDescription} onChange={e => setDraftDescription(e.target.value)} rows={4} placeholder="Describe the issue..." className="w-full px-2.5 py-2 rounded-lg border border-gray-300 min-h-[100px] text-sm sm:text-base" />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 mt-4">
              <button onClick={() => setShowNewTicket(false)} className="w-full sm:w-auto bg-white text-secondary border border-secondary rounded-full px-3.5 py-2 min-h-[44px] text-sm sm:text-base">Cancel</button>
              <button onClick={addTicket} className="w-full sm:w-auto bg-accent text-button-text rounded-full px-3.5 py-2 min-h-[44px] text-sm sm:text-base">Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer with details + chat */}
      {drawerTicket && (
        <div className="fixed inset-0 z-50">
          <div className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ease-out ${isDrawerOpen ? 'opacity-100' : 'opacity-0'}`} onClick={closeDrawer} />
          <div className={`absolute top-0 right-0 h-full w-full sm:w-[90%] md:w-[500px] bg-white shadow-xl flex flex-col transform transition-transform duration-300 ease-out ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="p-4 sm:p-5 border-b flex-shrink-0">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-xs text-gray-500">Ticket</div>
                  <div className="text-lg sm:text-xl font-semibold text-secondary">{drawerTicket.id}</div>
                </div>
                <button onClick={closeDrawer} className="text-gray-500 hover:text-gray-700 text-2xl leading-none min-w-[44px] min-h-[44px] flex items-center justify-center">✕</button>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-500">Issue Type</div>
                    <div className="font-medium text-xs sm:text-sm">{drawerTicket.issueType}</div>
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
                  <div className="text-xs sm:text-sm leading-relaxed">{drawerTicket.description}</div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-500">Date Created</div>
                    <div className="font-medium text-xs sm:text-sm">{drawerTicket.createdAt}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Last Updated</div>
                    <div className="font-medium text-xs sm:text-sm">{drawerTicket.updatedAt}</div>
                  </div>
                </div>

                <div className="flex gap-2 mt-2">
                  <button onClick={() => markClosed(drawerTicket)} className="bg-accent text-button-text rounded-full px-3 py-1.5 text-xs sm:text-sm hover:opacity-90 transition-opacity min-h-[44px]">Mark as Closed</button>
                </div>
              </div>
            </div>

            {/* Chat */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-5 bg-gray-50">
              <div className="text-sm font-medium text-gray-700 mb-3">Conversation</div>
              <div className="space-y-3">
                {drawerTicket.messages && drawerTicket.messages.length > 0 ? (
                  drawerTicket.messages.map(m => (
                    <div key={m.id} className={`flex ${m.sender === 'ops' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[85%] sm:max-w-[75%] ${m.sender === 'ops' ? 'bg-blue-600 text-white' : 'bg-white text-gray-800'} rounded-2xl p-3 shadow-sm`}>
                        <div className={`text-xs mb-1 ${m.sender === 'ops' ? 'text-blue-100' : 'text-gray-500'}`}>{m.senderName} • {m.timestamp}</div>
                        <div className="text-xs sm:text-sm leading-relaxed">{m.text}</div>
                        {m.attachments && m.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {m.attachments.map((att, idx) => (
                              <div key={idx} className={`text-xs flex items-center gap-1 ${m.sender === 'ops' ? 'text-blue-100' : 'text-blue-600'}`}>
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
            <div className="p-3 sm:p-4 border-t bg-white flex-shrink-0">
              {chatAttachment && (
                <div className="mb-2 px-3 py-2 bg-gray-100 rounded-lg flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700 min-w-0">
                    <Paperclip size={14} className="flex-shrink-0" />
                    <span className="truncate">{chatAttachment.name}</span>
                  </div>
                  <button onClick={() => setChatAttachment(null)} className="text-gray-500 hover:text-gray-700 ml-2 flex-shrink-0 min-w-[24px] min-h-[24px]">✕</button>
                </div>
              )}
              <div className="flex items-end gap-2">
                <input ref={fileInputRef} type="file" className="hidden" onChange={e => setChatAttachment(e.target.files?.[0] || null)} />
                <button onClick={() => fileInputRef.current?.click()} className="flex-shrink-0 p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center" title="Attach file">
                  <Paperclip size={18} />
                </button>
                <textarea
                  value={messageText}
                  onChange={e => setMessageText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault()
                      sendMessage()
                    }
                  }}
                  placeholder="Type your message..."
                  className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-xs sm:text-sm"
                  rows={2}
                />
                <button onClick={sendMessage} disabled={!messageText.trim()} className="flex-shrink-0 p-2.5 bg-accent text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed min-w-[44px] min-h-[44px] flex items-center justify-center" title="Send message">
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


