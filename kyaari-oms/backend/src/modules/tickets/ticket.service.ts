import { prisma } from '../../config/database';
import { Prisma } from '@prisma/client';

export interface TicketListFilters {
  status?: 'open' | 'under-review' | 'resolved' | 'closed' | 'all';
  vendor?: string;
  orderNumber?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

const mapStatusToEnum = (status?: string) => {
  switch (status) {
    case 'open':
      return 'OPEN';
    case 'under-review':
      return 'IN_PROGRESS';
    case 'resolved':
      return 'RESOLVED';
    case 'closed':
      return 'CLOSED';
    default:
      return undefined;
  }
};

export interface TicketTrendFilters {
  period: 'weekly' | 'monthly' | 'yearly';
  dateFrom?: string;
  dateTo?: string;
  userId?: string;
}

export interface TicketTrendData {
  period: string;
  periodStart: string;
  periodEnd: string;
  raised: number;
  resolved: number;
}

export interface ResolutionTimeTrendData {
  period: string;
  periodStart: string;
  periodEnd: string;
  avgResolutionHours: number;
  totalResolved: number;
}

export class TicketService {
  private static async generateNextTicketNumber(
    tx: Prisma.TransactionClient
  ): Promise<string> {
    // Find the latest ticket with a TKT- prefix and increment its numeric part
    const latest = await tx.ticket.findFirst({
      where: { ticketNumber: { startsWith: 'TKT-' } },
      orderBy: { createdAt: 'desc' },
      select: { ticketNumber: true },
    });

    let nextNumber = 1;
    if (latest?.ticketNumber) {
      const match = latest.ticketNumber.match(/^TKT-(\d+)$/);
      if (match) {
        const lastNumber = parseInt(match[1], 10);
        if (!Number.isNaN(lastNumber)) {
          nextNumber = lastNumber + 1;
        }
      }
    }

    const padded = String(nextNumber).padStart(6, '0');
    return `TKT-${padded}`;
  }
  static async createTicket(params: {
    title: string;
    description: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    createdById: string;
    goodsReceiptNoteId?: string | null;
  }) {
    const created = await prisma.$transaction(
      async (tx) => {
        const ticketNumber = await TicketService.generateNextTicketNumber(tx);

        const createdTicket = await tx.ticket.create({
          data: {
            ticketNumber,
            title: params.title,
            description: params.description,
            // Casting kept as-is to align with existing enum mapping in schema
            priority: params.priority as any,
            status: 'OPEN' as any,
            createdById: params.createdById,
            goodsReceiptNoteId: params.goodsReceiptNoteId ?? null,
          },
          include: {
            goodsReceiptNote: {
              include: {
                dispatch: {
                  include: {
                    vendor: { include: { user: true } },
                    items: {
                      include: {
                        assignedOrderItem: {
                          include: { orderItem: { include: { order: true } } },
                        },
                      },
                    },
                  },
                },
              },
            },
            _count: { select: { comments: true, attachments: true } },
          },
        });

        return createdTicket;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    return created;
  }
  static async getTicketTrends(filters: TicketTrendFilters) {
    const { period, dateFrom, dateTo, userId } = filters;

    // Build date range
    const now = new Date();
    const dateRange = {
      from: dateFrom ? new Date(dateFrom) : this.getPeriodStartDate(period, now),
      to: dateTo ? new Date(dateTo) : now,
    };

    // Fetch all tickets that might be relevant (created before end date, and either created or resolved in range)
    // We fetch a broader set and filter in memory to handle resolved tickets correctly
    const whereClause: Record<string, unknown> = {
      createdAt: {
        lte: dateRange.to, // Only fetch tickets created before or during the range
      },
      OR: [
        {
          createdAt: {
            gte: dateRange.from,
          },
        },
        {
          AND: [
            {
              OR: [
                { status: 'RESOLVED' },
                { status: 'CLOSED' },
              ],
            },
            {
              OR: [
                { resolvedAt: { gte: dateRange.from, lte: dateRange.to, not: null } },
                {
                  AND: [
                    { resolvedAt: null },
                    { updatedAt: { gte: dateRange.from, lte: dateRange.to } },
                  ],
                },
              ],
            },
          ],
        },
      ],
    };

    if (userId) {
      whereClause.createdById = userId;
    }

    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      select: {
        id: true,
        createdAt: true,
        resolvedAt: true,
        updatedAt: true,
        status: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group tickets by period
    const periodGroups = new Map<string, TicketTrendData>();

    tickets.forEach((ticket) => {
      // Handle raised tickets (created in range)
      if (ticket.createdAt >= dateRange.from && ticket.createdAt <= dateRange.to) {
        const periodKey = this.getPeriodKey(period, ticket.createdAt);
        if (!periodGroups.has(periodKey)) {
          periodGroups.set(periodKey, {
            period: periodKey,
            periodStart: this.getPeriodStart(period, ticket.createdAt).toISOString(),
            periodEnd: this.getPeriodEnd(period, ticket.createdAt).toISOString(),
            raised: 0,
            resolved: 0,
          });
        }
        const group = periodGroups.get(periodKey);
        if (group) {
          group.raised += 1;
        }
      }

      // Handle resolved tickets (status RESOLVED or CLOSED)
      const isResolved = ticket.status === 'RESOLVED' || ticket.status === 'CLOSED';
      if (isResolved) {
        // Use resolvedAt if available, otherwise use updatedAt when status changed
        const resolvedDate = ticket.resolvedAt || ticket.updatedAt;
        if (resolvedDate >= dateRange.from && resolvedDate <= dateRange.to) {
          const periodKey = this.getPeriodKey(period, resolvedDate);
          if (!periodGroups.has(periodKey)) {
            periodGroups.set(periodKey, {
              period: periodKey,
              periodStart: this.getPeriodStart(period, resolvedDate).toISOString(),
              periodEnd: this.getPeriodEnd(period, resolvedDate).toISOString(),
              raised: 0,
              resolved: 0,
            });
          }
          const group = periodGroups.get(periodKey);
          if (group) {
            group.resolved += 1;
          }
        }
      }
    });

    // Fill in missing periods within the date range
    const allPeriods = this.generatePeriodRange(period, dateRange.from, dateRange.to);
    allPeriods.forEach((periodKey) => {
      if (!periodGroups.has(periodKey)) {
        const periodDate = this.parsePeriodKey(period, periodKey);
        periodGroups.set(periodKey, {
          period: periodKey,
          periodStart: this.getPeriodStart(period, periodDate).toISOString(),
          periodEnd: this.getPeriodEnd(period, periodDate).toISOString(),
          raised: 0,
          resolved: 0,
        });
      }
    });

    // Convert map to array and sort by period
    const trends = Array.from(periodGroups.values()).sort((a, b) =>
      a.periodStart.localeCompare(b.periodStart)
    );

    return { trends, period, dateRange: { from: dateRange.from.toISOString(), to: dateRange.to.toISOString() } };
  }

  static async getResolutionTimeTrends(filters: TicketTrendFilters) {
    const { period, dateFrom, dateTo, userId } = filters;

    // Build date range
    const now = new Date();
    const dateRange = {
      from: dateFrom ? new Date(dateFrom) : this.getPeriodStartDate(period, now),
      to: dateTo ? new Date(dateTo) : now,
    };

    // Fetch resolved tickets (RESOLVED or CLOSED status) that were resolved in the date range
    const whereClause: Record<string, unknown> = {
      AND: [
        {
          OR: [
            { status: 'RESOLVED' },
            { status: 'CLOSED' },
          ],
        },
        {
          OR: [
            { resolvedAt: { gte: dateRange.from, lte: dateRange.to, not: null } },
            {
              AND: [
                { resolvedAt: null },
                { updatedAt: { gte: dateRange.from, lte: dateRange.to } },
              ],
            },
          ],
        },
      ],
    };

    if (userId) {
      (whereClause.AND as unknown[]).push({ createdById: userId });
    }

    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      select: {
        id: true,
        createdAt: true,
        resolvedAt: true,
        updatedAt: true,
        status: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group tickets by period and calculate resolution times
    const periodGroups = new Map<string, { totalHours: number; count: number }>();

    tickets.forEach((ticket) => {
      // Calculate resolution time
      const resolvedDate = ticket.resolvedAt || ticket.updatedAt;
      
      // Only process if resolved within the date range
      if (resolvedDate >= dateRange.from && resolvedDate <= dateRange.to) {
        const resolutionTimeMs = resolvedDate.getTime() - ticket.createdAt.getTime();
        const resolutionTimeHours = resolutionTimeMs / (1000 * 60 * 60); // Convert to hours

        const periodKey = this.getPeriodKey(period, resolvedDate);
        
        if (!periodGroups.has(periodKey)) {
          periodGroups.set(periodKey, { totalHours: 0, count: 0 });
        }
        
        const group = periodGroups.get(periodKey);
        if (group) {
          group.totalHours += resolutionTimeHours;
          group.count += 1;
        }
      }
    });

    // Fill in missing periods within the date range and calculate averages
    const allPeriods = this.generatePeriodRange(period, dateRange.from, dateRange.to);
    const trends: ResolutionTimeTrendData[] = [];

    allPeriods.forEach((periodKey) => {
      const periodDate = this.parsePeriodKey(period, periodKey);
      const group = periodGroups.get(periodKey);
      
      const avgResolutionHours = group && group.count > 0 
        ? Math.round((group.totalHours / group.count) * 100) / 100 // Round to 2 decimal places
        : 0;

      trends.push({
        period: periodKey,
        periodStart: this.getPeriodStart(period, periodDate).toISOString(),
        periodEnd: this.getPeriodEnd(period, periodDate).toISOString(),
        avgResolutionHours,
        totalResolved: group?.count || 0,
      });
    });

    // Sort by period start date
    trends.sort((a, b) => a.periodStart.localeCompare(b.periodStart));

    return { trends, period, dateRange: { from: dateRange.from.toISOString(), to: dateRange.to.toISOString() } };
  }

  private static getPeriodStartDate(period: 'weekly' | 'monthly' | 'yearly', date: Date): Date {
    const start = new Date(date);
    if (period === 'weekly') {
      const day = start.getDay();
      const diff = start.getDate() - day;
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
    } else if (period === 'monthly') {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
    } else {
      // yearly
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
    }
    return start;
  }

  private static getPeriodKey(period: 'weekly' | 'monthly' | 'yearly', date: Date): string {
    if (period === 'weekly') {
      // Get start of week (Sunday = 0, we'll use Sunday as week start to match typical behavior)
      const startOfWeek = new Date(date);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day;
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);
      
      // Use ISO date format (YYYY-MM-DD) as key for the week start
      const year = startOfWeek.getFullYear();
      const month = String(startOfWeek.getMonth() + 1).padStart(2, '0');
      const dayOfMonth = String(startOfWeek.getDate()).padStart(2, '0');
      return `${year}-${month}-${dayOfMonth}`;
    } else if (period === 'monthly') {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      return `${year}-${month}`;
    } else {
      // yearly
      return String(date.getFullYear());
    }
  }

  private static getPeriodStart(period: 'weekly' | 'monthly' | 'yearly', date: Date): Date {
    const start = new Date(date);
    if (period === 'weekly') {
      const day = start.getDay();
      const diff = start.getDate() - day;
      start.setDate(diff);
      start.setHours(0, 0, 0, 0);
    } else if (period === 'monthly') {
      start.setDate(1);
      start.setHours(0, 0, 0, 0);
    } else {
      start.setMonth(0, 1);
      start.setHours(0, 0, 0, 0);
    }
    return start;
  }

  private static getPeriodEnd(period: 'weekly' | 'monthly' | 'yearly', date: Date): Date {
    const end = new Date(date);
    if (period === 'weekly') {
      const day = end.getDay();
      const diff = end.getDate() - day + 6;
      end.setDate(diff);
      end.setHours(23, 59, 59, 999);
    } else if (period === 'monthly') {
      const month = end.getMonth();
      end.setMonth(month + 1, 0);
      end.setHours(23, 59, 59, 999);
    } else {
      end.setMonth(11, 31);
      end.setHours(23, 59, 59, 999);
    }
    return end;
  }

  private static parsePeriodKey(period: 'weekly' | 'monthly' | 'yearly', key: string): Date {
    if (period === 'weekly') {
      // Parse format: YYYY-MM-DD (week start date)
      const match = key.match(/(\d{4})-(\d{2})-(\d{2})/);
      if (match) {
        const year = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1;
        const day = parseInt(match[3], 10);
        return new Date(year, month, day);
      }
    } else if (period === 'monthly') {
      const match = key.match(/(\d{4})-(\d{2})/);
      if (match) {
        const year = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1;
        return new Date(year, month, 1);
      }
    } else {
      const year = parseInt(key, 10);
      return new Date(year, 0, 1);
    }
    return new Date();
  }

  private static generatePeriodRange(
    period: 'weekly' | 'monthly' | 'yearly',
    from: Date,
    to: Date
  ): string[] {
    const periods: string[] = [];
    const current = new Date(from);

    while (current <= to) {
      periods.push(this.getPeriodKey(period, current));
      if (period === 'weekly') {
        current.setDate(current.getDate() + 7);
      } else if (period === 'monthly') {
        current.setMonth(current.getMonth() + 1);
      } else {
        current.setFullYear(current.getFullYear() + 1);
      }
    }

    return periods;
  }

  static async listTicketsByUser(userId: string, filters: TicketListFilters) {
    const {
      status = 'all',
      vendor,
      orderNumber,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
    } = filters;

    const where: any = {
      createdById: userId,
    };

    const mappedStatus = mapStatusToEnum(status);
    if (mappedStatus) {
      where.status = mappedStatus;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    if (vendor) {
      // Filter by vendor name or email on the linked dispatch vendor
      where.goodsReceiptNote = {
        dispatch: {
          vendor: {
            OR: [
              { companyName: { contains: vendor, mode: 'insensitive' } },
              { user: { name: { contains: vendor, mode: 'insensitive' } } },
              { user: { email: { contains: vendor, mode: 'insensitive' } } },
            ],
          },
        },
      };
    }

    if (orderNumber) {
      // Match orderNumber/clientOrderId through the dispatch -> items -> assignedOrderItem -> orderItem -> order
      where.goodsReceiptNote = {
        ...(where.goodsReceiptNote || {}),
        dispatch: {
          ...(where.goodsReceiptNote?.dispatch || {}),
          items: {
            some: {
              assignedOrderItem: {
                orderItem: {
                  order: {
                    OR: [
                      { orderNumber: { contains: orderNumber, mode: 'insensitive' } },
                      { clientOrderId: { contains: orderNumber, mode: 'insensitive' } },
                    ],
                  },
                },
              },
            },
          },
        },
      };
    }

    const skip = (page - 1) * limit;

    const [tickets, totalCount] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          goodsReceiptNote: {
            include: {
              dispatch: {
                include: {
                  vendor: {
                    include: { user: true },
                  },
                  items: {
                    include: {
                      assignedOrderItem: {
                        include: {
                          orderItem: {
                            include: { order: true },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          _count: {
            select: { comments: true, attachments: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.ticket.count({ where }),
    ]);

    return { tickets, pagination: { page, limit, total: totalCount } };
  }

  static async listTicketsAll(filters: TicketListFilters) {
    const {
      status = 'all',
      vendor,
      orderNumber,
      dateFrom,
      dateTo,
      page = 1,
      limit = 20,
    } = filters;

    const where: any = {};

    const mappedStatus = mapStatusToEnum(status);
    if (mappedStatus) {
      where.status = mappedStatus;
    }

    if (dateFrom || dateTo) {
      where.createdAt = {};
      if (dateFrom) where.createdAt.gte = new Date(dateFrom);
      if (dateTo) where.createdAt.lte = new Date(dateTo);
    }

    if (vendor) {
      where.goodsReceiptNote = {
        dispatch: {
          vendor: {
            OR: [
              { companyName: { contains: vendor, mode: 'insensitive' } },
              { user: { name: { contains: vendor, mode: 'insensitive' } } },
              { user: { email: { contains: vendor, mode: 'insensitive' } } },
            ],
          },
        },
      };
    }

    if (orderNumber) {
      where.goodsReceiptNote = {
        ...(where.goodsReceiptNote || {}),
        dispatch: {
          ...(where.goodsReceiptNote?.dispatch || {}),
          items: {
            some: {
              assignedOrderItem: {
                orderItem: {
                  order: {
                    OR: [
                      { orderNumber: { contains: orderNumber, mode: 'insensitive' } },
                      { clientOrderId: { contains: orderNumber, mode: 'insensitive' } },
                    ],
                  },
                },
              },
            },
          },
        },
      };
    }

    const skip = (page - 1) * limit;

    const [tickets, totalCount] = await Promise.all([
      prisma.ticket.findMany({
        where,
        include: {
          createdBy: true,
          goodsReceiptNote: {
            include: {
              dispatch: {
                include: {
                  vendor: { include: { user: true } },
                  items: {
                    include: {
                      assignedOrderItem: {
                        include: { orderItem: { include: { order: true } } },
                      },
                    },
                  },
                },
              },
            },
          },
          _count: { select: { comments: true, attachments: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.ticket.count({ where }),
    ]);

    return { tickets, pagination: { page, limit, total: totalCount } };
  }

  static async updateStatus(
    ticketId: string,
    status: 'open' | 'under-review' | 'resolved' | 'closed',
    userId: string
  ) {
    const mapped = mapStatusToEnum(status);
    if (!mapped) {
      throw new Error('Invalid status');
    }

    // Ensure the ticket exists and is accessible by the user (creator)
    const existing = await prisma.ticket.findFirst({
      where: { id: ticketId, createdById: userId },
      select: { id: true },
    });

    if (!existing) {
      throw new Error('Ticket not found');
    }

    await prisma.ticket.update({
      where: { id: ticketId },
      data: { status: mapped },
    });

    const updated = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        goodsReceiptNote: {
          include: {
            dispatch: {
              include: {
                vendor: { include: { user: true } },
                items: {
                  include: {
                    assignedOrderItem: {
                      include: { orderItem: { include: { order: true } } },
                    },
                  },
                },
              },
            },
          },
        },
        _count: { select: { comments: true, attachments: true } },
      },
    });

    return updated;
  }
}


