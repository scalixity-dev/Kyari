import { useState, useEffect, useRef } from 'react'
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
const orderFulfillmentData = {
  monthly: [
    { period: 'Jan', fulfilled: 85, total: 100 },
    { period: 'Feb', fulfilled: 92, total: 110 },
    { period: 'Mar', fulfilled: 88, total: 105 },
    { period: 'Apr', fulfilled: 95, total: 120 },
    { period: 'May', fulfilled: 90, total: 115 },
    { period: 'Jun', fulfilled: 94, total: 125 }
  ],
  weekly: {
    'Jan': [
      { period: 'Week 1', fulfilled: 22, total: 25 },
      { period: 'Week 2', fulfilled: 28, total: 30 },
      { period: 'Week 3', fulfilled: 24, total: 28 },
      { period: 'Week 4', fulfilled: 31, total: 35 }
    ],
    'Feb': [
      { period: 'Week 1', fulfilled: 26, total: 30 },
      { period: 'Week 2', fulfilled: 29, total: 32 },
      { period: 'Week 3', fulfilled: 25, total: 28 },
      { period: 'Week 4', fulfilled: 33, total: 36 }
    ],
    'Mar': [
      { period: 'Week 1', fulfilled: 20, total: 24 },
      { period: 'Week 2', fulfilled: 26, total: 30 },
      { period: 'Week 3', fulfilled: 22, total: 26 },
      { period: 'Week 4', fulfilled: 28, total: 32 }
    ],
    'Apr': [
      { period: 'Week 1', fulfilled: 30, total: 33 },
      { period: 'Week 2', fulfilled: 28, total: 31 },
      { period: 'Week 3', fulfilled: 32, total: 35 },
      { period: 'Week 4', fulfilled: 29, total: 32 }
    ],
    'May': [
      { period: 'Week 1', fulfilled: 25, total: 28 },
      { period: 'Week 2', fulfilled: 27, total: 30 },
      { period: 'Week 3', fulfilled: 24, total: 27 },
      { period: 'Week 4', fulfilled: 26, total: 29 }
    ],
    'Jun': [
      { period: 'Week 1', fulfilled: 31, total: 34 },
      { period: 'Week 2', fulfilled: 29, total: 32 },
      { period: 'Week 3', fulfilled: 33, total: 36 },
      { period: 'Week 4', fulfilled: 30, total: 33 }
    ],
    'Jul': [
      { period: 'Week 1', fulfilled: 28, total: 31 },
      { period: 'Week 2', fulfilled: 32, total: 35 },
      { period: 'Week 3', fulfilled: 29, total: 32 },
      { period: 'Week 4', fulfilled: 31, total: 34 }
    ],
    'Aug': [
      { period: 'Week 1', fulfilled: 26, total: 29 },
      { period: 'Week 2', fulfilled: 30, total: 33 },
      { period: 'Week 3', fulfilled: 28, total: 31 },
      { period: 'Week 4', fulfilled: 32, total: 35 }
    ],
    'Sep': [
      { period: 'Week 1', fulfilled: 33, total: 36 },
      { period: 'Week 2', fulfilled: 29, total: 32 },
      { period: 'Week 3', fulfilled: 31, total: 34 },
      { period: 'Week 4', fulfilled: 30, total: 33 }
    ],
    'Oct': [
      { period: 'Week 1', fulfilled: 27, total: 30 },
      { period: 'Week 2', fulfilled: 31, total: 34 },
      { period: 'Week 3', fulfilled: 28, total: 31 },
      { period: 'Week 4', fulfilled: 32, total: 35 }
    ],
    'Nov': [
      { period: 'Week 1', fulfilled: 29, total: 32 },
      { period: 'Week 2', fulfilled: 33, total: 36 },
      { period: 'Week 3', fulfilled: 30, total: 33 },
      { period: 'Week 4', fulfilled: 31, total: 34 }
    ],
    'Dec': [
      { period: 'Week 1', fulfilled: 35, total: 38 },
      { period: 'Week 2', fulfilled: 32, total: 35 },
      { period: 'Week 3', fulfilled: 34, total: 37 },
      { period: 'Week 4', fulfilled: 33, total: 36 }
    ]
  }
}

