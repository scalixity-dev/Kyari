import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { jwtService } from '../auth/jwt.service';
import { TicketChatService, MessageType } from './ticket-chat.service';
import { logger } from '../../utils/logger';
import { prisma } from '../../config/database';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userRoles?: string[];
}

interface ChatMessagePayload {
  ticketId: string;
  message: string;
  messageType?: MessageType;
  attachments?: Array<{
    fileName: string;
    url: string;
    s3Key: string;
    mimeType: string;
    fileSize: number;
  }>;
}

export class TicketChatGateway {
  private io: SocketIOServer;
  private connectedUsers: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds
  private ticketRooms: Map<string, Set<string>> = new Map(); // ticketId -> Set of userIds

  constructor(httpServer: HTTPServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
        methods: ['GET', 'POST'],
        credentials: true,
      },
      transports: ['websocket', 'polling'],
    });

    this.setupMiddleware();
    this.setupEventHandlers();
    logger.info('📡 Ticket Chat WebSocket Gateway initialized');
  }

  /**
   * Socket.IO authentication middleware
   */
  private setupMiddleware() {
    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
        
        if (!token) {
          logger.warn('WebSocket connection rejected: No token provided', {
            socketId: socket.id,
            ip: socket.handshake.address,
          });
          return next(new Error('Authentication token required'));
        }

        try {
          const payload = await jwtService.verifyAccessToken(token);
          
          // Attach user info to socket
          socket.userId = payload.userId;
          socket.userRoles = payload.roles || [];

          // Store user connection
          if (!this.connectedUsers.has(payload.userId)) {
            this.connectedUsers.set(payload.userId, new Set());
          }
          this.connectedUsers.get(payload.userId)!.add(socket.id);

          logger.info('WebSocket connection authenticated', {
            userId: payload.userId,
            socketId: socket.id,
          });

          next();
        } catch (error) {
          logger.warn('WebSocket authentication failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            socketId: socket.id,
          });
          return next(new Error('Invalid or expired token'));
        }
      } catch (error) {
        logger.error('WebSocket middleware error', { error });
        return next(new Error('Authentication failed'));
      }
    });
  }

  /**
   * Setup Socket.IO event handlers
   */
  private setupEventHandlers() {
    this.io.on('connection', async (socket: AuthenticatedSocket) => {
      const userId = socket.userId!;
      logger.info('Client connected', { userId, socketId: socket.id });

      // Join user's personal room for direct notifications
      socket.join(`user:${userId}`);

      // Handle joining a ticket chat room
      socket.on('join_ticket', async (data: { ticketId: string }) => {
        await this.handleJoinTicket(socket, data.ticketId);
      });

      // Handle leaving a ticket chat room
      socket.on('leave_ticket', async (data: { ticketId: string }) => {
        await this.handleLeaveTicket(socket, data.ticketId);
      });

      // Handle sending a message
      socket.on('send_message', async (payload: ChatMessagePayload, callback) => {
        await this.handleSendMessage(socket, payload, callback);
      });

      // Handle typing indicator
      socket.on('typing_start', async (data: { ticketId: string }) => {
        await this.handleTyping(socket, data.ticketId, true);
      });

      socket.on('typing_stop', async (data: { ticketId: string }) => {
        await this.handleTyping(socket, data.ticketId, false);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });

      // Send connection confirmation
      socket.emit('connected', {
        userId,
        message: 'Connected to ticket chat server',
      });
    });
  }

  /**
   * Handle joining a ticket chat room
   */
  private async handleJoinTicket(socket: AuthenticatedSocket, ticketId: string) {
    try {
      const userId = socket.userId!;

      // Check if user has access to this ticket
      const hasAccess = await TicketChatService.checkChatAccess({
        ticketId,
        userId,
      });

      if (!hasAccess) {
        socket.emit('error', {
          type: 'ACCESS_DENIED',
          message: 'You do not have access to this ticket',
        });
        logger.warn('Access denied for ticket room', { userId, ticketId });
        return;
      }

      // Join the ticket room
      const roomName = `ticket:${ticketId}`;
      await socket.join(roomName);

      // Track users in ticket room
      if (!this.ticketRooms.has(ticketId)) {
        this.ticketRooms.set(ticketId, new Set());
      }
      this.ticketRooms.get(ticketId)!.add(userId);

      // Notify others in the room that user joined
      socket.to(roomName).emit('user_joined', {
        userId,
        ticketId,
        timestamp: new Date().toISOString(),
      });

      logger.info('User joined ticket room', { userId, ticketId, socketId: socket.id });

      // Send confirmation
      socket.emit('joined_ticket', {
        ticketId,
        message: 'Successfully joined ticket chat',
      });

      // Send recent messages (last 50)
      const messages = await TicketChatService.getChatMessages(ticketId, 1, 50);
      socket.emit('messages_history', messages);
    } catch (error) {
      logger.error('Error joining ticket room', { error, ticketId, userId: socket.userId });
      socket.emit('error', {
        type: 'JOIN_ERROR',
        message: 'Failed to join ticket chat',
      });
    }
  }

  /**
   * Handle leaving a ticket chat room
   */
  private async handleLeaveTicket(socket: AuthenticatedSocket, ticketId: string) {
    try {
      const userId = socket.userId!;
      const roomName = `ticket:${ticketId}`;

      await socket.leave(roomName);

      // Remove user from tracking
      if (this.ticketRooms.has(ticketId)) {
        this.ticketRooms.get(ticketId)!.delete(userId);
        if (this.ticketRooms.get(ticketId)!.size === 0) {
          this.ticketRooms.delete(ticketId);
        }
      }

      // Notify others in the room
      socket.to(roomName).emit('user_left', {
        userId,
        ticketId,
        timestamp: new Date().toISOString(),
      });

      logger.info('User left ticket room', { userId, ticketId });

      socket.emit('left_ticket', {
        ticketId,
        message: 'Left ticket chat',
      });
    } catch (error) {
      logger.error('Error leaving ticket room', { error, ticketId });
    }
  }

  /**
   * Handle sending a message
   */
  private async handleSendMessage(
    socket: AuthenticatedSocket,
    payload: ChatMessagePayload,
    callback?: (response: { success: boolean; error?: string }) => void
  ) {
    try {
      const userId = socket.userId!;
      const { ticketId, message, messageType, attachments } = payload;

      if (!message && (!attachments || attachments.length === 0)) {
        const error = 'Message or attachment is required';
        socket.emit('error', { type: 'VALIDATION_ERROR', message: error });
        callback?.({ success: false, error });
        return;
      }

      // Check if user has access
      const hasAccess = await TicketChatService.checkChatAccess({
        ticketId,
        userId,
      });

      if (!hasAccess) {
        const error = 'Access denied to this ticket';
        socket.emit('error', { type: 'ACCESS_DENIED', message: error });
        callback?.({ success: false, error });
        return;
      }

      // Check if user is in the room
      const roomName = `ticket:${ticketId}`;
      const isInRoom = socket.rooms.has(roomName);
      
      if (!isInRoom) {
        // Auto-join the room
        await this.handleJoinTicket(socket, ticketId);
      }

      // Save message to database
      const chatMessage = await TicketChatService.sendChatMessage({
        ticketId,
        senderId: userId,
        message: message || undefined,
        attachments: attachments || undefined,
        messageType: messageType ?? MessageType.TEXT,
      });

      // Broadcast message to all users in the ticket room
      this.io.to(roomName).emit('new_message', {
        message: {
          ...chatMessage,
          sender: {
            ...chatMessage.sender,
            role: chatMessage.sender.roles?.[0]?.role?.name || 'USER',
            companyName: chatMessage.sender.vendorProfile?.companyName,
          },
        },
        ticketId,
        timestamp: new Date().toISOString(),
      });

      logger.info('Message sent via WebSocket', {
        messageId: chatMessage.id,
        ticketId,
        userId,
      });

      callback?.({ success: true });
    } catch (error) {
      logger.error('Error sending message', {
        error: error instanceof Error ? error.message : 'Unknown error',
        ticketId: payload.ticketId,
        userId: socket.userId,
      });

      const errorMessage = 'Failed to send message';
      socket.emit('error', {
        type: 'SEND_ERROR',
        message: errorMessage,
      });
      callback?.({ success: false, error: errorMessage });
    }
  }

  /**
   * Handle typing indicators
   */
  private async handleTyping(
    socket: AuthenticatedSocket,
    ticketId: string,
    isTyping: boolean
  ) {
    try {
      const userId = socket.userId!;
      const roomName = `ticket:${ticketId}`;

      // Check access
      const hasAccess = await TicketChatService.checkChatAccess({
        ticketId,
        userId,
      });

      if (!hasAccess) {
        return;
      }

      // Get user info for typing indicator
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          vendorProfile: {
            select: {
              companyName: true,
            },
          },
        },
      });

      if (!user) {
        return;
      }

      // Broadcast typing indicator to others in the room
      socket.to(roomName).emit(isTyping ? 'user_typing' : 'user_stopped_typing', {
        userId,
        userName: user.name,
        ticketId,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      logger.error('Error handling typing indicator', { error, ticketId });
    }
  }

  /**
   * Handle client disconnection
   */
  private handleDisconnect(socket: AuthenticatedSocket) {
    const userId = socket.userId;
    
    if (userId) {
      // Remove socket from user's connected sockets
      const userSockets = this.connectedUsers.get(userId);
      if (userSockets) {
        userSockets.delete(socket.id);
        if (userSockets.size === 0) {
          this.connectedUsers.delete(userId);
        }
      }

      // Remove user from all ticket rooms
      for (const [ticketId, users] of this.ticketRooms.entries()) {
        if (users.has(userId)) {
          users.delete(userId);
          const roomName = `ticket:${ticketId}`;
          socket.to(roomName).emit('user_left', {
            userId,
            ticketId,
            timestamp: new Date().toISOString(),
          });

          if (users.size === 0) {
            this.ticketRooms.delete(ticketId);
          }
        }
      }

      logger.info('Client disconnected', { userId, socketId: socket.id });
    }
  }

  /**
   * Get active users in a ticket room
   */
  public getActiveUsersInTicket(ticketId: string): string[] {
    return Array.from(this.ticketRooms.get(ticketId) || []);
  }

  /**
   * Check if user is connected
   */
  public isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId) && this.connectedUsers.get(userId)!.size > 0;
  }

  /**
   * Get Socket.IO server instance
   */
  public getIO(): SocketIOServer {
    return this.io;
  }
}

