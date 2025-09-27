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
}

// task items will be rendered in a table below

/* styles migrated to Tailwind classes */

const KPICard: React.FC<KPICardProps> = ({ title, value, icon, color, subtitle }) => {
  const borderTopClass = color === 'blue' ? 'border-t-4 border-blue-600' : color === 'orange' ? 'border-t-4 border-orange-600' : color === 'green' ? 'border-t-4 border-green-600' : color === 'red' ? 'border-t-4 border-red-600' : ''
  return (
    <div className={`bg-white p-6 rounded-xl shadow-md flex items-center gap-4 border border-white/20 relative overflow-hidden ${borderTopClass} hover:shadow-lg hover:-translate-y-1 transition-transform`}>
      <div className="w-16 h-16 flex items-center justify-center rounded-lg text-3xl text-[var(--color-heading)]">{React.isValidElement(icon) ? React.cloneElement(icon as any, { color: 'var(--color-heading)', size: 32 } as any) : icon}</div>
      <div className="flex-1">
        <h3 className="text-xs font-semibold text-[var(--color-primary)] uppercase tracking-wide mb-1">{title}</h3>
        <div className="text-2xl font-bold text-[var(--color-primary)] mb-1">{value}</div>
        {subtitle && <div className="text-sm text-gray-400">{subtitle}</div>}
      </div>
    </div>
  )
}

// TaskItem removed; tasks are now rendered as a table with an Actions column

export default function Dashboard() {
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Mock data - in a real app, this would come from API calls
  const kpiData = [
    {
      title: 'Orders Today',
      value: '47',
      icon: <Package size={32} />,
      color: 'blue',
      subtitle: 'Pending: 12 | Confirmed: 20 | Dispatched: 15'
    },
    {
      title: 'Vendor Confirmations',
      value: '8',
      icon: <BarChart3 size={32} />,
      color: 'orange',
      subtitle: 'Pending Approval'
    },
    {
      title: 'Payments Pending',
      value: '₹2,34,500',
      icon: <Wallet size={32} />,
      color: 'green',
      subtitle: '15 invoices'
    },
    {
      title: 'Tickets Open',
      value: '6',
      icon: <FileText size={32} />,
      color: 'red',
      subtitle: '2 high priority'
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
    <div className="p-8 bg-[#ECDDC9] min-h-[calc(100vh-4rem)] font-sans w-full overflow-x-hidden">
      {/* Header Section */}
      <div className="bg-white p-8 rounded-xl shadow-lg mb-8 border border-gray-200">
        <h1 className="text-4xl font-bold text-[var(--color-heading)] mb-2 font-[var(--font-heading)]">Welcome, Admin..!</h1>
        <p className="text-lg text-[var(--color-primary)] font-medium">{today}</p>
      </div>

      {/* KPI Cards */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-[var(--color-heading)] mb-6 font-[var(--font-heading)]">Today's Overview</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* Task Center */}
      <div className="mb-8">
        <h2 className="text-2xl font-semibold text-[var(--color-heading)] mb-6 font-[var(--font-heading)]">Actions Required Today</h2>
        <div className="bg-white rounded-xl shadow-md border border-white/20 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Task</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Urgency</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Count</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {taskData.map((task, idx) => (
                <tr key={idx}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{task.description}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={task.urgency === 'high' ? 'text-red-600 font-semibold' : task.urgency === 'medium' ? 'text-yellow-600 font-semibold' : 'text-green-600 font-semibold'}>{task.urgency}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold">{task.count}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
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

      {/* Quick Graphs */}
      <div>
        <h2 className="text-2xl font-semibold text-[var(--color-heading)] mb-6 font-[var(--font-heading)]">Quick Insights</h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Order Fulfillment Chart */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-white/20">
            <h3 className="text-center text-lg font-semibold text-[#2d3748] mb-4">Order Fulfillment Rate</h3>
            <ResponsiveContainer width="100%" height={380}>
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
                <Bar dataKey="value" fill="#667eea" radius={[6, 6, 0, 0]}>
                  <LabelList dataKey="value" position="top" formatter={(val: any) => `${val}%`} />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Payment Status Pie Chart */}
          <div className="bg-white p-6 rounded-xl shadow-md border border-white/20">
            <h3 className="text-center text-lg font-semibold text-[#2d3748] mb-4">Payment Status</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie dataKey="value" data={[{ name: 'Completed', value: 60 }, { name: 'Pending', value: 25 }, { name: 'Overdue', value: 15 }]} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={2}>
                    <Cell key="cell-completed" fill="#38a169" />
                    <Cell key="cell-pending" fill="#dd6b20" />
                    <Cell key="cell-overdue" fill="#e53e3e" />
                  </Pie>
                  <Legend verticalAlign="bottom" />
                  <Tooltip formatter={(value: any) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
              {/* Enhanced payment figures: mock totals and per-status breakdown */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 font-medium">Total Payments</div>
                  <div className="text-2xl font-bold text-[var(--color-primary)]">1,200</div>
                  <div className="text-sm text-gray-400">Period: Last 30 days</div>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="text-sm text-gray-500 font-medium">Total Amount</div>
                  <div className="text-2xl font-bold text-[var(--color-primary)]">₹12,45,600</div>
                  <div className="text-sm text-gray-400">Net received: ₹10,98,400</div>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                  <span className="w-3 h-3 rounded-sm bg-[var(--color-success)] block" />
                  <div>
                    <div className="font-semibold">Completed</div>
                    <div className="text-sm text-gray-400">720 payments • ₹8,50,000</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                  <span className="w-3 h-3 rounded-sm bg-[var(--color-warning)] block" />
                  <div>
                    <div className="font-semibold">Pending</div>
                    <div className="text-sm text-gray-400">300 payments • ₹2,34,500</div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-sm text-gray-700 font-medium">
                  <span className="w-3 h-3 rounded-sm bg-[var(--color-danger)] block" />
                  <div>
                    <div className="font-semibold">Overdue</div>
                    <div className="text-sm text-gray-400">180 payments • ₹1,61,100</div>
                  </div>
                </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  )
}


