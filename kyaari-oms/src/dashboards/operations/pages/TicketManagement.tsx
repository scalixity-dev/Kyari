import React, { useState } from 'react'
import { AlertTriangle, Eye, Filter, Search, X, CheckSquare, Clock } from 'lucide-react'

interface Ticket {
  id: string
  ticketNumber: string
  orderId: string
  orderNumber: string
  vendor: {
    name: string
    id: string
    email: string
  }
  issueType: 'qty-mismatch' | 'damaged' | 'missing-item'
  issueDescription: string
  status: 'open' | 'under-review' | 'resolved'
  raisedOn: string
  lastUpdated: string
  raisedBy: string
  assignedTo?: string
  comments: Comment[]
  attachments: Attachment[]
  priority: 'low' | 'medium' | 'high'
}

interface Comment {
  id: string
  author: string
  message: string
  timestamp: string
  type: 'internal' | 'vendor-response'
}

interface Attachment {
  id: string
  fileName: string
  fileType: string
  uploadedBy: string
  uploadedAt: string
}

const sampleTickets: Ticket[] = [
  {
    id: '1',
    ticketNumber: 'TKT-001',
    orderId: '2',
    orderNumber: 'ORD-002',
    vendor: {
      name: 'Green Valley Suppliers',
      id: 'VEN-002',
      email: 'supply@greenvalley.com'
    },
    issueType: 'qty-mismatch',
    issueDescription: 'Quantity received (95) does not match invoiced quantity (100). Missing 5 units of organic carrots.',
    status: 'open',
    raisedOn: '2025-09-29',
    lastUpdated: '2025-09-29',
    raisedBy: 'Operations Team',
    priority: 'high',
    comments: [
      {
        id: 'c1',
        author: 'Operations Team',
        message: 'Quantity mismatch identified during receiving. Please provide explanation and delivery schedule for remaining units.',
        timestamp: '2025-09-29 10:30 AM',
        type: 'internal'
      }
    ],
    attachments: [
      {
        id: 'a1',
        fileName: 'delivery_receipt.pdf',
        fileType: 'pdf',
        uploadedBy: 'Operations Team',
        uploadedAt: '2025-09-29 10:30 AM'
      }
    ]
  },
  {
    id: '2',
    ticketNumber: 'TKT-002',
    orderId: '4',
    orderNumber: 'ORD-004',
    vendor: {
      name: 'Farm Direct Ltd',
      id: 'VEN-004',
      email: 'orders@farmdirect.in'
    },
    issueType: 'damaged',
    issueDescription: '10% of the vegetables received were damaged during transit. Quality does not meet standards.',
    status: 'under-review',
    raisedOn: '2025-09-28',
    lastUpdated: '2025-09-29',
    raisedBy: 'Quality Team',
    assignedTo: 'John Doe',
    priority: 'medium',
    comments: [
      {
        id: 'c2',
        author: 'Quality Team',
        message: 'Damaged items found during quality inspection. Photos attached for reference.',
        timestamp: '2025-09-28 02:15 PM',
        type: 'internal'
      },
      {
        id: 'c3',
        author: 'Farm Direct Ltd',
        message: 'We apologize for the quality issue. We will investigate with our logistics partner and provide replacement items.',
        timestamp: '2025-09-29 09:30 AM',
        type: 'vendor-response'
      }
    ],
    attachments: [
      {
        id: 'a2',
        fileName: 'damaged_items_photo.jpg',
        fileType: 'jpg',
        uploadedBy: 'Quality Team',
        uploadedAt: '2025-09-28 02:15 PM'
      }
    ]
  },
  {
    id: '3',
    ticketNumber: 'TKT-003',
    orderId: '1',
    orderNumber: 'ORD-001',
    vendor: {
      name: 'Fresh Farms Pvt Ltd',
      id: 'VEN-001',
      email: 'orders@freshfarms.in'
    },
    issueType: 'missing-item',
    issueDescription: 'Invoice shows organic tomatoes but item was not included in the delivery.',
    status: 'resolved',
    raisedOn: '2025-09-27',
    lastUpdated: '2025-09-28',
    raisedBy: 'Operations Team',
    assignedTo: 'Jane Smith',
    priority: 'low',
    comments: [
      {
        id: 'c4',
        author: 'Operations Team',
        message: 'Missing item identified during receiving process.',
        timestamp: '2025-09-27 03:45 PM',
        type: 'internal'
      },
      {
        id: 'c5',
        author: 'Fresh Farms Pvt Ltd',
        message: 'Item was shipped separately due to quality check delay. Will be delivered tomorrow.',
        timestamp: '2025-09-27 04:30 PM',
        type: 'vendor-response'
      },
      {
        id: 'c6',
        author: 'Operations Team',
        message: 'Item received and verified. Closing ticket.',
        timestamp: '2025-09-28 11:00 AM',
        type: 'internal'
      }
    ],
    attachments: []
  }
]

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'open':
      return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">Open</span>
    case 'under-review':
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Under Review</span>
    case 'resolved':
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Resolved</span>
    default:
      return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">{status}</span>
  }
}

