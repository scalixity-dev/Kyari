import { PrismaClient } from '@prisma/client';
import { logger } from '../../utils/logger';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export class EnhancedValidationService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Validate invoice amounts against purchase order
   */
  async validateInvoiceAmount(invoiceId: string, proposedAmount: number): Promise<ValidationResult> {
    try {
      const invoice = await this.prisma.vendorInvoice.findUnique({
        where: { id: invoiceId },
        include: {
          purchaseOrder: {
            include: {
              items: true
            }
          }
        }
      });

      if (!invoice) {
        return {
          isValid: false,
          errors: ['Invoice not found']
        };
      }

      if (!invoice.purchaseOrder) {
        return {
          isValid: false,
          errors: ['Invoice is not linked to any purchase order'],
        };
      }

      const poTotalAmount = Number(invoice.purchaseOrder.totalAmount);
      const tolerance = 0.05; // 5% tolerance
      const minAllowed = poTotalAmount * (1 - tolerance);
      const maxAllowed = poTotalAmount * (1 + tolerance);

      const errors: string[] = [];
      const warnings: string[] = [];

      // Check if amount is within tolerance
      if (proposedAmount < minAllowed) {
        errors.push(`Invoice amount ₹${proposedAmount} is significantly lower than PO amount ₹${poTotalAmount}`);
      } else if (proposedAmount > maxAllowed) {
        errors.push(`Invoice amount ₹${proposedAmount} exceeds PO amount ₹${poTotalAmount} by more than 5%`);
      } else if (proposedAmount !== poTotalAmount) {
        warnings.push(`Invoice amount ₹${proposedAmount} differs from PO amount ₹${poTotalAmount} but within acceptable range`);
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };

    } catch (error) {
      logger.error('Error validating invoice amount', { error, invoiceId });
      return {
        isValid: false,
        errors: ['Validation service error']
      };
    }
  }

  /**
   * Validate vendor authorization for operations
   */
  async validateVendorAuthorization(vendorId: string, orderId: string): Promise<ValidationResult> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              assignedItems: {
                where: { vendorId }
              }
            }
          }
        }
      });

      if (!order) {
        return {
          isValid: false,
          errors: ['Order not found']
        };
      }

      // Check if vendor has any assigned items for this order
      const hasAssignedItems = order.items.some(item => item.assignedItems.length > 0);

      if (!hasAssignedItems) {
        return {
          isValid: false,
          errors: ['Vendor is not authorized for this order - no items assigned']
        };
      }

      // Check vendor status
      const vendor = await this.prisma.vendorProfile.findUnique({
        where: { id: vendorId },
        include: { user: true }
      });

      if (!vendor) {
        return {
          isValid: false,
          errors: ['Vendor profile not found']
        };
      }

      if (!vendor.verified) {
        return {
          isValid: false,
          errors: ['Vendor is not verified']
        };
      }

      if (vendor.user.status !== 'ACTIVE') {
        return {
          isValid: false,
          errors: ['Vendor account is not active']
        };
      }

      return {
        isValid: true,
        errors: []
      };

    } catch (error) {
      logger.error('Error validating vendor authorization', { error, vendorId, orderId });
      return {
        isValid: false,
        errors: ['Authorization validation error']
      };
    }
  }

  /**
   * Validate data consistency across related entities
   */
  async validateDataConsistency(orderId: string): Promise<ValidationResult> {
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: {
          items: {
            include: {
              assignedItems: {
                include: {
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
        return {
          isValid: false,
          errors: ['Order not found']
        };
      }

      const errors: string[] = [];
      const warnings: string[] = [];

      // Check quantity consistency
      for (const item of order.items) {
        const totalAssigned = item.assignedItems.reduce((sum, ai) => sum + ai.assignedQuantity, 0);
        
        if (totalAssigned > item.quantity) {
          errors.push(`Item ${item.productName}: Assigned quantity (${totalAssigned}) exceeds order quantity (${item.quantity})`);
        } else if (totalAssigned < item.quantity) {
          warnings.push(`Item ${item.productName}: Only ${totalAssigned} of ${item.quantity} items assigned`);
        }

        // Check pricing consistency
        for (const assignment of item.assignedItems) {
          const po = assignment.purchaseOrderItem?.purchaseOrder;
          if (po && assignment.purchaseOrderItem) {
            const poItemPrice = Number(assignment.purchaseOrderItem.pricePerUnit);
            const orderItemPrice = Number(item.pricePerUnit || 0);
            
            if (Math.abs(poItemPrice - orderItemPrice) > 0.01) {
              warnings.push(`Item ${item.productName}: PO price (₹${poItemPrice}) differs from order price (₹${orderItemPrice})`);
            }
          }
        }

        // Check dispatch quantity consistency
        for (const assignment of item.assignedItems) {
          const totalDispatched = assignment.dispatchItems.reduce((sum, di) => sum + di.dispatchedQuantity, 0);
          
          if (totalDispatched > assignment.assignedQuantity) {
            errors.push(`Item ${item.productName}: Dispatched quantity (${totalDispatched}) exceeds assigned quantity (${assignment.assignedQuantity})`);
          }
        }

        // Check GRN quantity consistency
        for (const assignment of item.assignedItems) {
          const totalReceived = assignment.goodsReceiptItems.reduce((sum, gri) => sum + gri.receivedQuantity, 0);
          const totalDispatched = assignment.dispatchItems.reduce((sum, di) => sum + di.dispatchedQuantity, 0);
          
          if (totalReceived > totalDispatched) {
            errors.push(`Item ${item.productName}: Received quantity (${totalReceived}) exceeds dispatched quantity (${totalDispatched})`);
          }
        }
      }

      // Check financial consistency
      const orderTotal = Number(order.totalValue || 0);
      let poTotal = 0;
      let invoiceTotal = 0;
      let paymentTotal = 0;

      const seenPOIds = new Set<string>();
      const seenInvoiceIds = new Set<string>();
      const seenPaymentIds = new Set<string>();

      for (const item of order.items) {
        for (const assignment of item.assignedItems) {
          const po = assignment.purchaseOrderItem?.purchaseOrder;
          if (po) {
            if (!seenPOIds.has(po.id)) {
              seenPOIds.add(po.id);
              poTotal += Number(po.totalAmount);
            }
            if (po.vendorInvoice && !seenInvoiceIds.has(po.vendorInvoice.id)) {
              seenInvoiceIds.add(po.vendorInvoice.id);
              invoiceTotal += Number(po.vendorInvoice.invoiceAmount);
            }
            if (po.payment && !seenPaymentIds.has(po.payment.id)) {
              seenPaymentIds.add(po.payment.id);
              paymentTotal += Number(po.payment.amount);
            }
          }
        }
      }

      if (Math.abs(orderTotal - poTotal) > 1) {
        warnings.push(`Order total (₹${orderTotal}) differs from PO total (₹${poTotal})`);
      }

      if (Math.abs(poTotal - invoiceTotal) > 1 && invoiceTotal > 0) {
        warnings.push(`PO total (₹${poTotal}) differs from invoice total (₹${invoiceTotal})`);
      }

      if (Math.abs(invoiceTotal - paymentTotal) > 1 && paymentTotal > 0) {
        warnings.push(`Invoice total (₹${invoiceTotal}) differs from payment total (₹${paymentTotal})`);
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings
      };

    } catch (error) {
      logger.error('Error validating data consistency', { error, orderId });
      return {
        isValid: false,
        errors: ['Data consistency validation error']
      };
    }
  }

  /**
   * Validate business logic rules
   */
  async validateBusinessRules(entityType: string, entityId: string, operation: string): Promise<ValidationResult> {
    try {
      const errors: string[] = [];
      const warnings: string[] = [];

      switch (entityType) {
        case 'order':
          return await this.validateOrderBusinessRules(entityId, operation);
        
        case 'purchaseOrder':
          return await this.validatePOBusinessRules(entityId, operation);
        
        case 'invoice':
          return await this.validateInvoiceBusinessRules(entityId, operation);
        
        case 'dispatch':
          return await this.validateDispatchBusinessRules(entityId, operation);
        
        case 'grn':
          return await this.validateGRNBusinessRules(entityId, operation);
        
        default:
          return {
            isValid: false,
            errors: [`Unknown entity type: ${entityType}`]
          };
      }

    } catch (error) {
      logger.error('Error validating business rules', { error, entityType, entityId, operation });
      return {
        isValid: false,
        errors: ['Business rules validation error']
      };
    }
  }

  private async validateOrderBusinessRules(orderId: string, operation: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: {
          include: {
            assignedItems: true
          }
        }
      }
    });

    if (!order) {
      return { isValid: false, errors: ['Order not found'] };
    }

    switch (operation) {
      case 'assign':
        if (order.status !== 'RECEIVED') {
          errors.push(`Cannot assign items to order with status: ${order.status}`);
        }
        break;

      case 'cancel':
        if (['FULFILLED', 'CLOSED'].includes(order.status)) {
          errors.push(`Cannot cancel order with status: ${order.status}`);
        }
        
        // Check if any items are already dispatched
        const hasDispatchedItems = order.items.some(item =>
          item.assignedItems.some(ai => ai.status === 'DISPATCHED')
        );
        
        if (hasDispatchedItems) {
          errors.push('Cannot cancel order - some items have already been dispatched');
        }
        break;

      case 'fulfill':
        const allItemsAssigned = order.items.every(item =>
          item.assignedItems.reduce((sum, ai) => sum + ai.assignedQuantity, 0) >= item.quantity
        );
        
        if (!allItemsAssigned) {
          errors.push('Cannot fulfill order - not all items are assigned');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private async validatePOBusinessRules(poId: string, operation: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        vendorInvoice: true,
        payment: true
      }
    });

    if (!po) {
      return { isValid: false, errors: ['Purchase Order not found'] };
    }

    switch (operation) {
      case 'cancel':
        if (po.vendorInvoice) {
          errors.push('Cannot cancel PO - invoice already exists');
        }
        if (po.payment) {
          errors.push('Cannot cancel PO - payment already processed');
        }
        break;

      case 'modify':
        if (po.status === 'PAID') {
          errors.push('Cannot modify paid PO');
        }
        if (po.vendorInvoice && po.vendorInvoice.status === 'APPROVED') {
          warnings.push('PO modification after invoice approval may cause discrepancies');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private async validateInvoiceBusinessRules(invoiceId: string, operation: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const invoice = await this.prisma.vendorInvoice.findUnique({
      where: { id: invoiceId },
      include: {
        purchaseOrder: {
          include: {
            payment: true
          }
        }
      }
    });

    if (!invoice) {
      return { isValid: false, errors: ['Invoice not found'] };
    }

    switch (operation) {
      case 'approve':
        if (invoice.status === 'APPROVED') {
          errors.push('Invoice is already approved');
        }
        if (invoice.status === 'REJECTED') {
          warnings.push('Approving previously rejected invoice');
        }
        break;

      case 'reject':
        if (invoice.purchaseOrder.payment && invoice.purchaseOrder.payment.status === 'COMPLETED') {
          errors.push('Cannot reject invoice - payment already completed');
        }
        break;

      case 'modify':
        if (invoice.status === 'APPROVED') {
          errors.push('Cannot modify approved invoice');
        }
        if (invoice.purchaseOrder.payment) {
          errors.push('Cannot modify invoice - payment record exists');
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private async validateDispatchBusinessRules(dispatchId: string, operation: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const dispatch = await this.prisma.dispatch.findUnique({
      where: { id: dispatchId },
      include: {
        goodsReceiptNote: true,
        items: true
      }
    });

    if (!dispatch) {
      return { isValid: false, errors: ['Dispatch not found'] };
    }

    switch (operation) {
      case 'cancel':
        if (dispatch.status === 'DELIVERED') {
          errors.push('Cannot cancel delivered dispatch');
        }
        if (dispatch.goodsReceiptNote) {
          errors.push('Cannot cancel dispatch - GRN already created');
        }
        break;

      case 'deliver':
        if (dispatch.status !== 'IN_TRANSIT') {
          errors.push(`Cannot deliver dispatch with status: ${dispatch.status}`);
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private async validateGRNBusinessRules(grnId: string, operation: string): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    const grn = await this.prisma.goodsReceiptNote.findUnique({
      where: { id: grnId },
      include: {
        items: true,
        ticket: true
      }
    });

    if (!grn) {
      return { isValid: false, errors: ['GRN not found'] };
    }

    switch (operation) {
      case 'verify':
        if (grn.status !== 'PENDING_VERIFICATION') {
          errors.push(`Cannot verify GRN with status: ${grn.status}`);
        }
        break;

      case 'modify':
        if (grn.status === 'VERIFIED_OK' || grn.status === 'VERIFIED_MISMATCH') {
          errors.push('Cannot modify verified GRN');
        }
        break;

      case 'resolve':
        if (!grn.ticket) {
          errors.push('No ticket found for GRN resolution');
        }
        if (grn.ticket && grn.ticket.status !== 'OPEN') {
          warnings.push(`Resolving ticket with status: ${grn.ticket.status}`);
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Comprehensive validation for all related entities
   */
  async validateFullWorkflow(orderId: string): Promise<ValidationResult> {
    try {
      const results = await Promise.all([
        this.validateDataConsistency(orderId),
        this.validateBusinessRules('order', orderId, 'validate')
      ]);

      const allErrors = results.flatMap(r => r.errors);
      const allWarnings = results.flatMap(r => r.warnings || []);

      return {
        isValid: allErrors.length === 0,
        errors: allErrors,
        warnings: allWarnings
      };

    } catch (error) {
      logger.error('Error in full workflow validation', { error, orderId });
      return {
        isValid: false,
        errors: ['Full workflow validation error']
      };
    }
  }
}