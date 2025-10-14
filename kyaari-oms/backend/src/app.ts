import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { env } from './config/env';
import { authRoutes } from './modules/auth/auth.routes';
import { adminRoutes } from './modules/admin/admin.routes';
import { userRoutes } from './modules/users/user.routes';
import { vendorRoutes } from './modules/vendors/vendor.routes';
import { orderRoutes } from './modules/orders/order.routes';
import { assignmentRoutes } from './modules/assignments/assignment.routes';
import { workflowRoutes } from './modules/workflow/workflow.routes';
import { validationRoutes } from './modules/validation/validation.routes';
import { opsVerificationRoutes } from './modules/ops-verification/ops-verification.routes';
import receivedOrdersRoutes from './modules/ops-verification/received-orders.routes';
import { reportingRoutes } from './modules/reporting/reporting.routes';
import { notificationRoutes } from './modules/notifications/notification.routes';
import invoiceRoutes from './modules/invoices/invoice.routes';
import dispatchRoutes from './routes/dispatch.routes';
import grnRoutes from './routes/grn.routes';
import { errorHandler, notFoundHandler, rateLimiter } from './middlewares/error.middleware';
import { logger } from './utils/logger';

const app = express();

// Trust proxy (for accurate IP addresses behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
app.use(cors({
  origin: (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (env.CORS_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true, // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting (adjust as needed for your use case)
// More lenient in development, stricter in production
const rateLimit = env.NODE_ENV === 'production' 
  ? { max: 100, window: 15 * 60 * 1000 } // Production: 100 requests per 15 minutes
  : { max: 1000, window: 15 * 60 * 1000 }; // Development: 1000 requests per 15 minutes

app.use(rateLimiter(rateLimit.max, rateLimit.window));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Cookie parsing middleware
app.use(cookieParser());

// Request logging middleware
app.use((req, res, next) => {
  logger.info('Request received', {
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/users', userRoutes);
app.use('/api/vendors', vendorRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/workflow', workflowRoutes);
app.use('/api/validation', validationRoutes);
app.use('/api/ops-verification', opsVerificationRoutes);
app.use('/api/ops/received-orders', receivedOrdersRoutes);
app.use('/api/reporting', reportingRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/dispatches', dispatchRoutes);
app.use('/api/grn', grnRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

export { app };