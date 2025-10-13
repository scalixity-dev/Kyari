import { Request, Response } from 'express';
import multer from 'multer';
import { ResponseHelper } from '../../utils/response';
import { logger } from '../../utils/logger';
import s3Service from '../../services/s3.service';
import { invoiceService } from './invoice.service';
import { prisma } from '../../config/database';
import { z } from 'zod';
import { notificationService } from '../notifications/notification.service';

// Validation helper function
export const validateSchema = <T>(schema: z.ZodType<T, any, any>, data: unknown): { success: true; data: T } | { success: false; errors: Record<string, string[]> } => {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors: Record<string, string[]> = {};
      error.errors.forEach((err) => {
        const path = err.path.join('.');
        if (!errors[path]) {
          errors[path] = [];
        }
        errors[path].push(err.message);
      });
      return { success: false, errors };
    }
    throw error;
  }
};

// Upload validation schemas
const uploadFileSchema = z.object({
  invoiceType: z.enum(['VENDOR_UPLOAD', 'ACCOUNTS_UPLOAD']),
  invoiceId: z.string().optional(),
  notes: z.string().optional(),
});

const uploadAndLinkSchema = z.object({
  invoiceType: z.enum(['VENDOR_UPLOAD', 'ACCOUNTS_UPLOAD']),
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  purchaseOrderId: z.string().min(1, 'Purchase order ID is required'),
  notes: z.string().optional(),
});

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept PDF, images, and common document formats
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, images, and document files are allowed.'));
    }
  }
});

// Helper function to get vendor profile for authenticated user
async function getVendorProfile(userId: string) {
  return await prisma.vendorProfile.findFirst({
    where: { userId }
  });
}

