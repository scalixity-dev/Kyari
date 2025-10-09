import React from 'react';
// import { useNavigate } from 'react-router-dom';
import { Package, BarChart3, Wallet, FileText } from 'lucide-react'
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
  
} from 'recharts'

interface KPICardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  subtitle?: string;
  onClick?: () => void;
}

// task items will be rendered in a table below

/* styles migrated to Tailwind classes */

const KPICard: React.FC<KPICardProps> = ({ title, value, icon, subtitle, onClick }) => {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : -1}
      onKeyDown={(e) => { if (onClick && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick() } }}
      onClick={onClick}
      className={`bg-[var(--color-happyplant-bg)] p-6 pt-10 rounded-xl shadow-sm flex flex-col items-center text-center relative ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all' : ''}`}
    >
      {/* Circular icon at top center, overlapping the card edge */}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 w-16 h-16 bg-[var(--color-accent)] rounded-full p-3 flex items-center justify-center text-white shadow-md">
        {React.isValidElement(icon) ? React.cloneElement(icon as any, { color: 'white', size: 32, strokeWidth: 2 } as any) : icon}
      </div>
      
      {/* Card content */}
      <h3 className="text-lg font-semibold text-gray-800 mb-1">{title}</h3>
      <div className="text-2xl font-bold text-gray-900 mt-1">{value}</div>
      {subtitle && <div className="text-sm text-gray-600 mt-1">{subtitle}</div>}
    </div>
  )
}

// TaskItem removed; tasks are now rendered as a table with an Actions column

export default function Dashboard() {
  // const navigate = useNavigate()
  const [fulfillmentPeriod, setFulfillmentPeriod] = React.useState<'daily'|'weekly'|'monthly'|'yearly'>('weekly')

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
      color: 'orange',
      subtitle: 'Pending: 12 | Confirmed: 20 | Dispatched: 15'
    },
    {
      title: 'Vendor Confirmation',
      value: '8',
      icon: <BarChart3 size={32} />,
      color: 'orange',
      subtitle: 'Pending Approval'
    },
    {
      title: 'Payment Pending',
      value: '₹2,34,500',
      icon: <Wallet size={32} />,
      color: 'orange',
      subtitle: '15 Invoices'
    },
    {
      title: 'Tickets Open',
      value: '6',
      icon: <FileText size={32} />,
      color: 'orange',
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

  return (
    <div className="py-4 px-9 sm:py-6 lg:py-8 min-h-[calc(100vh-4rem)] font-sans w-full overflow-x-hidden" style={{ background: 'var(--color-sharktank-bg)' }}>
      {/* Header Section */}
     

      {/* Task Center */}
      <div className="mb-6 lg:mb-8 py-10">
        <h2 className="text-xl sm:text-2xl font-semibold text-[var(--color-heading)] mb-4 sm:mb-6 font-[var(--font-heading)]">Actions Required Today</h2>
        
        {/* Mobile Card Layout */}
        <div className="block sm:hidden space-y-3">
          {taskData.map((task, idx) => (
            <div key={idx} className="bg-white p-4 rounded-xl shadow-md border border-white/20">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-medium text-gray-900 capitalize">{task.description}</h3>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  task.urgency === 'high' ? 'bg-red-100 text-red-800' : 
                  task.urgency === 'medium' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-green-100 text-green-800'
                }`}>
                  {task.urgency}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-lg font-bold text-gray-900">{task.count} items</span>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-[var(--color-accent)] text-[var(--color-button-text)] rounded-md text-sm">Take action</button>
                  <button className="px-3 py-1 border rounded-md text-sm">View</button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop Table Layout */}
        <div className="hidden sm:block bg-white rounded-xl shadow-md border border-white/20 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-[var(--color-accent)]">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[var(--color-button-text)] uppercase tracking-wider">Task</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[var(--color-button-text)] uppercase tracking-wider">Urgency</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[var(--color-button-text)] uppercase tracking-wider">Count</th>
                <th className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-[var(--color-button-text)] uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {taskData.map((task, idx) => (
                <tr key={idx}>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm text-gray-700">{task.description}</td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                    <span className={task.urgency === 'high' ? 'text-red-600 font-semibold' : task.urgency === 'medium' ? 'text-yellow-600 font-semibold' : 'text-green-600 font-semibold'}>{task.urgency}</span>
                  </td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm font-semibold">{task.count}</td>
                  <td className="px-4 sm:px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex gap-2">
                      <button className="px-3 py-1 bg-[var(--color-accent)] text-[var(--color-button-text)] rounded-md">Take action</button>
                      <button className="px-3 py-1 border rounded-md">View</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="mb-6 lg:mb-8 ">
        <h2 className="text-xl sm:text-2xl font-semibold text-[var(--color-heading)] mb-4 sm:mb-6 font-[var(--font-heading)]">Today's Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {kpiData.map((kpi, index) => (
            <KPICard
              key={index}
              title={kpi.title}
              value={kpi.value}
              icon={kpi.icon}
              color={kpi.color}
              subtitle={kpi.subtitle}
            />
          ))}
        </div>
      </div>

      {/* Quick Insights */}
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold text-[var(--color-heading)] mb-4 sm:mb-6 font-[var(--font-heading)]">Quick Insights</h2>
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
                      dataKey="value" 
                      data={[
                        { name: 'Completed', value: 60 }, 
                        { name: 'Overdue', value: 15 },
                        { name: 'Pending', value: 25 }
                      ]} 
                      cx="50%" 
                      cy="50%" 
                      innerRadius={90} 
                      outerRadius={140} 
                      paddingAngle={2}
                      strokeWidth={0}
                    >
                      <Cell key="cell-completed" fill="#1D4D43" />
                      <Cell key="cell-overdue" fill="#E05B4C" />
                      <Cell key="cell-pending" fill="#C3754C" />
                    </Pie>
                    <Tooltip formatter={(value: any) => `${value}%`} />
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
            <ResponsiveContainer width="100%" height={350}>
              <BarChart 
                data={fulfillmentDataSets[fulfillmentPeriod]}
                margin={{ top: 20, right: 10, left: -20, bottom: 5 }}
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
                <Tooltip />
                <Bar 
                  dataKey="value" 
                  fill="var(--color-secondary)" 
                  radius={[4, 4, 0, 0]}
                  barSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  )
}


