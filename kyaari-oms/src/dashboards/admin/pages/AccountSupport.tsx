import { useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'

type IssueType = 'Payment Delay' | 'Invoice Missing' | 'Reconciliation Error' | 'Credit Note' | 'Others'
type TicketPriority = 'Low' | 'Medium' | 'High' | 'Urgent'
type TicketStatus = 'Open' | 'In-progress' | 'Escalated' | 'Resolved' | 'Closed'

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
  { id: 'ACT-7001', invoiceId: 'INV-32014', vendor: 'GreenLeaf Co', issue: 'Payment Delay', priority: 'High', status: 'Open', amount: 45230, assignedTo: 'Anita', createdAt: '2025-09-20', updatedAt: '2025-09-20' },
  { id: 'ACT-7002', invoiceId: 'INV-31977', vendor: 'Urban Roots', issue: 'Invoice Missing', priority: 'Urgent', status: 'Escalated', amount: 12150, assignedTo: 'Rahul', createdAt: '2025-09-18', updatedAt: '2025-09-21' },
  { id: 'ACT-7003', invoiceId: 'INV-31888', vendor: 'Plantify', issue: 'Reconciliation Error', priority: 'Medium', status: 'In-progress', amount: 7800, assignedTo: 'Kiran', createdAt: '2025-09-19', updatedAt: '2025-09-22' },
  { id: 'ACT-7004', invoiceId: 'INV-31756', vendor: 'Clay Works', issue: 'Credit Note', priority: 'Low', status: 'Resolved', amount: 0, assignedTo: 'Meera', createdAt: '2025-09-10', updatedAt: '2025-09-15' },
  { id: 'ACT-7005', invoiceId: 'INV-32044', vendor: 'EcoGarden Solutions', issue: 'Others', priority: 'High', status: 'Open', amount: 15990, assignedTo: 'Arjun', createdAt: '2025-09-25', updatedAt: '2025-09-25' },
]