const ticketResolutionData = [
  { name: 'Resolved on Time', value: 70, color: '#10B981' },
  { name: 'Overdue', value: 20, color: '#F59E0B' },
  { name: 'Pending', value: 10, color: '#EF4444' }
]

const slaBreachesData = [
  { name: 'On Time', value: 88, color: '#10B981' },
  { name: 'Breaches', value: 12, color: '#EF4444' }
]

const vendorSlaDetails = [
  { vendor: 'GreenLeaf Co', totalOrders: 25, breaches: 2, breachRate: 8.0, avgDelay: '2.5 hrs', slaTarget: '24 hrs', recentBreaches: ['ORD-1001', 'ORD-1006'] },
  { vendor: 'Urban Roots', totalOrders: 33, breaches: 5, breachRate: 15.2, avgDelay: '4.2 hrs', slaTarget: '24 hrs', recentBreaches: ['ORD-1002', 'ORD-1005', 'ORD-2002', 'ORD-2005', 'ORD-3005'] },
  { vendor: 'Plantify', totalOrders: 32, breaches: 1, breachRate: 3.1, avgDelay: '1.8 hrs', slaTarget: '24 hrs', recentBreaches: ['ORD-1003'] },
  { vendor: 'Clay Works', totalOrders: 12, breaches: 4, breachRate: 33.3, avgDelay: '6.5 hrs', slaTarget: '24 hrs', recentBreaches: ['ORD-1004', 'ORD-1008', 'INV-2004', 'TKT-3004'] },
  { vendor: 'EcoGarden Solutions', totalOrders: 28, breaches: 3, breachRate: 10.7, avgDelay: '3.2 hrs', slaTarget: '24 hrs', recentBreaches: ['ORD-2001', 'ORD-2003', 'ORD-3001'] },
  { vendor: 'FreshHarvest Ltd', totalOrders: 45, breaches: 2, breachRate: 4.4, avgDelay: '2.1 hrs', slaTarget: '24 hrs', recentBreaches: ['ORD-3002', 'ORD-3003'] },
  { vendor: 'Garden Paradise', totalOrders: 19, breaches: 6, breachRate: 31.6, avgDelay: '5.8 hrs', slaTarget: '24 hrs', recentBreaches: ['ORD-4001', 'ORD-4002', 'ORD-4003', 'ORD-4004', 'ORD-4005', 'ORD-4006'] },
  { vendor: 'Nature\'s Best', totalOrders: 37, breaches: 1, breachRate: 2.7, avgDelay: '1.5 hrs', slaTarget: '24 hrs', recentBreaches: ['ORD-5001'] },
  { vendor: 'Organic Valley', totalOrders: 52, breaches: 4, breachRate: 7.7, avgDelay: '2.8 hrs', slaTarget: '24 hrs', recentBreaches: ['ORD-6001', 'ORD-6002', 'ORD-6003', 'ORD-6004'] },
  { vendor: 'Green Thumb Co', totalOrders: 23, breaches: 7, breachRate: 30.4, avgDelay: '6.2 hrs', slaTarget: '24 hrs', recentBreaches: ['ORD-7001', 'ORD-7002', 'ORD-7003', 'ORD-7004', 'ORD-7005', 'ORD-7006', 'ORD-7007'] }
]

