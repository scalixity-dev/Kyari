import { useState } from 'react'
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts'
import Button from '../../../components/Button/Button'
import { FileText } from 'lucide-react'
import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'

// Sample data for charts
const orderFulfillmentData = [
  { month: 'Jan', fulfilled: 85, total: 100 },
  { month: 'Feb', fulfilled: 92, total: 110 },
  { month: 'Mar', fulfilled: 88, total: 105 },
  { month: 'Apr', fulfilled: 95, total: 120 },
  { month: 'May', fulfilled: 90, total: 115 },
  { month: 'Jun', fulfilled: 94, total: 125 }
]

const ticketResolutionData = [
  { name: 'Resolved on Time', value: 70, color: '#10B981' },
  { name: 'Overdue', value: 20, color: '#F59E0B' },
  { name: 'Pending', value: 10, color: '#EF4444' }
]

const paymentAgingData = [
  { bucket: "0-30 days", amount: 10000, count: 2 },
  { bucket: "31-60 days", amount: 25000, count: 3 },
  { bucket: "61-90 days", amount: 15000, count: 1 },
  { bucket: "90+ days", amount: 30000, count: 4 }
]

// Sample report data
const sampleOrdersData = [
  { orderId: 'ORD-1001', vendor: 'GreenLeaf Co', status: 'CONFIRMED', date: '2025-01-15', amount: 2500, city: 'Mumbai' },
  { orderId: 'ORD-1002', vendor: 'Urban Roots', status: 'DISPATCHED', date: '2025-01-14', amount: 1800, city: 'Delhi' },
  { orderId: 'ORD-1003', vendor: 'Plantify', status: 'PAYMENT_DONE', date: '2025-01-13', amount: 3200, city: 'Bengaluru' },
  { orderId: 'ORD-1004', vendor: 'Clay Works', status: 'CONFIRMED', date: '2025-01-12', amount: 950, city: 'Pune' },
  { orderId: 'ORD-1005', vendor: 'Urban Roots', status: 'DISPATCHED', date: '2025-01-11', amount: 2100, city: 'Hyderabad' },
  { orderId: 'ORD-1006', vendor: 'GreenLeaf Co', status: 'CONFIRMED', date: '2025-01-10', amount: 1500, city: 'Mumbai' },
  { orderId: 'ORD-1007', vendor: 'Plantify', status: 'PAYMENT_DONE', date: '2025-01-09', amount: 2800, city: 'Bengaluru' },
  { orderId: 'ORD-1008', vendor: 'Clay Works', status: 'DISPATCHED', date: '2025-01-08', amount: 1200, city: 'Pune' }
]

const samplePaymentsData = [
  { invoiceId: 'INV-2001', vendor: 'GreenLeaf Co', amount: 2500, status: 'PAID', date: '2025-01-15', city: 'Mumbai' },
  { invoiceId: 'INV-2002', vendor: 'Urban Roots', amount: 1800, status: 'PENDING', date: '2025-01-14', city: 'Delhi' },
  { invoiceId: 'INV-2003', vendor: 'Plantify', amount: 3200, status: 'PAID', date: '2025-01-13', city: 'Bengaluru' },
  { invoiceId: 'INV-2004', vendor: 'Clay Works', amount: 950, status: 'OVERDUE', date: '2025-01-12', city: 'Pune' },
  { invoiceId: 'INV-2005', vendor: 'Urban Roots', amount: 2100, status: 'PAID', date: '2025-01-11', city: 'Hyderabad' },
  { invoiceId: 'INV-2006', vendor: 'GreenLeaf Co', amount: 1500, status: 'PAID', date: '2025-01-10', city: 'Mumbai' },
  { invoiceId: 'INV-2007', vendor: 'Plantify', amount: 2800, status: 'PENDING', date: '2025-01-09', city: 'Bengaluru' }
]

const sampleVendorsData = [
  { vendorId: 'VEN-001', name: 'GreenLeaf Co', city: 'Mumbai', orders: 25, rating: 4.8, status: 'ACTIVE' },
  { vendorId: 'VEN-002', name: 'Urban Roots', city: 'Delhi', orders: 18, rating: 4.6, status: 'ACTIVE' },
  { vendorId: 'VEN-003', name: 'Plantify', city: 'Bengaluru', orders: 32, rating: 4.9, status: 'ACTIVE' },
  { vendorId: 'VEN-004', name: 'Clay Works', city: 'Pune', orders: 12, rating: 4.3, status: 'PENDING' },
  { vendorId: 'VEN-005', name: 'Urban Roots', city: 'Hyderabad', orders: 15, rating: 4.7, status: 'ACTIVE' }
]

