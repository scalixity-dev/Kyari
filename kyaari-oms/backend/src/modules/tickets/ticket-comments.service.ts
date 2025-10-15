import { prisma } from '../../config/database';

export class TicketCommentsService {
  static async listComments(ticketId: string) {
    return prisma.ticketComment.findMany({
      where: { ticketId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  static async createComment(params: { ticketId: string; userId: string; content: string }) {
    const { ticketId, userId, content } = params;
    // Ensure ticket exists
    await prisma.ticket.findUniqueOrThrow({ where: { id: ticketId } });
    return prisma.ticketComment.create({
      data: {
        ticketId,
        userId,
        content,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }

  static async updateComment(params: { commentId: string; userId: string; content: string }) {
    const { commentId, userId, content } = params;

    // Optional: ensure the updater is the author; for now only update content
    // You may add ownership checks here if required
    return prisma.ticketComment.update({
      where: { id: commentId },
      data: { content },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }
}


