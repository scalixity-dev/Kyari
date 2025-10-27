import axios from 'axios';
import { TokenManager } from './api';

// Ensure API_URL always includes /api path
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
const API_URL = BASE_URL.endsWith('/api') ? BASE_URL : `${BASE_URL}/api`;

// Performance API Types
export interface KPICardsData {
  fillRate: number;
  rejectionRate: number;
  slaBreaches: number;
  pendingPayments: number;
  releasedPayments: number;
  totalOrders: number;
  completedOrders: number;
  rejectedOrders: number;
}

export interface PerformanceInsight {
  type: 'positive' | 'warning' | 'info';
  title: string;
  description: string;
  icon: string;
  color: string;
}

export interface PerformanceInsightsData {
  insights: PerformanceInsight[];
  currentMetrics: {
    fillRate: number;
    rejectionRate: number;
    slaComplianceRate: number;
    totalOrders: number;
    slaBreaches: number;
  };
  industryAverage: {
    fillRate: number;
    rejectionRate: number;
    slaCompliance: number;
  };
}

export interface PerformanceGoal {
  name: string;
  current: number;
  target: number;
  progress: number;
  unit: string;
  status: 'achieved' | 'in-progress';
}

export interface PerformanceGoalsData {
  goals: PerformanceGoal[];
  targets: {
    fillRate: number;
    rejectionRate: number;
    slaCompliance: number;
  };
  summary: {
    totalGoals: number;
    achievedGoals: number;
    overallProgress: number;
  };
}

export interface PerformanceTrendData {
  period: string;
  fillRate: number;
  rejectionRate: number;
  slaBreaches: number;
  totalOrders: number;
  completedOrders: number;
  rejectedOrders: number;
}

export interface PerformanceTrendsData {
  trends: PerformanceTrendData[];
  timeRange: string;
  totalPeriods: number;
}

export interface RejectionReasonOrder {
  id: string;
  orderNumber: string;
  productName: string;
  quantity: number;
  remarks: string | null;
  rejectedAt: Date;
  orderCreatedAt: Date;
}

export interface RejectionCategory {
  reason: string;
  count: number;
  percentage: number;
  orders: RejectionReasonOrder[];
  totalOrders: number;
}

export interface RejectionReasonsData {
  summary: {
    totalRejections: number;
    rejectionRate: number;
  };
  categories: RejectionCategory[];
  timeRange: {
    startDate: Date;
    endDate: Date;
  };
}

export interface WeeklyFulfillmentData {
  week: string;
  delivered: number;
  rejected: number;
  pending: number;
  total: number;
}

export interface WeeklyOrderFulfillmentData {
  weeklyData: WeeklyFulfillmentData[];
  summary: {
    totalOrders: number;
    totalDelivered: number;
    totalRejected: number;
    totalPending: number;
  };
  timeRange: {
    startDate: Date;
    endDate: Date;
  };
}

export interface SLABreachOrder {
  id: string;
  orderNumber: string;
  productName: string;
  status: string;
  daysSinceAssigned: number;
  assignedAt: Date;
}

export interface SLABreachAnalysisData {
  summary: {
    totalOrders: number;
    breachedOrders: number;
    compliantOrders: number;
    slaComplianceRate: number;
    avgFulfillmentTime: number;
    slaBenchmark: number;
    bufferPercentage: number;
  };
  categories: {
    'Order Confirmation': SLABreachOrder[];
    'Dispatch Marking': SLABreachOrder[];
    'Invoice Upload': SLABreachOrder[];
  };
  chartData: {
    type: string;
    count: number;
    target: number;
  }[];
  timeRange: {
    startDate: Date;
    endDate: Date;
  };
}

export interface PerformanceQueryParams {
  startDate?: string;
  endDate?: string;
  timeRange?: '1W' | '1M' | '3M' | '6M' | '1Y';
}

class PerformanceApiService {
  private api = axios.create({
    baseURL: `${API_URL}/performance`,
    timeout: 30000,
  });

