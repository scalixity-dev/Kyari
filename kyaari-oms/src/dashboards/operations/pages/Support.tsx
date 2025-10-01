import { useEffect, useMemo, useRef, useState } from 'react'
import { Plus, Send, Paperclip, FileDown } from 'lucide-react'

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
    <div className="p-6 font-sans text-primary" style={{ background: 'transparent' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-heading text-secondary text-2xl font-semibold">Operations Support</h2>
        <div className="flex items-center gap-2">
          <button onClick={exportCSV} className="bg-white text-secondary border border-secondary rounded-full px-3 py-2 flex items-center gap-1"><FileDown size={16} /> CSV</button>
          <button onClick={exportPDF} className="bg-white text-secondary border border-secondary rounded-full px-3 py-2 flex items-center gap-1"><FileDown size={16} /> PDF</button>
          <button onClick={() => setShowNewTicket(true)} className="bg-accent text-button-text rounded-full px-4 py-2.5 border border-transparent flex items-center gap-2">
            <Plus size={16} />
            <span>Raise New Ticket</span>
          </button>
        </div>
      </div>

      {/* Analytics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <div className="rounded-2xl p-4 shadow-md bg-white">
          <div className="text-sm text-gray-600">Open Tickets</div>
          <div className="text-3xl font-semibold text-secondary mt-1">{openTickets}</div>
        </div>
        <div className="rounded-2xl p-4 shadow-md bg-blue-50">
          <div className="text-sm text-gray-700">In Progress</div>
          <div className="text-3xl font-semibold text-blue-700 mt-1">{inProgressTickets}</div>
        </div>
        <div className="rounded-2xl p-4 shadow-md bg-green-50">
          <div className="text-sm text-gray-700">Resolved</div>
          <div className="text-3xl font-semibold text-green-700 mt-1">{resolvedTickets}</div>
        </div>
        <div className="rounded-2xl p-4 shadow-md bg-white">
          <div className="text-sm text-gray-600">Avg Resolution Time</div>
          <div className="text-3xl font-semibold text-secondary mt-1">4.2 hrs</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center mb-4 bg-white border border-secondary/20 rounded-xl p-3">
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as TicketStatus | '')} className="px-3 py-2 rounded-xl border border-gray-300">
          <option value="">Status</option>
          {(['Open','In Progress','Resolved','Closed'] as TicketStatus[]).map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value as TicketPriority | '')} className="px-3 py-2 rounded-xl border border-gray-300">
          <option value="">Priority</option>
          {(['Low','Medium','High'] as TicketPriority[]).map(p => <option key={p} value={p}>{p}</option>)}
        </select>
        <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-300" />
        <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-300" />
        <input placeholder="Search by Ticket ID or description" value={search} onChange={e => setSearch(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-300 flex-1 min-w-[240px]" />
        <button onClick={resetFilters} className="bg-white text-secondary border border-secondary rounded-full px-4 py-2">Reset</button>
      </div>

      {/* Table */}
      <div className="bg-header-bg rounded-xl">
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

      {/* Raise Ticket Modal */}
      {showNewTicket && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-[680px] rounded-2xl p-5 max-h-[90vh] overflow-y-auto">
            <div className="mb-3">
              <h3 className="font-heading text-secondary font-normal">Raise New Ticket</h3>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Issue Type</label>
                <select value={draftIssue} onChange={e => setDraftIssue(e.target.value as IssueType | '')} className="w-full px-2.5 py-2 rounded-lg border border-gray-300">
                  <option value="">Select Issue</option>
                  {(['Order Discrepancy','Vendor Delay','System Error','Payment Mismatch','Other'] as IssueType[]).map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select value={draftPriority} onChange={e => setDraftPriority(e.target.value as TicketPriority | '')} className="w-full px-2.5 py-2 rounded-lg border border-gray-300">
                  <option value="">Select Priority</option>
                  {(['Low','Medium','High'] as TicketPriority[]).map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Attachments (optional)</label>
                <input type="file" onChange={e => setDraftFile(e.target.files?.[0] || null)} className="w-full px-2.5 py-2 rounded-lg border border-gray-300" />
                {draftFile && (
                  <div className="mt-1 text-xs text-gray-600">Selected: {draftFile.name}</div>
                )}
              </div>
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea value={draftDescription} onChange={e => setDraftDescription(e.target.value)} rows={4} placeholder="Describe the issue..." className="w-full px-2.5 py-2 rounded-lg border border-gray-300" />
              </div>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowNewTicket(false)} className="bg-white text-secondary border border-secondary rounded-full px-3.5 py-2">Cancel</button>
              <button onClick={addTicket} className="bg-accent text-button-text rounded-full px-3.5 py-2">Submit</button>
            </div>
          </div>
        </div>
      )}

      {/* Drawer with details + chat */}
      {drawerTicket && (
        <div className="fixed inset-0 z-50">
          <div className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ease-out ${isDrawerOpen ? 'opacity-100' : 'opacity-0'}`} onClick={closeDrawer} />
          <div className={`absolute top-0 right-0 h-full w-[500px] bg-white shadow-xl flex flex-col transform transition-transform duration-300 ease-out ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="p-5 border-b flex-shrink-0">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="text-xs text-gray-500">Ticket</div>
                  <div className="text-xl font-semibold text-secondary">{drawerTicket.id}</div>
                </div>
                <button onClick={closeDrawer} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">✕</button>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
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

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="text-xs text-gray-500">Date Created</div>
                    <div className="font-medium text-sm">{drawerTicket.createdAt}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500">Last Updated</div>
                    <div className="font-medium text-sm">{drawerTicket.updatedAt}</div>
                  </div>
                </div>

                <div className="flex gap-2 mt-2">
                  <button onClick={() => markClosed(drawerTicket)} className="bg-accent text-button-text rounded-full px-3 py-1.5 text-sm hover:opacity-90 transition-opacity">Mark as Closed</button>
                </div>
              </div>
            </div>

            {/* Chat */}
            <div className="flex-1 overflow-y-auto p-5 bg-gray-50">
              <div className="text-sm font-medium text-gray-700 mb-3">Conversation</div>
              <div className="space-y-3">
                {drawerTicket.messages && drawerTicket.messages.length > 0 ? (
                  drawerTicket.messages.map(m => (
                    <div key={m.id} className={`flex ${m.sender === 'ops' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] ${m.sender === 'ops' ? 'bg-blue-600 text-white' : 'bg-white text-gray-800'} rounded-2xl p-3 shadow-sm`}>
                        <div className={`text-xs mb-1 ${m.sender === 'ops' ? 'text-blue-100' : 'text-gray-500'}`}>{m.senderName} • {m.timestamp}</div>
                        <div className="text-sm leading-relaxed">{m.text}</div>
                        {m.attachments && m.attachments.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {m.attachments.map((att, idx) => (
                              <div key={idx} className={`text-xs flex items-center gap-1 ${m.sender === 'ops' ? 'text-blue-100' : 'text-blue-600'}`}>
                                <Paperclip size={12} />
                                <span>{att.name}</span>
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
            <div className="p-4 border-t bg-white flex-shrink-0">
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
                <input ref={fileInputRef} type="file" className="hidden" onChange={e => setChatAttachment(e.target.files?.[0] || null)} />
                <button onClick={() => fileInputRef.current?.click()} className="flex-shrink-0 p-2.5 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors" title="Attach file">
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
                  className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  rows={2}
                />
                <button onClick={sendMessage} disabled={!messageText.trim()} className="flex-shrink-0 p-2.5 bg-accent text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed" title="Send message">
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


