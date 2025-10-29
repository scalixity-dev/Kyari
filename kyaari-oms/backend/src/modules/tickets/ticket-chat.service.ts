import { prisma } from '../../config/database';
import { logger } from '../../utils/logger';

// Define MessageType enum locally
enum MessageType {
  TEXT = 'TEXT',
  FILE = 'FILE', 
  IMAGE = 'IMAGE',
  SYSTEM = 'SYSTEM'
}

interface ChatMessageData {
  ticketId: string;
  senderId: string;
  message?: string;
  attachments?: any[];
  messageType?: MessageType;
}

interface ChatAccessCheck {
  ticketId: string;
  userId: string;
}

export class TicketChatService {
  /**
   * Check if user has access to ticket chat based on ticket relationships
   */
  static async checkChatAccess({ ticketId, userId }: ChatAccessCheck): Promise<boolean> {
    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          goodsReceiptNote: {
            include: {
              dispatch: {
                include: {
                  vendor: {
                    include: {
                      user: true
                    }
                  }
                }
              },
              verifiedBy: true
            }
          },
          createdBy: true,
          assignee: true
        }
      });

      if (!ticket) {
        return false;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          roles: {
            include: {
              role: true
            }
          },
          vendorProfile: true
        }
      });

      if (!user) {
        return false;
      }

      // Check user roles
      const userRoles = user.roles.map(ur => ur.role.name);

      // Admin has access to all tickets
      if (userRoles.includes('ADMIN')) {
        return true;
      }

      // Ticket creator (OPS team who created the ticket)
      if (ticket.createdById === userId) {
        return true;
      }

      // Assigned user (if ticket is assigned)
      if (ticket.assigneeId === userId) {
        return true;
      }

      // Vendor access (if user is the vendor who dispatched the goods)
      if (ticket.goodsReceiptNote?.dispatch?.vendor?.user?.id === userId) {
        return true;
      }

      // OPS team access (if user is OPS team member and verified the GRN)
      if (userRoles.includes('OPS') && ticket.goodsReceiptNote?.verifiedById === userId) {
        return true;
      }

      // Accounts team access (for payment/invoice related issues)
      if (userRoles.includes('ACCOUNTS')) {
        return true;
      }

      return false;
    } catch (error) {
      logger.error('Error checking chat access:', error);
      return false;
    }
  }

  /**
   * Get chat messages for a ticket
   */
  static async getChatMessages(ticketId: string, page: number = 1, limit: number = 50) {
    try {
      const offset = (page - 1) * limit;

      const messages = await (prisma as any).ticketChat.findMany({
        where: { ticketId },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              roles: {
                include: {
                  role: {
                    select: {
                      name: true
                    }
                  }
                }
              },
              vendorProfile: {
                select: {
                  companyName: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'asc' },
        skip: offset,
        take: limit
      });

      const total = await (prisma as any).ticketChat.count({
        where: { ticketId }
      });

      return {
        messages: messages.map((msg: any) => ({
          ...msg,
          sender: {
            ...msg.sender,
            role: msg.sender.roles[0]?.role?.name || 'USER',
            companyName: msg.sender.vendorProfile?.companyName
          }
        })),
        pagination: {
          page,
          limit,
          total,
          hasMore: offset + messages.length < total
        }
      };
    } catch (error) {
      logger.error('Error fetching chat messages:', error);
      throw error;
    }
  }

  /**
   * Send a chat message
   */
  static async sendChatMessage(data: ChatMessageData) {
    try {
      const createdMessage = await (prisma as any).ticketChat.create({
        data: {
          ticketId: data.ticketId,
          senderId: data.senderId,
          message: data.message,
          attachments: data.attachments ? data.attachments as any : null,
          messageType: data.messageType || MessageType.TEXT
        }
      });

      // Fetch the complete message with sender details
      const message = await (prisma as any).ticketChat.findUnique({
        where: { id: createdMessage.id },
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              email: true,
              roles: {
                include: {
                  role: {
                    select: {
                      name: true
                    }
                  }
                }
              },
              vendorProfile: {
                select: {
                  companyName: true
                }
              }
            }
          }
        }
      });

      if (!message) {
        throw new Error('Failed to fetch created message');
      }

      // Update ticket's lastMessageAt
      await prisma.ticket.update({
        where: { id: data.ticketId },
        data: { lastMessageAt: new Date() } as any
      });

      return {
        ...message,
        sender: {
          ...message.sender,
          role: message.sender.roles[0]?.role?.name || 'USER',
          companyName: message.sender.vendorProfile?.companyName
        }
      };
    } catch (error) {
      logger.error('Error sending chat message:', error);
      throw error;
    }
  }

  /**
   * Get ticket participants for chat context
   */
  static async getTicketParticipants(ticketId: string) {
    try {
      const ticket = await prisma.ticket.findUnique({
        where: { id: ticketId },
        include: {
          createdBy: {
            select: {
              id: true,
              name: true,
              email: true,
              roles: {
                include: {
                  role: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            }
          },
          assignee: {
            select: {
              id: true,
              name: true,
              email: true,
              roles: {
                include: {
                  role: {
                    select: {
                      name: true
                    }
                  }
                }
              }
            }
          },
          goodsReceiptNote: {
            include: {
              dispatch: {
                include: {
                  vendor: {
                    include: {
                      user: {
                        select: {
                          id: true,
                          name: true,
                          email: true
                        }
                      }
                    }
                  }
                }
              },
              verifiedBy: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  roles: {
                    include: {
                      role: {
                        select: {
                          name: true
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!ticket) {
        throw new Error('Ticket not found');
      }

      const participants = [];

      // Add ticket creator (OPS team)
      if (ticket.createdBy) {
        participants.push({
          id: ticket.createdBy.id,
          name: ticket.createdBy.name,
          email: ticket.createdBy.email,
          role: ticket.createdBy.roles[0]?.role?.name || 'OPS',
          type: 'creator'
        });
      }

      // Add assignee if different from creator
      if (ticket.assignee && ticket.assignee.id !== ticket.createdBy?.id) {
        participants.push({
          id: ticket.assignee.id,
          name: ticket.assignee.name,
          email: ticket.assignee.email,
          role: ticket.assignee.roles[0]?.role?.name || 'USER',
          type: 'assignee'
        });
      }

      // Add vendor
      if (ticket.goodsReceiptNote?.dispatch?.vendor?.user) {
        const vendor = ticket.goodsReceiptNote.dispatch.vendor;
        participants.push({
          id: vendor.user.id,
          name: vendor.user.name,
          email: vendor.user.email,
          role: 'VENDOR',
          companyName: vendor.companyName,
          type: 'vendor'
        });
      }

      // Add OPS verifier if different from creator
      if (ticket.goodsReceiptNote?.verifiedBy && 
          ticket.goodsReceiptNote.verifiedBy.id !== ticket.createdBy?.id) {
        participants.push({
          id: ticket.goodsReceiptNote.verifiedBy.id,
          name: ticket.goodsReceiptNote.verifiedBy.name,
          email: ticket.goodsReceiptNote.verifiedBy.email,
          role: ticket.goodsReceiptNote.verifiedBy.roles[0]?.role?.name || 'OPS',
          type: 'verifier'
        });
      }

      return {
        ticket: {
          id: ticket.id,
          ticketNumber: ticket.ticketNumber,
          title: ticket.title,
          status: ticket.status,
          priority: ticket.priority
        },
        participants
      };
    } catch (error) {
      logger.error('Error fetching ticket participants:', error);
      throw error;
    }
  }
}