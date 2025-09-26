import React from 'react';

interface KPICardProps {
  title: string;
  value: number | string;
  icon: string;
  color: string;
  subtitle?: string;
}

interface TaskItemProps {
  description: string;
  urgency: 'high' | 'medium' | 'low';
  count: number;
}

const styles = {
  dashboard: {
    padding: '2rem',
    background: 'var(--color-happyplant-bg)',
    minHeight: 'calc(100vh - 4rem)',
    fontFamily: 'var(--font-sans)',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box' as const,
    overflowX: 'hidden' as const
  },
  header: {
    background: 'var(--color-header-bg)',
    padding: '2rem',
    borderRadius: 16,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.06)',
    marginBottom: '2rem',
    border: '1px solid rgba(0, 0, 0, 0.03)',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box' as const
  },
  headerTitle: {
    fontSize: '2.5rem',
    fontWeight: 700,
    color: 'var(--color-heading)',
    margin: 0,
    marginBottom: '0.5rem',
    fontFamily: 'var(--font-heading)'
  },
  date: {
    fontSize: '1.1rem',
    color: 'var(--color-primary)',
    margin: 0,
    fontWeight: 500
  },
  sectionTitle: {
    color: 'var(--color-heading)',
    fontSize: '1.8rem',
    fontWeight: 600,
    marginBottom: '1.5rem',
    fontFamily: 'var(--font-heading)'
  },
  kpiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '1.5rem',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box' as const
  },
  kpiCard: (color: string) => ({
    background: 'white',
    padding: '1.5rem',
    borderRadius: 16,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    transition: 'all 0.3s ease',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    position: 'relative' as const,
    overflow: 'hidden' as const,
    // top border color stripe
    borderTop: '4px solid transparent',
    ...(color === 'blue' && { borderTop: '4px solid #3182ce' }),
    ...(color === 'orange' && { borderTop: '4px solid #dd6b20' }),
    ...(color === 'green' && { borderTop: '4px solid #38a169' }),
    ...(color === 'red' && { borderTop: '4px solid #e53e3e' })
  }),
  kpiIcon: {
    fontSize: '2.5rem',
    width: 60,
    height: 60,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'rgba(29,77,67,0.06)',
    borderRadius: 12
  },
  kpiContent: {
    flex: 1
  },
  kpiTitle: {
    fontSize: '0.9rem',
    fontWeight: 600,
    color: 'var(--color-primary)',
    margin: 0,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px'
  },
  kpiValue: {
    fontSize: '2rem',
    fontWeight: 700,
    color: 'var(--color-primary)',
    marginBottom: '0.5rem'
  },
  kpiSubtitle: {
    fontSize: '0.8rem',
    color: '#97a0aa',
    lineHeight: 1.4
  },
  taskList: {
    background: 'white',
    borderRadius: 16,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box' as const
  },
  taskItem: (urgency: string) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1.2rem 1.5rem',
    borderBottom: '1px solid #e2e8f0',
    transition: 'all 0.3s ease',
    background: 'white',
    ...(urgency === 'high' && {}),
    ...(urgency === 'medium' && {}),
    ...(urgency === 'low' && {})
  }),
  taskCount: (urgency: string) => ({
    background: '#667eea',
    color: 'white',
    padding: '0.3rem 0.8rem',
    borderRadius: 20,
    fontWeight: 600,
    fontSize: '0.9rem',
    minWidth: 40,
    textAlign: 'center' as const,
    ...(urgency === 'high' && { background: 'linear-gradient(135deg, var(--color-danger), var(--color-danger-light))' }),
    ...(urgency === 'medium' && { background: 'linear-gradient(135deg, var(--color-warning), var(--color-warning-light))' }),
    ...(urgency === 'low' && { background: 'linear-gradient(135deg, var(--color-success), var(--color-success-light))' })
  }),
  taskDescription: {
    fontSize: '1rem',
    color: '#4a5568',
    fontWeight: 500
  },
  graphsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))',
    gap: '2rem',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box' as const
  },
  chartContainer: {
    background: 'white',
    padding: '2rem',
    borderRadius: 16,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    width: '100%',
    maxWidth: '100%',
    boxSizing: 'border-box' as const
  },
  barChart: {
    height: 250,
    display: 'flex',
    alignItems: 'end',
    justifyContent: 'center'
  },
  chartBars: {
    display: 'flex',
    alignItems: 'end',
    gap: '0.8rem',
    height: '100%'
  },
  bar: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 40,
    background: 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)',
    borderRadius: '6px 6px 0 0',
    position: 'relative' as const,
    transition: 'all 0.3s ease'
  },
  barValue: {
    color: 'white',
    fontSize: '0.8rem',
    fontWeight: 600,
    padding: '0.3rem'
  },
  barLabel: {
    color: '#4a5568',
    fontSize: '0.8rem',
    fontWeight: 600,
    marginTop: '0.5rem',
    position: 'absolute' as const,
    bottom: -25
  },
  pieChart: {
    width: 200,
    height: 200,
    borderRadius: '50%',
    background: 'conic-gradient(#38a169 0deg 216deg, #dd6b20 216deg 306deg, #e53e3e 306deg 360deg)',
    margin: '0 auto 1.5rem',
    position: 'relative' as const,
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
  },
  pieInner: {
    content: "''",
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 80,
    height: 80,
    background: 'var(--color-background)',
    borderRadius: '50%',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)'
  },
  pieLegend: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.8rem'
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.8rem',
    fontSize: '0.9rem',
    color: '#4a5568',
    fontWeight: 500
  },
  legendColor: (type: string) => ({
    width: 16,
    height: 16,
    borderRadius: 4,
    ...(type === 'completed' && { background: 'var(--color-success)' }),
    ...(type === 'pending' && { background: 'var(--color-warning)' }),
    ...(type === 'overdue' && { background: 'var(--color-danger)' })
  })
};

