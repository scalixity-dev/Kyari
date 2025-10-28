import { useState, useEffect, useRef } from 'react'
import { ChevronUp as TrendingUpIcon, AlertTriangle, Wallet, Clock, CheckSquare, X, Package, BarChart3, Calendar as CalendarIcon } from 'lucide-react'
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, Sector,
  XAxis, YAxis, CartesianGrid 
} from 'recharts'
import { KPICard } from '../../../components'
import { CSVPDFExportButton } from '../../../components/ui/export-button'
import { Calendar } from '../../../components/ui/calendar'
import { format } from 'date-fns'
import { 
  ChartContainer, 
  ChartTooltip, 
  ChartTooltipContent, 
  ChartLegend, 
  ChartLegendContent,
  type ChartConfig 
} from '../../../components/ui/chart'
import { performanceApi, type KPICardsData, type PerformanceInsightsData, type PerformanceGoalsData, type PerformanceTrendsData, type RejectionReasonsData, type WeeklyOrderFulfillmentData, type SLABreachAnalysisData } from '../../../services/performanceApi'
import toast from 'react-hot-toast'

// State interfaces
interface PerformanceState {
  kpiData: KPICardsData | null;
  insightsData: PerformanceInsightsData | null;
  goalsData: PerformanceGoalsData | null;
  trendsData: PerformanceTrendsData | null;
  rejectionReasonsData: RejectionReasonsData | null;
  weeklyFulfillmentData: WeeklyOrderFulfillmentData | null;
  slaBreachAnalysisData: SLABreachAnalysisData | null;
  loading: boolean;
  error: string | null;
}

// Chart data will be populated from API




// Chart configurations for shadcn charts
const fillRateChartConfig = {
  fillRate: {
    label: "Fill Rate",
    color: "var(--color-secondary)",
  },
  rejectionRate: {
    label: "Rejection Rate",
    color: "hsl(0, 84%, 60%)",
  },
} satisfies ChartConfig

const paymentChartConfig = {
  pending: {
    label: "Pending Payments",
    color: "var(--color-accent)",
  },
  released: {
    label: "Released Payments",
    color: "var(--color-secondary)",
  },
} satisfies ChartConfig

const slaChartConfig = {
  count: {
    label: "Actual Breaches",
    color: "hsl(0, 84%, 60%)",
  },
  target: {
    label: "Target (Max)",
    color: "var(--color-secondary)",
  },
} satisfies ChartConfig

const rejectionChartConfig = {
  "Quality Issues": {
    label: "Quality Issues",
    color: "hsl(0, 84%, 60%)",
  },
  "Stock Unavailable": {
    label: "Stock Unavailable",
    color: "hsl(25, 95%, 53%)",
  },
  "Price Mismatch": {
    label: "Price Mismatch",
    color: "var(--color-accent)",
  },
  "Late Delivery": {
    label: "Late Delivery",
    color: "hsl(218, 11%, 48%)",
  },
} satisfies ChartConfig

const orderFulfillmentChartConfig = {
  delivered: {
    label: "Delivered",
    color: "var(--color-secondary)",
  },
  rejected: {
    label: "Rejected",
    color: "hsl(0, 84%, 60%)",
  },
  pending: {
    label: "Pending",
    color: "var(--color-accent)",
  },
} satisfies ChartConfig

