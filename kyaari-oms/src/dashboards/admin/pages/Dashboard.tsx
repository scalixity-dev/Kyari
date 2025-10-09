import React from 'react';
 
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
  Legend,
  LabelList
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

const KPICard: React.FC<KPICardProps> = ({ title, value, icon, color, subtitle, onClick }) => {
  const iconBgClass =
    color === 'blue'
      ? 'bg-blue-600'
      : color === 'orange'
      ? 'bg-[#C3754C]'
      : color === 'green'
      ? 'bg-green-600'
      : color === 'red'
      ? 'bg-red-600'
      : 'bg-gray-600'
  
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : -1}
      onKeyDown={(e) => { if (onClick && (e.key === 'Enter' || e.key === ' ')) { e.preventDefault(); onClick() } }}
      onClick={onClick}
      className={`bg-[#ECDDC9] pt-16 pb-6 px-6 rounded-xl shadow-sm flex flex-col items-center gap-3 border border-gray-200 relative overflow-visible ${onClick ? 'cursor-pointer hover:shadow-md hover:-translate-y-1 transition-all' : ''}`}
    >
      <div className={`absolute -top-10 left-1/2 -translate-x-1/2 w-20 h-20 sm:w-20 sm:h-20 flex items-center justify-center rounded-full ${iconBgClass} text-white shadow-md`}>
        {React.isValidElement(icon)
          ? React.cloneElement(
              icon as React.ReactElement<{ color?: string; size?: number }>,
              { color: 'white', size: 36 }
            )
          : icon}
      </div>
      <div className="flex flex-col items-center text-center w-full">
        <h3 className="font-['Fraunces'] font-bold text-[18px] leading-[100%] tracking-[0] text-center text-[#2d3748] mb-2">{title}</h3>
        <div className="text-3xl font-bold text-[#2d3748] mb-2">{value}</div>
        {subtitle && <div className="text-sm text-orange-600 font-semibold leading-tight">{subtitle}</div>}
      </div>
    </div>
  )
}

// TaskItem removed; tasks are now rendered as a table with an Actions column

export default function Dashboard() {

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
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 py-10 gap-6">
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

      {/* Quick Graphs */}
      <div>
        <h2 className="text-xl sm:text-2xl font-semibold text-[var(--color-heading)] mb-4 sm:mb-6 font-[var(--font-heading)]">Quick Insights</h2>
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 lg:gap-8">
          {/* Order Fulfillment Chart */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-white/20">
            <h3 className="text-center text-base sm:text-lg font-semibold text-[#2d3748] mb-4">Order Fulfillment Rate</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={
                [
                  { name: 'Mon', value: 85 },
                  { name: 'Tue', value: 92 },
                  { name: 'Wed', value: 75 },
                  { name: 'Thu', value: 88 },
                  { name: 'Fri', value: 95 },
                  { name: 'Sat', value: 82 },
                  { name: 'Sun', value: 78 }
                ]
              }>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#38a169" radius={[6, 6, 0, 0]}>
                  <LabelList dataKey="value" position="top" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Payment Status Pie Chart */}
          <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-white/20">
            <h3 className="text-center text-base sm:text-lg font-semibold text-[#2d3748] mb-4">Payment Status</h3>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie dataKey="value" data={[{ name: 'Completed', value: 60 }, { name: 'Pending', value: 25 }, { name: 'Overdue', value: 15 }]} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
                    <Cell key="cell-completed" fill="#38a169" />
                    <Cell key="cell-pending" fill="#dd6b20" />
                    <Cell key="cell-overdue" fill="#e53e3e" />
                  </Pie>
                  <Legend verticalAlign="bottom" />
                  <Tooltip formatter={(value: number | string) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
              {/* Enhanced payment figures: mock totals and per-status breakdown */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <div className="text-xs sm:text-sm text-gray-500 font-medium">Total Payments</div>
                  <div className="text-xl sm:text-2xl font-bold text-[var(--color-primary)]">1,200</div>
                  <div className="text-xs sm:text-sm text-gray-400">Period: Last 30 days</div>
                </div>
                <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                  <div className="text-xs sm:text-sm text-gray-500 font-medium">Total Amount</div>
                  <div className="text-xl sm:text-2xl font-bold text-[var(--color-primary)]">₹12,45,600</div>
                  <div className="text-xs sm:text-sm text-gray-400">Net received: ₹10,98,400</div>
                </div>
              </div>

              <div className="mt-4 space-y-3 sm:space-y-0 sm:grid sm:grid-cols-1 lg:grid-cols-3 sm:gap-3">
                <div className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                  <span className="w-3 h-3 rounded-sm bg-[var(--color-success)] block flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-semibold">Completed</div>
                    <div className="text-xs sm:text-sm text-gray-400 truncate">720 payments • ₹8,50,000</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                  <span className="w-3 h-3 rounded-sm bg-[var(--color-warning)] block flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-semibold">Pending</div>
                    <div className="text-xs sm:text-sm text-gray-400 truncate">300 payments • ₹2,34,500</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                  <span className="w-3 h-3 rounded-sm bg-[var(--color-danger)] block flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-semibold">Overdue</div>
                    <div className="text-xs sm:text-sm text-gray-400 truncate">180 payments • ₹1,61,100</div>
                  </div>
                </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  )
}


