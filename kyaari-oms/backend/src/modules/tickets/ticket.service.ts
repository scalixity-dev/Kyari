import { prisma } from '../../config/database';

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

export class TicketService {
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
}