const getPriorityBadge = (priority: string) => {
  switch (priority) {
    case 'high':
      return <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">High</span>
    case 'medium':
      return <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">Medium</span>
    case 'low':
      return <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">Low</span>
    default:
      return <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs font-medium">{priority}</span>
  }
}

const getIssueTypeLabel = (issueType: string) => {
  switch (issueType) {
    case 'qty-mismatch':
      return 'Quantity Mismatch'
    case 'damaged':
      return 'Damaged Items'
    case 'missing-item':
      return 'Missing Item'
    default:
      return issueType
  }
}

export default function TicketManagement() {
  const [tickets, setTickets] = useState<Ticket[]>(sampleTickets)
  const [filteredTickets, setFilteredTickets] = useState<Ticket[]>(sampleTickets)
  const [filters, setFilters] = useState({
    status: 'all',
    vendor: '',
    date: ''
  })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null)
  const [detailsModalOpen, setDetailsModalOpen] = useState(false)
  const [updateStatusModalOpen, setUpdateStatusModalOpen] = useState(false)
  const [commentModalOpen, setCommentModalOpen] = useState(false)
  const [newComment, setNewComment] = useState('')
  const [newStatus, setNewStatus] = useState<'open' | 'under-review' | 'resolved'>('open')
  const [newAttachment, setNewAttachment] = useState<File | null>(null)

  // Apply filters
  React.useEffect(() => {
    let filtered = tickets

    if (filters.status !== 'all') {
      filtered = filtered.filter(ticket => ticket.status === filters.status)
    }

    if (filters.vendor) {
      filtered = filtered.filter(ticket => 
        ticket.vendor.name.toLowerCase().includes(filters.vendor.toLowerCase())
      )
    }

    if (filters.date) {
      filtered = filtered.filter(ticket => ticket.raisedOn === filters.date)
    }

    setFilteredTickets(filtered)
  }, [filters, tickets])

  const handleViewDetails = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setDetailsModalOpen(true)
  }

  const handleUpdateStatus = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setNewStatus(ticket.status)
    setUpdateStatusModalOpen(true)
  }

  const handleAddComment = (ticket: Ticket) => {
    setSelectedTicket(ticket)
    setNewComment('')
    setNewAttachment(null)
    setCommentModalOpen(true)
  }

  const submitStatusUpdate = () => {
    if (selectedTicket) {
      setTickets(tickets.map(ticket => 
        ticket.id === selectedTicket.id 
          ? { 
              ...ticket, 
              status: newStatus,
              lastUpdated: new Date().toISOString().split('T')[0]
            }
          : ticket
      ))
      setUpdateStatusModalOpen(false)
      setSelectedTicket(null)
    }
  }

  const submitComment = () => {
    if (selectedTicket && newComment.trim()) {
      const newCommentObj: Comment = {
        id: `c${Date.now()}`,
        author: 'Current User',
        message: newComment,
        timestamp: new Date().toLocaleString(),
        type: 'internal'
      }

      const newAttachmentObj: Attachment | null = newAttachment ? {
        id: `a${Date.now()}`,
        fileName: newAttachment.name,
        fileType: newAttachment.type,
        uploadedBy: 'Current User',
        uploadedAt: new Date().toLocaleString()
      } : null

      setTickets(tickets.map(ticket => 
        ticket.id === selectedTicket.id 
          ? { 
              ...ticket, 
              comments: [...ticket.comments, newCommentObj],
              attachments: newAttachmentObj ? [...ticket.attachments, newAttachmentObj] : ticket.attachments,
              lastUpdated: new Date().toISOString().split('T')[0]
            }
          : ticket
      ))
      setCommentModalOpen(false)
      setSelectedTicket(null)
      setNewComment('')
      setNewAttachment(null)
    }
  }

  const openTickets = tickets.filter(ticket => ticket.status === 'open').length
  const underReviewTickets = tickets.filter(ticket => ticket.status === 'under-review').length
  const resolvedTickets = tickets.filter(ticket => ticket.status === 'resolved').length

  return (
    <div className="p-4 sm:p-6 md:p-8 bg-[var(--color-happyplant-bg)] min-h-[calc(100vh-4rem)] font-sans w-full overflow-x-hidden">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-heading)] mb-2 font-[var(--font-heading)]">
          Ticket Management
        </h1>
        <p className="text-sm sm:text-base text-[var(--color-primary)]">
          Manage and resolve vendor tickets and issues
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-white/20">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-medium text-gray-600">Open Tickets</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[var(--color-primary)]">{openTickets}</div>
        </div>
        
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-white/20">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-medium text-gray-600">Under Review</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[var(--color-primary)]">{underReviewTickets}</div>
        </div>
        
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-white/20">
          <div className="flex items-center gap-2 sm:gap-3 mb-2">
            <CheckSquare className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
            <span className="text-xs sm:text-sm font-medium text-gray-600">Resolved Tickets</span>
          </div>
          <div className="text-xl sm:text-2xl font-bold text-[var(--color-primary)]">{resolvedTickets}</div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-xl shadow-md border border-white/20 mb-6">
        <div className="p-4 sm:p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-3">
            <h2 className="text-lg sm:text-xl font-semibold text-[var(--color-heading)]">All Tickets</h2>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 min-h-[44px]"
            >
              <Filter size={16} />
              Filters
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent min-h-[44px]"
                  value={filters.status}
                  onChange={(e) => setFilters({...filters, status: e.target.value})}
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="under-review">Under Review</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
                  <input
                    type="text"
                    placeholder="Search vendor..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent min-h-[44px]"
                    value={filters.vendor}
                    onChange={(e) => setFilters({...filters, vendor: e.target.value})}
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent min-h-[44px]"
                  value={filters.date}
                  onChange={(e) => setFilters({...filters, date: e.target.value})}
                />
              </div>
              
              <div className="flex items-end">
                <button
                  onClick={() => setFilters({status: 'all', vendor: '', date: ''})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors min-h-[44px]"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Desktop Table View - Hidden on Mobile */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ticket ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Issue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Raised On</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last Updated</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTickets.map((ticket) => (
                <tr key={ticket.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-[var(--color-heading)]">{ticket.ticketNumber}</div>
                      {getPriorityBadge(ticket.priority)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{ticket.orderNumber}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{ticket.vendor.name}</div>
                      <div className="text-xs text-gray-500">{ticket.vendor.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{getIssueTypeLabel(ticket.issueType)}</div>
                      <div className="text-xs text-gray-500 max-w-xs truncate">{ticket.issueDescription}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(ticket.status)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {ticket.raisedOn}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {ticket.lastUpdated}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleViewDetails(ticket)}
                        className="px-3 py-1 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-xs font-medium flex items-center gap-1"
                      >
                        <Eye size={14} />
                        View
                      </button>
                      {ticket.status !== 'resolved' && (
                        <button
                          onClick={() => handleUpdateStatus(ticket)}
                          className="px-3 py-1 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors text-xs font-medium"
                        >
                          Update
                        </button>
                      )}
                      <button
                        onClick={() => handleAddComment(ticket)}
                        className="px-3 py-1 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-xs font-medium flex items-center gap-1"
                      >
                        💬
                        Comment
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View - Visible only on Mobile */}
        <div className="md:hidden space-y-4 p-4">
          {filteredTickets.map((ticket) => (
            <div key={ticket.id} className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-semibold text-[var(--color-heading)]">{ticket.ticketNumber}</span>
                    {getPriorityBadge(ticket.priority)}
                  </div>
                  <div className="text-xs text-gray-500">{ticket.orderNumber}</div>
                </div>
                {getStatusBadge(ticket.status)}
              </div>

              <div className="space-y-2 mb-3">
                <div>
                  <span className="text-xs text-gray-500">Vendor:</span>
                  <div className="text-sm font-medium text-gray-900">{ticket.vendor.name}</div>
                  <div className="text-xs text-gray-500">{ticket.vendor.email}</div>
                </div>
                <div>
                  <span className="text-xs text-gray-500">Issue:</span>
                  <div className="text-sm font-medium text-gray-900">{getIssueTypeLabel(ticket.issueType)}</div>
                  <div className="text-xs text-gray-600 line-clamp-2">{ticket.issueDescription}</div>
                </div>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Raised: {ticket.raisedOn}</span>
                  <span>Updated: {ticket.lastUpdated}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-2">
                <button
                  onClick={() => handleViewDetails(ticket)}
                  className="w-full px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors text-sm font-medium flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <Eye size={16} />
                  View Details
                </button>
                <div className="grid grid-cols-2 gap-2">
                  {ticket.status !== 'resolved' && (
                    <button
                      onClick={() => handleUpdateStatus(ticket)}
                      className="px-3 py-2 bg-yellow-500 text-white rounded-md hover:bg-yellow-600 transition-colors text-sm font-medium min-h-[44px]"
                    >
                      Update
                    </button>
                  )}
                  <button
                    onClick={() => handleAddComment(ticket)}
                    className={`px-3 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors text-sm font-medium flex items-center justify-center gap-1 min-h-[44px] ${
                      ticket.status !== 'resolved' ? '' : 'col-span-2'
                    }`}
                  >
                    💬 Comment
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredTickets.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No tickets found matching the current filters.
          </div>
        )}
      </div>

      {/* View Details Modal */}
      {detailsModalOpen && selectedTicket && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-[var(--color-heading)]">Ticket Details</h3>
              <button 
                onClick={() => setDetailsModalOpen(false)} 
                className="text-gray-400 hover:text-gray-600 p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
              <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">Ticket Information</h4>
                <div className="space-y-2">
                  <p className="text-xs sm:text-sm"><span className="font-medium">Ticket ID:</span> {selectedTicket.ticketNumber}</p>
                  <p className="text-xs sm:text-sm"><span className="font-medium">Order ID:</span> {selectedTicket.orderNumber}</p>
                  <p className="text-xs sm:text-sm"><span className="font-medium">Issue Type:</span> {getIssueTypeLabel(selectedTicket.issueType)}</p>
                  <p className="text-xs sm:text-sm flex items-center gap-2"><span className="font-medium">Priority:</span> {getPriorityBadge(selectedTicket.priority)}</p>
                  <p className="text-xs sm:text-sm flex items-center gap-2"><span className="font-medium">Status:</span> {getStatusBadge(selectedTicket.status)}</p>
                  <p className="text-xs sm:text-sm"><span className="font-medium">Raised By:</span> {selectedTicket.raisedBy}</p>
                  {selectedTicket.assignedTo && (
                    <p className="text-xs sm:text-sm"><span className="font-medium">Assigned To:</span> {selectedTicket.assignedTo}</p>
                  )}
                </div>
              </div>
              
              <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">Vendor Information</h4>
                <div className="space-y-2">
                  <p className="text-xs sm:text-sm"><span className="font-medium">Name:</span> {selectedTicket.vendor.name}</p>
                  <p className="text-xs sm:text-sm"><span className="font-medium">Email:</span> {selectedTicket.vendor.email}</p>
                  <p className="text-xs sm:text-sm"><span className="font-medium">Vendor ID:</span> {selectedTicket.vendor.id}</p>
                </div>
              </div>
            </div>

            <div className="mb-4 sm:mb-6">
              <h4 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">Issue Description</h4>
              <p className="text-xs sm:text-sm text-gray-700 p-3 sm:p-4 bg-gray-50 rounded-lg">{selectedTicket.issueDescription}</p>
            </div>

            {selectedTicket.attachments.length > 0 && (
              <div className="mb-4 sm:mb-6">
                <h4 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">Attachments</h4>
                <div className="space-y-2">
                  {selectedTicket.attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center gap-2 sm:gap-3 p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-400 text-lg sm:text-xl">📎</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-medium truncate">{attachment.fileName}</p>
                        <p className="text-xs text-gray-500">Uploaded by {attachment.uploadedBy} on {attachment.uploadedAt}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4 sm:mb-6">
              <h4 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">Comments History</h4>
              <div className="space-y-3 sm:space-y-4 max-h-60 overflow-y-auto">
                {selectedTicket.comments.map((comment) => (
                  <div key={comment.id} className={`p-3 sm:p-4 rounded-lg ${
                    comment.type === 'internal' ? 'bg-blue-50 border-l-4 border-blue-500' : 'bg-green-50 border-l-4 border-green-500'
                  }`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-2 gap-1">
                      <span className="text-xs sm:text-sm font-medium">{comment.author}</span>
                      <span className="text-xs text-gray-500">{comment.timestamp}</span>
                    </div>
                    <p className="text-xs sm:text-sm text-gray-700">{comment.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Update Status Modal */}
      {updateStatusModalOpen && selectedTicket && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-lg">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-[var(--color-heading)]">Update Status</h3>
              <button 
                onClick={() => setUpdateStatusModalOpen(false)} 
                className="text-gray-400 hover:text-gray-600 p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-4 p-3 sm:p-4 bg-gray-50 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-600 mb-2">Ticket: <span className="font-medium">{selectedTicket.ticketNumber}</span></p>
              <p className="text-xs sm:text-sm text-gray-600 mb-2">Current Status: {getStatusBadge(selectedTicket.status)}</p>
            </div>

            <div className="mb-4 sm:mb-6">
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                New Status
              </label>
              <select
                className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent min-h-[44px] text-sm sm:text-base"
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value as any)}
              >
                <option value="open">Open</option>
                <option value="under-review">Under Review</option>
                <option value="resolved">Resolved</option>
              </select>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3">
              <button
                onClick={() => setUpdateStatusModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors min-h-[44px] text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={submitStatusUpdate}
                className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors min-h-[44px] text-sm sm:text-base"
              >
                Update Status
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Comment Modal */}
      {commentModalOpen && selectedTicket && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <h3 className="text-base sm:text-lg font-semibold text-[var(--color-heading)]">Add Comment</h3>
              <button 
                onClick={() => setCommentModalOpen(false)} 
                className="text-gray-400 hover:text-gray-600 p-1 min-w-[44px] min-h-[44px] flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="mb-4 sm:mb-6 p-3 sm:p-4 bg-gray-50 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-600 mb-2">Ticket: <span className="font-medium">{selectedTicket.ticketNumber}</span></p>
              <p className="text-xs sm:text-sm text-gray-600">Vendor: <span className="font-medium">{selectedTicket.vendor.name}</span></p>
            </div>

            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Comment *
                </label>
                <textarea
                  className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent min-h-[100px] text-sm sm:text-base"
                  rows={4}
                  placeholder="Add your comment or update..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                  Attach File (Optional)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 sm:p-6 text-center hover:border-gray-400 transition-colors">
                  <div className="mx-auto h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mb-3 sm:mb-4 flex items-center justify-center text-2xl sm:text-3xl">
                    📎
                  </div>
                  <div className="text-xs sm:text-sm text-gray-600 mb-2">
                    <label htmlFor="attachment-upload" className="cursor-pointer text-[var(--color-accent)] hover:underline">
                      Click to upload
                    </label>
                    <span> or drag and drop</span>
                  </div>
                  <p className="text-xs text-gray-500">PNG, JPG, PDF up to 10MB</p>
                  <input
                    id="attachment-upload"
                    type="file"
                    className="hidden"
                    accept=".png,.jpg,.jpeg,.pdf"
                    onChange={(e) => setNewAttachment(e.target.files?.[0] || null)}
                  />
                  {newAttachment && (
                    <p className="mt-2 text-xs sm:text-sm text-green-600 truncate px-2">
                      Selected: {newAttachment.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row gap-3 mt-4 sm:mt-6">
              <button
                onClick={() => setCommentModalOpen(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors min-h-[44px] text-sm sm:text-base"
              >
                Cancel
              </button>
              <button
                onClick={submitComment}
                disabled={!newComment.trim()}
                className="flex-1 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] text-sm sm:text-base"
              >
                Add Comment
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
