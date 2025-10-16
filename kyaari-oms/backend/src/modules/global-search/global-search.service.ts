import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';
import { APP_CONSTANTS } from '../../config/constants';

export interface GlobalSearchFilters {
  query: string;
  entityTypes?: string[];
  page?: number;
  limit?: number;
}

export interface SearchResult {
  type: string;
  id: string;
  title: string;
  description: string;
  metadata: Record<string, unknown>;
  relevanceScore?: number;
}

export interface GlobalSearchResponse {
  results: SearchResult[];
  total: number;
  page: number;
  limit: number;
  entityTypes: string[];
}

export class GlobalSearchService {
  /**
   * Perform global search across all accessible entities based on user roles
   */
  static async search(
    filters: GlobalSearchFilters,
    userRoles: string[],
    userId: string
  ): Promise<GlobalSearchResponse> {
    const { query, entityTypes = [], page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    if (!query || query.trim().length < 2) {
      return {
        results: [],
        total: 0,
        page,
        limit,
        entityTypes: []
      };
    }

    const searchTerm = query.trim().toLowerCase();
    const searchResults: SearchResult[] = [];

    try {
      // Get accessible entity types based on user roles
      const accessibleEntities = this.getAccessibleEntityTypes(userRoles);
      
      // Filter entity types if specified
      const entitiesToSearch = entityTypes.length > 0 
        ? entityTypes.filter(entity => accessibleEntities.includes(entity))
        : accessibleEntities;

      // Perform searches in parallel for different entity types
      const searchPromises = entitiesToSearch.map(entityType => {
        switch (entityType) {
          case 'orders':
            return this.searchOrders(searchTerm, userRoles, userId);
          case 'users':
            return this.searchUsers(searchTerm, userRoles, userId);
          case 'vendors':
            return this.searchVendors(searchTerm, userRoles, userId);
          case 'tickets':
            return this.searchTickets(searchTerm, userRoles, userId);
          case 'payments':
            return this.searchPayments(searchTerm, userRoles, userId);
          case 'dispatches':
            return this.searchDispatches(searchTerm, userRoles, userId);
          case 'grns':
            return this.searchGRNs(searchTerm, userRoles, userId);
          default:
            return Promise.resolve([]);
        }
      });

      const results = await Promise.all(searchPromises);
      
      // Flatten and combine all results
      searchResults.push(...results.flat());

      // Sort by relevance (simple text matching score)
      searchResults.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));

      // Apply pagination
      const paginatedResults = searchResults.slice(skip, skip + limit);

      return {
        results: paginatedResults,
        total: searchResults.length,
        page,
        limit,
        entityTypes: entitiesToSearch
      };

    } catch (error) {
      logger.error('Global search failed', { error, query, userRoles, userId });
      throw new Error('Search failed. Please try again.');
    }
  }

  /**
   * Get entity types accessible based on user roles
   */
  private static getAccessibleEntityTypes(userRoles: string[]): string[] {
    const entityPermissions: Record<string, string[]> = {
      'ADMIN': ['orders', 'users', 'vendors', 'tickets', 'payments', 'dispatches', 'grns'],
      'OPS': ['orders', 'vendors', 'tickets', 'dispatches', 'grns'],
      'ACCOUNTS': ['orders', 'vendors', 'payments', 'tickets'],
      'VENDOR': ['orders', 'tickets'] // Vendors can only see their own orders and tickets
    };

    const accessibleEntities = new Set<string>();
    
    userRoles.forEach(role => {
      const entities = entityPermissions[role] || [];
      entities.forEach(entity => accessibleEntities.add(entity));
    });

    return Array.from(accessibleEntities);
  }

  /**
   * Search orders
   */
  private static async searchOrders(searchTerm: string, userRoles: string[], userId: string): Promise<SearchResult[]> {
    const whereClause: any = {
      deletedAt: null,
      OR: [
        { clientOrderId: { contains: searchTerm, mode: 'insensitive' } },
        { orderNumber: { contains: searchTerm, mode: 'insensitive' } },
        { items: { some: { productName: { contains: searchTerm, mode: 'insensitive' } } } }
      ]
    };

    // Vendors can only see their own orders
    if (userRoles.includes('VENDOR') && !userRoles.includes('ADMIN')) {
      whereClause.OR = [
        ...whereClause.OR,
        { 
          items: { 
            some: { 
              assignedItems: { 
                some: { 
                  vendor: { 
                    user: { id: userId } 
                  } 
                } 
              } 
            } 
          } 
        }
      ];
    }

    const orders = await prisma.order.findMany({
      where: whereClause,
      include: {
        items: {
          include: {
            assignedItems: {
              include: {
                vendor: {
                  include: {
                    user: true
                  }
                }
              }
            }
          }
        },
        primaryVendor: true
      },
      take: 50, // Limit per entity type
      orderBy: { createdAt: 'desc' }
    });

    return orders.map(order => ({
      type: 'orders',
      id: order.id,
      title: `${order.clientOrderId || order.orderNumber}`,
      description: `${order.status} • ${order.items.length} items • ₹${order.totalValue || 0}`,
      metadata: {
        status: order.status,
        totalValue: order.totalValue,
        createdAt: order.createdAt,
        primaryVendor: order.primaryVendor?.companyName
      },
      relevanceScore: this.calculateRelevanceScore(searchTerm, [
        order.clientOrderId || '',
        order.orderNumber,
        order.items.map(item => item.productName).join(' ')
      ])
    }));
  }

  /**
   * Search users
   */
  private static async searchUsers(searchTerm: string, userRoles: string[], userId: string): Promise<SearchResult[]> {
    // Only ADMIN and OPS can search users
    if (!userRoles.includes('ADMIN') && !userRoles.includes('OPS')) {
      return [];
    }

    const users = await prisma.user.findMany({
      where: {
        deletedAt: null,
        OR: [
          { name: { contains: searchTerm, mode: 'insensitive' } },
          { email: { contains: searchTerm, mode: 'insensitive' } }
        ]
      },
      include: {
        roles: {
          include: {
            role: true
          }
        },
        vendorProfile: true
      },
      take: 50,
      orderBy: { createdAt: 'desc' }
    });

    return users.map(user => ({
      type: 'users',
      id: user.id,
      title: user.name,
      description: `${user.email || 'No email'} • ${user.status} • ${user.roles.map(r => r.role.name).join(', ')}`,
      metadata: {
        email: user.email,
        status: user.status,
        roles: user.roles.map(r => r.role.name),
        isVendor: !!user.vendorProfile,
        createdAt: user.createdAt
      },
      relevanceScore: this.calculateRelevanceScore(searchTerm, [user.name, user.email || ''])
    }));
  }

  /**
   * Search vendors
   */
  private static async searchVendors(searchTerm: string, userRoles: string[], userId: string): Promise<SearchResult[]> {
    const whereClause: any = {
      OR: [
        { companyName: { contains: searchTerm, mode: 'insensitive' } },
        { contactPersonName: { contains: searchTerm, mode: 'insensitive' } },
        { contactPhone: { contains: searchTerm, mode: 'insensitive' } },
        { gstNumber: { contains: searchTerm, mode: 'insensitive' } }
      ]
    };

    const vendors = await prisma.vendorProfile.findMany({
      where: whereClause,
      include: {
        user: {
          include: {
            roles: {
              include: {
                role: true
              }
            }
          }
        }
      },
      take: 50,
      orderBy: { createdAt: 'desc' }
    });

    return vendors.map(vendor => ({
      type: 'vendors',
      id: vendor.id,
      title: vendor.companyName,
      description: `${vendor.contactPersonName} • ${vendor.contactPhone} • ${vendor.verified ? 'Verified' : 'Pending'}`,
      metadata: {
        contactPersonName: vendor.contactPersonName,
        contactPhone: vendor.contactPhone,
        gstNumber: vendor.gstNumber,
        verified: vendor.verified,
        userStatus: vendor.user.status,
        createdAt: vendor.createdAt
      },
      relevanceScore: this.calculateRelevanceScore(searchTerm, [
        vendor.companyName,
        vendor.contactPersonName,
        vendor.contactPhone,
        vendor.gstNumber || ''
      ])
    }));
  }

  /**
   * Search tickets
   */
  private static async searchTickets(searchTerm: string, userRoles: string[], userId: string): Promise<SearchResult[]> {
    const whereClause: any = {
      OR: [
        { title: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } },
        { ticketNumber: { contains: searchTerm, mode: 'insensitive' } }
      ]
    };

    // Vendors can only see tickets they created or are assigned to
    if (userRoles.includes('VENDOR') && !userRoles.includes('ADMIN')) {
      whereClause.OR = [
        ...whereClause.OR,
        { createdById: userId },
        { assigneeId: userId }
      ];
    }

    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      include: {
        createdBy: true,
        assignee: true,
        goodsReceiptNote: true
      },
      take: 50,
      orderBy: { createdAt: 'desc' }
    });

    return tickets.map(ticket => ({
      type: 'tickets',
      id: ticket.id,
      title: ticket.title,
      description: `${ticket.status} • ${ticket.priority} • Created by ${ticket.createdBy.name}`,
      metadata: {
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
        priority: ticket.priority,
        createdBy: ticket.createdBy.name,
        assignee: ticket.assignee?.name,
        createdAt: ticket.createdAt
      },
      relevanceScore: this.calculateRelevanceScore(searchTerm, [
        ticket.title,
        ticket.description,
        ticket.ticketNumber
      ])
    }));
  }

  /**
   * Search payments
   */
  private static async searchPayments(searchTerm: string, userRoles: string[], userId: string): Promise<SearchResult[]> {
    // Only ADMIN and ACCOUNTS can search payments
    if (!userRoles.includes('ADMIN') && !userRoles.includes('ACCOUNTS')) {
      return [];
    }

    const payments = await prisma.payment.findMany({
      where: {
        OR: [
          { transactionId: { contains: searchTerm, mode: 'insensitive' } },
          { notes: { contains: searchTerm, mode: 'insensitive' } },
          { 
            purchaseOrder: {
              OR: [
                { poNumber: { contains: searchTerm, mode: 'insensitive' } },
                { vendor: { companyName: { contains: searchTerm, mode: 'insensitive' } } }
              ]
            }
          }
        ]
      },
      include: {
        purchaseOrder: {
          include: {
            vendor: true
          }
        },
        processedBy: true
      },
      take: 50,
      orderBy: { createdAt: 'desc' }
    });

    return payments.map(payment => ({
      type: 'payments',
      id: payment.id,
      title: `Payment ${payment.transactionId || payment.id.slice(-8)}`,
      description: `${payment.status} • ₹${payment.amount} • ${payment.purchaseOrder.vendor.companyName}`,
      metadata: {
        amount: payment.amount,
        status: payment.status,
        transactionId: payment.transactionId,
        vendor: payment.purchaseOrder.vendor.companyName,
        processedBy: payment.processedBy.name,
        createdAt: payment.createdAt
      },
      relevanceScore: this.calculateRelevanceScore(searchTerm, [
        payment.transactionId || '',
        payment.notes || '',
        payment.purchaseOrder.poNumber,
        payment.purchaseOrder.vendor.companyName
      ])
    }));
  }

  /**
   * Search dispatches
   */
  private static async searchDispatches(searchTerm: string, userRoles: string[], userId: string): Promise<SearchResult[]> {
    const whereClause: any = {
      OR: [
        { dispatchNumber: { contains: searchTerm, mode: 'insensitive' } },
        { awbNumber: { contains: searchTerm, mode: 'insensitive' } },
        { logisticsPartner: { contains: searchTerm, mode: 'insensitive' } }
      ]
    };

    // Vendors can only see their own dispatches
    if (userRoles.includes('VENDOR') && !userRoles.includes('ADMIN')) {
      whereClause.vendorId = await this.getVendorIdByUserId(userId);
    }

    const dispatches = await prisma.dispatch.findMany({
      where: whereClause,
      include: {
        vendor: true,
        items: {
          include: {
            assignedOrderItem: {
              include: {
                orderItem: {
                  include: {
                    order: true
                  }
                }
              }
            }
          }
        }
      },
      take: 50,
      orderBy: { createdAt: 'desc' }
    });

    return dispatches.map(dispatch => ({
      type: 'dispatches',
      id: dispatch.id,
      title: `Dispatch ${dispatch.dispatchNumber}`,
      description: `${dispatch.status} • ${dispatch.logisticsPartner} • ${dispatch.vendor.companyName}`,
      metadata: {
        dispatchNumber: dispatch.dispatchNumber,
        awbNumber: dispatch.awbNumber,
        status: dispatch.status,
        logisticsPartner: dispatch.logisticsPartner,
        vendor: dispatch.vendor.companyName,
        dispatchDate: dispatch.dispatchDate,
        createdAt: dispatch.createdAt
      },
      relevanceScore: this.calculateRelevanceScore(searchTerm, [
        dispatch.dispatchNumber,
        dispatch.awbNumber,
        dispatch.logisticsPartner,
        dispatch.vendor.companyName
      ])
    }));
  }

  /**
   * Search GRNs (Goods Receipt Notes)
   */
  private static async searchGRNs(searchTerm: string, userRoles: string[], userId: string): Promise<SearchResult[]> {
    const whereClause: any = {
      OR: [
        { grnNumber: { contains: searchTerm, mode: 'insensitive' } },
        { operatorRemarks: { contains: searchTerm, mode: 'insensitive' } },
        {
          dispatch: {
            OR: [
              { dispatchNumber: { contains: searchTerm, mode: 'insensitive' } },
              { awbNumber: { contains: searchTerm, mode: 'insensitive' } }
            ]
          }
        }
      ]
    };

    // Vendors can only see GRNs for their dispatches
    if (userRoles.includes('VENDOR') && !userRoles.includes('ADMIN')) {
      whereClause.dispatch = {
        ...whereClause.dispatch,
        vendorId: await this.getVendorIdByUserId(userId)
      };
    }

    const grns = await prisma.goodsReceiptNote.findMany({
      where: whereClause,
      include: {
        dispatch: {
          include: {
            vendor: true
          }
        },
        verifiedBy: true,
        items: {
          include: {
            assignedOrderItem: {
              include: {
                orderItem: true
              }
            }
          }
        }
      },
      take: 50,
      orderBy: { createdAt: 'desc' }
    });

    return grns.map(grn => ({
      type: 'grns',
      id: grn.id,
      title: `GRN ${grn.grnNumber}`,
      description: `${grn.status} • ${grn.dispatch.vendor.companyName} • ${grn.items.length} items`,
      metadata: {
        grnNumber: grn.grnNumber,
        status: grn.status,
        vendor: grn.dispatch.vendor.companyName,
        verifiedBy: grn.verifiedBy?.name,
        receivedAt: grn.receivedAt,
        verifiedAt: grn.verifiedAt,
        createdAt: grn.createdAt
      },
      relevanceScore: this.calculateRelevanceScore(searchTerm, [
        grn.grnNumber,
        grn.operatorRemarks || '',
        grn.dispatch.dispatchNumber,
        grn.dispatch.awbNumber,
        grn.dispatch.vendor.companyName
      ])
    }));
  }

  /**
   * Calculate relevance score based on text matching
   */
  private static calculateRelevanceScore(searchTerm: string, fields: string[]): number {
    const term = searchTerm.toLowerCase();
    let score = 0;
    
    fields.forEach(field => {
      if (!field) return;
      
      const fieldLower = field.toLowerCase();
      
      // Exact match gets highest score
      if (fieldLower === term) {
        score += 100;
      }
      // Starts with search term
      else if (fieldLower.startsWith(term)) {
        score += 80;
      }
      // Contains search term
      else if (fieldLower.includes(term)) {
        score += 60;
      }
      // Word boundary match
      else if (fieldLower.split(/\s+/).some(word => word.startsWith(term))) {
        score += 40;
      }
    });
    
    return score;
  }

  /**
   * Get vendor ID by user ID
   */
  private static async getVendorIdByUserId(userId: string): Promise<string | null> {
    const vendor = await prisma.vendorProfile.findUnique({
      where: { userId },
      select: { id: true }
    });
    return vendor?.id || null;
  }

  /**
   * Get available entity types for search based on user roles
   */
  static getAvailableEntityTypes(userRoles: string[]): string[] {
    return this.getAccessibleEntityTypes(userRoles);
  }
}