const KPICard: React.FC<KPICardProps> = ({ title, value, icon, color, subtitle }) => (
  <div style={styles.kpiCard(color)}>
    <div style={styles.kpiIcon}>{icon}</div>
    <div style={styles.kpiContent}>
      <h3 style={styles.kpiTitle}>{title}</h3>
      <div style={styles.kpiValue as React.CSSProperties}>{value}</div>
      {subtitle && <div style={styles.kpiSubtitle}>{subtitle}</div>}
    </div>
  </div>
);

const TaskItem: React.FC<TaskItemProps> = ({ description, urgency, count }) => (
  <div style={styles.taskItem(urgency)}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
      <span style={styles.taskCount(urgency)}>{count}</span>
      <span style={styles.taskDescription}>{description}</span>
    </div>
    <div style={{ fontSize: '1.2rem' }}>{urgency === 'high' ? '🔴' : urgency === 'medium' ? '🟡' : '🟢'}</div>
  </div>
);

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
      icon: '📦',
      color: 'blue',
      subtitle: 'Pending: 12 | Confirmed: 20 | Dispatched: 15'
    },
    {
      title: 'Vendor Confirmations',
      value: '8',
      icon: '⏳',
      color: 'orange',
      subtitle: 'Pending Approval'
    },
    {
      title: 'Payments Pending',
      value: '₹2,34,500',
      icon: '💰',
      color: 'green',
      subtitle: '15 invoices'
    },
    {
      title: 'Tickets Open',
      value: '6',
      icon: '🎫',
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
    <div style={styles.dashboard}>
      {/* Header Section */}
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>Welcome, Admin 👋</h1>
        <p style={styles.date as React.CSSProperties}>{today}</p>
      </div>

      {/* KPI Cards */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={styles.sectionTitle}>Today's Overview</h2>
        <div style={styles.kpiGrid}>
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
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={styles.sectionTitle}>Actions Required Today</h2>
        <div style={styles.taskList}>
          {taskData.map((task, index) => (
            <TaskItem
              key={index}
              description={task.description}
              urgency={task.urgency}
              count={task.count}
            />
          ))}
        </div>
      </div>

      {/* Quick Graphs */}
      <div>
        <h2 style={styles.sectionTitle}>Quick Insights</h2>
        <div style={styles.graphsGrid}>
          {/* Order Fulfillment Chart */}
          <div style={styles.chartContainer}>
            <h3 style={{ textAlign: 'center', fontSize: '1.3rem', fontWeight: 600, color: '#2d3748', marginBottom: '1.5rem' }}>Order Fulfillment Rate</h3>
            <div style={styles.barChart}>
              <div style={styles.chartBars}>
                <div style={{ ...styles.bar, height: '80%' }}>
                  <span style={styles.barLabel as React.CSSProperties}>Mon</span>
                  <span style={styles.barValue}>85%</span>
                </div>
                <div style={{ ...styles.bar, height: '92%' }}>
                  <span style={styles.barLabel as React.CSSProperties}>Tue</span>
                  <span style={styles.barValue}>92%</span>
                </div>
                <div style={{ ...styles.bar, height: '75%' }}>
                  <span style={styles.barLabel as React.CSSProperties}>Wed</span>
                  <span style={styles.barValue}>75%</span>
                </div>
                <div style={{ ...styles.bar, height: '88%' }}>
                  <span style={styles.barLabel as React.CSSProperties}>Thu</span>
                  <span style={styles.barValue}>88%</span>
                </div>
                <div style={{ ...styles.bar, height: '95%' }}>
                  <span style={styles.barLabel as React.CSSProperties}>Fri</span>
                  <span style={styles.barValue}>95%</span>
                </div>
                <div style={{ ...styles.bar, height: '82%' }}>
                  <span style={styles.barLabel as React.CSSProperties}>Sat</span>
                  <span style={styles.barValue}>82%</span>
                </div>
                <div style={{ ...styles.bar, height: '78%' }}>
                  <span style={styles.barLabel as React.CSSProperties}>Sun</span>
                  <span style={styles.barValue}>78%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Status Pie Chart */}
          <div style={styles.chartContainer}>
            <h3 style={{ textAlign: 'center', fontSize: '1.3rem', fontWeight: 600, color: '#2d3748', marginBottom: '1.5rem' }}>Payment Status</h3>
            <div style={styles.pieChart}>
              <div className="pie-slice completed" data-percentage="60">
                <span style={{ display: 'none' }}>Completed 60%</span>
              </div>
              <div className="pie-slice pending" data-percentage="25">
                <span style={{ display: 'none' }}>Pending 25%</span>
              </div>
              <div className="pie-slice overdue" data-percentage="15">
                <span style={{ display: 'none' }}>Overdue 15%</span>
              </div>
              <div style={styles.pieInner}></div>
            </div>
            <div style={styles.pieLegend}>
              <div style={styles.legendItem}>
                <span style={styles.legendColor('completed')}></span>
                <span>Completed (60%)</span>
              </div>
              <div style={styles.legendItem}>
                <span style={styles.legendColor('pending')}></span>
                <span>Pending (25%)</span>
              </div>
              <div style={styles.legendItem}>
                <span style={styles.legendColor('overdue')}></span>
                <span>Overdue (15%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


