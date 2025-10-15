import { Request, Response } from 'express';
import multer from 'multer';
import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';
import { ResponseHelper } from '../../utils/response';
import s3Service from '../../services/s3.service';

// Multer configuration for ticket attachments
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/jpg',
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF and image files are allowed.'));
    }
  },
});

export class TicketAttachmentsController {
  static async list(req: Request, res: Response) {
    try {
      const { ticketId } = req.params;
      const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
      if (!ticket) {
        return ResponseHelper.notFound(res, 'Ticket not found');
      }

      const attachments = await prisma.attachment.findMany({
        where: { ticketId },
        orderBy: { createdAt: 'asc' },
      });

      const withUrls = await Promise.all(
        attachments.map(async (a) => ({
          id: a.id,
          fileName: a.fileName,
          fileType: a.mimeType || a.fileType,
          uploadedBy: a.uploadedBy || '',
          uploadedAt: a.createdAt,
          url: a.s3Key ? await s3Service.getPresignedUrl(a.s3Key) : a.s3Url,
        }))
      );

      return ResponseHelper.success(res, withUrls);
    } catch (error) {
      logger.error('Failed to list ticket attachments', { error, ticketId: req.params.ticketId });
      return ResponseHelper.internalError(res, 'Failed to fetch attachments');
    }
  }
  static upload = [
    upload.single('file'),
    async (req: Request, res: Response) => {
      try {
        const { ticketId } = req.params;

        // Verify ticket exists
        const ticket = await prisma.ticket.findUnique({ where: { id: ticketId } });
        if (!ticket) {
          return ResponseHelper.notFound(res, 'Ticket not found');
        }

        if (!req.file) {
          return ResponseHelper.error(res, 'No file uploaded', 400);
        }

        const fileName = `ticket-${ticketId}-${Date.now()}-${req.file.originalname}`;
        const folder = 'ticket-attachments';

        const uploadResult = await s3Service.uploadBuffer(
          req.file.buffer,
          fileName,
          req.file.mimetype,
          folder
        );

        const attachment = await prisma.attachment.create({
          data: {
            fileName: req.file.originalname,
            originalName: req.file.originalname,
            fileType: req.file.mimetype,
            mimeType: req.file.mimetype,
            fileSize: req.file.size,
            s3Key: uploadResult.key,
            s3Url: uploadResult.url,
            uploadedBy: req.user?.userId || 'unknown',
            ticketId,
          },
        });

        logger.info('Ticket attachment uploaded', {
          ticketId,
          attachmentId: attachment.id,
          userId: req.user?.userId,
        });

        return ResponseHelper.success(res, {
          attachment: {
            id: attachment.id,
            fileName: attachment.fileName,
            fileSize: attachment.fileSize,
            url: uploadResult.url,
          },
        }, 'Attachment uploaded successfully');
      } catch (error) {
        logger.error('Ticket attachment upload failed', { error, ticketId: req.params.ticketId });
        return ResponseHelper.internalError(res, 'Failed to upload attachment');
      }
    },
  ];
}


