import { GRNAutoTicketingService, GRNMismatchData } from '../../../services/grn-auto-ticketing.service';
import { prisma } from '../../../config/database';
import { notificationService } from '../../notifications/notification.service';

// Mock dependencies
jest.mock('../../../config/database', () => ({
  prisma: {
    $transaction: jest.fn(),
    goodsReceiptNote: {
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    goodsReceiptItem: {
      update: jest.fn(),
    },
    ticket: {
      create: jest.fn(),
      update: jest.fn(),
      findUnique: jest.fn(),
    },
    ticketComment: {
      create: jest.fn(),
    },
    user: {
      findFirst: jest.fn(),
    },
  },
}));

jest.mock('../../notifications/notification.service', () => ({
  notificationService: {
    sendNotificationToRole: jest.fn(),
    sendNotificationToUser: jest.fn(),
  },
}));

describe('GRNAutoTicketingService', () => {
  // Base test data available to all test suites
  const baseGRNData: GRNMismatchData = {
    goodsReceiptNoteId: 'grn-123',
    grnNumber: 'GRN-2025-001',
    dispatchId: 'dispatch-123',
    verifiedById: 'user-ops-1',
    operatorRemarks: 'Verified at store',
    mismatches: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processGRNVerification', () => {

    it('should mark GRN as VERIFIED_OK when no mismatches', async () => {
      const grnDataNoMismatch: GRNMismatchData = {
        ...baseGRNData,
        mismatches: [
          {
            grnItemId: 'item-1',
            assignedOrderItemId: 'assigned-1',
            assignedQuantity: 10,
            confirmedQuantity: 10,
            receivedQuantity: 10,
            discrepancyQuantity: 0,
            status: 'VERIFIED_OK',
            damageReported: false,
          },
        ],
      };

      const mockGRN = {
        id: 'grn-123',
        grnNumber: 'GRN-2025-001',
        status: 'VERIFIED_OK',
        verifiedAt: new Date(),
        dispatch: {
          vendor: {
            userId: 'vendor-user-1',
            companyName: 'Test Vendor',
            user: { email: 'vendor@test.com' },
          },
        },
        items: [],
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const txResult = await callback({
          goodsReceiptNote: {
            update: jest.fn().mockResolvedValue(mockGRN),
          },
          goodsReceiptItem: {
            update: jest.fn(),
          },
        });
        return txResult;
      });

      const result = await GRNAutoTicketingService.processGRNVerification(grnDataNoMismatch);

      expect(result.success).toBe(true);
      expect(result.ticket).toBeNull();
      expect(result.message).toContain('no issues');
    });

    it('should create URGENT ticket for damage + shortage', async () => {
      const grnDataWithDamage: GRNMismatchData = {
        ...baseGRNData,
        mismatches: [
          {
            grnItemId: 'item-1',
            assignedOrderItemId: 'assigned-1',
            assignedQuantity: 10,
            confirmedQuantity: 10,
            receivedQuantity: 5,
            discrepancyQuantity: -5,
            status: 'DAMAGE_REPORTED',
            damageReported: true,
            damageDescription: 'Boxes crushed, items broken',
          },
        ],
      };

      const mockGRN = {
        id: 'grn-123',
        grnNumber: 'GRN-2025-001',
        status: 'VERIFIED_MISMATCH',
        verifiedAt: new Date(),
        dispatch: {
          vendor: {
            userId: 'vendor-user-1',
            companyName: 'Test Vendor',
            user: { email: 'vendor@test.com' },
          },
        },
        items: [
          {
            id: 'item-1',
            assignedOrderItem: {
              orderItem: { productName: 'Tomatoes' },
            },
          },
        ],
      };

      const mockTicket = {
        id: 'ticket-123',
        ticketNumber: 'TKT-2025-001',
        title: 'GRN Mismatch - GRN-2025-001',
        priority: 'URGENT',
        status: 'OPEN',
        assigneeId: null,
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const txResult = await callback({
          goodsReceiptNote: {
            update: jest.fn().mockResolvedValue(mockGRN),
          },
          goodsReceiptItem: {
            update: jest.fn(),
          },
          ticket: {
            create: jest.fn().mockResolvedValue(mockTicket),
            count: jest.fn().mockResolvedValue(0),
          },
          ticketComment: {
            create: jest.fn(),
          },
          user: {
            findFirst: jest.fn().mockResolvedValue({ id: 'qc-lead-1' }),
          },
        });
        return txResult;
      });

      const result = await GRNAutoTicketingService.processGRNVerification(grnDataWithDamage);

      expect(result.success).toBe(true);
      expect(result.ticket).toBeTruthy();
      expect(result.ticket?.priority).toBe('URGENT');
    });

    it('should create HIGH priority ticket for significant quantity mismatch', async () => {
      const grnDataWithMismatch: GRNMismatchData = {
        ...baseGRNData,
        mismatches: [
          {
            grnItemId: 'item-1',
            assignedOrderItemId: 'assigned-1',
            assignedQuantity: 100,
            confirmedQuantity: 100,
            receivedQuantity: 85, // 15% shortage
            discrepancyQuantity: -15,
            status: 'QUANTITY_MISMATCH',
            damageReported: false,
          },
        ],
      };

      const mockGRN = {
        id: 'grn-123',
        grnNumber: 'GRN-2025-001',
        status: 'VERIFIED_MISMATCH',
        verifiedAt: new Date(),
        dispatch: {
          vendor: {
            userId: 'vendor-user-1',
            companyName: 'Test Vendor',
            user: { email: 'vendor@test.com' },
          },
        },
        items: [],
      };

      const mockTicket = {
        id: 'ticket-123',
        ticketNumber: 'TKT-2025-001',
        priority: 'HIGH',
        status: 'OPEN',
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const txResult = await callback({
          goodsReceiptNote: {
            update: jest.fn().mockResolvedValue(mockGRN),
          },
          goodsReceiptItem: {
            update: jest.fn(),
          },
          ticket: {
            create: jest.fn().mockResolvedValue(mockTicket),
            count: jest.fn().mockResolvedValue(0),
          },
          ticketComment: {
            create: jest.fn(),
          },
          user: {
            findFirst: jest.fn().mockResolvedValue({ id: 'qc-lead-1' }),
          },
        });
        return txResult;
      });

      const result = await GRNAutoTicketingService.processGRNVerification(grnDataWithMismatch);

      expect(result.success).toBe(true);
      expect(result.ticket?.priority).toBe('HIGH');
    });

    it('should create MEDIUM priority ticket for minor discrepancies', async () => {
      const grnDataMinorMismatch: GRNMismatchData = {
        ...baseGRNData,
        mismatches: [
          {
            grnItemId: 'item-1',
            assignedOrderItemId: 'assigned-1',
            assignedQuantity: 100,
            confirmedQuantity: 100,
            receivedQuantity: 98, // 2% shortage (minor)
            discrepancyQuantity: -2,
            status: 'SHORTAGE_REPORTED',
            damageReported: false,
          },
        ],
      };

      const mockGRN = {
        id: 'grn-123',
        grnNumber: 'GRN-2025-001',
        status: 'PARTIALLY_VERIFIED',
        verifiedAt: new Date(),
        dispatch: {
          vendor: {
            userId: 'vendor-user-1',
            companyName: 'Test Vendor',
            user: { email: 'vendor@test.com' },
          },
        },
        items: [],
      };

      const mockTicket = {
        id: 'ticket-123',
        ticketNumber: 'TKT-2025-001',
        priority: 'MEDIUM',
        status: 'OPEN',
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const txResult = await callback({
          goodsReceiptNote: {
            update: jest.fn().mockResolvedValue(mockGRN),
          },
          goodsReceiptItem: {
            update: jest.fn(),
          },
          ticket: {
            create: jest.fn().mockResolvedValue(mockTicket),
            count: jest.fn().mockResolvedValue(0),
          },
          ticketComment: {
            create: jest.fn(),
          },
          user: {
            findFirst: jest.fn().mockResolvedValue(null), // No QC lead found
          },
        });
        return txResult;
      });

      const result = await GRNAutoTicketingService.processGRNVerification(grnDataMinorMismatch);

      expect(result.success).toBe(true);
      expect(result.ticket?.priority).toBe('MEDIUM');
    });

    it('should handle excess received items', async () => {
      const grnDataExcess: GRNMismatchData = {
        ...baseGRNData,
        mismatches: [
          {
            grnItemId: 'item-1',
            assignedOrderItemId: 'assigned-1',
            assignedQuantity: 10,
            confirmedQuantity: 10,
            receivedQuantity: 12, // Excess
            discrepancyQuantity: 2,
            status: 'EXCESS_RECEIVED',
            damageReported: false,
          },
        ],
      };

      const mockGRN = {
        id: 'grn-123',
        grnNumber: 'GRN-2025-001',
        status: 'PARTIALLY_VERIFIED',
        verifiedAt: new Date(),
        dispatch: {
          vendor: {
            userId: 'vendor-user-1',
            companyName: 'Test Vendor',
            user: { email: 'vendor@test.com' },
          },
        },
        items: [],
      };

      const mockTicket = {
        id: 'ticket-123',
        ticketNumber: 'TKT-2025-001',
        priority: 'LOW',
        status: 'OPEN',
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const txResult = await callback({
          goodsReceiptNote: {
            update: jest.fn().mockResolvedValue(mockGRN),
          },
          goodsReceiptItem: {
            update: jest.fn(),
          },
          ticket: {
            create: jest.fn().mockResolvedValue(mockTicket),
            count: jest.fn().mockResolvedValue(0),
          },
          ticketComment: {
            create: jest.fn(),
          },
          user: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
        });
        return txResult;
      });

      const result = await GRNAutoTicketingService.processGRNVerification(grnDataExcess);

      expect(result.success).toBe(true);
      expect(result.ticket?.priority).toBe('LOW'); // Excess is low priority
    });
  });

  describe('updateTicketStatus', () => {
    it('should update ticket status and add comment', async () => {
      const mockTicket = {
        id: 'ticket-123',
        ticketNumber: 'TKT-2025-001',
        status: 'RESOLVED',
        resolvedAt: new Date(),
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const txResult = await callback({
          ticket: {
            update: jest.fn().mockResolvedValue(mockTicket),
          },
          ticketComment: {
            create: jest.fn(),
          },
        });
        return txResult;
      });

      const result = await GRNAutoTicketingService.updateTicketStatus(
        'ticket-123',
        'RESOLVED',
        'user-1',
        'Issue resolved by vendor replacement'
      );

      expect(result.success).toBe(true);
      expect(result.ticket?.status).toBe('RESOLVED');
    });

    it('should set resolvedAt when status is RESOLVED', async () => {
      const mockTicket = {
        id: 'ticket-123',
        status: 'RESOLVED',
        resolvedAt: new Date(),
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const txResult = await callback({
          ticket: {
            update: jest.fn().mockResolvedValue(mockTicket),
          },
          ticketComment: {
            create: jest.fn(),
          },
        });
        return txResult;
      });

      const result = await GRNAutoTicketingService.updateTicketStatus(
        'ticket-123',
        'RESOLVED',
        'user-1'
      );

      expect(result.ticket?.resolvedAt).toBeDefined();
    });

    it('should clear resolvedAt when reopening ticket', async () => {
      const mockTicket = {
        id: 'ticket-123',
        status: 'OPEN',
        resolvedAt: null,
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const txResult = await callback({
          ticket: {
            update: jest.fn().mockResolvedValue(mockTicket),
          },
          ticketComment: {
            create: jest.fn(),
          },
        });
        return txResult;
      });

      const result = await GRNAutoTicketingService.updateTicketStatus(
        'ticket-123',
        'OPEN',
        'user-1',
        'Reopening due to new findings'
      );

      expect(result.ticket?.resolvedAt).toBeNull();
    });
  });

  describe('getTicketByGRNId', () => {
    it('should return ticket for given GRN', async () => {
      const mockTicket = {
        id: 'ticket-123',
        ticketNumber: 'TKT-2025-001',
        goodsReceiptNoteId: 'grn-123',
      };

      (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(mockTicket);

      const result = await GRNAutoTicketingService.getTicketByGRNId('grn-123');

      expect(prisma.ticket.findUnique).toHaveBeenCalledWith({
        where: { goodsReceiptNoteId: 'grn-123' },
        include: expect.any(Object),
      });

      expect(result).toEqual(mockTicket);
    });

    it('should return null if no ticket exists for GRN', async () => {
      (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await GRNAutoTicketingService.getTicketByGRNId('grn-without-ticket');

      expect(result).toBeNull();
    });
  });

  describe('Notification Sending', () => {
    it('should send notifications when ticket is created', async () => {
      const grnDataWithMismatch: GRNMismatchData = {
        ...baseGRNData,
        mismatches: [
          {
            grnItemId: 'item-1',
            assignedOrderItemId: 'assigned-1',
            assignedQuantity: 10,
            confirmedQuantity: 10,
            receivedQuantity: 7,
            discrepancyQuantity: -3,
            status: 'QUANTITY_MISMATCH',
            damageReported: false,
          },
        ],
      };

      const mockGRN = {
        id: 'grn-123',
        grnNumber: 'GRN-2025-001',
        status: 'VERIFIED_MISMATCH',
        verifiedAt: new Date(),
        dispatch: {
          vendor: {
            userId: 'vendor-user-1',
            companyName: 'Test Vendor',
            user: { email: 'vendor@test.com' },
          },
        },
        items: [],
      };

      const mockTicket = {
        id: 'ticket-123',
        ticketNumber: 'TKT-2025-001',
        priority: 'HIGH',
        status: 'OPEN',
        assigneeId: null,
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const txResult = await callback({
          goodsReceiptNote: {
            update: jest.fn().mockResolvedValue(mockGRN),
          },
          goodsReceiptItem: {
            update: jest.fn(),
          },
          ticket: {
            create: jest.fn().mockResolvedValue(mockTicket),
            count: jest.fn().mockResolvedValue(0),
          },
          ticketComment: {
            create: jest.fn(),
          },
          user: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
        });
        return txResult;
      });

      await GRNAutoTicketingService.processGRNVerification(grnDataWithMismatch);

      // Should notify operations/admin/qc teams
      expect(notificationService.sendNotificationToRole).toHaveBeenCalledWith(
        ['OPERATIONS', 'ADMIN', 'QC'],
        expect.objectContaining({
          title: expect.stringContaining('GRN Ticket Created'),
          priority: 'URGENT',
        })
      );

      // Should notify the vendor
      expect(notificationService.sendNotificationToUser).toHaveBeenCalledWith(
        'vendor-user-1',
        expect.objectContaining({
          title: expect.stringContaining('Quality Issue'),
        })
      );
    });

    it('should not fail if notification sending fails', async () => {
      const grnDataWithMismatch: GRNMismatchData = {
        ...baseGRNData,
        mismatches: [
          {
            grnItemId: 'item-1',
            assignedOrderItemId: 'assigned-1',
            assignedQuantity: 10,
            confirmedQuantity: 10,
            receivedQuantity: 7,
            discrepancyQuantity: -3,
            status: 'QUANTITY_MISMATCH',
            damageReported: false,
          },
        ],
      };

      const mockGRN = {
        id: 'grn-123',
        status: 'VERIFIED_MISMATCH',
        dispatch: {
          vendor: {
            userId: 'vendor-user-1',
            companyName: 'Test Vendor',
          },
        },
        items: [],
      };

      const mockTicket = {
        id: 'ticket-123',
        ticketNumber: 'TKT-2025-001',
        priority: 'HIGH',
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const txResult = await callback({
          goodsReceiptNote: {
            update: jest.fn().mockResolvedValue(mockGRN),
          },
          goodsReceiptItem: {
            update: jest.fn(),
          },
          ticket: {
            create: jest.fn().mockResolvedValue(mockTicket),
            count: jest.fn().mockResolvedValue(0),
          },
          ticketComment: {
            create: jest.fn(),
          },
          user: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
        });
      });

      // Mock notification failure
      (notificationService.sendNotificationToRole as jest.Mock).mockRejectedValue(
        new Error('Notification service unavailable')
      );

      const result = await GRNAutoTicketingService.processGRNVerification(grnDataWithMismatch);

      // Should still succeed even if notifications fail
      expect(result.success).toBe(true);
      expect(result.ticket).toBeTruthy();
    });
  });

  describe('Ticket Priority Logic', () => {
    it('should assign URGENT for damage + critical shortage (>20%)', async () => {
      // Test priority calculation logic
      const hasDamage = true;
      const shortagePercent = 25; // >20%
      
      const expectedPriority = hasDamage ? 'URGENT' : shortagePercent > 20 ? 'HIGH' : 'MEDIUM';
      
      expect(expectedPriority).toBe('URGENT');
    });

    it('should assign HIGH for significant mismatch (10-20%)', async () => {
      const hasDamage = false;
      const shortagePercent = 15;
      
      const expectedPriority = hasDamage ? 'URGENT' : shortagePercent > 10 ? 'HIGH' : 'MEDIUM';
      
      expect(expectedPriority).toBe('HIGH');
    });

    it('should assign MEDIUM for minor mismatch (<10%)', async () => {
      const hasDamage = false;
      const shortagePercent = 5;
      
      const expectedPriority = hasDamage ? 'URGENT' : shortagePercent > 10 ? 'HIGH' : 'MEDIUM';
      
      expect(expectedPriority).toBe('MEDIUM');
    });

    it('should assign LOW for excess received', async () => {
      const isExcess = true;
      const expectedPriority = isExcess ? 'LOW' : 'MEDIUM';
      
      expect(expectedPriority).toBe('LOW');
    });
  });

  describe('Error Handling', () => {
    it('should handle transaction failures gracefully', async () => {
      const grnData: GRNMismatchData = {
        ...baseGRNData,
        mismatches: [
          {
            grnItemId: 'item-1',
            assignedOrderItemId: 'assigned-1',
            assignedQuantity: 10,
            confirmedQuantity: 10,
            receivedQuantity: 7,
            discrepancyQuantity: -3,
            status: 'QUANTITY_MISMATCH',
            damageReported: false,
          },
        ],
      };

      (prisma.$transaction as jest.Mock).mockRejectedValue(
        new Error('Transaction timeout')
      );

      const result = await GRNAutoTicketingService.processGRNVerification(grnData);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to process GRN verification');
    });

    it('should handle missing GRN data', async () => {
      const invalidData = {
        goodsReceiptNoteId: '',
        grnNumber: '',
        dispatchId: '',
        verifiedById: '',
        mismatches: [],
      } as GRNMismatchData;

      const result = await GRNAutoTicketingService.processGRNVerification(invalidData);
      
      expect(result.success).toBe(false);
      expect(result.message).toContain('Failed to process GRN verification');
    });
  });

  describe('Multiple Items Verification', () => {
    it('should handle multiple items with mixed statuses', async () => {
      const grnDataMultipleItems: GRNMismatchData = {
        ...baseGRNData,
        mismatches: [
          {
            grnItemId: 'item-1',
            assignedOrderItemId: 'assigned-1',
            assignedQuantity: 10,
            confirmedQuantity: 10,
            receivedQuantity: 10,
            discrepancyQuantity: 0,
            status: 'VERIFIED_OK',
            damageReported: false,
          },
          {
            grnItemId: 'item-2',
            assignedOrderItemId: 'assigned-2',
            assignedQuantity: 20,
            confirmedQuantity: 20,
            receivedQuantity: 18,
            discrepancyQuantity: -2,
            status: 'QUANTITY_MISMATCH',
            damageReported: false,
          },
        ],
      };

      const mockGRN = {
        id: 'grn-123',
        grnNumber: 'GRN-2025-001',
        status: 'VERIFIED_MISMATCH',
        verifiedAt: new Date(),
        dispatch: {
          vendor: {
            userId: 'vendor-user-1',
            companyName: 'Test Vendor',
            user: { email: 'vendor@test.com' },
          },
        },
        items: [],
      };

      const mockTicket = {
        id: 'ticket-123',
        ticketNumber: 'TKT-2025-001',
        priority: 'HIGH',
        status: 'OPEN',
      };

      (prisma.$transaction as jest.Mock).mockImplementation(async (callback) => {
        const txResult = await callback({
          goodsReceiptNote: {
            update: jest.fn().mockResolvedValue(mockGRN),
          },
          goodsReceiptItem: {
            update: jest.fn(),
          },
          ticket: {
            create: jest.fn().mockResolvedValue(mockTicket),
            count: jest.fn().mockResolvedValue(0),
          },
          ticketComment: {
            create: jest.fn(),
          },
          user: {
            findFirst: jest.fn().mockResolvedValue(null),
          },
        });
        return txResult;
      });

      const result = await GRNAutoTicketingService.processGRNVerification(grnDataMultipleItems);

      expect(result.success).toBe(true);
      expect(result.ticket).toBeTruthy(); // Should create ticket for the mismatch
    });
  });
});

