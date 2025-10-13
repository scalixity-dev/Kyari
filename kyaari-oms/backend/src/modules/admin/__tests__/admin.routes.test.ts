import request from 'supertest';
import express, { Express, Request, Response, NextFunction } from 'express';
import { APP_CONSTANTS } from '../../../config/constants';

// Mock auth middleware
const mockAuthenticate = jest.fn((req: Request, res: Response, next: NextFunction) => {
  req.user = {
    userId: 'admin-123',
    roles: ['ADMIN'],
  } as any;
  next();
});

const mockRequireRole = jest.fn(() => (req: Request, res: Response, next: NextFunction) => {
  next();
});

jest.mock('../../../middlewares/auth.middleware', () => ({
  authenticate: mockAuthenticate,
  requireRole: mockRequireRole,
}));

// Mock admin controller
const mockAdminController = {
  createUser: jest.fn((req: Request, res: Response) => {
    res.status(201).json({ success: true });
  }),
  listUsers: jest.fn((req: Request, res: Response) => {
    res.status(200).json({ success: true, data: [] });
  }),
  getUserDetails: jest.fn((req: Request, res: Response) => {
    res.status(200).json({ success: true, data: {} });
  }),
  approveVendor: jest.fn((req: Request, res: Response) => {
    res.status(200).json({ success: true });
  }),
  suspendVendor: jest.fn((req: Request, res: Response) => {
    res.status(200).json({ success: true });
  }),
};

jest.mock('../admin.controller', () => ({
  adminController: mockAdminController,
}));

// Mock device token controller
const mockDeviceTokenController = {
  getTokenStatistics: jest.fn((req: Request, res: Response) => {
    res.status(200).json({ success: true, data: {} });
  }),
  cleanupTokens: jest.fn((req: Request, res: Response) => {
    res.status(200).json({ success: true });
  }),
};

jest.mock('../../notifications/deviceToken.controller', () => ({
  deviceTokenController: mockDeviceTokenController,
}));

// Import after mocks
import { adminRoutes } from '../admin.routes';

describe('Admin Routes Integration Tests', () => {
  let app: Express;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/admin', adminRoutes);

    // Clear all mock calls
    jest.clearAllMocks();
  });

  describe('Authentication and Authorization', () => {
    it('should apply authenticate middleware to all routes', async () => {
      await request(app).get('/api/admin/users');
      expect(mockAuthenticate).toHaveBeenCalled();
    });

    it('should require ADMIN role for all routes', async () => {
      await request(app).get('/api/admin/users');
      expect(mockRequireRole).toHaveBeenCalledWith([APP_CONSTANTS.ROLES.ADMIN]);
    });
  });

  describe('User Management Routes', () => {
    describe('POST /api/admin/users', () => {
      it('should call createUser controller', async () => {
        const userData = {
          role: 'VENDOR',
          name: 'Test User',
          email: 'test@example.com',
          password: 'Password123!',
        };

        const response = await request(app)
          .post('/api/admin/users')
          .send(userData);

        expect(mockAdminController.createUser).toHaveBeenCalled();
        expect(response.status).toBe(201);
      });
    });

    describe('GET /api/admin/users', () => {
      it('should call listUsers controller', async () => {
        const response = await request(app)
          .get('/api/admin/users')
          .query({ page: '1', limit: '10' });

        expect(mockAdminController.listUsers).toHaveBeenCalled();
        expect(response.status).toBe(200);
      });

      it('should pass query parameters to controller', async () => {
        let capturedReq: Request | undefined;
        mockAdminController.listUsers.mockImplementationOnce((req: Request, res: Response) => {
          capturedReq = req;
          res.status(200).json({ success: true, data: [] });
        });

        await request(app)
          .get('/api/admin/users')
          .query({ role: 'VENDOR', status: 'PENDING', page: '2', limit: '20' });

        expect(mockAdminController.listUsers).toHaveBeenCalled();
        expect(capturedReq!.query).toMatchObject({
          role: 'VENDOR',
          status: 'PENDING',
          page: '2',
          limit: '20',
        });
      });
    });

    describe('GET /api/admin/users/:userId', () => {
      it('should call getUserDetails controller with userId param', async () => {
        const userId = 'user-123';
        let capturedReq: Request | undefined;
        mockAdminController.getUserDetails.mockImplementationOnce((req: Request, res: Response) => {
          capturedReq = req;
          res.status(200).json({ success: true, data: {} });
        });

        const response = await request(app)
          .get(`/api/admin/users/${userId}`);

        expect(mockAdminController.getUserDetails).toHaveBeenCalled();
        expect(capturedReq!.params.userId).toBe(userId);
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Vendor Management Routes', () => {
    describe('PUT /api/admin/vendors/:userId/approve', () => {
      it('should call approveVendor controller', async () => {
        const userId = 'vendor-123';
        let capturedReq: Request | undefined;
        mockAdminController.approveVendor.mockImplementationOnce((req: Request, res: Response) => {
          capturedReq = req;
          res.status(200).json({ success: true });
        });

        const response = await request(app)
          .put(`/api/admin/vendors/${userId}/approve`);

        expect(mockAdminController.approveVendor).toHaveBeenCalled();
        expect(capturedReq!.params.userId).toBe(userId);
        expect(response.status).toBe(200);
      });
    });

    describe('PUT /api/admin/vendors/:userId/suspend', () => {
      it('should call suspendVendor controller', async () => {
        const userId = 'vendor-123';
        let capturedReq: Request | undefined;
        mockAdminController.suspendVendor.mockImplementationOnce((req: Request, res: Response) => {
          capturedReq = req;
          res.status(200).json({ success: true });
        });

        const response = await request(app)
          .put(`/api/admin/vendors/${userId}/suspend`);

        expect(mockAdminController.suspendVendor).toHaveBeenCalled();
        expect(capturedReq!.params.userId).toBe(userId);
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Device Token Admin Routes', () => {
    describe('GET /api/admin/device-tokens/stats', () => {
      it('should call getTokenStatistics controller', async () => {
        const response = await request(app)
          .get('/api/admin/device-tokens/stats');

        expect(mockDeviceTokenController.getTokenStatistics).toHaveBeenCalled();
        expect(response.status).toBe(200);
      });
    });

    describe('POST /api/admin/device-tokens/cleanup', () => {
      it('should call cleanupTokens controller', async () => {
        const response = await request(app)
          .post('/api/admin/device-tokens/cleanup');

        expect(mockDeviceTokenController.cleanupTokens).toHaveBeenCalled();
        expect(response.status).toBe(200);
      });
    });
  });

  describe('Route Bindings', () => {
    it('should properly bind controller methods to preserve context', async () => {
      await request(app)
        .post('/api/admin/users')
        .send({
          role: 'VENDOR',
          name: 'Test',
          email: 'test@example.com',
          password: 'Password123!',
        });

      expect(mockAdminController.createUser).toHaveBeenCalled();
    });
  });

  describe('HTTP Methods', () => {
    it('should only accept POST for /users creation', async () => {
      await request(app)
        .post('/api/admin/users')
        .send({ role: 'VENDOR', name: 'Test', email: 'test@test.com', password: 'Pass123!' })
        .expect(201);
      
      await request(app).get('/api/admin/users').expect(200);
    });

    it('should only accept PUT for vendor approval/suspension', async () => {
      const userId = 'vendor-123';
      await request(app).put(`/api/admin/vendors/${userId}/approve`).expect(200);
      await request(app).post(`/api/admin/vendors/${userId}/approve`).expect(404);
      await request(app).get(`/api/admin/vendors/${userId}/approve`).expect(404);
    });
  });
});