export default function AccountSupport() {
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
  const [draftInvoiceId, setDraftInvoiceId] = useState('')
  const [draftVendor, setDraftVendor] = useState('')
  const [draftIssue, setDraftIssue] = useState<IssueType | ''>('')
  const [draftPriority, setDraftPriority] = useState<TicketPriority | ''>('')
  const [draftAmount, setDraftAmount] = useState<number | ''>('')
  const [draftDescription, setDraftDescription] = useState('')
  const [draftFile, setDraftFile] = useState<File | null>(null)

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
      if (filterDate && t.createdAt !== filterDate) return false
      if (search) {
        const q = search.toLowerCase()
        const hit = t.id.toLowerCase().includes(q) || t.invoiceId.toLowerCase().includes(q) || t.vendor.toLowerCase().includes(q)
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
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-heading text-secondary text-2xl font-semibold">Account Support</h2>
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
          <div className="text-sm text-gray-600">Pending Payment Tickets</div>
          <div className="text-3xl font-semibold text-secondary mt-1">{pendingPayments}</div>
        </div>
        <div className="rounded-2xl p-4 shadow-md bg-amber-50">
          <div className="text-sm text-gray-700">Invoice Discrepancy Cases</div>
          <div className="text-3xl font-semibold text-amber-700 mt-1">{invoiceDiscrepancies}</div>
        </div>
        <div className="rounded-2xl p-4 shadow-md bg-green-50">
          <div className="text-sm text-gray-700">Resolved This Month</div>
          <div className="text-3xl font-semibold text-green-700 mt-1">{resolvedThisMonth}</div>
        </div>
        <div className="rounded-2xl p-4 shadow-md bg-blue-50">
          <div className="text-sm text-gray-700">Avg Resolution Time (days)</div>
          <div className="text-3xl font-semibold text-blue-700 mt-1">{avgResolutionDays}</div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center mb-4 bg-white border border-secondary/20 rounded-xl p-3">
        <select value={filterIssue} onChange={e => setFilterIssue(e.target.value as IssueType | '')} className="px-3 py-2 rounded-xl border border-gray-300">
          <option value="">Issue Type</option>
          {(['Payment Delay','Invoice Missing','Reconciliation Error','Credit Note','Others'] as IssueType[]).map(v => (
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
        <input placeholder="Search ticket / invoice / vendor" value={search} onChange={e => setSearch(e.target.value)} className="px-3 py-2 rounded-xl border border-gray-300 flex-1 min-w-[220px]" />
        <button onClick={resetFilters} className="bg-white text-secondary border border-secondary rounded-full px-4 py-2">Reset</button>
      </div>

      <div className="bg-header-bg rounded-xl">
        <div className="overflow-x-auto">
          <table className="w-full border-separate border-spacing-0 whitespace-nowrap">
          <thead>
            <tr className="bg-white">
              {['Ticket ID','Invoice ID','Vendor Name','Issue Type','Amount','Priority','Status','Assigned To','Created / Last Update','Actions'].map(h => (
                <th key={h} className="text-left p-3 font-heading text-secondary font-normal whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filteredTickets.map((t, idx) => (
              <tr key={t.id} className={idx % 2 === 0 ? 'bg-white' : 'bg-header-bg'}>
                <td className="p-3 whitespace-nowrap">{t.id}</td>
                <td className="p-3 whitespace-nowrap">{t.invoiceId}</td>
                <td className="p-3 whitespace-nowrap">{t.vendor}</td>
                <td className="p-3 whitespace-nowrap">{t.issue}</td>
                <td className="p-3 whitespace-nowrap">{typeof t.amount === 'number' ? `₹${t.amount.toLocaleString('en-IN')}` : '-'}</td>
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
                <td colSpan={10} className="p-6 text-center text-gray-500">No tickets match current filters.</td>
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
                <label className="block text-sm font-medium mb-1">Invoice ID</label>
                <input value={draftInvoiceId} onChange={e => setDraftInvoiceId(e.target.value)} placeholder="INV-xxxxx" className="w-full px-2.5 py-2 rounded-lg border border-gray-300" />
              </div>
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
                  {(['Payment Delay','Invoice Missing','Reconciliation Error','Credit Note','Others'] as IssueType[]).map(opt => (
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
                <label className="block text-sm font-medium mb-1">Amount (optional)</label>
                <input type="number" value={draftAmount} onChange={e => setDraftAmount(e.target.value === '' ? '' : Number(e.target.value))} placeholder="0" className="w-full px-2.5 py-2 rounded-lg border border-gray-300" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Upload Supporting Document</label>
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

      {drawerTicket && (
        <div className="fixed inset-0 z-50">
          <div
            className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ease-out ${isDrawerOpen ? 'opacity-100' : 'opacity-0'}`}
            onClick={closeDrawer}
          />
          <div
            className={`absolute top-0 right-0 h-full w-[460px] bg-white shadow-xl p-5 overflow-y-auto transform transition-transform duration-300 ease-out ${isDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
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
                  <div className="text-xs text-gray-500">Invoice ID</div>
                  <div className="font-medium">{drawerTicket.invoiceId}</div>
                </div>
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
                <div>
                  <div className="text-xs text-gray-500">Amount</div>
                  <div className="font-medium">{typeof drawerTicket.amount === 'number' ? `₹${drawerTicket.amount.toLocaleString('en-IN')}` : '-'}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-xs text-gray-500">Assigned To</div>
                  <div className="font-medium">{drawerTicket.assignedTo}</div>
                </div>
                <div>
                  <div className="text-xs text-gray-500">Created / Updated</div>
                  <div className="font-medium">{drawerTicket.createdAt} / {drawerTicket.updatedAt}</div>
                </div>
              </div>
            </div>

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
                    <div className="text-gray-800">Assigned</div>
                    <div className="text-xs text-gray-500">{drawerTicket.updatedAt}</div>
                  </div>
                </div>
                <div className="flex items-start gap-2">
                  <div className="mt-1 h-2 w-2 rounded-full bg-green-500" />
                  <div>
                    <div className="text-gray-800">Latest Update</div>
                    <div className="text-xs text-gray-500">{drawerTicket.updatedAt}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <div className="text-sm font-medium text-gray-700 mb-3">Conversation</div>
              <div className="space-y-3">
                <div className="p-3 rounded-xl bg-gray-50">
                  <div className="text-xs text-gray-500 mb-1">Vendor • {drawerTicket.createdAt}</div>
                  <div className="text-sm">Raised issue for {drawerTicket.issue.toLowerCase()}.</div>
                </div>
                <div className="p-3 rounded-xl bg-blue-50">
                  <div className="text-xs text-blue-700 mb-1">Accounts • {drawerTicket.updatedAt}</div>
                  <div className="text-sm">Acknowledged. Investigating with finance.</div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-5">
              <button onClick={() => escalateTicket(drawerTicket)} className="bg-white text-red-600 border border-red-600 rounded-full px-3.5 py-2">Escalate</button>
              <button onClick={() => resolveTicket(drawerTicket)} className="bg-accent text-button-text rounded-full px-3.5 py-2">Mark as Resolved</button>
              <button onClick={() => closeTicket(drawerTicket)} className="bg-white text-secondary border border-secondary rounded-full px-3.5 py-2">Close Ticket</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