// Simulate a larger dataset for demonstration
const generateMoreVendors = () => {
  const cities = ['Mumbai', 'Delhi', 'Bangalore', 'Pune', 'Hyderabad', 'Chennai', 'Kolkata', 'Ahmedabad']
  const vendorTypes = ['Garden', 'Organic', 'Fresh', 'Green', 'Natural', 'Eco', 'Urban', 'Rural']
  const suffixes = ['Co', 'Ltd', 'Solutions', 'Services', 'Farms', 'Gardens', 'Supply', 'Trade']
  
  const moreVendors = []
  for (let i = 11; i <= 100; i++) {
    const city = cities[Math.floor(Math.random() * cities.length)]
    const type = vendorTypes[Math.floor(Math.random() * vendorTypes.length)]
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)]
    const vendor = `${type} ${suffix} ${city}`
    const totalOrders = Math.floor(Math.random() * 50) + 10
    const breaches = Math.floor(Math.random() * Math.min(totalOrders, 10))
    const breachRate = (breaches / totalOrders) * 100
    const avgDelay = (Math.random() * 8 + 1).toFixed(1) + ' hrs'
    
    const recentBreaches = []
    for (let j = 0; j < breaches; j++) {
      recentBreaches.push(`ORD-${i}${j.toString().padStart(3, '0')}`)
    }
    
    moreVendors.push({
      vendor,
      totalOrders,
      breaches,
      breachRate: parseFloat(breachRate.toFixed(1)),
      avgDelay,
      slaTarget: '24 hrs',
      recentBreaches
    })
  }
  return moreVendors
}

const allVendorSlaDetails = [...vendorSlaDetails, ...generateMoreVendors()]

