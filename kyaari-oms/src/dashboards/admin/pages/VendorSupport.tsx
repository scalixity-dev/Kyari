import { useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'

type IssueType = 'Payment' | 'SLA Breach' | 'Order Delay' | 'Onboarding' | 'Others'
type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent'
type TicketStatus = 'Open' | 'In-progress' | 'Escalated' | 'Resolved' | 'Closed'

type Ticket = {
  id: string
  vendor: string
  issue: IssueType
  priority: TicketPriority
  status: TicketStatus
  assignedTo: string
  createdAt: string
  updatedAt: string
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
  { id: 'TKT-5001', vendor: 'GreenLeaf Co', issue: 'Payment', priority: 'High', status: 'Open', assignedTo: 'Anita', createdAt: '2025-09-20', updatedAt: '2025-09-20' },
  { id: 'TKT-5002', vendor: 'Urban Roots', issue: 'SLA Breach', priority: 'Urgent', status: 'Escalated', assignedTo: 'Rahul', createdAt: '2025-09-18', updatedAt: '2025-09-21' },
  { id: 'TKT-5003', vendor: 'Plantify', issue: 'Order Delay', priority: 'Medium', status: 'In-progress', assignedTo: 'Kiran', createdAt: '2025-09-19', updatedAt: '2025-09-22' },
  { id: 'TKT-5004', vendor: 'Clay Works', issue: 'Onboarding', priority: 'Low', status: 'Resolved', assignedTo: 'Meera', createdAt: '2025-09-10', updatedAt: '2025-09-15' },
  { id: 'TKT-5005', vendor: 'EcoGarden Solutions', issue: 'Others', priority: 'High', status: 'Open', assignedTo: 'Arjun', createdAt: '2025-09-25', updatedAt: '2025-09-25' },
]

export default function VendorSupport() {
  const [tickets, setTickets] = useState<Ticket[]>(INITIAL_TICKETS)

  // filters
  const [filterVendor, setFilterVendor] = useState('')
  const [filterStatus, setFilterStatus] = useState<TicketStatus | ''>('')
  const [filterPriority, setFilterPriority] = useState<TicketPriority | ''>('')
  const [filterDate, setFilterDate] = useState('')
  const [search, setSearch] = useState('')

  // modal + drawer
  const [showNewTicket, setShowNewTicket] = useState(false)
  const [drawerTicket, setDrawerTicket] = useState<Ticket | null>(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)

  // new ticket draft
  const [draftVendor, setDraftVendor] = useState('')
  const [draftIssue, setDraftIssue] = useState<IssueType | ''>('')
  const [draftPriority, setDraftPriority] = useState<TicketPriority | ''>('')
  const [draftDescription, setDraftDescription] = useState('')
  const [draftFile, setDraftFile] = useState<File | null>(null)

  const vendors = useMemo(() => Array.from(new Set(tickets.map(t => t.vendor))).sort(), [tickets])

  const openCount = tickets.filter(t => t.status === 'Open').length
  const slaBreaches = tickets.filter(t => t.issue === 'SLA Breach').length
  const resolvedThisWeek = tickets.filter(t => t.status === 'Resolved').length
  const avgResolutionHours = 4.2

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      if (filterVendor && t.vendor !== filterVendor) return false
      if (filterStatus && t.status !== filterStatus) return false
      if (filterPriority && t.priority !== filterPriority) return false
      if (filterDate && t.createdAt !== filterDate) return false
      if (search && !(t.id.toLowerCase().includes(search.toLowerCase()) || t.vendor.toLowerCase().includes(search.toLowerCase()))) return false
      return true
    })
  }, [tickets, filterVendor, filterStatus, filterPriority, filterDate, search])

  function resetFilters() {
    setFilterVendor('')
    setFilterStatus('')
    setFilterPriority('')
    setFilterDate('')
    setSearch('')
  }

  function addTicket() {
    if (!draftVendor || !draftIssue || !draftPriority || !draftDescription) {
      alert('Please fill all required fields')
      return
    }
    const newTicket: Ticket = {
      id: `TKT-${6000 + tickets.length}`,
      vendor: draftVendor,
      issue: draftIssue as IssueType,
      priority: draftPriority as TicketPriority,
      status: 'Open',
      assignedTo: '-',
      createdAt: new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
    }
    setTickets(prev => [newTicket, ...prev])
    setShowNewTicket(false)
    setDraftVendor('')
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

  function closeTicket(t: Ticket) {
    setTickets(prev => prev.map(x => x.id === t.id ? { ...x, status: 'Closed', updatedAt: new Date().toISOString().split('T')[0] } : x))
  }

  function escalateTicket(t: Ticket) {
    setTickets(prev => prev.map(x => x.id === t.id ? { ...x, status: 'Escalated', updatedAt: new Date().toISOString().split('T')[0] } : x))
  }

  // Animate drawer open/close
  function closeDrawer() {
    setIsDrawerOpen(false)
    setTimeout(() => setDrawerTicket(null), 300)
  }
  
  useEffect(() => {
    if (drawerTicket) {
      const rafId = requestAnimationFrame(() => setIsDrawerOpen(true))
      return () => cancelAnimationFrame(rafId)
    }
    return undefined
  }, [drawerTicket])

  return (
    <div className="p-6 font-sans text-primary" style={{ background: 'transparent' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-heading text-secondary text-2xl font-semibold">Vendor Support</h2>
        <button
          onClick={() => setShowNewTicket(true)}
          className="bg-accent text-button-text rounded-full px-4 py-2.5 border border-transparent flex items-center gap-2"
        >
          <Plus size={16} />
          <span>Raise New Ticket</span>
        </button>
      </div>

      {/* Analytics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <div className="rounded-2xl p-4 shadow-md bg-white">
          <div className="text-sm text-gray-600">Open Tickets</div>
          <div className="text-3xl font-semibold text-secondary mt-1">{openCount}</div>
        </div>
        <div className="rounded-2xl p-4 shadow-md bg-red-50">
          <div className="text-sm text-gray-700">SLA Breaches</div>
          <div className="text-3xl font-semibold text-red-600 mt-1">{slaBreaches}</div>
        </div>
        <div className="rounded-2xl p-4 shadow-md bg-green-50">
          <div className="text-sm text-gray-700">Resolved This Week</div>
          <div className="text-3xl font-semibold text-green-700 mt-1">{resolvedThisWeek}</div>
        </div>
        <div className="rounded-2xl p-4 shadow-md bg-blue-50">
          <div className="text-sm text-gray-700">Avg Resolution Time</div>
          <div className="text-3xl font-semibold text-blue-700 mt-1">{avgResolutionHours} hrs</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center mb-4 bg-white border border-secondary/20 rounded-xl p-3">
        <select value={filterVendor} onChange={e => setFilterVendor(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-300">
          <option value="">Vendor Name</option>
          {vendors.map(v => (
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
        <input placeholder="Search ticket/vendor" value={search} onChange={e => setSearch(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-300 flex-1 min-w-[200px]" />
        <button onClick={resetFilters} className="bg-white text-secondary border border-secondary rounded-full px-4 py-2">Reset</button>
      </div>

      {/* Table */}
      <div className="bg-header-bg rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 whitespace-nowrap">
          <thead>
            <tr className="bg-white">
              {['Ticket ID','Vendor Name','Issue Type','Priority','Status','Assigned To','Created / Updated','Actions'].map(h => (
                <th key={h} className="text-left p-3 font-heading text-secondary font-normal whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredTickets.map((t, idx) => (
              <tr key={t.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-header-bg'}>
                <td className="p-3 whitespace-nowrap">{t.id}</td>
                <td className="p-3 whitespace-nowrap">{t.vendor}</td>
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
                <td className="p-3 whitespace-nowrap">{t.createdAt} / {t.updatedAt}</td>
                <td className="p-3 whitespace-nowrap">
                  <div className="flex gap-2">
                    <button onClick={() => setDrawerTicket(t)} className="bg-white text-secondary border border-secondary rounded-full px-2.5 py-1.5 text-sm">View</button>
                    <button onClick={() => assignTicket(t)} className="bg-white text-secondary border border-secondary rounded-full px-2.5 py-1.5 text-sm">Assign</button>
                    <button onClick={() => resolveTicket(t)} className="bg-white text-secondary border border-secondary rounded-full px-2.5 py-1.5 text-sm">Resolve</button>
                    <button onClick={() => closeTicket(t)} className="bg-white text-red-600 border border-red-600 rounded-full px-2.5 py-1.5 text-sm">Close</button>
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
                <label className="block text-sm font-medium mb-1">Vendor Name</label>
                <select value={draftVendor} onChange={e => setDraftVendor(e.target.value)} className="w-full px-2.5 py-2 rounded-lg border border-gray-300">
                  <option value="">Select Vendor</option>
                  {vendors.map(v => (
                    <option key={v} value={v}>{v}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Issue Type</label>
                <select value={draftIssue} onChange={e => setDraftIssue(e.target.value as IssueType | '')} className="w-full px-2.5 py-2 rounded-lg border border-gray-300">
                  <option value="">Select Issue</option>
                  {(['Payment','SLA Breach','Order Delay','Onboarding','Others'] as IssueType[]).map(opt => (
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

      {/* Ticket Detail Drawer */}
      {drawerTicket && (
        <div className="fixed inset-0 z-50">
          <div
            className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ease-out ${isDrawerOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={closeDrawer}
          />
          <div
            className={`absolute top-0 right-0 h-full w-[420px] bg-white shadow-xl p-5 overflow-y-auto transform transition-transform duration-300 ease-out ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
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
                  <div className="text-xs text-gray-500">Vendor</div>
                  <div className="font-medium">{drawerTicket.vendor}</div>
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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-gray-500">Assigned To</div>
                  <div className="font-medium">{drawerTicket.assignedTo}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">SLA</div>
                  <div className="font-medium">24 hrs</div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="text-sm font-medium text-gray-700 mb-3">Conversation</div>
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-gray-50">
                  <div className="text-xs text-gray-500 mb-1">Vendor • {drawerTicket.createdAt}</div>
                  <div className="text-sm">Initial ticket created for {drawerTicket.issue.toLowerCase()}.</div>
                </div>
                <div className="p-3 rounded-xl bg-blue-50">
                  <div className="text-xs text-blue-700 mb-1">Support • {drawerTicket.updatedAt}</div>
                  <div className="text-sm">Acknowledged. Working on the issue.</div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={() => escalateTicket(drawerTicket)} className="bg-white text-red-600 border border-red-600 rounded-full px-3.5 py-2">Escalate</button>
              <button onClick={() => resolveTicket(drawerTicket)} className="bg-accent text-button-text rounded-full px-3.5 py-2">Mark as Resolved</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