  constructor() {
    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      (config) => {
        const token = TokenManager.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.api.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          TokenManager.clearAll();
          window.location.href = '/vendors/signin';
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get KPI cards data for vendor performance dashboard
   */
  async getKPICards(params?: PerformanceQueryParams): Promise<KPICardsData> {
    try {
      console.log('🔍 API Debug - getKPICards called with params:', params);
      const response = await this.api.get('/kpi-cards', {
        params: {
          startDate: params?.startDate,
          endDate: params?.endDate,
        },
      });
      console.log('📊 API Debug - getKPICards response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ API Debug - Error fetching KPI cards:', error);
      console.error('❌ API Debug - Error response:', (error as any)?.response?.data);
      throw error;
    }
  }

  /**
   * Get performance insights and recommendations for vendor
   */
  async getPerformanceInsights(params?: PerformanceQueryParams): Promise<PerformanceInsightsData> {
    try {
      console.log('🔍 API Debug - getPerformanceInsights called with params:', params);
      const response = await this.api.get('/insights', {
        params: {
          startDate: params?.startDate,
          endDate: params?.endDate,
        },
      });
      console.log('💡 API Debug - getPerformanceInsights response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ API Debug - Error fetching performance insights:', error);
      console.error('❌ API Debug - Error response:', (error as any)?.response?.data);
      throw error;
    }
  }

  /**
   * Get performance goals and targets for vendor
   */
  async getPerformanceGoals(params?: PerformanceQueryParams): Promise<PerformanceGoalsData> {
    try {
      console.log('🔍 API Debug - getPerformanceGoals called with params:', params);
      const response = await this.api.get('/goals', {
        params: {
          startDate: params?.startDate,
          endDate: params?.endDate,
        },
      });
      console.log('🎯 API Debug - getPerformanceGoals response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ API Debug - Error fetching performance goals:', error);
      console.error('❌ API Debug - Error response:', (error as any)?.response?.data);
      throw error;
    }
  }

  /**
   * Get performance trends data for charts
   */
  async getPerformanceTrends(params?: PerformanceQueryParams): Promise<PerformanceTrendsData> {
    try {
      console.log('🔍 API Debug - getPerformanceTrends called with params:', params);
      const response = await this.api.get('/trends', {
        params: {
          timeRange: params?.timeRange || '3M',
          startDate: params?.startDate,
          endDate: params?.endDate,
        },
      });
      console.log('📈 API Debug - getPerformanceTrends response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ API Debug - Error fetching performance trends:', error);
      console.error('❌ API Debug - Error response:', (error as any)?.response?.data);
      throw error;
    }
  }

  /**
   * Get rejection reasons analysis for vendor
   */
  async getRejectionReasons(params?: PerformanceQueryParams): Promise<RejectionReasonsData> {
    try {
      console.log('🔍 API Debug - getRejectionReasons called with params:', params);
      const response = await this.api.get('/rejection-reasons', {
        params: {
          startDate: params?.startDate,
          endDate: params?.endDate,
        },
      });
      console.log('🚫 API Debug - getRejectionReasons response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ API Debug - Error fetching rejection reasons:', error);
      console.error('❌ API Debug - Error response:', (error as any)?.response?.data);
      throw error;
    }
  }

  /**
   * Get weekly order fulfillment data for vendor (last 4 weeks)
   */
  async getWeeklyOrderFulfillment(): Promise<WeeklyOrderFulfillmentData> {
    try {
      console.log('🔍 API Debug - getWeeklyOrderFulfillment called');
      const response = await this.api.get('/weekly-fulfillment');
      console.log('📦 API Debug - getWeeklyOrderFulfillment response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ API Debug - Error fetching weekly order fulfillment:', error);
      console.error('❌ API Debug - Error response:', (error as any)?.response?.data);
      throw error;
    }
  }

  /**
   * Get SLA breach analysis for vendor
   */
  async getSLABreachAnalysis(params?: PerformanceQueryParams): Promise<SLABreachAnalysisData> {
    try {
      console.log('🔍 API Debug - getSLABreachAnalysis called with params:', params);
      const response = await this.api.get('/sla-breach-analysis', {
        params: {
          startDate: params?.startDate,
          endDate: params?.endDate,
        },
      });
      console.log('⏰ API Debug - getSLABreachAnalysis response:', response.data);
      return response.data.data;
    } catch (error) {
      console.error('❌ API Debug - Error fetching SLA breach analysis:', error);
      console.error('❌ API Debug - Error response:', (error as any)?.response?.data);
      throw error;
    }
  }
}

export const performanceApi = new PerformanceApiService();
