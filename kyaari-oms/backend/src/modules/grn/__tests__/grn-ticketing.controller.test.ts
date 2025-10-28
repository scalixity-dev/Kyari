import { Request, Response } from 'express';
import { GRNTicketingController } from '../grn-ticketing.controller';
import { GRNAutoTicketingService } from '../../../services/grn-auto-ticketing.service';
import { prisma } from '../../../config/database';
import { ResponseHelper } from '../../../utils/response';

// Mock dependencies
jest.mock('../../../config/database', () => ({
  prisma: {
    goodsReceiptNote: {
      findUnique: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn(),
    },
    ticket: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('../../../services/grn-auto-ticketing.service');
jest.mock('../../../utils/response');

describe('GRNTicketingController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;

  beforeEach(() => {
    mockRequest = {
      user: {
        userId: 'test-user-id',
        email: 'test@example.com',
        roles: ['OPS'],
        type: 'access',
      },
      body: {},
      params: {},
      query: {},
    };

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    jest.clearAllMocks();
  });

  describe('processGRNVerification', () => {
    const validGRNData = {
      goodsReceiptNoteId: 'grn-123',
      grnNumber: 'GRN-2025-001',
      dispatchId: 'dispatch-123',
      operatorRemarks: 'Test remarks',
      mismatches: [
        {
          grnItemId: 'item-1',
          assignedOrderItemId: 'assigned-1',
          assignedQuantity: 10,
          confirmedQuantity: 10,
          receivedQuantity: 8,
          discrepancyQuantity: -2,
          status: 'QUANTITY_MISMATCH',
          itemRemarks: 'Missing 2 units',
          damageReported: false,
        },
      ],
    };

    it('should successfully process GRN verification with no mismatches', async () => {
      const grnDataNoMismatch = {
        ...validGRNData,
        mismatches: [
          {
            ...validGRNData.mismatches[0],
            receivedQuantity: 10,
            discrepancyQuantity: 0,
            status: 'VERIFIED_OK',
            itemRemarks: 'All good',
          },
        ],
      };

      mockRequest.body = grnDataNoMismatch;

      const mockGRN = {
        id: 'grn-123',
        status: 'PENDING_VERIFICATION',
        dispatch: { vendor: { id: 'vendor-1' } },
      };

      const mockResult = {
        success: true,
        grn: { id: 'grn-123', grnNumber: 'GRN-2025-001', status: 'VERIFIED_OK', verifiedAt: new Date() },
        ticket: null,
        message: 'GRN verified successfully without issues',
      };

      (prisma.goodsReceiptNote.findUnique as jest.Mock).mockResolvedValue(mockGRN);
      (GRNAutoTicketingService.processGRNVerification as jest.Mock).mockResolvedValue(mockResult);

      await GRNTicketingController.processGRNVerification(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(GRNAutoTicketingService.processGRNVerification).toHaveBeenCalledWith({
        ...grnDataNoMismatch,
        verifiedById: 'test-user-id',
      });
      expect(ResponseHelper.success).toHaveBeenCalled();
    });

    it('should create ticket for quantity mismatch', async () => {
      mockRequest.body = validGRNData;

      const mockGRN = {
        id: 'grn-123',
        status: 'PENDING_VERIFICATION',
        dispatch: { vendor: { id: 'vendor-1' } },
      };

      const mockTicket = {
        id: 'ticket-123',
        ticketNumber: 'TKT-2025-001',
        title: 'GRN Mismatch: Quantity Shortage',
        priority: 'HIGH',
        status: 'OPEN',
      };

      const mockResult = {
        success: true,
        grn: { id: 'grn-123', grnNumber: 'GRN-2025-001', status: 'VERIFIED_MISMATCH', verifiedAt: new Date() },
        ticket: mockTicket,
        message: 'GRN verified with mismatches. Ticket created.',
      };

      (prisma.goodsReceiptNote.findUnique as jest.Mock).mockResolvedValue(mockGRN);
      (GRNAutoTicketingService.processGRNVerification as jest.Mock).mockResolvedValue(mockResult);

      await GRNTicketingController.processGRNVerification(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResponse,
        expect.objectContaining({
          ticket: expect.objectContaining({
            id: 'ticket-123',
            ticketNumber: 'TKT-2025-001',
          }),
        }),
        mockResult.message
      );
    });

    it('should return error if GRN not found', async () => {
      mockRequest.body = validGRNData;

      (prisma.goodsReceiptNote.findUnique as jest.Mock).mockResolvedValue(null);

      await GRNTicketingController.processGRNVerification(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(ResponseHelper.notFound).toHaveBeenCalledWith(mockResponse, 'Goods Receipt Note not found');
    });

    it('should return error if GRN already verified', async () => {
      mockRequest.body = validGRNData;

      const mockGRN = {
        id: 'grn-123',
        status: 'VERIFIED_OK', // Already verified
        dispatch: { vendor: { id: 'vendor-1' } },
      };

      (prisma.goodsReceiptNote.findUnique as jest.Mock).mockResolvedValue(mockGRN);

      await GRNTicketingController.processGRNVerification(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(ResponseHelper.error).toHaveBeenCalledWith(
        mockResponse,
        'GRN has already been verified',
        400
      );
    });

    it('should handle validation errors', async () => {
      mockRequest.body = {
        // Missing required fields
        goodsReceiptNoteId: 'grn-123',
      };

      await GRNTicketingController.processGRNVerification(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(ResponseHelper.validationError).toHaveBeenCalled();
    });

    it('should handle damage reports with high priority', async () => {
      const damageData = {
        ...validGRNData,
        mismatches: [
          {
            ...validGRNData.mismatches[0],
            status: 'DAMAGE_REPORTED',
            damageReported: true,
            damageDescription: 'Items crushed during transit',
          },
        ],
      };

      mockRequest.body = damageData;

      const mockGRN = {
        id: 'grn-123',
        status: 'PENDING_VERIFICATION',
        dispatch: { vendor: { id: 'vendor-1' } },
      };

      const mockTicket = {
        id: 'ticket-123',
        ticketNumber: 'TKT-2025-001',
        title: 'GRN Mismatch: Damage Reported',
        priority: 'URGENT',
        status: 'OPEN',
      };

      const mockResult = {
        success: true,
        grn: { id: 'grn-123', grnNumber: 'GRN-2025-001', status: 'VERIFIED_MISMATCH', verifiedAt: new Date() },
        ticket: mockTicket,
        message: 'GRN verified with critical damage. Urgent ticket created.',
      };

      (prisma.goodsReceiptNote.findUnique as jest.Mock).mockResolvedValue(mockGRN);
      (GRNAutoTicketingService.processGRNVerification as jest.Mock).mockResolvedValue(mockResult);

      await GRNTicketingController.processGRNVerification(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(ResponseHelper.success).toHaveBeenCalled();
    });
  });

  describe('getPendingGRNs', () => {
    it('should return list of pending GRNs with pagination', async () => {
      mockRequest.query = { page: '1', limit: '20' };

      const mockGRNs = [
        {
          id: 'grn-1',
          grnNumber: 'GRN-2025-001',
          status: 'PENDING_VERIFICATION',
          dispatch: {
            vendor: {
              user: { email: 'vendor1@example.com' },
              companyName: 'Vendor 1',
            },
          },
          items: [],
        },
        {
          id: 'grn-2',
          grnNumber: 'GRN-2025-002',
          status: 'PENDING_VERIFICATION',
          dispatch: {
            vendor: {
              user: { email: 'vendor2@example.com' },
              companyName: 'Vendor 2',
            },
          },
          items: [],
        },
      ];

      (prisma.goodsReceiptNote.findMany as jest.Mock).mockResolvedValue(mockGRNs);
      (prisma.goodsReceiptNote.count as jest.Mock).mockResolvedValue(2);

      await GRNTicketingController.getPendingGRNs(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(prisma.goodsReceiptNote.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { status: 'PENDING_VERIFICATION' },
          orderBy: { receivedAt: 'desc' },
        })
      );

      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResponse,
        expect.objectContaining({
          grns: mockGRNs,
          pagination: expect.objectContaining({
            currentPage: 1,
            totalItems: 2,
          }),
        }),
        'Pending GRNs retrieved successfully'
      );
    });

    it('should handle empty pending GRNs', async () => {
      mockRequest.query = { page: '1', limit: '20' };

      (prisma.goodsReceiptNote.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.goodsReceiptNote.count as jest.Mock).mockResolvedValue(0);

      await GRNTicketingController.getPendingGRNs(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResponse,
        expect.objectContaining({
          grns: [],
          pagination: expect.objectContaining({
            totalItems: 0,
          }),
        }),
        'Pending GRNs retrieved successfully'
      );
    });
  });

  describe('getGRNDetails', () => {
    it('should return GRN details with verification status', async () => {
      mockRequest.params = { grnId: 'grn-123' };

      const mockGRN = {
        id: 'grn-123',
        grnNumber: 'GRN-2025-001',
        status: 'VERIFIED_MISMATCH',
        dispatch: {
          vendor: {
            user: { email: 'vendor@example.com' },
            companyName: 'Test Vendor',
          },
        },
        items: [
          {
            id: 'item-1',
            status: 'QUANTITY_MISMATCH',
            receivedQuantity: 8,
            assignedQuantity: 10,
          },
        ],
        ticket: {
          id: 'ticket-123',
          ticketNumber: 'TKT-2025-001',
          status: 'OPEN',
          comments: [],
        },
        verifiedBy: {
          id: 'user-1',
          email: 'ops@example.com',
        },
      };

      (prisma.goodsReceiptNote.findUnique as jest.Mock).mockResolvedValue(mockGRN);

      await GRNTicketingController.getGRNDetails(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(prisma.goodsReceiptNote.findUnique).toHaveBeenCalledWith({
        where: { id: 'grn-123' },
        include: expect.objectContaining({
          dispatch: expect.any(Object),
          items: expect.any(Object),
          ticket: expect.any(Object),
          verifiedBy: true,
        }),
      });

      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResponse,
        mockGRN,
        'GRN details retrieved successfully'
      );
    });

    it('should return 404 if GRN not found', async () => {
      mockRequest.params = { grnId: 'non-existent-grn' };

      (prisma.goodsReceiptNote.findUnique as jest.Mock).mockResolvedValue(null);

      await GRNTicketingController.getGRNDetails(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(ResponseHelper.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Goods Receipt Note not found'
      );
    });
  });

  describe('getTicketByGRN', () => {
    it('should return ticket associated with GRN', async () => {
      mockRequest.params = { grnId: 'grn-123' };

      const mockTicket = {
        id: 'ticket-123',
        ticketNumber: 'TKT-2025-001',
        title: 'GRN Mismatch: Quantity Shortage',
        status: 'OPEN',
        priority: 'HIGH',
      };

      (GRNAutoTicketingService.getTicketByGRNId as jest.Mock).mockResolvedValue(mockTicket);

      await GRNTicketingController.getTicketByGRN(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(GRNAutoTicketingService.getTicketByGRNId).toHaveBeenCalledWith('grn-123');
      expect(ResponseHelper.success).toHaveBeenCalledWith(
        mockResponse,
        mockTicket,
        'Ticket retrieved successfully'
      );
    });

    it('should return 404 if no ticket found for GRN', async () => {
      mockRequest.params = { grnId: 'grn-without-ticket' };

      (GRNAutoTicketingService.getTicketByGRNId as jest.Mock).mockResolvedValue(null);

      await GRNTicketingController.getTicketByGRN(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(ResponseHelper.notFound).toHaveBeenCalledWith(
        mockResponse,
        'No ticket found for this GRN'
      );
    });
  });

  describe('updateTicketStatus', () => {
    it('should successfully update ticket status to RESOLVED', async () => {
      mockRequest.params = { ticketId: 'ticket-123' };
      mockRequest.body = {
        status: 'RESOLVED',
        comment: 'Issue resolved, vendor will send replacement',
      };

      const mockTicket = {
        id: 'ticket-123',
        ticketNumber: 'TKT-2025-001',
        status: 'OPEN',
      };

      const mockResult = {
        success: true,
        ticket: {
          id: 'ticket-123',
          ticketNumber: 'TKT-2025-001',
          status: 'RESOLVED',
          resolvedAt: new Date(),
        },
        message: 'Ticket status updated successfully',
      };

      (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(mockTicket);
      (GRNAutoTicketingService.updateTicketStatus as jest.Mock).mockResolvedValue(mockResult);

      await GRNTicketingController.updateTicketStatus(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(GRNAutoTicketingService.updateTicketStatus).toHaveBeenCalledWith(
        'ticket-123',
        'RESOLVED',
        'test-user-id',
        'Issue resolved, vendor will send replacement'
      );

      expect(ResponseHelper.success).toHaveBeenCalled();
    });

    it('should return error if ticket not found', async () => {
      mockRequest.params = { ticketId: 'non-existent-ticket' };
      mockRequest.body = { status: 'RESOLVED' };

      (prisma.ticket.findUnique as jest.Mock).mockResolvedValue(null);

      await GRNTicketingController.updateTicketStatus(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(ResponseHelper.notFound).toHaveBeenCalledWith(
        mockResponse,
        'Ticket not found'
      );
    });

    it('should handle validation errors for invalid status', async () => {
      mockRequest.params = { ticketId: 'ticket-123' };
      mockRequest.body = {
        status: 'INVALID_STATUS', // Invalid enum value
      };

      await GRNTicketingController.updateTicketStatus(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(ResponseHelper.validationError).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      mockRequest.body = {
        goodsReceiptNoteId: 'grn-123',
        grnNumber: 'GRN-2025-001',
        dispatchId: 'dispatch-123',
        mismatches: [],
      };

      const dbError = new Error('Database connection failed');
      (prisma.goodsReceiptNote.findUnique as jest.Mock).mockRejectedValue(dbError);

      await GRNTicketingController.processGRNVerification(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(ResponseHelper.internalError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to process GRN verification'
      );
    });

    it('should handle service errors during ticket creation', async () => {
      mockRequest.body = {
        goodsReceiptNoteId: 'grn-123',
        grnNumber: 'GRN-2025-001',
        dispatchId: 'dispatch-123',
        mismatches: [
          {
            grnItemId: 'item-1',
            assignedOrderItemId: 'assigned-1',
            assignedQuantity: 10,
            confirmedQuantity: 10,
            receivedQuantity: 8,
            discrepancyQuantity: -2,
            status: 'QUANTITY_MISMATCH',
            itemRemarks: '',
            damageReported: false,
          },
        ],
      };

      const mockGRN = {
        id: 'grn-123',
        status: 'PENDING_VERIFICATION',
        dispatch: { vendor: { id: 'vendor-1' } },
      };

      (prisma.goodsReceiptNote.findUnique as jest.Mock).mockResolvedValue(mockGRN);
      (GRNAutoTicketingService.processGRNVerification as jest.Mock).mockResolvedValue({
        success: false,
        message: 'Failed to create ticket',
      });

      await GRNTicketingController.processGRNVerification(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(ResponseHelper.internalError).toHaveBeenCalledWith(
        mockResponse,
        'Failed to create ticket'
      );
    });
  });
});