const sampleTicketsData = [
  { ticketId: 'TKT-3001', subject: 'Order Delay', vendor: 'GreenLeaf Co', status: 'RESOLVED', priority: 'HIGH', date: '2025-01-15', city: 'Mumbai' },
  { ticketId: 'TKT-3002', subject: 'Payment Issue', vendor: 'Urban Roots', status: 'OPEN', priority: 'MEDIUM', date: '2025-01-14', city: 'Delhi' },
  { ticketId: 'TKT-3003', subject: 'Quality Complaint', vendor: 'Plantify', status: 'IN_PROGRESS', priority: 'HIGH', date: '2025-01-13', city: 'Bengaluru' },
  { ticketId: 'TKT-3004', subject: 'Delivery Update', vendor: 'Clay Works', status: 'RESOLVED', priority: 'LOW', date: '2025-01-12', city: 'Pune' },
  { ticketId: 'TKT-3005', subject: 'Refund Request', vendor: 'Urban Roots', status: 'OPEN', priority: 'MEDIUM', date: '2025-01-11', city: 'Hyderabad' },
  { ticketId: 'TKT-3006', subject: 'Order Status', vendor: 'GreenLeaf Co', status: 'RESOLVED', priority: 'LOW', date: '2025-01-10', city: 'Mumbai' },
  { ticketId: 'TKT-3007', subject: 'Delivery Delay', vendor: 'Plantify', status: 'IN_PROGRESS', priority: 'MEDIUM', date: '2025-01-09', city: 'Bengaluru' }
]

type MetricType = 'Orders' | 'Vendors' | 'Payments' | 'Tickets'
type FilterType = {
  dateRange: string
  city: string
  vendor: string
  status: string
}



