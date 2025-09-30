import { useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { Link } from 'react-router-dom'

type IssueType = 'Mismatch' | 'Missing Item' | 'Damaged Item' | 'Escalation' | 'Others'
type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent'
type TicketStatus = 'Open' | 'Under Review' | 'Escalated' | 'Resolved' | 'Closed'

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
  { id: 'OPS-8001', orderId: 'ORD-120045', store: 'Koramangala BLR', issue: 'Mismatch', priority: 'High', status: 'Open', assignedTo: 'Ravi', createdAt: '2025-09-20', updatedAt: '2025-09-20', description: 'Qty mismatch between manifest and delivery.', slaHours: 24 },
  { id: 'OPS-8002', orderId: 'ORD-120081', store: 'HSR BLR', issue: 'Missing Item', priority: 'Urgent', status: 'Escalated', assignedTo: 'Priya', createdAt: '2025-09-18', updatedAt: '2025-09-21', description: 'One planter missing from shipment.', slaHours: 12 },
  { id: 'OPS-8003', orderId: 'ORD-119988', store: 'Powai MUM', issue: 'Damaged Item', priority: 'Medium', status: 'Under Review', assignedTo: 'Naresh', createdAt: '2025-09-19', updatedAt: '2025-09-22', description: 'Cracked ceramic pot received.', slaHours: 36 },
  { id: 'OPS-8004', orderId: 'ORD-119701', store: 'Wakad PUN', issue: 'Escalation', priority: 'Low', status: 'Resolved', assignedTo: 'Anita', createdAt: '2025-09-10', updatedAt: '2025-09-15', description: 'Store escalated due to repeated delays.', slaHours: 48 },
  { id: 'OPS-8005', orderId: 'ORD-120101', store: 'Whitefield BLR', issue: 'Others', priority: 'High', status: 'Open', assignedTo: 'Arjun', createdAt: '2025-09-25', updatedAt: '2025-09-25', description: 'General operational discrepancy.', slaHours: 24 },
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
    setTimeout(() => setDrawerTicket(null), 300)
  }

  return (
    <div className="p-6 font-sans text-primary" style={{ background: 'transparent' }}>
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="font-heading text-secondary text-2xl font-semibold">OPS Support</h2>
          <div className="text-sm text-gray-600">Manage operational discrepancies, store tickets, and escalations.</div>
        </div>
        <button
          onClick={() => setShowNewTicket(true)}
          className="bg-accent text-button-text rounded-full px-4 py-2.5 border border-transparent flex items-center gap-2"
        >
          <Plus size={16} />
          <span>Raise New Ticket</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <div className="rounded-2xl p-4 shadow-md bg-white">
          <div className="text-sm text-gray-600">Open Ops Tickets</div>
          <div className="text-3xl font-semibold text-secondary mt-1">{openOpsTickets}</div>
        </div>
        <div className="rounded-2xl p-4 shadow-md bg-amber-50">
          <div className="text-sm text-gray-700">Store Mismatch Reports</div>
          <div className="text-3xl font-semibold text-amber-700 mt-1">{storeMismatchReports}</div>
        </div>
        <div className="rounded-2xl p-4 shadow-md bg-red-50">
          <div className="text-sm text-gray-700">Escalated Cases</div>
          <div className="text-3xl font-semibold text-red-600 mt-1">{escalatedCases}</div>
        </div>
        <div className="rounded-2xl p-4 shadow-md bg-blue-50">
          <div className="text-sm text-gray-700">Avg Resolution Time (Days)</div>
          <div className="text-3xl font-semibold text-blue-700 mt-1">{avgResolutionDays}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center mb-4 bg-white border border-secondary/20 rounded-xl p-3">
        <select value={filterIssue} onChange={e => setFilterIssue(e.target.value as IssueType | '')} className="px-3 py-2 rounded-xl border border-gray-300">
          <option value="">Issue Type</option>
          {(['Mismatch','Missing Item','Damaged Item','Escalation','Others'] as IssueType[]).map(v => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as TicketStatus | '')} className="px-3 py-2 rounded-xl border border-gray-300">
          <option value="">Status</option>
          {Object.keys(STATUS_STYLES).map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <select value={filterPriority} onChange={e => setFilterPriority(e.target.value as TicketPriority | '')} className="px-3 py-2 rounded-xl border border-gray-300">
          <option value="">Priority</option>
          {Object.keys(PRIORITY_STYLES).map(p => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
        <input type="date" value={filterDate} onChange={e => setFilterDate(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-300" />
        <input placeholder="Search ticket / order / store" value={search} onChange={e => setSearch(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-300 flex-1 min-w-[220px]" />
        <button onClick={resetFilters} className="bg-white text-secondary border border-secondary rounded-full px-4 py-2">Reset</button>
      </div>

      <div className="bg-header-bg rounded-xl">
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

      {showNewTicket && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white w-[780px] rounded-2xl p-5 max-h-[90vh] overflow-y-auto">
            <div className="mb-3">
              <h3 className="font-heading text-secondary font-normal">Raise New Ticket</h3>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-sm font-medium mb-1">Order ID</label>
                <input value={draftOrderId} onChange={e => setDraftOrderId(e.target.value)} placeholder="ORD-xxxxx" className="w-full px-2.5 py-2 rounded-lg border border-gray-300" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Store Name</label>
                <select value={draftStore} onChange={e => setDraftStore(e.target.value)} className="w-full px-2.5 py-2 rounded-lg border border-gray-300">
                  <option value="">Select Store</option>
                  {stores.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Issue Type</label>
                <select value={draftIssue} onChange={e => setDraftIssue(e.target.value as IssueType | '')} className="w-full px-2.5 py-2 rounded-lg border border-gray-300">
                  <option value="">Select Issue</option>
                  {(['Mismatch','Missing Item','Damaged Item','Escalation','Others'] as IssueType[]).map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Priority</label>
                <select value={draftPriority} onChange={e => setDraftPriority(e.target.value as TicketPriority | '')} className="w-full px-2.5 py-2 rounded-lg border border-gray-300">
                  <option value="">Select Priority</option>
                  {(['Low','Medium','High','Urgent'] as TicketPriority[]).map(opt => (
                    <option key={opt} value={opt}>{opt}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Attachments</label>
                <input 
                  type="file" 
                  accept="image/*,application/pdf"
                  onChange={e => setDraftFile(e.target.files?.[0] || null)} 
                  className="w-full px-2.5 py-2 rounded-lg border border-gray-300" 
                />
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

      {drawerTicket && (
        <div className="fixed inset-0 z-50">
          <div
            className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ease-out ${isDrawerOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={closeDrawer}
          />
          <div
            className={`absolute top-0 right-0 h-full w-[480px] bg-white shadow-xl p-5 overflow-y-auto transform transition-transform duration-300 ease-out ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="text-xs text-gray-500">Ticket</div>
                <div className="text-xl font-semibold text-secondary">{drawerTicket.id}</div>
              </div>
              <button onClick={closeDrawer} className="text-gray-500">✕</button>
            </div>

            <div className="space-y-3 mb-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-gray-500">Order ID</div>
                  <div className="font-medium">
                    <Link to={`/admin/orders/${drawerTicket.orderId}`} className="underline text-blue-700">{drawerTicket.orderId}</Link>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Store</div>
                  <div className="font-medium">{drawerTicket.store}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Issue</div>
                  <div className="font-medium">{drawerTicket.issue}</div>
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
                  <div className="font-medium">{drawerTicket.assignedTo}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Created / Updated</div>
                  <div className="font-medium">{drawerTicket.createdAt} / {drawerTicket.updatedAt}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">SLA</div>
                  <div className="font-medium">{drawerTicket.slaHours} hrs</div>
                </div>
              </div>

              {drawerTicket.description && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">Description</div>
                  <div className="text-sm">{drawerTicket.description}</div>
                </div>
              )}

              {drawerTicket.attachments && drawerTicket.attachments.length > 0 && (
                <div>
                  <div className="text-xs text-gray-500 mb-1">Attachments</div>
                  <ul className="list-disc pl-5 text-sm">
                    {drawerTicket.attachments.map((a, i) => (
                      <li key={i}>{a}</li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="border-t pt-4">
                <div className="text-sm font-medium text-gray-700 mb-3">Timeline</div>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start gap-2">
                    <div className="mt-1 h-2 w-2 rounded-full bg-gray-400" />
                    <div>
                      <div className="text-gray-800">Created</div>
                      <div className="text-xs text-gray-500">{drawerTicket.createdAt}</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="mt-1 h-2 w-2 rounded-full bg-blue-500" />
                    <div>
                      <div className="text-gray-800">Under Review</div>
                      <div className="text-xs text-gray-500">{drawerTicket.updatedAt}</div>
                    </div>
                  </div>
                  {drawerTicket.status === 'Escalated' && (
                    <div className="flex items-start gap-2">
                      <div className="mt-1 h-2 w-2 rounded-full bg-red-500" />
                      <div>
                        <div className="text-gray-800">Escalated</div>
                        <div className="text-xs text-gray-500">{drawerTicket.updatedAt}</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t pt-4 mt-4">
                <div className="text-sm font-medium text-gray-700 mb-3">Conversation</div>
                <div className="space-y-3">
                  <div className="p-3 rounded-xl bg-gray-50">
                    <div className="text-xs text-gray-500 mb-1">Store Operator • {drawerTicket.createdAt}</div>
                    <div className="text-sm">Raised issue for {drawerTicket.issue.toLowerCase()}.</div>
                  </div>
                  <div className="p-3 rounded-xl bg-blue-50">
                    <div className="text-xs text-blue-700 mb-1">Ops • {drawerTicket.updatedAt}</div>
                    <div className="text-sm">Acknowledged. Investigating with logistics.</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 whitespace-nowrap mt-5">
              <button onClick={() => escalateTicket(drawerTicket)} className="bg-white text-red-600 border border-red-600 rounded-full px-3.5 py-2">Escalate</button>
              <button onClick={() => resolveTicket(drawerTicket)} className="bg-accent text-button-text rounded-full px-3.5 py-2">Mark as Resolved</button>
              <button onClick={() => setTickets(prev => prev.map(x => x.id === drawerTicket.id ? { ...x, status: 'Under Review', updatedAt: new Date().toISOString().split('T')[0] } : x))} className="bg-white text-secondary border border-secondary rounded-full px-3.5 py-2">Mark Under Review</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


