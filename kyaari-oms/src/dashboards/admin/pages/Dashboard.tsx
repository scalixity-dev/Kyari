import * as React from 'react';
// import { useNavigate } from 'react-router-dom';
import { Package, BarChart3, Wallet, FileText } from 'lucide-react'
import { CSVPDFExportButton } from '../../../components'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Sector,
  LabelList,
} from 'recharts'
import { KPICard } from '../../../components'
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "../../../components/ui/chart"

// task items will be rendered in a table below

/* styles migrated to Tailwind classes */

export default function Dashboard() {
  // const navigate = useNavigate()
  const [fulfillmentPeriod, setFulfillmentPeriod] = React.useState<'daily'|'weekly'|'monthly'|'yearly'>('weekly')
  const [activePieIndex, setActivePieIndex] = React.useState<number | undefined>(undefined)

  const paymentChartData = [
    { name: 'Completed', value: 60, count: 720, amount: 850000, fill: '#1D4D43' },
    { name: 'Pending', value: 25, count: 300, amount: 234500, fill: '#C3754C' },
    { name: 'Overdue', value: 15, count: 180, amount: 161100, fill: '#E05B4C' }
  ]

  // Chart config for bar chart
  const fulfillmentChartConfig = {
    value: {
      label: "Fulfillment Rate",
      color: "var(--color-secondary)",
    },
  }

  // Custom render function for active pie sector (makes it bigger on hover with animation)
  const renderActiveShape = (props: any) => {
    const {
      cx,
      cy,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fill,
    } = props

    return (
      <g>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius + 20} // Expand by 20px on hover
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          style={{
            filter: 'drop-shadow(0px 4px 8px rgba(0, 0, 0, 0.2))',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        />
      </g>
    )
  }

  const fulfillmentDataSets = {
    daily: [
      { name: '00:00', value: 78 },
      { name: '04:00', value: 82 },
      { name: '08:00', value: 88 },
      { name: '12:00', value: 90 },
      { name: '16:00', value: 85 },
      { name: '20:00', value: 80 }
    ],
    weekly: [
      { name: 'Mon', value: 85 },
      { name: 'Tue', value: 92 },
      { name: 'Wed', value: 75 },
      { name: 'Thu', value: 88 },
      { name: 'Fri', value: 95 },
      { name: 'Sat', value: 82 },
      { name: 'Sun', value: 78 }
    ],
    monthly: [
      { name: 'Wk 1', value: 84 },
      { name: 'Wk 2', value: 88 },
      { name: 'Wk 3', value: 90 },
      { name: 'Wk 4', value: 86 }
    ],
    yearly: [
      { name: 'Jan', value: 80 },
      { name: 'Feb', value: 82 },
      { name: 'Mar', value: 85 },
      { name: 'Apr', value: 88 },
      { name: 'May', value: 90 },
      { name: 'Jun', value: 87 },
      { name: 'Jul', value: 89 },
      { name: 'Aug', value: 91 },
      { name: 'Sep', value: 90 },
      { name: 'Oct', value: 92 },
      { name: 'Nov', value: 88 },
      { name: 'Dec', value: 86 }
    ]
  }
  // const today = new Date().toLocaleDateString('en-GB', {
  //   weekday: 'long',
  //   year: 'numeric',
  //   month: 'long',
  //   day: 'numeric'
  // });

  // Mock data - in a real app, this would come from API calls
  const kpiData = [
    {
      title: 'Order Today',
      value: '47',
      icon: <Package size={32} />,
      subtitle: 'Pending: 12 | Confirmed: 20 | Dispatched: 15'
    },
    {
      title: 'Vendor Confirmation',
      value: '8',
      icon: <BarChart3 size={32} />,
      subtitle: 'Pending Approval'
    },
    {
      title: 'Payment Pending',
      value: '₹2,34,500',
      icon: <Wallet size={32} />,
      subtitle: '15 Invoices'
    },
    {
      title: 'Tickets Open',
      value: '6',
      icon: <FileText size={32} />,
      subtitle: '2 High Priority'
    }
  ];

  const taskData = [
    { description: 'vendor confirmations overdue', urgency: 'high' as const, count: 3 },
    { description: 'invoices pending validation', urgency: 'high' as const, count: 2 },
    { description: 'delivery confirmations needed', urgency: 'medium' as const, count: 5 },
    { description: 'inventory updates required', urgency: 'medium' as const, count: 4 },
    { description: 'weekly reports due', urgency: 'low' as const, count: 1 }
  ];

  // Payment Status data for export
  const paymentStatusData = [
    { status: 'Completed', payments: 720, amount: 850000 },
    { status: 'Pending', payments: 300, amount: 234500 },
    { status: 'Overdue', payments: 180, amount: 161100 }
  ];

  // Export functions
  const handleExportCSV = () => {
    const headers = ['Metric', 'Value']
    const csvContent = [
      headers.join(','),
      // Payment Status Summary
      '"Payment Status Summary"',
      '"Total Payments","1,200"',
      '"Total Amount","₹12,45,600"',
      '"Net Received","₹10,98,400"',
      '',
      '"Payment Breakdown"',
      '"Status","Payments","Amount (₹)"',
      ...paymentStatusData.map(item => `"${item.status}","${item.payments}","${item.amount}"`),
      '',
      // Order Fulfillment Rate
      '"Order Fulfillment Rate"',
      '"Period","Fulfillment Rate (%)"',
      ...fulfillmentDataSets[fulfillmentPeriod].map(item => `"${item.name}","${item.value}"`)
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `quick-insights-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  const handleExportPDF = () => {
    const content = [
      'QUICK INSIGHTS REPORT',
      `Generated: ${new Date().toLocaleString()}`,
      '',
      '=== PAYMENT STATUS SUMMARY ===',
      'Total Payments: 1,200',
      'Total Amount: ₹12,45,600',
      'Net Received: ₹10,98,400',
      '',
      'Payment Breakdown:',
      ...paymentStatusData.map(item => 
        `  ${item.status}: ${item.payments} payments • ₹${item.amount.toLocaleString()}`
      ),
      '',
      `=== ORDER FULFILLMENT RATE (${fulfillmentPeriod.toUpperCase()}) ===`,
      ...fulfillmentDataSets[fulfillmentPeriod].map(item => 
        `  ${item.name}: ${item.value}%`
      )
    ].join('\n')
    
    const blob = new Blob([content], { type: 'text/plain' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `quick-insights-${new Date().toISOString().split('T')[0]}.txt`
    a.click()
    window.URL.revokeObjectURL(url)
  }

  return (
    <div className="py-4 px-9 sm:py-6 lg:py-8 min-h-[calc(100vh-4rem)] font-sans w-full overflow-x-hidden" style={{ background: 'var(--color-sharktank-bg)' }}>
      {/* Header Section */}
     

      {/* KPI Cards */}
      <div className="mb-6 lg:mb-8 ">
        <h2 className="text-xl sm:text-2xl font-semibold text-[var(--color-heading)] mb-6 sm:mb-10 font-[var(--font-heading)]">Today's Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {kpiData.map((kpi, index) => (
            <KPICard
              key={index}
              title={kpi.title}
              value={kpi.value}
              icon={kpi.icon}
              subtitle={kpi.subtitle}
            />
          ))}
        </div>
      </div>

      {/* Task Center */}
      <div className="mb-6 lg:mb-8">
        <h2 className="text-xl sm:text-2xl font-semibold text-[var(--color-heading)] mb-4 sm:mb-6 font-[var(--font-heading)]">Actions Required Today</h2>
        
        {/* Mobile Card Layout */}
        <div className="lg:hidden space-y-3">
          {taskData.map((task, idx) => (
            <div key={idx} className="rounded-xl p-4 border border-gray-200 bg-white">
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-secondary text-lg capitalize">{task.description}</h3>
                <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold ${
                  task.urgency === 'high' ? 'bg-red-100 text-red-800' : 
                  task.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-green-100 text-green-800'
                }`}>
                  {task.urgency}
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 mb-4 text-sm">
                <div>
                  <span className="text-gray-500 block">Count</span>
                  <span className="font-medium text-lg">{task.count} items</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="bg-[var(--color-accent)] text-[var(--color-button-text)] rounded-md px-2.5 py-1.5 text-xs hover:brightness-95">
                  Take action
                </button>
                <button className="bg-white text-gray-700 border border-gray-300 rounded-md px-2.5 py-1.5 text-xs hover:bg-gray-50">
                  View
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table Layout */}
        <div className="hidden lg:block bg-white rounded-xl overflow-hidden shadow-md border border-gray-200">
          <table className="w-full border-separate border-spacing-0">
            <thead>
              <tr style={{ background: 'var(--color-accent)' }}>
                <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Task</th>
                <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Urgency</th>
                <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Count</th>
                <th className="text-left p-3 font-heading font-normal" style={{ color: 'var(--color-button-text)' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {taskData.map((task, idx) => (
                <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50 bg-white">
                  <td className="p-3 capitalize">{task.description}</td>
                  <td className="p-3">
                    <span className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${
                      task.urgency === 'high' 
                        ? 'bg-red-50 text-red-700 border-red-200' 
                        : task.urgency === 'medium' 
                        ? 'bg-yellow-50 text-yellow-700 border-yellow-200' 
                        : 'bg-green-50 text-green-700 border-green-200'
                    }`}>
                      {task.urgency}
                    </span>
                  </td>
                  <td className="p-3 font-semibold text-secondary">{task.count}</td>
                  <td className="p-3">
                    <div className="flex items-center gap-1.5">
                      <button className="bg-[var(--color-accent)] text-[var(--color-button-text)] rounded-md px-2.5 py-1.5 text-xs hover:brightness-95">
                        Take action
                      </button>
                      <button className="bg-white text-gray-700 border border-gray-300 rounded-md px-2.5 py-1.5 text-xs hover:bg-gray-50">
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Insights */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6 gap-3">
          <h2 className="text-xl sm:text-2xl font-semibold text-[var(--color-heading)] font-[var(--font-heading)]">Quick Insights</h2>
          <CSVPDFExportButton
            onExportCSV={handleExportCSV}
            onExportPDF={handleExportPDF}
          />
        </div>
  <div className="grid grid-cols-1 gap-6">
          {/* Payment Status Card */}
          <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200">
            {/* Title */}
            <h3 className="text-xl font-semibold text-[#1D4D43] mb-6">Payment Status</h3>
            
            {/* Main content: Summary stats on left, Chart on right */}
            <div className="flex flex-col lg:flex-row gap-8 items-start lg:items-center">
              {/* Left side: Summary Stats and Legend (now stacked) */}
              <div className="flex-1 w-full">
                <div className="grid grid-cols-2 gap-8 w-full">
                  <div>
                    <div className="text-base text-gray-500 mb-2 font-medium">Total Payments</div>
                    <div className="text-5xl font-extrabold text-gray-900 mb-1">1,200</div>
                    <div className="text-sm text-gray-400">Period: Last 30 days</div>
                  </div>
                  <div>
                    <div className="text-base text-gray-500 mb-2 font-medium">Total Amount</div>
                    <div className="text-5xl font-extrabold text-gray-900 mb-1">₹12,45,600</div>
                    <div className="text-sm text-gray-400">Net received: ₹10,98,400</div>
                  </div>
                </div>

                {/* Legend moved directly under totals */}
                <div className="flex flex-wrap gap-10 mt-8 lg:mt-10">
                  <div className="flex items-start gap-3 min-w-[160px] sm:min-w-[200px]">
                    <span className="w-4 h-4 rounded-full bg-[#1D4D43] block flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-0.5">Completed</div>
                      <div className="text-xs text-gray-500">720 payments • ₹8,50,000</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 min-w-[160px] sm:min-w-[200px]">
                    <span className="w-4 h-4 rounded-full bg-[#C3754C] block flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-0.5">Pending</div>
                      <div className="text-xs text-gray-500">300 payments • ₹2,34,500</div>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 min-w-[160px] sm:min-w-[200px]">
                    <span className="w-4 h-4 rounded-full bg-[#E05B4C] block flex-shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-semibold text-gray-700 mb-0.5">Overdue</div>
                      <div className="text-xs text-gray-500">180 payments • ₹1,61,100</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right side: Enlarged Donut Chart */}
              <div className="flex-shrink-0">
                <ResponsiveContainer width={320} height={320}>
                  <PieChart>
                    <Pie 
                      activeIndex={activePieIndex}
                      activeShape={renderActiveShape}
                      data={paymentChartData}
                      cx="50%" 
                      cy="50%" 
                      innerRadius={90} 
                      outerRadius={140} 
                      paddingAngle={2}
                      strokeWidth={0}
                      dataKey="value"
                      onMouseEnter={(_, index) => setActivePieIndex(index)}
                      onMouseLeave={() => setActivePieIndex(undefined)}
                      animationBegin={0}
                      animationDuration={400}
                      animationEasing="ease-in-out"
                    >
                      {paymentChartData.map((entry, index) => (
                        <Cell 
                          key={`cell-${index}`} 
                          fill={entry.fill}
                          style={{
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            cursor: 'pointer'
                          }}
                        />
                      ))}
                    </Pie>
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload
                          return (
                            <div className="rounded-lg border bg-white p-3 shadow-lg">
                              <div className="font-semibold text-gray-900">{data.name}</div>
                              <div className="text-sm text-gray-600 mt-1">
                                <div>{data.value}% of total</div>
                                <div>{data.count} payments</div>
                                <div>₹{data.amount.toLocaleString()}</div>
                              </div>
                            </div>
                          )
                        }
                        return null
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Order Fulfillment Rate Card */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-[var(--color-secondary)]">Order Fulfillment Rate</h3>
              <div className="flex items-center gap-2 bg-gray-100 rounded-md p-1">
                {(['daily','weekly','monthly','yearly'] as const).map(p => (
                  <button
                    key={p}
                    onClick={() => setFulfillmentPeriod(p)}
                    className={`px-3 py-1 text-sm rounded-md ${fulfillmentPeriod === p ? 'bg-[var(--color-accent)] text-[var(--color-button-text)]' : 'text-gray-600'}`}
                  >
                    {p[0].toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <ChartContainer config={fulfillmentChartConfig} className="h-[350px] w-full">
              <BarChart 
                data={fulfillmentDataSets[fulfillmentPeriod]}
                margin={{ top: 30, right: 10, left: -20, bottom: 5 }}
              >
                <XAxis 
                  dataKey="name" 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                />
                <YAxis 
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#6b7280', fontSize: 12 }}
                  domain={[0, 100]}
                />
                <ChartTooltip 
                  cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                  content={<ChartTooltipContent 
                    formatter={(value) => [`${value}%`, "Fulfillment Rate"]}
                    className="bg-white"
                  />}
                />
                <Bar 
                  dataKey="value" 
                  fill="var(--color-secondary)" 
                  radius={[8, 8, 0, 0]}
                  barSize={45}
                >
                  <LabelList 
                    dataKey="value" 
                    position="top" 
                    offset={8}
                    className="fill-foreground"
                    fontSize={13}
                    fontWeight={600}
                    formatter={(value: number) => `${value}%`}
                  />
                </Bar>
              </BarChart>
            </ChartContainer>
          </div>
        </div>
      </div>
    </div>
  )
}