export class InvoiceUploadController {
  /**
   * Upload invoice file to existing invoice record
   * POST /api/invoices/:invoiceId/upload
   */
  static uploadInvoiceFile = [
    upload.single('invoice'),
    async (req: Request, res: Response) => {
      try {
        const { invoiceId } = req.params;
        
        // Validate request body
        const validation = validateSchema(uploadFileSchema, req.body);
        if (!validation.success) {
          return ResponseHelper.validationError(res, validation.errors);
        }

        const { invoiceType, notes } = validation.data;

        // Check if file was uploaded
        if (!req.file) {
          return ResponseHelper.error(res, 'No file uploaded', 400);
        }

        // Check user role authorization
        const userRole = req.user?.roles?.[0]; // roles is array of strings
        if (!userRole || !['VENDOR', 'ACCOUNTS'].includes(userRole)) {
          return ResponseHelper.forbidden(res, 'Access denied. Only vendors and accounts team can upload invoices.');
        }

        // Verify invoice exists
        const existingInvoice = await prisma.vendorInvoice.findUnique({
          where: { id: invoiceId },
          include: {
            purchaseOrder: {
              include: {
                vendor: true
              }
            }
          }
        });

        if (!existingInvoice) {
          return ResponseHelper.notFound(res, 'Invoice not found');
        }

        // For vendor uploads, ensure they can only upload for their own invoices
        if (invoiceType === 'VENDOR_UPLOAD' && userRole === 'VENDOR') {
          const vendorProfile = await getVendorProfile(req.user!.userId);
          if (!vendorProfile || existingInvoice.purchaseOrder?.vendor?.id !== vendorProfile.id) {
            return ResponseHelper.forbidden(res, 'You can only upload invoices for your own orders');
          }
        }

        // Upload file to S3
        const fileName = `invoice-${invoiceId}-${Date.now()}-${req.file.originalname}`;
        const folder = invoiceType === 'VENDOR_UPLOAD' ? 'vendor-invoices' : 'accounts-invoices';
        
        const uploadResult = await s3Service.uploadBuffer(
          req.file.buffer,
          fileName,
          req.file.mimetype,
          folder
        );

        // Create attachment record
        const attachment = await prisma.attachment.create({
          data: {
            fileName: req.file.originalname,
            originalName: req.file.originalname,
            fileType: req.file.mimetype,
            mimeType: req.file.mimetype,
            fileSize: req.file.size,
            s3Key: uploadResult.key,
            s3Url: uploadResult.url,
            uploadedBy: req.user?.userId || 'unknown'
          }
        });

        // Update invoice with attachment
        await prisma.vendorInvoice.update({
          where: { id: invoiceId },
          data: {
            attachmentId: attachment.id,
            updatedAt: new Date()
          }
        });

        // Create upload log/audit entry
        await prisma.auditLog.create({
          data: {
            actorUserId: req.user?.userId || 'unknown',
            action: `INVOICE_${invoiceType}`,
            entityType: 'VendorInvoice',
            entityId: invoiceId,
            metadata: {
              attachmentId: attachment.id,
              uploadType: invoiceType,
              fileName: uploadResult.fileName,
              notes
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
          }
        });

        logger.info('Invoice file uploaded successfully', {
          invoiceId,
          attachmentId: attachment.id,
          uploadType: invoiceType,
          userId: req.user?.userId
        });

        // Send notification for vendor invoice uploads
        if (invoiceType === 'VENDOR_UPLOAD') {
          try {
            await notificationService.sendNotificationToRole(
              ['ADMIN', 'ACCOUNTS'],
              {
                title: 'Vendor Invoice Uploaded',
                body: `${existingInvoice.purchaseOrder?.vendor?.companyName || 'Vendor'} has uploaded invoice ${existingInvoice.invoiceNumber}`,
                priority: 'NORMAL' as const,
                data: {
                  type: 'VENDOR_INVOICE_UPLOADED',
                  invoiceId: existingInvoice.id,
                  invoiceNumber: existingInvoice.invoiceNumber,
                  vendorName: existingInvoice.purchaseOrder?.vendor?.companyName || 'Unknown',
                  purchaseOrderId: existingInvoice.purchaseOrderId || '',
                  uploadedBy: req.user?.userId || 'unknown',
                  deepLink: `/admin/invoices/${existingInvoice.id}/review`
                }
              }
            );
          } catch (notificationError) {
            // Don't fail the upload if notification fails
            logger.warn('Failed to send vendor invoice upload notification', { 
              notificationError, 
              invoiceId, 
              uploadType: invoiceType 
            });
          }
        }

        return ResponseHelper.success(res, {
          attachment: {
            id: attachment.id,
            fileName: attachment.fileName,
            fileSize: attachment.fileSize,
            uploadedAt: attachment.createdAt
          },
          invoice: {
            id: existingInvoice.id,
            invoiceNumber: existingInvoice.invoiceNumber,
            status: existingInvoice.status
          }
        }, 'Invoice file uploaded successfully');

      } catch (error) {
        logger.error('Invoice file upload failed', { error, invoiceId: req.params.invoiceId });
        return ResponseHelper.internalError(res, 'Failed to upload invoice file');
      }
    }
  ];

  /**
   * Upload invoice file and link to purchase order (create new invoice record)
   * POST /api/invoices/upload-and-link
   */
  static uploadAndLinkInvoice = [
    upload.single('invoice'),
    async (req: Request, res: Response) => {
      try {
        // Validate request body
        const validation = validateSchema(uploadAndLinkSchema, req.body);
        if (!validation.success) {
          return ResponseHelper.validationError(res, validation.errors);
        }

        const { invoiceType, invoiceNumber, purchaseOrderId, notes } = validation.data;

        // Check if file was uploaded
        if (!req.file) {
          return ResponseHelper.error(res, 'No file uploaded', 400);
        }

        // Role-based access control
        const userRole = req.user?.roles?.[0]; // roles is array of strings
        let folder = '';
        
        if (invoiceType === 'VENDOR_UPLOAD') {
          if (userRole !== 'VENDOR') {
            return ResponseHelper.forbidden(res, 'Only vendors can upload vendor invoices');
          }
          
          // Ensure vendor can only upload for their own POs
          const purchaseOrder = await prisma.purchaseOrder.findUnique({
            where: { id: purchaseOrderId },
            include: { vendor: true }
          });

          if (!purchaseOrder) {
            return ResponseHelper.error(res, 'Purchase order not found', 400);
          }

          const vendorProfile = await getVendorProfile(req.user!.userId);
          if (!vendorProfile || purchaseOrder.vendor?.id !== vendorProfile.id) {
            return ResponseHelper.forbidden(res, 'You can only upload invoices for your own orders');
          }
          
          folder = 'vendor-invoices';
        } else if (invoiceType === 'ACCOUNTS_UPLOAD') {
          if (userRole !== 'ACCOUNTS') {
            return ResponseHelper.forbidden(res, 'Only accounts team can upload accounts invoices');
          }
          folder = 'accounts-invoices';
        }

        // Upload file to S3 first
        const fileName = `invoice-${purchaseOrderId}-${Date.now()}-${req.file.originalname}`;
        
        const uploadResult = await s3Service.uploadBuffer(
          req.file.buffer,
          fileName,
          req.file.mimetype,
          folder
        );

        // Create attachment record
        const attachment = await prisma.attachment.create({
          data: {
            fileName: req.file.originalname,
            originalName: req.file.originalname,
            fileType: req.file.mimetype,
            mimeType: req.file.mimetype,
            fileSize: req.file.size,
            s3Key: uploadResult.key,
            s3Url: uploadResult.url,
            uploadedBy: req.user?.userId || 'unknown'
          }
        });

        // Create invoice record directly 
        const newInvoice = await prisma.vendorInvoice.create({
          data: {
            purchaseOrderId,
            invoiceNumber: invoiceNumber,
            invoiceDate: new Date(),
            invoiceAmount: 0, // Will be updated when verified
            attachmentId: attachment.id,
            status: 'PENDING_VERIFICATION'
          }
        });

        // Create audit log entry
        await prisma.auditLog.create({
          data: {
            actorUserId: req.user?.userId || 'unknown',
            action: `INVOICE_LINK_${invoiceType}`,
            entityType: 'VendorInvoice',
            entityId: newInvoice.id,
            metadata: {
              attachmentId: attachment.id,
              uploadType: invoiceType,
              fileName: uploadResult.fileName,
              purchaseOrderId,
              vendorInvoiceNumber: invoiceNumber,
              notes
            },
            ipAddress: req.ip,
            userAgent: req.get('User-Agent')
          }
        });

        logger.info('Invoice uploaded and linked successfully', {
          invoiceId: newInvoice.id,
          purchaseOrderId,
          uploadType: invoiceType,
          userId: req.user?.userId
        });

        // Send notification for vendor invoice uploads
        if (invoiceType === 'VENDOR_UPLOAD') {
          try {
            // Get vendor information for notification
            const purchaseOrder = await prisma.purchaseOrder.findUnique({
              where: { id: purchaseOrderId },
              include: { vendor: true }
            });

            await notificationService.sendNotificationToRole(
              ['ADMIN', 'ACCOUNTS'],
              {
                title: 'New Vendor Invoice Submitted',
                body: `${purchaseOrder?.vendor?.companyName || 'Vendor'} has submitted a new invoice ${invoiceNumber}`,
                priority: 'NORMAL' as const,
                data: {
                  type: 'VENDOR_INVOICE_SUBMITTED',
                  invoiceId: newInvoice.id,
                  invoiceNumber: newInvoice.invoiceNumber,
                  vendorName: purchaseOrder?.vendor?.companyName || 'Unknown',
                  purchaseOrderId,
                  uploadedBy: req.user?.userId || 'unknown',
                  deepLink: `/admin/invoices/${newInvoice.id}/review`
                }
              }
            );
          } catch (notificationError) {
            // Don't fail the upload if notification fails
            logger.warn('Failed to send vendor invoice submission notification', { 
              notificationError, 
              invoiceId: newInvoice.id, 
              uploadType: invoiceType 
            });
          }
        }

        return ResponseHelper.success(res, {
          invoice: {
            id: newInvoice.id,
            invoiceNumber: newInvoice.invoiceNumber,
            purchaseOrderId: newInvoice.purchaseOrderId,
            status: newInvoice.status
          },
          attachment: {
            id: attachment.id,
            fileName: attachment.fileName,
            fileSize: attachment.fileSize,
            uploadedAt: attachment.createdAt
          }
        }, 'Invoice uploaded and linked successfully');

      } catch (error) {
        logger.error('Invoice upload and link failed', { error, body: req.body });
        return ResponseHelper.internalError(res, 'Failed to upload and link invoice');
      }
    }
  ];

  /**
   * Get uploaded invoices for a user based on their role
   * GET /api/invoices/uploads
   */
  static getUploadedInvoices = async (req: Request, res: Response) => {
    try {
      const userRole = req.user?.roles?.[0];
      const { page = 1, limit = 20, status, purchaseOrderId } = req.query;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);
      const offset = (pageNum - 1) * limitNum;

      let whereClause: any = {};

      // Role-based filtering
      if (userRole === 'VENDOR') {
        // Vendors can only see their own uploaded invoices
        const vendorProfile = await getVendorProfile(req.user!.userId);
        if (vendorProfile) {
          whereClause.purchaseOrder = {
            vendor: {
              id: vendorProfile.id
            }
          };
        }
      }

      // Additional filters
      if (status) {
        whereClause.status = status;
      }

      if (purchaseOrderId) {
        whereClause.purchaseOrderId = purchaseOrderId;
      }

      const [invoices, total] = await Promise.all([
        prisma.vendorInvoice.findMany({
          where: whereClause,
          include: {
            purchaseOrder: {
              include: {
                vendor: true,
                items: {
                  include: {
                    assignedOrderItem: {
                      include: {
                        orderItem: true
                      }
                    }
                  }
                }
              }
            },
            attachment: true
          },
          orderBy: { createdAt: 'desc' },
          skip: offset,
          take: limitNum
        }),
        prisma.vendorInvoice.count({ where: whereClause })
      ]);

      return ResponseHelper.success(res, {
        invoices,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          totalItems: total,
          itemsPerPage: limitNum
        }
      }, 'Uploaded invoices retrieved successfully');

    } catch (error) {
      logger.error('Failed to get uploaded invoices', { error, userId: req.user?.userId });
      return ResponseHelper.internalError(res, 'Failed to retrieve uploaded invoices');
    }
  };
}