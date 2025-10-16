import { prisma } from '../../config/database';
import s3Service from '../../services/s3.service';
import { GRNStatus, GRNItemStatus } from '@prisma/client';

type DeliveryVerified = 'Yes' | 'No' | 'Partial';
type PaymentStatusUI = 'Pending' | 'Released' | 'Overdue';

export interface ListPaymentsFilters {
  status?: PaymentStatusUI | '';
  deliveryVerified?: DeliveryVerified | '';
  page?: number;
  limit?: number;
}

export class PaymentService {
  static async listPayments(filters: ListPaymentsFilters) {
    const { status = '', deliveryVerified = '', page = 1, limit = 20 } = filters;
    const skip = (page - 1) * limit;

    // Pull purchase orders with invoice and related GRN via dispatch
    const [pos, total] = await Promise.all([
      prisma.purchaseOrder.findMany({
        include: {
          vendor: true,
          vendorInvoice: {
            include: {
              accountsAttachment: true,
              vendorAttachment: true,
            },
          },
          payment: true,
          items: {
            include: {
              assignedOrderItem: {
                include: {
                  orderItem: {
                    include: {
                      order: true,
                    },
                  },
                  dispatchItems: {
                    include: {
                      dispatch: {
                        include: {
                          goodsReceiptNote: true,
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.purchaseOrder.count(),
    ]);

    const today = new Date();

    const rows = await Promise.all(pos.map(async (po) => {
      const vendorName = po.vendor.companyName;
      // Prefer clientOrderId (or fallback to orderNumber) aggregated from related orders
      let clientOrderId: string | undefined = undefined;
      for (const item of po.items) {
        const ord = item.assignedOrderItem?.orderItem?.order;
        if (ord?.clientOrderId) { clientOrderId = ord.clientOrderId; break; }
        if (!clientOrderId && ord?.orderNumber) { clientOrderId = ord.orderNumber; }
      }
      const orderId = clientOrderId || po.id;
      const invoice = po.vendorInvoice || null;
      const payment = po.payment || null;

      // Determine delivery verification from any GRN on related dispatches
      let delivery: DeliveryVerified = 'No';
      const anyGRNStatuses: Array<string | undefined> = [];
      for (const item of po.items) {
        for (const di of item.assignedOrderItem?.dispatchItems || []) {
          anyGRNStatuses.push(di.dispatch?.goodsReceiptNote?.status);
        }
      }
      if (anyGRNStatuses.some((s) => s === 'VERIFIED_OK')) delivery = 'Yes';
      else if (anyGRNStatuses.some((s) => s === 'VERIFIED_MISMATCH' || s === 'PARTIALLY_VERIFIED')) delivery = 'Partial';

      const invoiceNumber = invoice?.invoiceNumber || '-';
      // Prefer vendor invoice amount when present (>0), otherwise fall back to PO totalAmount
      const poTotalAmount = Number(po.totalAmount || 0);
      const vendorInvoiceAmount = Number(invoice?.invoiceAmount || 0);
      const invoiceAmount = vendorInvoiceAmount > 0 ? vendorInvoiceAmount : poTotalAmount;
      // Resolve presigned URLs for account/vendor invoice files if stored with s3Key
      const accountsUrl = invoice?.accountsAttachment
        ? (invoice.accountsAttachment.s3Key
            ? await s3Service.getPresignedUrl(invoice.accountsAttachment.s3Key)
            : invoice.accountsAttachment.s3Url)
        : undefined;
      const vendorUrl = invoice?.vendorAttachment
        ? (invoice.vendorAttachment.s3Key
            ? await s3Service.getPresignedUrl(invoice.vendorAttachment.s3Key)
            : invoice.vendorAttachment.s3Url)
        : undefined;
      const invoiceDate = invoice?.invoiceDate?.toISOString().slice(0, 10) || '';

      // Derive due date as +7 days from invoice date for UI (adjust as needed)
      const due = invoice?.invoiceDate
        ? new Date(invoice.invoiceDate.getTime() + 7 * 24 * 60 * 60 * 1000)
        : null;
      const dueDate = due ? due.toISOString().slice(0, 10) : '';

      // Map payment status to UI
      let uiStatus: PaymentStatusUI = 'Pending';
      const isReleased = payment?.status === 'COMPLETED';
      if (isReleased) uiStatus = 'Released';
      else if (!isReleased && due && today > due) uiStatus = 'Overdue';

      return {
        id: po.id,
        vendor: vendorName,
        orderId,
        invoiceNumber,
        invoiceAmount,
        deliveryVerified: delivery as DeliveryVerified,
        paymentStatus: uiStatus as PaymentStatusUI,
        invoiceDate,
        dueDate,
        releaseDate: payment?.processedAt ? payment.processedAt.toISOString().slice(0, 10) : undefined,
        referenceId: payment?.transactionId || undefined,
        accountsInvoiceUrl: accountsUrl,
        vendorInvoiceUrl: vendorUrl,
      };
    }));

    // Apply filters in-memory (can be moved to SQL if needed)
    const filtered = rows.filter((r) => {
      if (status && r.paymentStatus !== status) return false;
      if (deliveryVerified && r.deliveryVerified !== deliveryVerified) return false;
      return true;
    });

    return {
      items: filtered,
      pagination: { page, limit, total },
    };
  }

  static async editInvoiceAmount(purchaseOrderId: string, newAmount: number) {
    // Update VendorInvoice amount; if missing, no-op
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: { vendorInvoice: true },
    });
    if (!po?.vendorInvoice) return null;
    const updated = await prisma.vendorInvoice.update({
      where: { id: po.vendorInvoice.id },
      data: { invoiceAmount: newAmount },
    });
    return updated;
  }

  static async releasePayment(purchaseOrderId: string, referenceId: string, processedById: string) {
    const po = await prisma.purchaseOrder.findUnique({ where: { id: purchaseOrderId } });
    if (!po) return null;

    const processedAt = new Date();
    const payment = await prisma.payment.upsert({
      where: { purchaseOrderId: purchaseOrderId },
      update: {
        status: 'COMPLETED',
        transactionId: referenceId,
        processedById,
        processedAt,
      },
      create: {
        purchaseOrderId: purchaseOrderId,
        amount: po.totalAmount as any,
        status: 'COMPLETED',
        transactionId: referenceId,
        processedById,
        processedAt,
      },
    });
    return payment;
  }

  static async updateDeliveryStatus(purchaseOrderId: string, deliveryStatus: 'Yes' | 'No' | 'Partial') {
    // Find the purchase order and its related GRNs
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: purchaseOrderId },
      include: {
        items: {
          include: {
            assignedOrderItem: {
              include: {
                dispatchItems: {
                  include: {
                    dispatch: {
                      include: {
                        goodsReceiptNote: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!po) return null;

    // Map delivery status to GRN status
    let grnStatus: GRNStatus;
    switch (deliveryStatus) {
      case 'Yes':
        grnStatus = GRNStatus.VERIFIED_OK;
        break;
      case 'Partial':
        grnStatus = GRNStatus.PARTIALLY_VERIFIED;
        break;
      case 'No':
        grnStatus = GRNStatus.PENDING_VERIFICATION;
        break;
      default:
        grnStatus = GRNStatus.PENDING_VERIFICATION;
    }

    // Update all related GRNs
    const grnIds: string[] = [];
    for (const item of po.items) {
      for (const dispatchItem of item.assignedOrderItem?.dispatchItems || []) {
        if (dispatchItem.dispatch?.goodsReceiptNote?.id) {
          grnIds.push(dispatchItem.dispatch.goodsReceiptNote.id);
        }
      }
    }

    if (grnIds.length === 0) {
      // No GRNs found, this might be a PO without dispatches yet
      return { message: 'No GRNs found for this purchase order' };
    }

    // Update GRN statuses
    const updatedGRNs = await prisma.goodsReceiptNote.updateMany({
      where: { id: { in: grnIds } },
      data: {
        status: grnStatus,
        verifiedAt: deliveryStatus === 'Yes' ? new Date() : null,
        operatorRemarks: `Delivery status updated to ${deliveryStatus} by accounts team`,
      },
    });

    // Update GRN items statuses
    let grnItemStatus: GRNItemStatus;
    switch (deliveryStatus) {
      case 'Yes':
        grnItemStatus = GRNItemStatus.VERIFIED_OK;
        break;
      case 'Partial':
        grnItemStatus = GRNItemStatus.QUANTITY_MISMATCH;
        break;
      case 'No':
        grnItemStatus = GRNItemStatus.SHORTAGE_REPORTED;
        break;
      default:
        grnItemStatus = GRNItemStatus.SHORTAGE_REPORTED;
    }

    await prisma.goodsReceiptItem.updateMany({
      where: { goodsReceiptNoteId: { in: grnIds } },
      data: { status: grnItemStatus },
    });

    return {
      message: `Updated ${updatedGRNs.count} GRN(s) to status: ${grnStatus}`,
      grnIds,
      deliveryStatus,
    };
  }
}