export default function Analytics() {
  const [selectedMetric, setSelectedMetric] = useState<MetricType>('Orders')
  const [filters, setFilters] = useState<FilterType>({
    dateRange: '',
    city: '',
    vendor: '',
    status: ''
  })
  const [reportData, setReportData] = useState<unknown[]>([])
  const [showReport, setShowReport] = useState(false)

  const getReportColumns = (metric: MetricType) => {
    switch (metric) {
      case 'Orders':
        return ['Order ID', 'Vendor', 'Status', 'Date', 'Amount']
      case 'Payments':
        return ['Invoice ID', 'Vendor', 'Amount', 'Status', 'Date']
      case 'Vendors':
        return ['Vendor ID', 'Name', 'City', 'Orders', 'Rating', 'Status']
      case 'Tickets':
        return ['Ticket ID', 'Subject', 'Vendor', 'Status', 'Priority', 'Date']
      default:
        return []
    }
  }

  const getReportData = (metric: MetricType): unknown[] => {
    switch (metric) {
      case 'Orders':
        return sampleOrdersData
      case 'Payments':
        return samplePaymentsData
      case 'Vendors':
        return sampleVendorsData
      case 'Tickets':
        return sampleTicketsData
      default:
        return []
    }
  }

  const handleGenerateReport = () => {
    let data = getReportData(selectedMetric)
    
    // Apply filters
    if (filters.city) {
      data = data.filter((item: unknown) => {
        const itemObj = item as Record<string, unknown>
        return itemObj.city === filters.city
      })
    }
    
    if (filters.vendor) {
      data = data.filter((item: unknown) => {
        const itemObj = item as Record<string, unknown>
        return itemObj.vendor === filters.vendor
      })
    }
    
    if (filters.status) {
      data = data.filter((item: unknown) => {
        const itemObj = item as Record<string, unknown>
        return itemObj.status === filters.status
      })
    }
    
    if (filters.dateRange) {
      const now = new Date()
      let startDate: Date
      
      switch (filters.dateRange) {
        case 'last7days':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          break
        case 'last30days':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
          break
        case 'last90days':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
          break
        default:
          startDate = new Date(0) // All time
      }
      
      data = data.filter((item: unknown) => {
        const itemObj = item as Record<string, unknown>
        if (itemObj.date) {
          const itemDate = new Date(itemObj.date as string)
          return itemDate >= startDate
        }
        return true
      })
    }
    
    setReportData(data)
    setShowReport(true)
  }

  const handleExportPDF = async () => {
    try {
      console.log('Starting PDF export...')
      
      if (reportData.length === 0) {
        alert('No data to export. Please generate a report first.')
        return
      }

      console.log('Creating PDF content...')
      const pdf = new jsPDF('p', 'mm', 'a4')
      
      // Add title
      pdf.setFontSize(16)
      pdf.setFont('helvetica', 'bold')
      pdf.text(`${selectedMetric} Report`, 20, 20)
      
      // Add date
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'normal')
      pdf.text(`Generated on: ${new Date().toLocaleDateString()}`, 20, 30)
      
      // Add table headers
      const columns = getReportColumns(selectedMetric)
      const startY = 40
      const cellHeight = 8
      const cellWidth = 35
      let currentY = startY
      
      // Table headers
      pdf.setFontSize(10)
      pdf.setFont('helvetica', 'bold')
      columns.forEach((col, index) => {
        pdf.text(col, 20 + (index * cellWidth), currentY)
      })
      
      // Add line under headers
      currentY += 5
      pdf.line(20, currentY, 20 + (columns.length * cellWidth), currentY)
      currentY += 5
      
      // Add data rows
      pdf.setFont('helvetica', 'normal')
      reportData.forEach((row: unknown) => {
        if (currentY > 280) { // Start new page if needed
          pdf.addPage()
          currentY = 20
        }
        
        const rowObj = row as Record<string, unknown>
        columns.forEach((col, colIndex) => {
          const key = Object.keys(rowObj).find(k => 
            k.toLowerCase().includes(col.toLowerCase().replace(' ', '').replace('id', ''))
          )
          const value = key ? String(rowObj[key] || '') : ''
          pdf.text(value.substring(0, 20), 20 + (colIndex * cellWidth), currentY)
        })
        currentY += cellHeight
      })
      
      const fileName = `${selectedMetric}_Report_${new Date().toISOString().split('T')[0]}.pdf`
      console.log('Saving PDF:', fileName)
      pdf.save(fileName)
      console.log('PDF export completed successfully')
    } catch (error) {
      console.error('Error generating PDF:', error)
      alert(`Error generating PDF: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`)
    }
  }

  const handleExportExcel = () => {
    try {
      console.log('Starting Excel export...')
      console.log('Report data length:', reportData.length)
      
      if (reportData.length === 0) {
        alert('No data to export. Please generate a report first.')
        return
      }

      const columns = getReportColumns(selectedMetric)
      console.log('Columns:', columns)
      console.log('Sample data:', reportData[0])
      
      const worksheetData = [
        columns, // Header row
        ...reportData.map((row: unknown) => {
          const rowObj = row as Record<string, unknown>
          return columns.map(col => {
            // Map column names to actual data properties
            const key = Object.keys(rowObj).find(k => 
              k.toLowerCase().includes(col.toLowerCase().replace(' ', '').replace('id', ''))
            )
            return key ? rowObj[key] : ''
          })
        })
      ]

      console.log('Worksheet data prepared:', worksheetData.length, 'rows')
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData)
      const workbook = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Report')

      const fileName = `${selectedMetric}_Report_${new Date().toISOString().split('T')[0]}.xlsx`
      console.log('Saving Excel file:', fileName)
      XLSX.writeFile(workbook, fileName)
      console.log('Excel export completed successfully')
    } catch (error) {
      console.error('Error generating Excel:', error)
      alert(`Error generating Excel file: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`)
    }
  }

  const handleClearFilters = () => {
    setFilters({
      dateRange: '',
      city: '',
      vendor: '',
      status: ''
    })
    setShowReport(false)
    setReportData([])
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'confirmed':
        return { bg: '#D1FAE5', color: '#065F46', border: '#A7F3D0' }
      case 'dispatched':
        return { bg: '#FFEDD5', color: '#9A3412', border: '#FED7AA' }
      case 'payment_pending':
      case 'pending':
        return { bg: '#FEF9C3', color: '#92400E', border: '#FEF08A' }
      case 'payment_done':
      case 'paid':
        return { bg: '#E0ECE8', color: '#1D4D43', border: '#B7CEC6' }
      case 'received':
        return { bg: '#E5E7EB', color: '#111827', border: '#D1D5DB' }
      case 'assigned':
        return { bg: '#DBEAFE', color: '#1E3A8A', border: '#BFDBFE' }
      case 'resolved':
      case 'active':
        return { bg: '#D1FAE5', color: '#065F46', border: '#A7F3D0' }
      case 'in_progress':
        return { bg: '#FFEDD5', color: '#9A3412', border: '#FED7AA' }
      case 'open':
        return { bg: '#FEF9C3', color: '#92400E', border: '#FEF08A' }
      case 'overdue':
        return { bg: '#FEE2E2', color: '#DC2626', border: '#FECACA' }
      default:
        return { bg: '#F3F4F6', color: '#6B7280', border: '#E5E7EB' }
    }
  }

  return (
    <div className="p-6 min-h-screen" style={{ backgroundColor: '#F5F3E7' }}>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-heading mb-2">Analytics & Reports</h1>
        <p className="text-gray-600">Monitor performance and generate custom reports</p>
      </div>

      {/* Prebuilt Reports Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold text-heading mb-6">Prebuilt Reports</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Order Fulfillment Rate */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-heading mb-4">Order Fulfillment Rate</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={orderFulfillmentData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="fulfilled" fill="#10B981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 text-center">
              <span className="text-2xl font-bold text-green-600">94%</span>
              <p className="text-sm text-gray-600">Average fulfillment rate</p>
            </div>
          </div>

          {/* Vendor SLA Breaches */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-heading mb-4">Vendor SLA Breaches</h3>
            <div className="flex items-center justify-center h-48">
              <div className="text-center">
                <div className="text-4xl font-bold text-red-600 mb-2">12</div>
                <p className="text-gray-600 mb-4">breaches this week</p>
                <div className="w-32 h-32 mx-auto">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[{ name: 'Breaches', value: 12 }, { name: 'On Time', value: 88 }]}
                        cx="50%"
                        cy="50%"
                        innerRadius={30}
                        outerRadius={60}
                        dataKey="value"
                      >
                        <Cell fill="#EF4444" />
                        <Cell fill="#10B981" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Resolution Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-heading mb-4">Ticket Resolution Stats</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ticketResolutionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    dataKey="value"
                  >
                    {ticketResolutionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 flex justify-center space-x-4">
              {ticketResolutionData.map((item, index) => (
                <div key={index} className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-gray-600">{item.name}: {item.value}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Aging Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-1" style={{ fontFamily: 'Fraunces', color: '#1D4D43' }}>
                Payment Aging
              </h3>
              <p className="text-sm text-gray-600" style={{ fontFamily: 'Quicksand' }}>
                Outstanding invoices grouped by days pending
              </p>
            </div>
            
            <div className="h-48 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentAgingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="bucket" 
                    tick={{ fontSize: 12, fontFamily: 'Quicksand' }}
                    axisLine={{ stroke: '#D1D5DB' }}
                    tickLine={{ stroke: '#D1D5DB' }}
                  />
                  <YAxis 
                    tick={{ fontSize: 12, fontFamily: 'Quicksand' }}
                    axisLine={{ stroke: '#D1D5DB' }}
                    tickLine={{ stroke: '#D1D5DB' }}
                    tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                  />
                  <Tooltip 
                    formatter={(value) => [
                      `₹${Number(value).toLocaleString()}`,
                      'Amount Pending'
                    ]}
                    labelFormatter={(label) => `Bucket: ${label}`}
                    contentStyle={{
                      backgroundColor: '#F9FAFB',
                      border: '1px solid #E5E7EB',
                      borderRadius: '8px',
                      fontFamily: 'Quicksand'
                    }}
                  />
                  <Bar 
                    dataKey="amount" 
                    radius={[4, 4, 0, 0]}
                  >
                    {paymentAgingData.map((_, index) => {
                      const colors = ['#1D4D43', '#C3754C', '#E57373', '#B71C1C']
                      return <Cell key={`cell-${index}`} fill={colors[index]} />
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
              {paymentAgingData.map((item, index) => {
                const colors = ['#1D4D43', '#C3754C', '#E57373', '#B71C1C']
                const bgColors = ['#E8F5E8', '#FDF2E9', '#FEE2E2', '#FEE2E2']
                
                return (
                  <div 
                    key={index} 
                    className="p-3 rounded-lg text-center"
                    style={{ backgroundColor: bgColors[index] }}
                  >
                    <div 
                      className="text-lg font-semibold mb-1"
                      style={{ color: colors[index], fontFamily: 'Quicksand' }}
                    >
                      ₹{item.amount.toLocaleString()}
                    </div>
                    <div 
                      className="text-xs text-gray-600 mb-1"
                      style={{ fontFamily: 'Quicksand' }}
                    >
                      {item.bucket}
                    </div>
                    <div 
                      className="text-xs font-medium"
                      style={{ color: colors[index], fontFamily: 'Quicksand' }}
                    >
                      {item.count} invoices
                    </div>
                  </div>
                )
              })}
            </div>
            
            <div className="flex justify-end">
              <button 
                className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ 
                  backgroundColor: '#C3754C', 
                  color: '#F5F3E7',
                  fontFamily: 'Quicksand'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#A85A3A'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#C3754C'
                }}
              >
                View Full Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Report Builder Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-semibold text-heading mb-6">Custom Report </h2>
        
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Metric</label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as MetricType)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
            >
              <option value="Orders">Orders</option>
              <option value="Vendors">Vendors</option>
              <option value="Payments">Payments</option>
              <option value="Tickets">Tickets</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <select
              value={filters.dateRange}
              onChange={(e) => setFilters({...filters, dateRange: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
            >
              <option value="">All Time</option>
              <option value="last7days">Last 7 Days</option>
              <option value="last30days">Last 30 Days</option>
              <option value="last90days">Last 90 Days</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
            <select
              value={filters.city}
              onChange={(e) => setFilters({...filters, city: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
            >
              <option value="">All Cities</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi">Delhi</option>
              <option value="Bengaluru">Bengaluru</option>
              <option value="Pune">Pune</option>
              <option value="Hyderabad">Hyderabad</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Vendor</label>
            <select
              value={filters.vendor}
              onChange={(e) => setFilters({...filters, vendor: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
            >
              <option value="">All Vendors</option>
              <option value="GreenLeaf Co">GreenLeaf Co</option>
              <option value="Urban Roots">Urban Roots</option>
              <option value="Plantify">Plantify</option>
              <option value="Clay Works">Clay Works</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters({...filters, status: e.target.value})}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="ACTIVE">Active</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="DISPATCHED">Dispatched</option>
              <option value="PAID">Paid</option>
              <option value="RESOLVED">Resolved</option>
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-4 mb-6">
          <Button onClick={handleGenerateReport}>
            Generate Report
          </Button>
          <Button onClick={handleClearFilters} className="bg-gray-500 hover:bg-gray-600">
            Clear Filters
          </Button>
          {showReport && (
            <>
              <Button onClick={handleExportPDF} className="bg-gray-600 hover:bg-gray-700">
                Export PDF
              </Button>
              <Button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700">
                Export Excel
              </Button>
            </>
          )}
        </div>

        {/* Report Table */}
        {showReport && (
          <div id="report-content" className="mt-6">
            <h3 className="text-lg font-semibold text-heading mb-4">
              Report: {selectedMetric} ({reportData.length} records)
            </h3>
            
            {reportData.length === 0 ? (
              <div className="text-center py-12 bg-white border border-gray-200 rounded-lg">
                <div className="flex justify-center mb-2">
                  <FileText size={48} className="text-gray-400" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">No Records Found</h4>
                <p className="text-gray-600 mb-4">
                  No data matches your current filter criteria. Try adjusting your filters to see more results.
                </p>
                <div className="text-sm text-gray-500">
                  <p>Current filters:</p>
                  <ul className="mt-2 space-y-1">
                    {filters.city && <li>• City: {filters.city}</li>}
                    {filters.vendor && <li>• Vendor: {filters.vendor}</li>}
                    {filters.status && <li>• Status: {filters.status}</li>}
                    {filters.dateRange && <li>• Date Range: {filters.dateRange.replace('last', 'Last ').replace('days', ' days')}</li>}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      {getReportColumns(selectedMetric).map((column, index) => (
                        <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {column}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {reportData.map((row, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        {Object.values(row as Record<string, unknown>).map((value: unknown, cellIndex) => (
                          <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {typeof value === 'string' && (value.includes('CONFIRMED') || value.includes('PAID') || value.includes('PAYMENT_DONE') || value.includes('ACTIVE') || value.includes('RESOLVED') || value.includes('DISPATCHED') || value.includes('PENDING') || value.includes('OVERDUE') || value.includes('OPEN') || value.includes('IN_PROGRESS')) ? (
                              <span 
                                className="inline-flex px-2.5 py-1 text-xs font-semibold rounded-full border"
                                style={{
                                  backgroundColor: getStatusColor(value).bg,
                                  color: getStatusColor(value).color,
                                  borderColor: getStatusColor(value).border,
                                }}
                              >
                                {value === 'PAYMENT_DONE' ? 'Paid' : value.replace('_', ' ')}
                              </span>
                            ) : (
                              String(value)
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}


