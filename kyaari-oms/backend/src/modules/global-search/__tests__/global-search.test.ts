import { Request, Response } from 'express';
import { GlobalSearchController } from '../global-search.controller';
import { GlobalSearchService } from '../global-search.service';

// Mock the dependencies
jest.mock('../global-search.service');
jest.mock('../../utils/logger');

const mockRequest = (user: any, body?: any, query?: any) => ({
  user,
  body: body || {},
  query: query || {}
}) as Request;

const mockResponse = () => {
  const res = {} as Response;
  res.status = jest.fn().mockReturnValue(res);
  res.json = jest.fn().mockReturnValue(res);
  return res;
};

describe('GlobalSearchController', () => {
  let mockRes: Response;

  beforeEach(() => {
    mockRes = mockResponse();
    jest.clearAllMocks();
  });

  describe('search', () => {
    it('should perform search successfully for authenticated user', async () => {
      const mockUser = {
        userId: 'user123',
        roles: ['ADMIN']
      };

      const mockReq = mockRequest(mockUser, {
        query: 'test search',
        entityTypes: ['orders'],
        page: 1,
        limit: 20
      });

      const mockSearchResults = {
        results: [
          {
            type: 'orders',
            id: 'order123',
            title: 'Test Order',
            description: 'Test order description',
            metadata: { status: 'PROCESSING' },
            relevanceScore: 85
          }
        ],
        total: 1,
        page: 1,
        limit: 20,
        entityTypes: ['orders']
      };

      (GlobalSearchService.search as jest.Mock).mockResolvedValue(mockSearchResults);

      await GlobalSearchController.search(mockReq, mockRes);

      expect(GlobalSearchService.search).toHaveBeenCalledWith(
        {
          query: 'test search',
          entityTypes: ['orders'],
          page: 1,
          limit: 20
        },
        ['ADMIN'],
        'user123'
      );

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: mockSearchResults,
        message: 'Found 1 results for "test search"'
      });
    });

    it('should return 401 for unauthenticated request', async () => {
      const mockReq = mockRequest(null);

      await GlobalSearchController.search(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required'
      });
    });

    it('should handle search errors gracefully', async () => {
      const mockUser = {
        userId: 'user123',
        roles: ['ADMIN']
      };

      const mockReq = mockRequest(mockUser, {
        query: 'test search'
      });

      (GlobalSearchService.search as jest.Mock).mockRejectedValue(new Error('Database error'));

      await GlobalSearchController.search(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Search failed. Please try again.'
      });
    });
  });

  describe('getAvailableEntityTypes', () => {
    it('should return available entity types for authenticated user', async () => {
      const mockUser = {
        userId: 'user123',
        roles: ['VENDOR']
      };

      const mockReq = mockRequest(mockUser);

      (GlobalSearchService.getAvailableEntityTypes as jest.Mock).mockReturnValue(['orders', 'tickets']);

      await GlobalSearchController.getAvailableEntityTypes(mockReq, mockRes);

      expect(GlobalSearchService.getAvailableEntityTypes).toHaveBeenCalledWith(['VENDOR']);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          entityTypes: ['orders', 'tickets']
        },
        message: 'Available entity types for your role(s): orders, tickets'
      });
    });

    it('should return 401 for unauthenticated request', async () => {
      const mockReq = mockRequest(null);

      await GlobalSearchController.getAvailableEntityTypes(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith({
        success: false,
        error: 'Authentication required'
      });
    });
  });

  describe('healthCheck', () => {
    it('should return health status', async () => {
      const mockReq = mockRequest(null);

      await GlobalSearchController.healthCheck(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        data: {
          service: 'Global Search Service',
          status: 'healthy',
          timestamp: expect.any(String),
          version: '1.0.0'
        },
        message: 'Global search service is operational'
      });
    });
  });
});
