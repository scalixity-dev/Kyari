import { prisma } from '../config/database';
import { logger } from '../utils/logger';
import { GRNStatus, GRNItemStatus, TicketStatus, TicketPriority, PrismaClient } from '@prisma/client';
import { notificationService } from '../modules/notifications/notification.service';

export interface GRNMismatchData {
  goodsReceiptNoteId: string;
  grnNumber: string;
  dispatchId: string;
  verifiedById: string;
  operatorRemarks?: string;
  mismatches: GRNItemMismatch[];
}

export interface GRNItemMismatch {
  grnItemId: string;
  assignedOrderItemId: string;
  assignedQuantity: number;
  confirmedQuantity: number;
  receivedQuantity: number;
  discrepancyQuantity: number;
  status: GRNItemStatus;
  itemRemarks?: string;
  damageReported: boolean;
  damageDescription?: string;
}

export interface TicketCreateData {
  title: string;
  description: string;
  priority: TicketPriority;
  goodsReceiptNoteId: string;
  createdById: string;
  assigneeId?: string;
}

export class GRNAutoTicketingService {
  /**
   * Process GRN verification and create tickets for mismatches
   */
  static async processGRNVerification(grnData: GRNMismatchData): Promise<{
    success: boolean;
    grn: any;
    ticket?: any;
    message: string;
  }> {
    try {
      // Start transaction with increased timeout
      const result = await prisma.$transaction(async (tx) => {
        // 1. Update GRN status based on verification
        const hasAnyMismatch = grnData.mismatches.some(
          mismatch => mismatch.status !== 'VERIFIED_OK'
        );

        const hasCriticalMismatch = grnData.mismatches.some(
          mismatch => mismatch.status === 'QUANTITY_MISMATCH' || 
                     mismatch.status === 'SHORTAGE_REPORTED' ||
                     mismatch.status === 'DAMAGE_REPORTED'
        );

        const grnStatus: GRNStatus = hasAnyMismatch 
          ? (hasCriticalMismatch ? 'VERIFIED_MISMATCH' : 'PARTIALLY_VERIFIED')
          : 'VERIFIED_OK';

        // 2. Update GRN record
        const updatedGRN = await tx.goodsReceiptNote.update({
          where: { id: grnData.goodsReceiptNoteId },
          data: {
            status: grnStatus,
            operatorRemarks: grnData.operatorRemarks,
            verifiedAt: new Date(),
          },
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
            items: {
              include: {
                assignedOrderItem: {
                  include: {
                    orderItem: true,
                    purchaseOrderItem: {
                      include: {
                        purchaseOrder: true
                      }
                    }
                  }
                }
              }
            }
          }
        });

        // 3. Update individual GRN items
        await Promise.all(
          grnData.mismatches.map(async (mismatch) => {
            await tx.goodsReceiptItem.update({
              where: { id: mismatch.grnItemId },
              data: {
                receivedQuantity: mismatch.receivedQuantity,
                discrepancyQuantity: mismatch.discrepancyQuantity,
                status: mismatch.status,
                itemRemarks: mismatch.itemRemarks,
                damageReported: mismatch.damageReported,
                damageDescription: mismatch.damageDescription,
              }
            });
          })
        );

        // 4. Auto-create ticket if there are mismatches
        let ticket = null;
        if (hasAnyMismatch) {
          const ticketData = this.generateTicketFromMismatches(
            updatedGRN,
            grnData.mismatches,
            grnData.verifiedById
          );

          // Generate unique ticket number
          const ticketNumber = await this.generateTicketNumber(tx);

          ticket = await tx.ticket.create({
            data: {
              ticketNumber,
              title: ticketData.title,
              description: ticketData.description,
              priority: ticketData.priority,
              goodsReceiptNoteId: grnData.goodsReceiptNoteId,
              createdById: grnData.verifiedById,
              assigneeId: ticketData.assigneeId,
            },
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
                  }
                }
              },
              createdBy: true,
              assignee: true
            }
          });

