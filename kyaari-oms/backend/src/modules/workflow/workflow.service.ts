import { PrismaClient, OrderStatus, AssignmentStatus, InvoiceStatus, PaymentStatus, DispatchStatus, GRNStatus } from '@prisma/client';
import { logger } from '../../utils/logger';

export class WorkflowOrchestrationService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Orchestrate order to purchase order workflow
   */
  async initiateOrderToPOWorkflow(orderId: string, userId: string): Promise<{ success: boolean; purchaseOrderId?: string; message: string }> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              assignedItems: {
                include: {
                  vendor: true
                }
              }
            }
          }
        }
      });

      if (!order) {
        return { success: false, message: 'Order not found' };
      }

      if (order.status !== 'RECEIVED' && order.status !== 'ASSIGNED') {
        return { success: false, message: `Order cannot be processed. Current status: ${order.status}` };
      }

      // Get all assigned items from order items
      const allAssignedItems = order.items.flatMap(item => item.assignedItems);

      if (allAssignedItems.length === 0) {
        return { success: false, message: 'No items assigned to vendors yet' };
      }

      // Group assigned items by vendor
      const vendorGroups = new Map();
      allAssignedItems.forEach(item => {
        const vendorId = item.vendorId;
        if (!vendorGroups.has(vendorId)) {
          vendorGroups.set(vendorId, {
            vendor: item.vendor,
            items: []
          });
        }
        vendorGroups.get(vendorId).items.push(item);
      });

      const createdPOs = [];

      // Create purchase orders for each vendor
      for (const [vendorId, vendorGroup] of vendorGroups) {
        const poNumber = await this.generatePONumber();
        const totalAmount = vendorGroup.items.reduce((sum: number, item: any) => {
          // Calculate based on assigned quantity and price from order item
          const orderItem = order.items.find(oi => oi.id === item.orderItemId);
          const pricePerUnit = orderItem?.pricePerUnit || 0;
          return sum + (item.assignedQuantity * Number(pricePerUnit));
        }, 0);

        const purchaseOrder = await this.prisma.purchaseOrder.create({
          data: {
            poNumber,
            vendorId,
            totalAmount,
            status: 'ISSUED',
            poJson: {
              items: vendorGroup.items.map((item: any) => ({
                assignedOrderItemId: item.id,
                quantity: item.assignedQuantity,
                pricePerUnit: Number(order.items.find(oi => oi.id === item.orderItemId)?.pricePerUnit || 0)
              }))
            },
            createdById: userId,
            items: {
              create: vendorGroup.items.map((item: any) => {
                const orderItem = order.items.find(oi => oi.id === item.orderItemId);
                const pricePerUnit = Number(orderItem?.pricePerUnit || 0);
                return {
                  assignedOrderItemId: item.id,
                  quantity: item.assignedQuantity,
                  pricePerUnit,
                  totalPrice: item.assignedQuantity * pricePerUnit
                };
              })
            }
          }
        });

        createdPOs.push(purchaseOrder);

        // Update assignment status
        await this.prisma.assignedOrderItem.updateMany({
          where: {
            id: { in: vendorGroup.items.map((item: any) => item.id) }
          },
          data: {
            status: 'PENDING_CONFIRMATION'
          }
        });

        logger.info(`Purchase Order created`, {
          poId: purchaseOrder.id,
          poNumber: purchaseOrder.poNumber,
          vendorId,
          orderId
        });
      }

      // Update order status
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: 'PROCESSING' }
      });

      return {
        success: true,
        purchaseOrderId: createdPOs[0]?.id,
        message: `${createdPOs.length} Purchase Order(s) created successfully`
      };

    } catch (error) {
      logger.error('Error in order to PO workflow', { error, orderId });
      return { success: false, message: 'Failed to create purchase orders' };
    }
  }

  /**
   * Orchestrate invoice to payment workflow
   */
  async initiateInvoiceToPaymentWorkflow(invoiceId: string, approvedBy: string): Promise<{ success: boolean; paymentId?: string; message: string }> {
    try {
      const invoice = await this.prisma.vendorInvoice.findUnique({
        where: { id: invoiceId },
        include: {
          purchaseOrder: {
            include: {
              vendor: {
                include: { user: true }
              }
            }
          }
        }
      });

      if (!invoice) {
        return { success: false, message: 'Invoice not found' };
      }

      if (invoice.status !== 'PENDING_VERIFICATION') {
        return { success: false, message: `Invoice cannot be processed. Current status: ${invoice.status}` };
      }

      let paymentId: string | undefined;

      await this.prisma.$transaction(async (tx) => {
        // Update invoice status to approved
        await tx.vendorInvoice.update({
          where: { id: invoiceId },
          data: {
            status: 'APPROVED'
          }
        });

        // Create payment record
        const paymentNumber = await this.generatePaymentNumber();
        const payment = await tx.payment.create({
          data: {
            purchaseOrderId: invoice.purchaseOrderId,
            amount: invoice.invoiceAmount,
            status: 'PENDING',
            processedById: approvedBy
          }
        });

        paymentId = payment.id;

        // Update purchase order status
        await tx.purchaseOrder.update({
          where: { id: invoice.purchaseOrderId },
          data: { status: 'PARTIALLY_PAID' }
        });
      });

      logger.info('Invoice approved and payment initiated', {
        invoiceId,
        approvedBy,
        vendorId: invoice.purchaseOrder?.vendorId
      });

      return {
        success: true,
        paymentId,
        message: 'Invoice approved and payment initiated successfully'
      };

    } catch (error) {
      logger.error('Error in invoice to payment workflow', { error, invoiceId });
      return { success: false, message: 'Failed to process invoice approval' };
    }
  }

  /**
   * Orchestrate dispatch to GRN workflow
   */
  async initiateDispatchToGRNWorkflow(dispatchId: string, verifiedBy: string): Promise<{ success: boolean; grnId?: string; message: string }> {
    try {
      const dispatch = await this.prisma.dispatch.findUnique({
        where: { id: dispatchId },
        include: {
          items: {
            include: {
              assignedOrderItem: true
            }
          }
        }
      });

      if (!dispatch) {
        return { success: false, message: 'Dispatch not found' };
      }

      if (dispatch.status !== 'DELIVERED') {
        return { success: false, message: `Dispatch not ready for GRN. Current status: ${dispatch.status}` };
      }

      // Check if GRN already exists
      const existingGRN = await this.prisma.goodsReceiptNote.findFirst({
        where: { dispatchId }
      });

      if (existingGRN) {
        return { success: false, message: 'GRN already exists for this dispatch' };
      }

      const grnNumber = await this.generateGRNNumber();

      const grn = await this.prisma.goodsReceiptNote.create({
        data: {
          grnNumber,
          dispatchId,
          status: 'PENDING_VERIFICATION',
          verifiedById: verifiedBy,
          receivedAt: new Date(),
          items: {
            create: dispatch.items.map(item => ({
              dispatchItemId: item.id,
              assignedOrderItemId: item.assignmentId,
              assignedQuantity: item.dispatchedQuantity,
              confirmedQuantity: item.dispatchedQuantity,
              receivedQuantity: item.dispatchedQuantity,
              status: 'VERIFIED_OK'
            }))
          }
        },
        include: {
          items: true
        }
      });

      logger.info('GRN created for dispatch', {
        grnId: grn.id,
        grnNumber: grn.grnNumber,
        dispatchId
      });

      return {
        success: true,
        grnId: grn.id,
        message: 'GRN created successfully'
      };

    } catch (error) {
      logger.error('Error in dispatch to GRN workflow', { error, dispatchId });
      return { success: false, message: 'Failed to create GRN' };
    }
  }

  /**
   * Complete order workflow after GRN verification
   */
  async completeOrderWorkflow(orderId: string): Promise<{ success: boolean; message: string }> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              assignedItems: {
                include: {
                  goodsReceiptItems: {
                    include: {
                      goodsReceiptNote: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!order) {
        return { success: false, message: 'Order not found' };
      }

      // Check if all assigned items have been verified through GRN
      const allAssignedItems = order.items.flatMap(item => item.assignedItems);
      const allGRNsVerified = allAssignedItems.every(item =>
        item.goodsReceiptItems.some(grn =>
          grn.goodsReceiptNote.status === 'VERIFIED_OK' ||
          grn.goodsReceiptNote.status === 'VERIFIED_MISMATCH'
        )
      );

      if (!allGRNsVerified) {
        return { success: false, message: 'Not all items have been verified through GRN' };
      }

      // Update order status to completed
      await this.prisma.order.update({
        where: { id: orderId },
        data: { status: 'FULFILLED' }
      });

      // Update all assigned items to completed
      await this.prisma.assignedOrderItem.updateMany({
        where: {
          orderItem: {
            orderId: orderId
          }
        },
        data: { status: 'COMPLETED' }
      });

      logger.info('Order workflow completed', { orderId });

      return {
        success: true,
        message: 'Order workflow completed successfully'
      };

    } catch (error) {
      logger.error('Error completing order workflow', { error, orderId });
      return { success: false, message: 'Failed to complete order workflow' };
    }
  }

  /**
   * Get workflow status for an order
   */
  async getOrderWorkflowStatus(orderId: string) {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              assignedItems: {
                include: {
                  vendor: { include: { user: true } },
                  purchaseOrderItem: {
                    include: {
                      purchaseOrder: {
                        include: {
                          vendorInvoice: true,
                          payment: true
                        }
                      }
                    }
                  },
                  dispatchItems: {
                    include: {
                      dispatch: true
                    }
                  },
                  goodsReceiptItems: {
                    include: {
                      goodsReceiptNote: true
                    }
                  }
                }
              }
            }
          }
        }
      });

      if (!order) {
        throw new Error('Order not found');
      }

      const workflow: any = {
        orderId: order.id,
        orderNumber: order.orderNumber,
        orderStatus: order.status,
        totalValue: order.totalValue,
        items: []
      };

      // Process each order item and its assigned items
      for (const item of order.items) {
        const itemWorkflow: any = {
          orderItem: {
            id: item.id,
            productName: item.productName,
            quantity: item.quantity,
            pricePerUnit: item.pricePerUnit,
            totalPrice: item.totalPrice
          },
          assignments: []
        };

        for (const assignment of item.assignedItems) {
          const assignmentWorkflow: any = {
            assignmentId: assignment.id,
            vendor: assignment.vendor,
            assignedQuantity: assignment.assignedQuantity,
            status: assignment.status,
            purchaseOrder: assignment.purchaseOrderItem?.purchaseOrder || null,
            invoice: assignment.purchaseOrderItem?.purchaseOrder?.vendorInvoice || null,
            payment: assignment.purchaseOrderItem?.purchaseOrder?.payment || null,
            dispatches: assignment.dispatchItems.map(di => di.dispatch),
            grns: assignment.goodsReceiptItems.map(gri => gri.goodsReceiptNote)
          };

          itemWorkflow.assignments.push(assignmentWorkflow);
        }

        workflow.items.push(itemWorkflow);
      }

      return workflow;

    } catch (error) {
      logger.error('Error getting workflow status', { error, orderId });
      throw error;
    }
  }

  // Helper methods for generating numbers
  private async generatePONumber(): Promise<string> {
    const count = await this.prisma.purchaseOrder.count();
    const year = new Date().getFullYear();
    return `PO-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private async generatePaymentNumber(): Promise<string> {
    const count = await this.prisma.payment.count();
    const year = new Date().getFullYear();
    return `PAY-${year}-${String(count + 1).padStart(4, '0')}`;
  }

  private async generateGRNNumber(): Promise<string> {
    const count = await this.prisma.goodsReceiptNote.count();
    const year = new Date().getFullYear();
    return `GRN-${year}-${String(count + 1).padStart(4, '0')}`;
  }
}