const ticketResolutionDetails = [
  { priority: 'High', total: 25, resolved: 18, overdue: 5, pending: 2, avgResolutionTime: '2.5 hrs' },
  { priority: 'Medium', total: 45, resolved: 32, overdue: 8, pending: 5, avgResolutionTime: '4.2 hrs' },
  { priority: 'Low', total: 30, resolved: 25, overdue: 3, pending: 2, avgResolutionTime: '6.8 hrs' }
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
  const [fulfillmentView, setFulfillmentView] = useState<'weekly' | 'monthly'>('monthly')
  const [selectedMonth, setSelectedMonth] = useState<string>('Sep')
  const [selectedYear, setSelectedYear] = useState<string>('2025')
  const [selectedVendorSla, setSelectedVendorSla] = useState<string>('')
  const [vendorSearchTerm, setVendorSearchTerm] = useState<string>('')
  const [showVendorDropdown, setShowVendorDropdown] = useState<boolean>(false)
  const vendorDropdownRef = useRef<HTMLDivElement>(null)

  // Calculate metrics for the current view
  const getCurrentMetrics = () => {
    const data = fulfillmentView === 'weekly' 
      ? orderFulfillmentData.weekly[selectedMonth as keyof typeof orderFulfillmentData.weekly] 
      : orderFulfillmentData.monthly
    
    const totalOrders = data.reduce((sum: number, item: { total: number }) => sum + item.total, 0)
    const fulfilledOrders = data.reduce((sum: number, item: { fulfilled: number }) => sum + item.fulfilled, 0)
    const pendingOrders = totalOrders - fulfilledOrders
    const fulfillmentRate = Math.round((fulfilledOrders / totalOrders) * 100)
    
    return {
      totalOrders,
      fulfilledOrders,
      pendingOrders,
      fulfillmentRate
    }
  }

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

  // Filter vendors based on search term
  const filteredVendors = allVendorSlaDetails.filter(vendor =>
    vendor.vendor.toLowerCase().includes(vendorSearchTerm.toLowerCase())
  ).slice(0, 10) // Limit to 10 results for performance

  const handleVendorSelect = (vendorName: string) => {
    setSelectedVendorSla(vendorName)
    setVendorSearchTerm(vendorName)
    setShowVendorDropdown(false)
  }

  const handleVendorSearchChange = (value: string) => {
    setVendorSearchTerm(value)
    setShowVendorDropdown(value.length > 0)
    if (value === '') {
      setSelectedVendorSla('')
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (vendorDropdownRef.current && !vendorDropdownRef.current.contains(event.target as Node)) {
        setShowVendorDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

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
    <div className="p-4 sm:p-6 lg:p-8 min-h-screen overflow-x-auto" style={{ backgroundColor: '#ECDDC9' }}>
      {/* Page Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-heading mb-2">Analytics & Reports</h1>
        <p className="text-sm sm:text-base text-gray-600">Monitor performance and generate custom reports</p>
      </div>

      {/* Prebuilt Reports Section */}
      <div className="mb-8 sm:mb-12">
        <h2 className="text-xl sm:text-2xl font-semibold text-heading mb-4 sm:mb-6">Prebuilt Reports</h2>
        {/* Order Fulfillment Rate - Full Width */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-center mb-4 sm:mb-6">
            <h3 className="text-lg sm:text-xl font-semibold text-heading">Order Fulfillment Rate</h3>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:space-x-4">
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setFulfillmentView('monthly')}
                  className={`px-3 sm:px-4 py-2 text-sm font-medium rounded-md transition-colors min-h-[44px] sm:min-h-auto ${
                    fulfillmentView === 'monthly'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setFulfillmentView('weekly')}
                  className={`px-3 sm:px-4 py-2 text-sm font-medium rounded-md transition-colors min-h-[44px] sm:min-h-auto ${
                    fulfillmentView === 'weekly'
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  Weekly
                </button>
              </div>
              
              {/* Month and Year Selectors for Weekly View */}
              {fulfillmentView === 'weekly' && (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:space-x-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                    <label className="text-sm font-medium text-gray-700">Month:</label>
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:border-transparent min-h-[44px] sm:min-h-auto"
                    >
                      <option value="Jan">January</option>
                      <option value="Feb">February</option>
                      <option value="Mar">March</option>
                      <option value="Apr">April</option>
                      <option value="May">May</option>
                      <option value="Jun">June</option>
                      <option value="Jul">July</option>
                      <option value="Aug">August</option>
                      <option value="Sep">September</option>
                      <option value="Oct">October</option>
                      <option value="Nov">November</option>
                      <option value="Dec">December</option>
                    </select>
                  </div>
                  
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2">
                    <label className="text-sm font-medium text-gray-700">Year:</label>
                    <select
                      value={selectedYear}
                      onChange={(e) => setSelectedYear(e.target.value)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:border-transparent min-h-[44px] sm:min-h-auto"
                    >
                      <option value="2023">2023</option>
                      <option value="2024">2024</option>
                      <option value="2025">2025</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Chart Section */}
            <div className="lg:col-span-2">
              <div className="h-48 sm:h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={fulfillmentView === 'weekly' ? orderFulfillmentData.weekly[selectedMonth as keyof typeof orderFulfillmentData.weekly] : orderFulfillmentData.monthly}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="fulfilled" fill="#10B981" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            {/* Metrics Section */}
            <div className="flex flex-col justify-center space-y-4 sm:space-y-6">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-green-600 mb-2">
                  {getCurrentMetrics().fulfillmentRate}%
                </div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">
                  Average {fulfillmentView} fulfillment rate
                  {fulfillmentView === 'weekly' && ` (${selectedMonth} ${selectedYear})`}
                </p>
                <div className="w-12 sm:w-16 h-1 bg-green-200 rounded-full mx-auto">
                  <div 
                    className="h-1 bg-green-600 rounded-full" 
                    style={{ width: `${getCurrentMetrics().fulfillmentRate}%` }}
                  ></div>
                </div>
              </div>
              
              <div className="space-y-2 sm:space-y-3">
                <div className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <span className="text-xs sm:text-sm text-gray-600">Total Orders</span>
                  <span className="font-semibold text-sm sm:text-base">
                    {getCurrentMetrics().totalOrders}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <span className="text-xs sm:text-sm text-gray-600">Fulfilled</span>
                  <span className="font-semibold text-green-600 text-sm sm:text-base">
                    {getCurrentMetrics().fulfilledOrders}
                  </span>
                </div>
                <div className="flex justify-between items-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                  <span className="text-xs sm:text-sm text-gray-600">Pending</span>
                  <span className="font-semibold text-orange-600 text-sm sm:text-base">
                    {getCurrentMetrics().pendingOrders}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Other Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">

          {/* Vendor SLA Breaches */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mb-4">
              <h3 className="text-base sm:text-lg font-semibold text-heading">Vendor SLA Breaches</h3>
              <div className="flex items-center space-x-3">
                <div className="relative" ref={vendorDropdownRef}>
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      placeholder="Search vendors..."
                      value={vendorSearchTerm}
                      onChange={(e) => handleVendorSearchChange(e.target.value)}
                      onFocus={() => setShowVendorDropdown(vendorSearchTerm.length > 0)}
                      className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-accent focus:border-transparent w-full sm:w-48 min-h-[44px] sm:min-h-auto"
                    />
                    {selectedVendorSla && (
                      <button
                        onClick={() => {
                          setSelectedVendorSla('')
                          setVendorSearchTerm('')
                          setShowVendorDropdown(false)
                        }}
                        className="text-gray-400 hover:text-gray-600 text-sm min-h-[44px] sm:min-h-auto px-2"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                  
                  {/* Search Dropdown */}
                  {showVendorDropdown && filteredVendors.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10 max-h-60 overflow-y-auto">
                      <div className="p-2 text-xs text-gray-500 border-b">
                        Showing {filteredVendors.length} of {allVendorSlaDetails.length} vendors
                      </div>
                      {filteredVendors.map((vendor, index) => (
                        <div
                          key={index}
                          onClick={() => handleVendorSelect(vendor.vendor)}
                          className="p-2 hover:bg-gray-50 cursor-pointer border-b last:border-b-0 min-h-[44px] sm:min-h-auto flex items-center"
                        >
                          <div className="flex justify-between items-center w-full">
                            <span className="text-sm font-medium text-gray-900">{vendor.vendor}</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-gray-500">{vendor.breaches}/{vendor.totalOrders}</span>
                              <span 
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  vendor.breachRate > 20 
                                    ? 'bg-red-100 text-red-800' 
                                    : vendor.breachRate > 10 
                                      ? 'bg-yellow-100 text-yellow-800' 
                                      : 'bg-green-100 text-green-800'
                                }`}
                              >
                                {vendor.breachRate}%
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                      {filteredVendors.length === 10 && (
                        <div className="p-2 text-xs text-gray-500 text-center border-t">
                          Type more to narrow results...
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* No Results */}
                  {showVendorDropdown && filteredVendors.length === 0 && vendorSearchTerm.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-10">
                      <div className="p-3 text-sm text-gray-500 text-center">
                        No vendors found matching "{vendorSearchTerm}"
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {selectedVendorSla ? (
              // Selected Vendor Details
              (() => {
                const vendor = allVendorSlaDetails.find(v => v.vendor === selectedVendorSla)
                if (!vendor) return null
                
                return (
                  <div className="space-y-4 sm:space-y-6">
                    {/* Vendor Specific Metrics */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
                      <div className="text-center p-2 sm:p-3 bg-gray-50 rounded-lg">
                        <div className="text-lg sm:text-xl font-bold text-gray-900">{vendor.totalOrders}</div>
                        <p className="text-xs text-gray-600">Total Orders</p>
                      </div>
                      <div className="text-center p-2 sm:p-3 bg-red-50 rounded-lg">
                        <div className="text-lg sm:text-xl font-bold text-red-600">{vendor.breaches}</div>
                        <p className="text-xs text-gray-600">Breaches</p>
                      </div>
                      <div className="text-center p-2 sm:p-3 bg-orange-50 rounded-lg">
                        <div className="text-lg sm:text-xl font-bold text-orange-600">{vendor.breachRate}%</div>
                        <p className="text-xs text-gray-600">Breach Rate</p>
                      </div>
                      <div className="text-center p-2 sm:p-3 bg-blue-50 rounded-lg">
                        <div className="text-lg sm:text-xl font-bold text-blue-600">{vendor.avgDelay}</div>
                        <p className="text-xs text-gray-600">Avg Delay</p>
                      </div>
                    </div>

                    {/* Vendor Performance Chart */}
                    <div className="h-24 sm:h-32">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'On Time', value: vendor.totalOrders - vendor.breaches, color: '#10B981' },
                              { name: 'Breaches', value: vendor.breaches, color: '#EF4444' }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={20}
                            outerRadius={35}
                            dataKey="value"
                          >
                            <Cell fill="#10B981" />
                            <Cell fill="#EF4444" />
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>

                    {/* Recent Breaches */}
                    <div className="border-t pt-4">
                      <h4 className="text-sm font-medium text-gray-700 mb-3">Recent SLA Breaches</h4>
                      <div className="space-y-2">
                        {vendor.recentBreaches.slice(0, 3).map((breach, index) => (
                          <div key={index} className="flex justify-between items-center p-2 bg-red-50 rounded-lg">
                            <span className="text-sm font-medium text-gray-900">{breach}</span>
                            <span className="text-xs text-red-600 font-medium">SLA Breach</span>
                          </div>
                        ))}
                        {vendor.recentBreaches.length > 3 && (
                          <div className="text-center">
                            <span className="text-xs text-gray-500">+{vendor.recentBreaches.length - 3} more</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* SLA Target Info */}
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-700">SLA Target:</span>
                        <span className="text-sm font-semibold text-blue-800">{vendor.slaTarget}</span>
                      </div>
                    </div>
                  </div>
                )
              })()
            ) : (
              // All Vendors Overview
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-red-600">12</div>
                    <p className="text-xs sm:text-sm text-gray-600">Total Breaches</p>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-orange-600">13.3%</div>
                    <p className="text-xs sm:text-sm text-gray-600">Breach Rate</p>
                  </div>
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-blue-600">3.6 hrs</div>
                    <p className="text-xs sm:text-sm text-gray-600">Avg Delay</p>
                  </div>
                </div>

                {/* Chart */}
                <div className="h-24 sm:h-32 mb-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={slaBreachesData}
                        cx="50%"
                        cy="50%"
                        innerRadius={20}
                        outerRadius={35}
                        dataKey="value"
                      >
                        {slaBreachesData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                {/* Legend */}
                <div className="flex flex-col sm:flex-row sm:justify-center sm:space-x-4 space-y-2 sm:space-y-0 mb-4">
                  {slaBreachesData.map((item, index) => (
                    <div key={index} className="flex items-center">
                      <div 
                        className="w-3 h-3 rounded-full mr-2" 
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs sm:text-sm text-gray-600">{item.name}: {item.value}%</span>
                    </div>
                  ))}
                </div>

                {/* Top Breaching Vendors */}
                <div className="border-t pt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Top Breaching Vendors</h4>
                  <div className="space-y-2">
                    {allVendorSlaDetails
                      .sort((a, b) => b.breachRate - a.breachRate)
                      .slice(0, 3)
                      .map((vendor, index) => (
                        <div key={index} className="flex justify-between items-center text-sm">
                          <span className="font-medium text-gray-900 truncate pr-2">{vendor.vendor}</span>
                          <div className="flex items-center space-x-2 sm:space-x-3">
                            <span className="text-gray-600 text-xs sm:text-sm">{vendor.breaches}/{vendor.totalOrders}</span>
                            <span 
                              className={`px-2 py-1 rounded-full text-xs font-medium ${
                                vendor.breachRate > 20 
                                  ? 'bg-red-100 text-red-800' 
                                  : vendor.breachRate > 10 
                                    ? 'bg-yellow-100 text-yellow-800' 
                                    : 'bg-green-100 text-green-800'
                              }`}
                            >
                              {vendor.breachRate}%
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Ticket Resolution Stats */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
            <h3 className="text-base sm:text-lg font-semibold text-heading mb-4">Ticket Resolution Stats</h3>
            
            {/* Key Metrics */}
            <div className="grid grid-cols-3 gap-2 sm:gap-4 mb-4 sm:mb-6">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-blue-600">100</div>
                <p className="text-xs sm:text-sm text-gray-600">Total Tickets</p>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-green-600">75</div>
                <p className="text-xs sm:text-sm text-gray-600">Resolved</p>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-orange-600">4.2 hrs</div>
                <p className="text-xs sm:text-sm text-gray-600">Avg Resolution</p>
              </div>
            </div>

            {/* Chart */}
            <div className="h-24 sm:h-32 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ticketResolutionData}
                    cx="50%"
                    cy="50%"
                    innerRadius={20}
                    outerRadius={35}
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

            {/* Legend */}
            <div className="flex flex-col sm:flex-row sm:justify-center sm:space-x-4 space-y-2 sm:space-y-0 mb-4">
              {ticketResolutionData.map((item, index) => (
                <div key={index} className="flex items-center">
                  <div 
                    className="w-3 h-3 rounded-full mr-2" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs sm:text-sm text-gray-600">{item.name}: {item.value}%</span>
                </div>
              ))}
            </div>

            {/* Priority Breakdown */}
            <div className="border-t pt-4">
              <h4 className="text-sm font-medium text-gray-700 mb-3">Resolution by Priority</h4>
              <div className="space-y-2">
                {ticketResolutionDetails.map((priority, index) => (
                  <div key={index} className="flex justify-between items-center text-sm">
                    <div className="flex items-center">
                      <div 
                        className={`w-2 h-2 rounded-full mr-2 ${
                          priority.priority === 'High' 
                            ? 'bg-red-500' 
                            : priority.priority === 'Medium' 
                              ? 'bg-yellow-500' 
                              : 'bg-green-500'
                        }`}
                      />
                      <span className="font-medium text-gray-900">{priority.priority}</span>
                    </div>
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <span className="text-gray-600 text-xs sm:text-sm">{priority.resolved}/{priority.total}</span>
                      <span 
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          priority.priority === 'High' 
                            ? 'bg-red-100 text-red-800' 
                            : priority.priority === 'Medium' 
                              ? 'bg-yellow-100 text-yellow-800' 
                              : 'bg-green-100 text-green-800'
                        }`}
                      >
                        {priority.avgResolutionTime}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Payment Aging Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:col-span-2">
            <div className="mb-4">
              <h3 className="text-base sm:text-lg font-semibold mb-1" style={{ fontFamily: 'Fraunces', color: '#1D4D43' }}>
                Payment Aging
              </h3>
              <p className="text-xs sm:text-sm text-gray-600" style={{ fontFamily: 'Quicksand' }}>
                Outstanding invoices grouped by days pending
              </p>
            </div>
            
            <div className="h-36 sm:h-48 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={paymentAgingData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="bucket" 
                    tick={{ fontSize: 10, fontFamily: 'Quicksand' }}
                    axisLine={{ stroke: '#D1D5DB' }}
                    tickLine={{ stroke: '#D1D5DB' }}
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fontFamily: 'Quicksand' }}
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
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 mb-4">
              {paymentAgingData.map((item, index) => {
                const colors = ['#1D4D43', '#C3754C', '#E57373', '#B71C1C']
                const bgColors = ['#E8F5E8', '#FDF2E9', '#FEE2E2', '#FEE2E2']
                
                return (
                  <div 
                    key={index} 
                    className="p-2 sm:p-3 rounded-lg text-center"
                    style={{ backgroundColor: bgColors[index] }}
                  >
                    <div 
                      className="text-sm sm:text-lg font-semibold mb-1"
                      style={{ color: colors[index], fontFamily: 'Quicksand' }}
                    >
                      ₹{(item.amount / 1000).toFixed(0)}k
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
                className="px-3 sm:px-4 py-2 rounded-lg text-sm font-medium transition-colors min-h-[44px] sm:min-h-auto"
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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <h2 className="text-xl sm:text-2xl font-semibold text-heading mb-4 sm:mb-6">Custom Report </h2>
        
        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Metric</label>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value as MetricType)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent min-h-[44px] sm:min-h-auto"
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
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent min-h-[44px] sm:min-h-auto"
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
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent min-h-[44px] sm:min-h-auto"
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
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent min-h-[44px] sm:min-h-auto"
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
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-accent focus:border-transparent min-h-[44px] sm:min-h-auto"
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
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4 sm:mb-6">
          <Button onClick={handleGenerateReport} className="min-h-[44px] sm:min-h-auto">
            Generate Report
          </Button>
          <Button onClick={handleClearFilters} className="bg-gray-500 hover:bg-gray-600 min-h-[44px] sm:min-h-auto">
            Clear Filters
          </Button>
          {showReport && (
            <>
              <Button onClick={handleExportPDF} className="bg-gray-600 hover:bg-gray-700 min-h-[44px] sm:min-h-auto">
                Export PDF
              </Button>
              <Button onClick={handleExportExcel} className="bg-green-600 hover:bg-green-700 min-h-[44px] sm:min-h-auto">
                Export Excel
              </Button>
            </>
          )}
        </div>

        {/* Report Table */}
        {showReport && (
          <div id="report-content" className="mt-4 sm:mt-6">
            <h3 className="text-base sm:text-lg font-semibold text-heading mb-4">
              Report: {selectedMetric} ({reportData.length} records)
            </h3>
            
            {reportData.length === 0 ? (
              <div className="text-center py-8 sm:py-12 bg-white border border-gray-200 rounded-lg">
                <div className="flex justify-center mb-2">
                  <FileText size={40} className="text-gray-400 sm:w-12 sm:h-12" />
                </div>
                <h4 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No Records Found</h4>
                <p className="text-sm sm:text-base text-gray-600 mb-4 px-4">
                  No data matches your current filter criteria. Try adjusting your filters to see more results.
                </p>
                <div className="text-xs sm:text-sm text-gray-500 px-4">
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
              <>
                {/* Mobile Card View */}
                <div className="lg:hidden space-y-3">
                  {reportData.map((row, index) => {
                    const rowObj = row as Record<string, unknown>
                    const columns = getReportColumns(selectedMetric)
                    return (
                      <div key={index} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <div className="space-y-2">
                          {columns.map((column, colIndex) => {
                            const key = Object.keys(rowObj).find(k => 
                              k.toLowerCase().includes(column.toLowerCase().replace(' ', '').replace('id', ''))
                            )
                            const value = key ? rowObj[key] : ''
                            
                            return (
                              <div key={colIndex} className="flex justify-between items-start">
                                <span className="text-sm font-medium text-gray-600 flex-shrink-0 mr-3">
                                  {column}:
                                </span>
                                <span className="text-sm text-gray-900 text-right">
                                  {typeof value === 'string' && (value.includes('CONFIRMED') || value.includes('PAID') || value.includes('PAYMENT_DONE') || value.includes('ACTIVE') || value.includes('RESOLVED') || value.includes('DISPATCHED') || value.includes('PENDING') || value.includes('OVERDUE') || value.includes('OPEN') || value.includes('IN_PROGRESS')) ? (
                                    <span 
                                      className="inline-flex px-2 py-1 text-xs font-semibold rounded-full border"
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
                                </span>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>

                {/* Desktop Table View */}
                <div className="hidden lg:block overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead className="bg-gray-50">
                      <tr>
                        {getReportColumns(selectedMetric).map((column, index) => (
                          <th key={index} className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {column}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {reportData.map((row, index) => (
                        <tr key={index} className="hover:bg-gray-50">
                          {Object.values(row as Record<string, unknown>).map((value: unknown, cellIndex) => (
                            <td key={cellIndex} className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
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
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}


