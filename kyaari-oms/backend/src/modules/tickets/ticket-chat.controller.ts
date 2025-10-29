import { Request, Response } from 'express';
import { z } from 'zod';
import multer from 'multer';
import { TicketChatService } from './ticket-chat.service';
import { logger } from '../../utils/logger';
import s3Service from '../../services/s3.service';

// Multer configuration for chat file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'application/pdf',
      'image/jpeg',
      'image/png', 
      'image/jpg',
      'image/gif',
      'image/webp',
      'text/plain',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, and documents are allowed.'));
    }
  },
});

const sendMessageSchema = z.object({
  message: z.string().min(1, 'Message cannot be empty').max(5000, 'Message too long'),
  messageType: z.enum(['TEXT', 'FILE', 'IMAGE', 'SYSTEM']).optional(),
});

const paginationSchema = z.object({
  page: z.coerce.number().min(1).optional().default(1),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
});

export class TicketChatController {
  /**
   * GET /api/tickets/:ticketId/chat
   * Fetch chat messages for a ticket
   */
  static async getChatMessages(req: Request, res: Response) {
    try {
      const { ticketId } = req.params;
      const userId = req.user?.userId as string;

      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          error: 'User authentication required' 
        });
      }

      // Validate pagination parameters
      const parse = paginationSchema.safeParse(req.query);
      if (!parse.success) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid query parameters', 
          details: parse.error.errors 
        });
      }

      const { page, limit } = parse.data;

      // Check if user has access to this ticket's chat
      const hasAccess = await TicketChatService.checkChatAccess({ 
        ticketId, 
        userId 
      });

      if (!hasAccess) {
        return res.status(403).json({ 
          success: false, 
          error: 'Access denied. You are not authorized to view this ticket chat.' 
        });
      }

      // Get chat messages
      const chatData = await TicketChatService.getChatMessages(ticketId, page, limit);
      
      // Get ticket participants for context
      const participantsData = await TicketChatService.getTicketParticipants(ticketId);

      return res.json({ 
        success: true, 
        data: {
          ...chatData,
          ticket: participantsData.ticket,
          participants: participantsData.participants
        }
      });
    } catch (error: any) {
      logger.error('Failed to fetch chat messages', { 
        error: error.message, 
        ticketId: req.params.ticketId,
        userId: req.user?.userId 
      });
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch chat messages' 
      });
    }
  }

  /**
   * POST /api/tickets/:ticketId/chat
   * Send a new chat message
   */
  static async sendChatMessage(req: Request, res: Response) {
    try {
      const { ticketId } = req.params;
      const userId = req.user?.userId as string;

      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          error: 'User authentication required' 
        });
      }

      // Validate message data
      const parse = sendMessageSchema.safeParse(req.body);
      if (!parse.success) {
        return res.status(400).json({ 
          success: false, 
          error: 'Invalid message data', 
          details: parse.error.errors 
        });
      }

      const { message, messageType } = parse.data;

      // Check if user has access to this ticket's chat
      const hasAccess = await TicketChatService.checkChatAccess({ 
        ticketId, 
        userId 
      });

      if (!hasAccess) {
        return res.status(403).json({ 
          success: false, 
          error: 'Access denied. You are not authorized to send messages to this ticket.' 
        });
      }

      // Send the message
      const chatMessage = await TicketChatService.sendChatMessage({
        ticketId,
        senderId: userId,
        message,
        messageType: messageType as any
      });

      return res.status(201).json({ 
        success: true, 
        data: { message: chatMessage }
      });
    } catch (error: any) {
      logger.error('Failed to send chat message', { 
        error: error.message, 
        ticketId: req.params.ticketId,
        userId: req.user?.userId 
      });
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to send message' 
      });
    }
  }

  /**
   * GET /api/tickets/:ticketId/chat/participants
   * Get ticket participants for chat context
   */
  static async getParticipants(req: Request, res: Response) {
    try {
      const { ticketId } = req.params;
      const userId = req.user?.userId as string;

      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          error: 'User authentication required' 
        });
      }

      // Check if user has access to this ticket
      const hasAccess = await TicketChatService.checkChatAccess({ 
        ticketId, 
        userId 
      });

      if (!hasAccess) {
        return res.status(403).json({ 
          success: false, 
          error: 'Access denied' 
        });
      }

      // Get participants
      const participantsData = await TicketChatService.getTicketParticipants(ticketId);

      return res.json({ 
        success: true, 
        data: participantsData
      });
    } catch (error: any) {
      logger.error('Failed to fetch ticket participants', { 
        error: error.message, 
        ticketId: req.params.ticketId,
        userId: req.user?.userId 
      });
      return res.status(500).json({ 
        success: false, 
        error: 'Failed to fetch participants' 
      });
    }
  }

  /**
   * POST /api/tickets/:ticketId/chat/upload
   * Upload file and send as chat message
   */
  static uploadFile = [
    upload.single('file'),
    async (req: Request, res: Response) => {
      try {
        const { ticketId } = req.params;
        const userId = req.user?.userId as string;

        if (!userId) {
          return res.status(401).json({ 
            success: false, 
            error: 'User authentication required' 
          });
        }

        if (!req.file) {
          return res.status(400).json({ 
            success: false, 
            error: 'No file uploaded' 
          });
        }

        // Check if user has access to this ticket's chat
        const hasAccess = await TicketChatService.checkChatAccess({ 
          ticketId, 
          userId 
        });

        if (!hasAccess) {
          return res.status(403).json({ 
            success: false, 
            error: 'Access denied. You are not authorized to send files to this ticket.' 
          });
        }

        // Upload file to S3
        const fileName = `ticket-chat-${ticketId}-${Date.now()}-${req.file.originalname}`;
        const folder = 'ticket-chat-attachments';

        const uploadResult = await s3Service.uploadBuffer(
          req.file.buffer,
          fileName,
          req.file.mimetype,
          folder
        );

        // Determine message type based on file mime type
        let messageType: 'FILE' | 'IMAGE' = 'FILE';
        if (req.file.mimetype.startsWith('image/')) {
          messageType = 'IMAGE';
        }

        // Create chat message with file attachment
        const attachmentData = {
          fileName: req.file.originalname,
          url: uploadResult.url,
          s3Key: uploadResult.key,
          mimeType: req.file.mimetype,
          fileSize: req.file.size,
          uploadedBy: userId,
          uploadedAt: new Date().toISOString()
        };

        const chatMessage = await TicketChatService.sendChatMessage({
          ticketId,
          senderId: userId,
          message: req.body.message || `Uploaded file: ${req.file.originalname}`,
          attachments: [attachmentData],
          messageType: messageType as any
        });

        logger.info('Chat file uploaded', {
          ticketId,
          messageId: chatMessage.id,
          fileName: req.file.originalname,
          userId
        });

        return res.status(201).json({ 
          success: true, 
          data: { 
            message: chatMessage,
            attachment: attachmentData 
          }
        });
      } catch (error: any) {
        logger.error('Failed to upload chat file', { 
          error: error.message, 
          ticketId: req.params.ticketId,
          userId: req.user?.userId 
        });
        return res.status(500).json({ 
          success: false, 
          error: 'Failed to upload file' 
        });
      }
    }
  ];
}