export default function Performance() {
  // State management
  const [performanceState, setPerformanceState] = useState<PerformanceState>({
    kpiData: null,
    insightsData: null,
    goalsData: null,
    trendsData: null,
    rejectionReasonsData: null,
    weeklyFulfillmentData: null,
    slaBreachAnalysisData: null,
    loading: true,
    error: null
  });

  const [timeRange, setTimeRange] = useState<'1W' | '1M' | '3M' | '6M' | '1Y'>('3M')
  const [dateRange, setDateRange] = useState({
    from: '2025-05-01',
    to: '2025-09-29'
  })
  const [useCustomDateRange, setUseCustomDateRange] = useState(false)
  const [screenSize, setScreenSize] = useState<'mobile' | 'tablet' | 'desktop'>('desktop')
  const [dateFromDate, setDateFromDate] = useState<Date | undefined>()
  const [dateToDate, setDateToDate] = useState<Date | undefined>()
  const [showFromCalendar, setShowFromCalendar] = useState(false)
  const [showToCalendar, setShowToCalendar] = useState(false)
  const fromCalendarRef = useRef<HTMLDivElement>(null)
  const toCalendarRef = useRef<HTMLDivElement>(null)
  const [activePieIndex, setActivePieIndex] = useState(0)

  // Fetch performance data
  const fetchPerformanceData = async () => {
    try {
      setPerformanceState(prev => ({ ...prev, loading: true, error: null }));
      
      const queryParams = {
        timeRange,
        startDate: useCustomDateRange ? dateRange.from : undefined,
        endDate: useCustomDateRange ? dateRange.to : undefined,
      };

      console.log('🔍 Performance API Debug - Query Params:', queryParams);

      const [kpiData, insightsData, goalsData, trendsData, rejectionReasonsData, weeklyFulfillmentData, slaBreachAnalysisData] = await Promise.all([
        performanceApi.getKPICards(queryParams),
        performanceApi.getPerformanceInsights(queryParams),
        performanceApi.getPerformanceGoals(queryParams),
        performanceApi.getPerformanceTrends(queryParams),
        performanceApi.getRejectionReasons(queryParams),
        performanceApi.getWeeklyOrderFulfillment(),
        performanceApi.getSLABreachAnalysis(queryParams)
      ]);

      console.log('📊 Performance API Debug - KPI Data:', kpiData);
      console.log('💡 Performance API Debug - Insights Data:', insightsData);
      console.log('🎯 Performance API Debug - Goals Data:', goalsData);
      console.log('📈 Performance API Debug - Trends Data:', trendsData);
      console.log('🚫 Performance API Debug - Rejection Reasons Data:', rejectionReasonsData);
      console.log('📦 Performance API Debug - Weekly Fulfillment Data:', weeklyFulfillmentData);
      console.log('⏰ Performance API Debug - SLA Breach Analysis Data:', slaBreachAnalysisData);

      setPerformanceState({
        kpiData,
        insightsData,
        goalsData,
        trendsData,
        rejectionReasonsData,
        weeklyFulfillmentData,
        slaBreachAnalysisData,
        loading: false,
        error: null
      });

      console.log('✅ Performance API Debug - All data loaded successfully');
    } catch (error) {
      console.error('❌ Performance API Debug - Error fetching performance data:', error);
      console.error('❌ Performance API Debug - Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        response: (error as any)?.response?.data,
        status: (error as any)?.response?.status
      });
      
      setPerformanceState(prev => ({
        ...prev,
        loading: false,
        error: 'Failed to load performance data'
      }));
      toast.error('Failed to load performance data');
    }
  };

  // Load data on component mount and when filters change
  useEffect(() => {
    fetchPerformanceData();
  }, [timeRange, useCustomDateRange, dateRange.from, dateRange.to]);

  // Utility functions
  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const toCSV = (rows: Array<Record<string, unknown>>, headerOrder?: string[]) => {
    if (!rows || rows.length === 0) return ''
    const headers = headerOrder && headerOrder.length > 0
      ? headerOrder
      : Array.from(new Set(rows.flatMap((r) => Object.keys(r))))

    const escapeCSV = (value: unknown) => {
      const s = value === undefined || value === null ? '' : String(value)
      return s.includes(',') || s.includes('"') || s.includes('\n')
        ? '"' + s.replace(/"/g, '""') + '"'
        : s
    }

    const lines: string[] = [headers.join(',')]
    for (const row of rows) {
      lines.push(
        headers
          .map((h) => escapeCSV((row as Record<string, unknown>)[h]))
          .join(',')
      )
    }
    return lines.join('\n')
  }
  const handleExportCSV = () => {
    if (!performanceState.kpiData || !performanceState.trendsData) {
      toast.error('No data available to export');
      return;
    }

    const kpiRows = [
      { metric: 'Fill Rate (%)', value: performanceState.kpiData.fillRate },
      { metric: 'Rejection Rate (%)', value: performanceState.kpiData.rejectionRate },
      { metric: 'SLA Breaches', value: performanceState.kpiData.slaBreaches },
      { metric: 'Pending Payments', value: performanceState.kpiData.pendingPayments },
      { metric: 'Released Payments', value: performanceState.kpiData.releasedPayments },
      { metric: 'Total Orders', value: performanceState.kpiData.totalOrders },
      { metric: 'Completed Orders', value: performanceState.kpiData.completedOrders },
      { metric: 'Rejected Orders', value: performanceState.kpiData.rejectedOrders }
    ]

    const trendsRows = performanceState.trendsData.trends.map((d) => ({ 
      period: d.period, 
      fillRate: d.fillRate, 
      rejectionRate: d.rejectionRate,
      totalOrders: d.totalOrders,
      completedOrders: d.completedOrders,
      rejectedOrders: d.rejectedOrders
    }))

    const sections = [
      ['# KPI Snapshot', toCSV(kpiRows, ['metric', 'value'])],
      ['# Performance Trends', toCSV(trendsRows, ['period', 'fillRate', 'rejectionRate', 'totalOrders', 'completedOrders', 'rejectedOrders'])]
    ]

    const content = sections.map(([title, csv]) => [title, csv].filter(Boolean).join('\n')).join('\n\n')
    const filename = `performance_${useCustomDateRange ? 'custom' : timeRange}_${new Date().toISOString().slice(0,10)}.csv`
    downloadFile(content, filename, 'text/csv;charset=utf-8;')
  }

  const handleExportPDF = () => {
    if (!performanceState.kpiData || !performanceState.trendsData) {
      toast.error('No data available to export');
      return;
    }

    const html = `
      <html>
        <head>
          <meta charset="utf-8" />
          <title>Performance Report</title>
          <style>
            body { font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Arial; padding: 16px; color: #111827; }
            h1 { font-size: 20px; margin: 0 0 12px 0; }
            h2 { font-size: 16px; margin: 16px 0 8px 0; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; background: #fff; }
            th, td { text-align: left; padding: 8px; border-bottom: 1px solid #e5e7eb; }
            thead { background: #f9fafb; }
            .muted { color: #6b7280; font-size: 12px; }
            .card { border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin-bottom: 12px; }
          </style>
        </head>
        <body>
          <h1>Performance Report</h1>
          <div class="muted">Generated on ${new Date().toLocaleString()}</div>
          <div class="muted" style="margin-top:6px">${useCustomDateRange ? `Custom Range: ${new Date(dateRange.from).toLocaleDateString()} — ${new Date(dateRange.to).toLocaleDateString()}` : `Time Range: ${timeRange}`}</div>

          <div class="card">
            <h2>KPI Snapshot</h2>
            <table>
              <thead><tr><th>Metric</th><th>Value</th></tr></thead>
              <tbody>
                <tr><td>Fill Rate (%)</td><td>${performanceState.kpiData.fillRate}</td></tr>
                <tr><td>Rejection Rate (%)</td><td>${performanceState.kpiData.rejectionRate}</td></tr>
                <tr><td>SLA Breaches</td><td>${performanceState.kpiData.slaBreaches}</td></tr>
                <tr><td>Pending Payments</td><td>₹${performanceState.kpiData.pendingPayments.toLocaleString()}</td></tr>
                <tr><td>Released Payments</td><td>₹${performanceState.kpiData.releasedPayments.toLocaleString()}</td></tr>
                <tr><td>Total Orders</td><td>${performanceState.kpiData.totalOrders}</td></tr>
                <tr><td>Completed Orders</td><td>${performanceState.kpiData.completedOrders}</td></tr>
                <tr><td>Rejected Orders</td><td>${performanceState.kpiData.rejectedOrders}</td></tr>
              </tbody>
            </table>
          </div>

          <div class="card">
            <h2>Performance Trends</h2>
            <table>
              <thead><tr><th>Period</th><th>Fill Rate</th><th>Rejection Rate</th><th>Total Orders</th><th>Completed</th><th>Rejected</th></tr></thead>
              <tbody>
                ${performanceState.trendsData.trends.map((d) => `<tr><td>${d.period}</td><td>${d.fillRate}%</td><td>${d.rejectionRate}%</td><td>${d.totalOrders}</td><td>${d.completedOrders}</td><td>${d.rejectedOrders}</td></tr>`).join('')}
              </tbody>
            </table>
          </div>
        </body>
      </html>
    `
    // Print in the same window via an offscreen iframe
    const iframe = document.createElement('iframe')
    iframe.style.position = 'fixed'
    iframe.style.right = '0'
    iframe.style.bottom = '0'
    iframe.style.width = '0'
    iframe.style.height = '0'
    iframe.style.border = '0'
    document.body.appendChild(iframe)

    const iframeDoc = iframe.contentWindow?.document
    if (!iframeDoc) {
      document.body.removeChild(iframe)
      return
    }
    iframeDoc.open()
    iframeDoc.write(html)
    iframeDoc.close()

    const cleanup = () => {
      if (iframe.parentNode) {
        document.body.removeChild(iframe)
      }
    }

    // Attempt cleanup after printing inside the iframe context
    iframe.contentWindow?.addEventListener('afterprint', cleanup, { once: true })

    // Trigger print once content is ready
    setTimeout(() => {
      iframe.contentWindow?.focus()
      iframe.contentWindow?.print()
      // Fallback cleanup in case afterprint doesn't fire
      setTimeout(cleanup, 1500)
    }, 250)
  }

  // Get data based on current selection
  const getDataForTimeRange = () => {
    if (!performanceState.trendsData) {
      return { fillRateData: [], paymentData: [] };
    }
    
    return {
      fillRateData: performanceState.trendsData.trends.map(trend => ({
        period: trend.period,
        fillRate: trend.fillRate,
        rejectionRate: trend.rejectionRate
      })),
      paymentData: performanceState.trendsData.trends.map(trend => ({
        period: trend.period,
        pending: performanceState.kpiData?.pendingPayments || 0,
        released: performanceState.kpiData?.releasedPayments || 0
      }))
    };
  };

  // Get data based on current selection
  const { fillRateData, paymentData } = getDataForTimeRange();

  // Hook to detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      if (window.innerWidth < 768) {
        setScreenSize('mobile')
      } else if (window.innerWidth < 1024) {
        setScreenSize('tablet')
      } else {
        setScreenSize('desktop')
      }
    }

    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  // Close calendars when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (fromCalendarRef.current && !fromCalendarRef.current.contains(event.target as Node)) {
        setShowFromCalendar(false)
      }
      if (toCalendarRef.current && !toCalendarRef.current.contains(event.target as Node)) {
        setShowToCalendar(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Get responsive font sizes for chart elements
  const getChartFontSizes = () => {
    switch (screenSize) {
      case 'mobile': return { axis: 10, tooltip: 11, legend: 10 }
      case 'tablet': return { axis: 11, tooltip: 12, legend: 11 }
      case 'desktop': return { axis: 12, tooltip: 13, legend: 12 }
      default: return { axis: 12, tooltip: 13, legend: 12 }
    }
  }

  // Get chart title based on time range
  const getChartTitle = (baseTitle: string) => {
    if (useCustomDateRange) return `${baseTitle} (Custom Range)`
    
    switch (timeRange) {
      case '1W': return `${baseTitle} (Daily)`
      case '1M': return `${baseTitle} (Weekly)`
      case '3M':
      case '6M': 
      case '1Y': return `${baseTitle} (Monthly)`
      default: return baseTitle
    }
  }

  return (
    <div className="py-4 px-4 sm:px-6 md:px-8 lg:px-9 sm:py-6 lg:py-8 min-h-[calc(100vh-4rem)] font-sans w-full overflow-x-hidden" style={{ background: 'var(--color-sharktank-bg)' }}>
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--color-heading)] mb-2">
          Performance Analytics
        </h1>
        <p className="text-sm sm:text-base text-[var(--color-primary)]">
          Monitor your performance metrics and analytics
        </p>
      </div>

      {/* Time Range Selector */}
      <div className="flex flex-wrap items-stretch gap-3 mb-6 lg:mb-8">
        {(['1W', '1M', '3M', '6M', '1Y'] as const).map((range) => (
          <button
            key={range}
            onClick={() => {
              setTimeRange(range)
              setUseCustomDateRange(false)
            }}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors h-[42px] ${
              timeRange === range && !useCustomDateRange
                ? 'bg-[var(--color-accent)] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            {range}
          </button>
        ))}
        <button
          onClick={() => setUseCustomDateRange(true)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors h-[42px] ${
            useCustomDateRange
              ? 'bg-[var(--color-accent)] text-white'
              : 'bg-white text-gray-600 hover:bg-gray-50'
          }`}
        >
          Custom Range
        </button>

        {/* Export button placed just right of Custom Range */}
        <div className="flex items-center">
          <CSVPDFExportButton
            onExportCSV={handleExportCSV}
            onExportPDF={handleExportPDF}
            buttonClassName="min-h-[42px]"
          />
        </div>

        {/* Date Range Filter */}
        {useCustomDateRange && (
          <>
            <div className="relative" ref={fromCalendarRef}>
              <button
                type="button"
                onClick={() => {
                  setShowFromCalendar(!showFromCalendar)
                  setShowToCalendar(false)
                }}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:border-[var(--color-accent)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:outline-none transition-all duration-200 h-[42px] flex items-center justify-between text-left bg-white min-w-[180px]"
              >
                <span className={dateFromDate ? 'text-gray-900 truncate' : 'text-gray-500'}>
                  {dateFromDate ? format(dateFromDate, 'MMM dd, yyyy') : 'From date'}
                </span>
                <CalendarIcon className="h-4 w-4 text-gray-500 flex-shrink-0 ml-2" />
              </button>
              {showFromCalendar && (
                <div className="absolute z-50 mt-2 right-0 bg-white border border-gray-200 rounded-md shadow-lg min-w-[280px]">
                  <Calendar
                    mode="single"
                    selected={dateFromDate}
                    onSelect={(date) => {
                      setDateFromDate(date)
                      setShowFromCalendar(false)
                    }}
                    initialFocus
                    className="w-full"
                  />
                </div>
              )}
            </div>

            <div className="relative" ref={toCalendarRef}>
              <button
                type="button"
                onClick={() => {
                  setShowToCalendar(!showToCalendar)
                  setShowFromCalendar(false)
                }}
                className="px-3 py-2 text-sm border border-gray-300 rounded-lg hover:border-[var(--color-accent)] focus:border-[var(--color-accent)] focus:ring-2 focus:ring-[var(--color-accent)]/20 focus:outline-none transition-all duration-200 h-[42px] flex items-center justify-between text-left bg-white min-w-[180px]"
              >
                <span className={dateToDate ? 'text-gray-900 truncate' : 'text-gray-500'}>
                  {dateToDate ? format(dateToDate, 'MMM dd, yyyy') : 'To date'}
                </span>
                <CalendarIcon className="h-4 w-4 text-gray-500 flex-shrink-0 ml-2" />
              </button>
              {showToCalendar && (
                <div className="absolute z-50 mt-2 right-0 bg-white border border-gray-200 rounded-md shadow-lg min-w-[280px]">
                  <Calendar
                    mode="single"
                    selected={dateToDate}
                    onSelect={(date) => {
                      setDateToDate(date)
                      setShowToCalendar(false)
                    }}
                    initialFocus
                    disabled={(date) => dateFromDate ? date < dateFromDate : false}
                    className="w-full"
                  />
                </div>
              )}
            </div>
            <button
              onClick={() => {
                if (dateFromDate && dateToDate) {
                  setDateRange({
                    from: format(dateFromDate, 'yyyy-MM-dd'),
                    to: format(dateToDate, 'yyyy-MM-dd')
                  })
                }
              }}
              disabled={!dateFromDate || !dateToDate}
              className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg text-sm font-medium hover:bg-[var(--color-accent)]/90 transition-colors whitespace-nowrap h-[42px] disabled:bg-gray-300 disabled:cursor-not-allowed cursor-pointer"
            >
              Apply Filter
            </button>
            <button
              onClick={() => {
                setUseCustomDateRange(false)
                setTimeRange('3M')
                setDateFromDate(undefined)
                setDateToDate(undefined)
                setShowFromCalendar(false)
                setShowToCalendar(false)
              }}
              className="px-4 py-1 bg-white text-secondary border border-secondary rounded-2xl font-medium hover:bg-secondary hover:text-white transition-colors duration-200 text-sm whitespace-nowrap h-[42px] cursor-pointer"
            >
              Reset
            </button>
          </>
        )}
      </div>

      {/* Active Filter Indicator */}
      {useCustomDateRange && dateRange.from && dateRange.to && (
        <div className="mb-4 p-4 rounded-lg border border-[#C4B5A0] shadow-sm" style={{ backgroundColor: '#ECDDC9' }}>
          <p className="text-sm text-[#5C4A3A]">
            <span className="font-semibold">Showing data from:</span> {new Date(dateRange.from).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })} 
            <span className="mx-2 font-medium">to</span> {new Date(dateRange.to).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
          </p>
        </div>
      )}

      {/* Key Performance Metrics */}
      <div className="mb-6 lg:mb-8">
        <h2 className="text-lg sm:text-xl md:text-2xl text-[var(--color-heading)] mb-4 sm:mb-6 font-[var(--font-heading)]">Key Metrics</h2>
        {performanceState.loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-4 mt-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-xl shadow-md border border-white/20 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : performanceState.error ? (
          <div className="text-center py-8">
            <p className="text-red-500 mb-4">{performanceState.error}</p>
            <button 
              onClick={fetchPerformanceData}
              className="px-4 py-2 bg-[var(--color-accent)] text-white rounded-lg hover:bg-[var(--color-accent)]/90"
            >
              Retry
            </button>
          </div>
        ) : performanceState.kpiData ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-4 mt-8">
            <KPICard
              title="Fill Rate"
              value={`${performanceState.kpiData.fillRate}%`}
              icon={<CheckSquare size={32} />}
              subtitle="Orders successfully fulfilled"
            />
            
            <KPICard
              title="Rejection Rate"
              value={`${performanceState.kpiData.rejectionRate}%`}
              icon={<X size={32} />}
              subtitle="Orders rejected or declined"
            />
            
            <KPICard
              title="SLA Breaches"
              value={performanceState.kpiData.slaBreaches.toString()}
              icon={<AlertTriangle size={32} />}
              subtitle="This month's SLA violations"
            />
            
            <KPICard
              title="Payment Status"
              value={`₹${(performanceState.kpiData.pendingPayments / 1000).toFixed(1)}K`}
              icon={<Wallet size={32} />}
              subtitle={`₹${(performanceState.kpiData.releasedPayments / 1000).toFixed(1)}K released`}
            />
          </div>
        ) : null}
      </div>

      {/* Performance Insights & Goals */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8">
        {/* Performance Insights */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-white/20">
          <h3 className="text-base sm:text-lg font-semibold text-[var(--color-heading)] mb-4">Performance Insights</h3>
          {performanceState.loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-start gap-3 animate-pulse">
                  <div className="w-2 h-2 rounded-full bg-gray-200 mt-2"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-gray-200 rounded w-full"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : performanceState.insightsData ? (
            <div className="space-y-4">
              {performanceState.insightsData.insights.map((insight, index) => (
                <div key={index} className="flex items-start gap-3">
                  <div 
                    className="w-2 h-2 rounded-full mt-2" 
                    style={{ backgroundColor: insight.color === 'green' ? 'var(--color-secondary)' : insight.color === 'orange' ? 'var(--color-accent)' : '#3b82f6' }}
                  ></div>
                  <div>
                    <p className="text-sm font-medium text-gray-800">{insight.title}</p>
                    <p className="text-xs text-gray-600">{insight.description}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No insights available</p>
          )}
        </div>

        {/* Performance Goals */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-white/20">
          <h3 className="text-base sm:text-lg font-semibold text-[var(--color-heading)] mb-4">Performance Goals</h3>
          {performanceState.loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="flex justify-between items-center mb-2">
                    <div className="h-4 bg-gray-200 rounded w-1/3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2"></div>
                </div>
              ))}
            </div>
          ) : performanceState.goalsData ? (
            <div className="space-y-4">
              {performanceState.goalsData.goals.map((goal, index) => (
                <div key={index}>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-700">{goal.name}</span>
                    <span className="text-sm text-gray-600">{goal.current}{goal.unit} / {goal.target}{goal.unit}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full" 
                      style={{ 
                        width: `${Math.min(goal.progress, 100)}%`, 
                        backgroundColor: goal.status === 'achieved' ? 'var(--color-secondary)' : 'var(--color-accent)' 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No goals data available</p>
          )}
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8 -ml-2 sm:ml-0">
        {/* Fill Rate & Rejection Trend */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-[var(--color-heading)]">
              {getChartTitle('Fill Rate & Rejection Trend')}
            </h3>
            <TrendingUpIcon className="w-4 h-4 sm:w-5 sm:h-5" color="var(--color-secondary)" />
          </div>
          {performanceState.loading ? (
            <div className="h-[250px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent)]"></div>
            </div>
          ) : fillRateData.length > 0 ? (
            <ChartContainer config={fillRateChartConfig} className="h-[250px] w-full">
              <LineChart data={fillRateData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="period" 
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: getChartFontSizes().axis }}
                />
                <YAxis 
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: getChartFontSizes().axis }}
                />
                <ChartTooltip 
                  content={<ChartTooltipContent className="bg-white" />} 
                  cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Line 
                  type="monotone" 
                  dataKey="fillRate" 
                  stroke="var(--color-fillRate)" 
                  strokeWidth={2}
                  dot={{ fill: 'var(--color-fillRate)', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="rejectionRate" 
                  stroke="var(--color-rejectionRate)" 
                  strokeWidth={2}
                  dot={{ fill: 'var(--color-rejectionRate)', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ChartContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-500">
              No data available
            </div>
          )}
        </div>

        {/* Payment Summary */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-[var(--color-heading)]">
              {getChartTitle('Payment Summary')}
            </h3>
            <Wallet className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
          </div>
          {performanceState.loading ? (
            <div className="h-[250px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent)]"></div>
            </div>
          ) : paymentData.length > 0 ? (
            <ChartContainer config={paymentChartConfig} className="h-[250px] w-full">
              <AreaChart data={paymentData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="fillReleased" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-released)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--color-released)" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="fillPending" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-pending)" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="var(--color-pending)" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="period" 
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: getChartFontSizes().axis }}
                />
                <YAxis 
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: getChartFontSizes().axis }}
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                />
                <ChartTooltip 
                  content={<ChartTooltipContent 
                    formatter={(value) => [`₹${((value as number) / 1000).toFixed(0)}K`, '']}
                    className="bg-white"
                  />}
                  cursor={{ stroke: 'hsl(var(--muted-foreground))', strokeWidth: 1 }}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Area
                  type="monotone"
                  dataKey="released"
                  stroke="var(--color-released)"
                  fill="url(#fillReleased)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="pending"
                  stroke="var(--color-pending)"
                  fill="url(#fillPending)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          ) : (
            <div className="h-[250px] flex items-center justify-center text-gray-500">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Second Row Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-6 mb-6 lg:mb-8 -ml-2 sm:ml-0">
        {/* SLA Breach Analysis */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-[var(--color-heading)]">SLA Breach Analysis</h3>
            <Clock className="w-4 h-4 sm:w-5 sm:h-5" color="var(--color-accent)" />
          </div>
          {performanceState.loading ? (
            <div className="h-[450px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent)]"></div>
            </div>
          ) : performanceState.slaBreachAnalysisData && performanceState.slaBreachAnalysisData.chartData.length > 0 ? (
            <>
              <ChartContainer config={slaChartConfig} className="h-[300px] w-full">
                <BarChart data={performanceState.slaBreachAnalysisData.chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis 
                    dataKey="type" 
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tick={{ fontSize: getChartFontSizes().axis }}
                    angle={-15}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis 
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    tick={{ fontSize: getChartFontSizes().axis }}
                  />
                  <ChartTooltip 
                    content={<ChartTooltipContent className="bg-white" />}
                    cursor={{ fill: 'hsl(var(--muted))', opacity: 0.15 }}
                  />
                  <ChartLegend content={<ChartLegendContent />} />
                  <Bar 
                    dataKey="count" 
                    fill="var(--color-count)" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="target" 
                    fill="var(--color-target)" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
              
              {/* SLA Summary Stats */}
              {performanceState.slaBreachAnalysisData.summary && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <div className="text-lg font-semibold text-gray-900">
                      {performanceState.slaBreachAnalysisData.summary.totalOrders}
                    </div>
                    <div className="text-xs text-gray-600">Total Orders</div>
                  </div>
                  <div className="text-center p-3 bg-red-50 rounded-lg">
                    <div className="text-lg font-semibold text-red-700">
                      {performanceState.slaBreachAnalysisData.summary.breachedOrders}
                    </div>
                    <div className="text-xs text-red-600">Breached</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-lg font-semibold text-green-700">
                      {performanceState.slaBreachAnalysisData.summary.compliantOrders}
                    </div>
                    <div className="text-xs text-green-600">Compliant</div>
                  </div>
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-lg font-semibold text-blue-700">
                      {performanceState.slaBreachAnalysisData.summary.slaComplianceRate}%
                    </div>
                    <div className="text-xs text-blue-600">Compliance Rate</div>
                  </div>
                </div>
              )}
              
              {/* SLA Benchmark Info */}
              {performanceState.slaBreachAnalysisData.summary && (
                <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm text-blue-800">
                    <span className="font-semibold">SLA Benchmark:</span> {performanceState.slaBreachAnalysisData.summary.slaBenchmark} days 
                    <span className="ml-2">(Avg: {performanceState.slaBreachAnalysisData.summary.avgFulfillmentTime} days + {performanceState.slaBreachAnalysisData.summary.bufferPercentage}% buffer)</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="h-[450px] flex items-center justify-center text-gray-500">
              No SLA breach data available
            </div>
          )}
        </div>

        {/* Rejection Reasons */}
        <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-white/20">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
            <h3 className="text-base sm:text-lg font-semibold text-[var(--color-heading)]">Rejection Reasons</h3>
            {performanceState.rejectionReasonsData && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <BarChart3 className="w-4 h-4 text-red-500" />
                <span className="text-xs sm:text-sm">
                  Total: {performanceState.rejectionReasonsData.summary.totalRejections} rejections
                </span>
              </div>
            )}
          </div>
          {performanceState.loading ? (
            <div className="h-[300px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent)]"></div>
            </div>
          ) : performanceState.rejectionReasonsData && performanceState.rejectionReasonsData.categories.length > 0 ? (
            <>
              <ChartContainer config={rejectionChartConfig} className="mx-auto aspect-square max-h-[300px]">
                <PieChart>
                  <ChartTooltip 
                    cursor={false}
                    content={<ChartTooltipContent 
                      hideLabel
                      className="bg-white"
                    />}
                  />
                  <Pie
                    data={performanceState.rejectionReasonsData.categories.map(category => ({
                      name: category.reason,
                      value: category.percentage,
                      color: category.reason === 'Stock Unavailable' ? '#f97316' :
                             category.reason === 'Quality Issue' ? '#ef4444' :
                             category.reason === 'Price Mismatch' ? 'var(--color-accent)' :
                             category.reason === 'Late Delivery' ? '#6b7280' : '#9ca3af'
                    }))}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={screenSize === 'mobile' ? 50 : 60}
                    strokeWidth={5}
                    activeIndex={activePieIndex}
                    activeShape={({
                      outerRadius = 0,
                      ...props
                    }: any) => (
                      <g>
                        <Sector {...props} outerRadius={outerRadius + 10} />
                        <Sector
                          {...props}
                          outerRadius={outerRadius + 25}
                          innerRadius={outerRadius + 12}
                        />
                      </g>
                    )}
                    onMouseEnter={(_, index) => setActivePieIndex(index)}
                  >
                    {performanceState.rejectionReasonsData.categories.map((category, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={category.reason === 'Stock Unavailable' ? '#f97316' :
                               category.reason === 'Quality Issue' ? '#ef4444' :
                               category.reason === 'Price Mismatch' ? 'var(--color-accent)' :
                               category.reason === 'Late Delivery' ? '#6b7280' : '#9ca3af'}
                      />
                    ))}
                  </Pie>
                </PieChart>
              </ChartContainer>
              
              {/* Interactive Legend */}
              <div className="mt-6 space-y-2">
                {performanceState.rejectionReasonsData.categories.map((category, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => setActivePieIndex(index)}
                    onMouseEnter={() => setActivePieIndex(index)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                      activePieIndex === index
                        ? 'bg-gray-100 shadow-sm'
                        : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full flex-shrink-0" 
                        style={{ 
                          backgroundColor: category.reason === 'Stock Unavailable' ? '#f97316' :
                                         category.reason === 'Quality Issue' ? '#ef4444' :
                                         category.reason === 'Price Mismatch' ? 'var(--color-accent)' :
                                         category.reason === 'Late Delivery' ? '#6b7280' : '#9ca3af'
                        }}
                      />
                      <span className="text-sm font-medium text-gray-700">
                        {category.reason}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {category.percentage}%
                      </span>
                      <span className="text-xs text-gray-500">
                        ({category.count})
                      </span>
                      {activePieIndex === index && (
                        <div className="w-2 h-2 rounded-full bg-gray-400" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="h-[300px] flex items-center justify-center text-gray-500">
              No rejection data available
            </div>
          )}
        </div>
      </div>

      {/* Order Fulfillment Weekly Analysis */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md border border-white/20 mb-6 lg:mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base sm:text-lg font-semibold text-[var(--color-heading)]">Weekly Order Fulfillment</h3>
          <Package className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
        </div>
        {performanceState.loading ? (
          <div className="h-[300px] flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-accent)]"></div>
          </div>
        ) : performanceState.weeklyFulfillmentData && performanceState.weeklyFulfillmentData.weeklyData.length > 0 ? (
          <>
            <ChartContainer config={orderFulfillmentChartConfig} className="h-[300px] w-full">
              <BarChart data={performanceState.weeklyFulfillmentData.weeklyData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis 
                  dataKey="week" 
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: getChartFontSizes().axis }}
                />
                <YAxis 
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tick={{ fontSize: getChartFontSizes().axis }}
                />
                <ChartTooltip 
                  content={<ChartTooltipContent className="bg-white" />}
                  cursor={{ fill: 'hsl(var(--muted))', opacity: 0.15 }}
                />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar 
                  dataKey="delivered" 
                  fill="var(--color-delivered)" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="rejected" 
                  fill="var(--color-rejected)" 
                  radius={[4, 4, 0, 0]}
                />
                <Bar 
                  dataKey="pending" 
                  fill="var(--color-pending)" 
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ChartContainer>
            
            {/* Summary Stats */}
            {performanceState.weeklyFulfillmentData.summary && (
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-lg font-semibold text-gray-900">
                    {performanceState.weeklyFulfillmentData.summary.totalOrders}
                  </div>
                  <div className="text-xs text-gray-600">Total Orders</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-lg font-semibold text-green-700">
                    {performanceState.weeklyFulfillmentData.summary.totalDelivered}
                  </div>
                  <div className="text-xs text-green-600">Delivered</div>
                </div>
                <div className="text-center p-3 bg-red-50 rounded-lg">
                  <div className="text-lg font-semibold text-red-700">
                    {performanceState.weeklyFulfillmentData.summary.totalRejected}
                  </div>
                  <div className="text-xs text-red-600">Rejected</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-lg font-semibold text-yellow-700">
                    {performanceState.weeklyFulfillmentData.summary.totalPending}
                  </div>
                  <div className="text-xs text-yellow-600">Pending</div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-gray-500">
            No weekly fulfillment data available
          </div>
        )}
      </div>

    </div>
  )
}