          // 5. Create initial comment with mismatch details
          await tx.ticketComment.create({
            data: {
              ticketId: ticket.id,
              userId: grnData.verifiedById,
              content: this.generateMismatchSummary(grnData.mismatches)
            }
          });
        }

        return { grn: updatedGRN, ticket };
      }, {
        maxWait: 15000, // Maximum time to wait for transaction to start (15 seconds)
        timeout: 30000, // Maximum time for transaction to complete (30 seconds)
      });

      logger.info('GRN verification processed successfully', {
        grnId: grnData.goodsReceiptNoteId,
        grnNumber: grnData.grnNumber,
        hasTicket: !!result.ticket,
        ticketId: result.ticket?.id
      });

      // Send URGENT notifications for ticket creation
      if (result.ticket) {
        try {
          const vendor = result.grn.dispatch?.vendor;
          const ticketPriorityText = result.ticket.priority === 'URGENT' ? '🔥 URGENT' : 
                                   result.ticket.priority === 'HIGH' ? '🚨 HIGH PRIORITY' : 
                                   result.ticket.priority === 'MEDIUM' ? '⚠️ MEDIUM' : 'LOW';

          // Notify Operations, Admin, QC, and Accounts teams
          await notificationService.sendNotificationToRole(
            ['OPERATIONS', 'ADMIN', 'QC', 'ACCOUNTS'],
            {
              title: `${ticketPriorityText} GRN Ticket Created`,
              body: `Ticket ${result.ticket.ticketNumber} created for GRN ${grnData.grnNumber}. Immediate review required.`,
              priority: 'URGENT' as const,
              data: {
                type: 'GRN_TICKET_CREATED',
                ticketId: result.ticket.id,
                ticketNumber: result.ticket.ticketNumber,
                grnId: grnData.goodsReceiptNoteId,
                grnNumber: grnData.grnNumber,
                vendorName: vendor?.companyName || 'Unknown',
                priority: result.ticket.priority,
                assigneeId: result.ticket.assigneeId || '',
                deepLink: `/operations/tickets/${result.ticket.id}/review`
              }
            }
          );

          // Notify the vendor about the quality issue
          if (vendor?.userId) {
            await notificationService.sendNotificationToUser(
              vendor.userId,
              {
                title: 'Quality Issue Ticket Created',
                body: `A quality issue ticket (${result.ticket.ticketNumber}) has been created for your delivery. Please review.`,
                priority: 'URGENT' as const,
                data: {
                  type: 'VENDOR_QUALITY_ISSUE',
                  ticketId: result.ticket.id,
                  ticketNumber: result.ticket.ticketNumber,
                  grnNumber: grnData.grnNumber,
                  deepLink: `/vendor/tickets/${result.ticket.id}/details`
                }
              }
            );
          }

          // If there's an assignee, notify them specifically
          if (result.ticket.assigneeId) {
            await notificationService.sendNotificationToUser(
              result.ticket.assigneeId,
              {
                title: 'New GRN Quality Ticket Assigned',
                body: `You have been assigned ticket ${result.ticket.ticketNumber} for GRN ${grnData.grnNumber}. Priority: ${result.ticket.priority}`,
                priority: 'URGENT' as const,
                data: {
                  type: 'TICKET_ASSIGNED',
                  ticketId: result.ticket.id,
                  ticketNumber: result.ticket.ticketNumber,
                  grnNumber: grnData.grnNumber,
                  priority: result.ticket.priority,
                  deepLink: `/tickets/${result.ticket.id}/action-required`
                }
              }
            );
          }
        } catch (notificationError) {
          // Don't fail the ticket creation if notification fails
          logger.warn('Failed to send GRN ticket notifications', { 
            notificationError, 
            ticketId: result.ticket?.id 
          });
        }
      }

      return {
        success: true,
        grn: result.grn,
        ticket: result.ticket,
        message: result.ticket 
          ? `GRN verified with mismatches. Ticket ${result.ticket.ticketNumber} created automatically.`
          : 'GRN verified successfully with no issues.'
      };

    } catch (error) {
      logger.error('Failed to process GRN verification', { 
        error, 
        grnId: grnData.goodsReceiptNoteId 
      });
      
      return {
        success: false,
        grn: null,
        message: 'Failed to process GRN verification'
      };
    }
  }

  /**
   * Generate ticket data based on GRN mismatches
   */
  private static generateTicketFromMismatches(
    grn: any,
    mismatches: GRNItemMismatch[],
    createdById: string
  ): TicketCreateData {
    const criticalMismatches = mismatches.filter(
      m => m.status === 'QUANTITY_MISMATCH' || 
           m.status === 'SHORTAGE_REPORTED' || 
           m.status === 'DAMAGE_REPORTED'
    );

    const minorMismatches = mismatches.filter(
      m => m.status === 'EXCESS_RECEIVED'
    );

    // Determine priority based on mismatch severity
    let priority: TicketPriority = 'MEDIUM';
    if (criticalMismatches.length > 0) {
      const totalCriticalDiscrepancy = criticalMismatches.reduce(
        (sum, m) => sum + Math.abs(m.discrepancyQuantity), 0
      );
      
      priority = totalCriticalDiscrepancy > 50 ? 'HIGH' : 'MEDIUM';
      
      // Escalate to urgent if damage reported or large shortage
      if (criticalMismatches.some(m => m.damageReported) || totalCriticalDiscrepancy > 100) {
        priority = 'URGENT';
      }
    } else if (minorMismatches.length > 0) {
      priority = 'LOW';
    }

    // Generate title and description
    const vendorName = grn.dispatch?.vendor?.user?.email || 'Unknown Vendor';
    const poNumber = grn.items?.[0]?.assignedOrderItem?.purchaseOrderItem?.purchaseOrder?.poNumber || 'Unknown PO';
    
    const title = `GRN Mismatch - ${grn.grnNumber} (${poNumber})`;
    
    const description = this.generateTicketDescription(grn, mismatches, vendorName, poNumber);

    return {
      title,
      description,
      priority,
      goodsReceiptNoteId: grn.id,
      createdById,
      // TODO: Implement assignment logic based on mismatch type
      assigneeId: undefined
    };
  }

  /**
   * Generate detailed ticket description
   */
  private static generateTicketDescription(
    grn: any,
    mismatches: GRNItemMismatch[],
    vendorName: string,
    poNumber: string
  ): string {
    const lines = [
      `AUTOMATED TICKET: GRN Verification Mismatch Detected`,
      ``,
      `GRN Details:`,
      `- GRN Number: ${grn.grnNumber}`,
      `- PO Number: ${poNumber}`,
      `- Vendor: ${vendorName}`,
      `- Verified At: ${new Date().toISOString()}`,
      ``,
      `Mismatches Identified:`
    ];

    mismatches.forEach((mismatch, index) => {
      const item = grn.items?.find((item: any) => item.id === mismatch.grnItemId);
      const productName = item?.assignedOrderItem?.orderItem?.productName || 'Unknown Product';
      
      lines.push(`${index + 1}. ${productName}:`);
      lines.push(`   - Assigned: ${mismatch.assignedQuantity}`);
      lines.push(`   - Confirmed: ${mismatch.confirmedQuantity}`);
      lines.push(`   - Received: ${mismatch.receivedQuantity}`);
      lines.push(`   - Discrepancy: ${mismatch.discrepancyQuantity}`);
      lines.push(`   - Status: ${mismatch.status}`);
      
      if (mismatch.damageReported) {
        lines.push(`   - Damage: ${mismatch.damageDescription}`);
      }
      
      if (mismatch.itemRemarks) {
        lines.push(`   - Remarks: ${mismatch.itemRemarks}`);
      }
      
      lines.push('');
    });

    lines.push(`Action Required:`);
    lines.push(`- Vendor coordination for discrepancies`);
    lines.push(`- Update inventory records if needed`);
    lines.push(`- Consider credit note or adjustment invoice`);
    lines.push(`- Document resolution for audit trail`);

    return lines.join('\n');
  }

  /**
   * Generate mismatch summary for ticket comment
   */
  private static generateMismatchSummary(mismatches: GRNItemMismatch[]): string {
    const summary = [
      `GRN Verification completed with the following issues:`,
      ``
    ];

    const groupedMismatches = mismatches.reduce((acc, mismatch) => {
      if (!acc[mismatch.status]) {
        acc[mismatch.status] = [];
      }
      acc[mismatch.status].push(mismatch);
      return acc;
    }, {} as Record<string, GRNItemMismatch[]>);

    Object.entries(groupedMismatches).forEach(([status, items]) => {
      summary.push(`${status}: ${items.length} item(s)`);
      items.forEach(item => {
        summary.push(`  - Discrepancy: ${item.discrepancyQuantity} units`);
        if (item.itemRemarks) {
          summary.push(`    Remarks: ${item.itemRemarks}`);
        }
      });
      summary.push('');
    });

    summary.push(`Total items with issues: ${mismatches.length}`);
    summary.push(`Requires vendor coordination and resolution.`);

    return summary.join('\n');
  }

  /**
   * Generate unique ticket number with retry logic to prevent duplicates
   */
  private static async generateTicketNumber(tx: any): Promise<string> {
    const maxRetries = 5;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const today = new Date();
        const yearMonth = today.toISOString().slice(0, 7).replace('-', ''); // YYYYMM
        const dayOfMonth = today.getDate().toString().padStart(2, '0');
        
        // Use timestamp in milliseconds + random component for uniqueness
        const timestamp = Date.now();
        const milliseconds = timestamp.toString().slice(-3); // Last 3 digits of milliseconds
        const random = Math.floor(Math.random() * 100).toString().padStart(2, '0'); // Random 00-99
        
        // Find the last ticket number for today to get sequence
        const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
        const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);
        
        const lastTicket = await tx.ticket.findFirst({
          where: {
            createdAt: {
              gte: startOfDay,
              lt: endOfDay
            },
            ticketNumber: {
              startsWith: `TKT-${yearMonth}${dayOfMonth}`
            }
          },
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            ticketNumber: true
          }
        });

        let sequenceNumber = 1;
        if (lastTicket) {
          // Extract sequence from last ticket number (format: TKT-YYYYMMDD-XXX-YY)
          const parts = lastTicket.ticketNumber.split('-');
          if (parts.length >= 3) {
            const lastSeq = parseInt(parts[2]);
            if (!isNaN(lastSeq)) {
              sequenceNumber = lastSeq + 1;
            }
          }
        }

        const sequence = sequenceNumber.toString().padStart(3, '0');
        const ticketNumber = `TKT-${yearMonth}${dayOfMonth}-${sequence}-${random}`;
        
        // Verify uniqueness before returning
        const existing = await tx.ticket.findUnique({
          where: { ticketNumber }
        });
        
        if (!existing) {
          return ticketNumber;
        }
        
        // If duplicate found, wait a bit and retry
        await new Promise(resolve => setTimeout(resolve, 50 * (attempt + 1)));
        
      } catch (error) {
        logger.warn(`Ticket number generation attempt ${attempt + 1} failed`, { error });
        if (attempt === maxRetries - 1) {
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
      }
    }
    
    // Ultimate fallback: use timestamp + UUID-like random string
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '');
    return `TKT-${yearMonth}-${timestamp}-${randomStr}`;
  }

  /**
   * Get ticket by GRN ID
   */
  static async getTicketByGRNId(grnId: string): Promise<any> {
    try {
      return await prisma.ticket.findUnique({
        where: { goodsReceiptNoteId: grnId },
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
              }
            }
          },
          createdBy: true,
          assignee: true,
          comments: {
            include: {
              user: true
            },
            orderBy: { createdAt: 'desc' }
          },
          attachments: true
        }
      });
    } catch (error) {
      logger.error('Failed to get ticket by GRN ID', { error, grnId });
      return null;
    }
  }

  /**
   * Update ticket status manually (for operations team)
   */
  static async updateTicketStatus(
    ticketId: string,
    status: TicketStatus,
    userId: string,
    comment?: string
  ): Promise<{ success: boolean; ticket?: any; message: string }> {
    try {
      const result = await prisma.$transaction(async (tx) => {
        // Update ticket
        const ticket = await tx.ticket.update({
          where: { id: ticketId },
          data: {
            status,
            resolvedAt: status === 'RESOLVED' || status === 'CLOSED' ? new Date() : null,
            updatedAt: new Date()
          },
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
                }
              }
            },
            createdBy: true,
            assignee: true
          }
        });

        // Add comment if provided
        if (comment) {
          await tx.ticketComment.create({
            data: {
              ticketId,
              userId,
              content: comment
            }
          });
        }

        return ticket;
      }, {
        maxWait: 15000, // Maximum time to wait for transaction to start (15 seconds)
        timeout: 30000, // Maximum time for transaction to complete (30 seconds)
      });

      logger.info('Ticket status updated', {
        ticketId,
        status,
        userId
      });

      // Send notifications for important status changes
      if (status === 'RESOLVED' || status === 'CLOSED') {
        try {
          const statusEmoji = status === 'RESOLVED' ? '✅' : '🔒';
          const vendor = result.goodsReceiptNote?.dispatch?.vendor;

          // Notify stakeholders about resolution
          await notificationService.sendNotificationToRole(
            ['OPERATIONS', 'ADMIN'],
            {
              title: `${statusEmoji} GRN Ticket ${status}`,
              body: `Ticket ${result.ticketNumber} has been ${status.toLowerCase()}. GRN: ${result.goodsReceiptNote?.grnNumber}`,
              priority: 'NORMAL' as const,
              data: {
                type: 'TICKET_STATUS_UPDATED',
                ticketId: result.id,
                ticketNumber: result.ticketNumber,
                status,
                grnNumber: result.goodsReceiptNote?.grnNumber || '',
                vendorName: vendor?.companyName || 'Unknown',
                updatedBy: userId,
                deepLink: `/operations/tickets/${result.id}/summary`
              }
            }
          );

          // Notify vendor about resolution
          if (vendor?.userId) {
            await notificationService.sendNotificationToUser(
              vendor.userId,
              {
                title: `Quality Issue ${status}`,
                body: `Quality issue ticket ${result.ticketNumber} has been ${status.toLowerCase()}.`,
                priority: 'NORMAL' as const,
                data: {
                  type: 'VENDOR_TICKET_RESOLVED',
                  ticketId: result.id,
                  ticketNumber: result.ticketNumber,
                  status,
                  deepLink: `/vendor/tickets/${result.id}/resolution`
                }
              }
            );
          }
        } catch (notificationError) {
          logger.warn('Failed to send ticket status update notification', { 
            notificationError, 
            ticketId, 
            status 
          });
        }
      }

      return {
        success: true,
        ticket: result,
        message: `Ticket status updated to ${status}`
      };

    } catch (error) {
      logger.error('Failed to update ticket status', { error, ticketId });
      return {
        success: false,
        message: 'Failed to update ticket status'
      };
    }
  }
}