import { prisma } from '../../config/database';
import s3Service from '../../services/s3.service';
import { GRNStatus, GRNItemStatus, NotificationPriority } from '@prisma/client';
import { notificationService } from '../notifications/notification.service';
import { logger } from '../../utils/logger';

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
      // For mismatches/partial deliveries, align UI with PO items total; only trust vendor invoice for fully verified deliveries
      const poItemsTotal = po.items.reduce(
        (sum: number, it: { totalPrice?: unknown }) => sum + Number((it.totalPrice as number | string | undefined) ?? 0),
        0
      );
      const vendorInvoiceAmount = Number(invoice?.invoiceAmount || 0);
      const invoiceAmount = (delivery === 'Yes' && vendorInvoiceAmount > 0) ? vendorInvoiceAmount : poItemsTotal;
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

  static async getVendorsPaymentAging(vendorIds?: string[]) {
    // Fetch POs with invoice and payment for selected vendors (or all)
    const pos = await prisma.purchaseOrder.findMany({
      where: vendorIds && vendorIds.length > 0 ? { vendorId: { in: vendorIds } } : undefined,
      include: {
        vendor: true,
        vendorInvoice: true,
        payment: true,
        items: {
          include: {
            assignedOrderItem: {
              include: {
                dispatchItems: {
                  include: {
                    dispatch: {
                      include: { goodsReceiptNote: true }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    const byVendor: Record<string, {
      vendorId: string;
      vendorName: string;
      outstandingAmounts: number[];
      pendingDays: number[];
      oldestInvoiceDate: Date | null;
    }> = {};

    const todayMs = Date.now();

    for (const po of pos) {
      const vId = po.vendorId;
      const vName = po.vendor.companyName;
      const invoiceDate = po.vendorInvoice?.invoiceDate ?? null;
      // Determine delivery verification from any GRN on related dispatches (same as listPayments)
      let delivery: DeliveryVerified = 'No';
      const anyGRNStatuses: Array<string | undefined> = [];
      for (const item of po.items) {
        for (const di of (item.assignedOrderItem?.dispatchItems || [])) {
          anyGRNStatuses.push(di.dispatch?.goodsReceiptNote?.status);
        }
      }
      if (anyGRNStatuses.some((s) => s === 'VERIFIED_OK')) delivery = 'Yes';
      else if (anyGRNStatuses.some((s) => s === 'VERIFIED_MISMATCH' || s === 'PARTIALLY_VERIFIED')) delivery = 'Partial';

      // Amount selection: if fully verified and vendor invoice amount > 0, use it; otherwise sum of PO items totalPrice
      const poItemsTotal = po.items.reduce(
        (sum: number, it: { totalPrice?: unknown }) => sum + Number((it.totalPrice as number | string | undefined) ?? 0),
        0
      );
      const vendorInvoiceAmount = Number(po.vendorInvoice?.invoiceAmount || 0);
      const amount = (delivery === 'Yes' && vendorInvoiceAmount > 0) ? vendorInvoiceAmount : poItemsTotal;
      const isPaid = po.payment?.status === 'COMPLETED';

      if (!byVendor[vId]) {
        byVendor[vId] = {
          vendorId: vId,
          vendorName: vName,
          outstandingAmounts: [],
          pendingDays: [],
          oldestInvoiceDate: null,
        };
      }

      if (!isPaid && amount > 0) {
        byVendor[vId].outstandingAmounts.push(amount);
        if (invoiceDate) {
          const days = Math.max(0, Math.floor((todayMs - invoiceDate.getTime()) / (1000 * 60 * 60 * 24)));
          byVendor[vId].pendingDays.push(days);
          if (!byVendor[vId].oldestInvoiceDate || invoiceDate < byVendor[vId].oldestInvoiceDate!) {
            byVendor[vId].oldestInvoiceDate = invoiceDate;
          }
        }
      }
    }

    const result = Object.values(byVendor).map(v => {
      const outstandingAmount = v.outstandingAmounts.reduce((sum, x) => sum + x, 0);
      const avgPendingDays = v.pendingDays.length > 0
        ? Math.round(v.pendingDays.reduce((s, d) => s + d, 0) / v.pendingDays.length)
        : 0;
      return {
        vendorId: v.vendorId,
        vendorName: v.vendorName,
        outstandingAmount,
        avgPendingDays,
        oldestInvoiceDate: v.oldestInvoiceDate ? v.oldestInvoiceDate.toISOString().slice(0, 10) : null,
      };
    });

    return result;
  }

  static async getInvoiceCompliance(vendorIds?: string[]) {
    const pos = await prisma.purchaseOrder.findMany({
      where: vendorIds && vendorIds.length > 0 ? { vendorId: { in: vendorIds } } : undefined,
      include: {
        vendor: true,
        vendorInvoice: true,
        items: { select: { totalPrice: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    type VendorAgg = {
      vendorId: string;
      vendorName: string;
      totalInvoices: number;
      compliantInvoices: number;
      issuesFound: number;
    };

    const byVendor = new Map<string, VendorAgg>();

    for (const po of pos) {
      const vId = po.vendorId;
      const vName = po.vendor.companyName;
      if (!byVendor.has(vId)) {
        byVendor.set(vId, { vendorId: vId, vendorName: vName, totalInvoices: 0, compliantInvoices: 0, issuesFound: 0 });
      }
      const agg = byVendor.get(vId)!;

      // Only consider POs that have a vendor invoice record
      if (po.vendorInvoice) {
        agg.totalInvoices += 1;
        const poItemsTotal = po.items.reduce(
          (sum: number, it: { totalPrice?: unknown }) => sum + Number((it.totalPrice as number | string | undefined) ?? 0),
          0
        );
        const vendorInvoiceAmount = Number(po.vendorInvoice.invoiceAmount || 0);
        const isCompliant = Math.abs(vendorInvoiceAmount - poItemsTotal) < 0.5; // treat <50 paise as match
        if (isCompliant) {
          agg.compliantInvoices += 1;
        } else {
          agg.issuesFound += 1;
        }
      }
    }

    const vendors = Array.from(byVendor.values()).map(v => {
      const compliantPercentage = v.totalInvoices > 0 ? Math.round((v.compliantInvoices / v.totalInvoices) * 100) : 0;
      return {
        vendorId: v.vendorId,
        vendor: v.vendorName,
        totalInvoices: v.totalInvoices,
        compliantPercentage,
        issuesFound: v.issuesFound,
      };
    });

    const totals = vendors.reduce(
      (acc, v) => {
        acc.totalInvoices += v.totalInvoices;
        acc.totalCompliant += Math.round((v.compliantPercentage / 100) * v.totalInvoices);
        return acc;
      },
      { totalInvoices: 0, totalCompliant: 0 }
    );
    const overallComplianceRate = totals.totalInvoices > 0
      ? Math.round((totals.totalCompliant / totals.totalInvoices) * 100)
      : 0;

    return { vendors, overallComplianceRate };
  }

  static async getSlaBreaches() {
    // 1) Invoice Validation: time between VendorInvoice.createdAt and updatedAt for APPROVED invoices
    const invoices = await prisma.vendorInvoice.findMany({
      where: { status: 'APPROVED' },
      select: { createdAt: true, updatedAt: true }
    });
    const invoiceValidationDelays = invoices
      .map(iv => (iv.updatedAt.getTime() - iv.createdAt.getTime()) / (1000 * 60 * 60 * 24))
      .filter(d => isFinite(d) && d >= 0);
    const invoiceValidationCount = invoiceValidationDelays.length;
    const invoiceValidationAvg = invoiceValidationCount > 0
      ? Number((invoiceValidationDelays.reduce((s, d) => s + d, 0) / invoiceValidationCount).toFixed(1))
      : 0;

    // 2) Payment Release: time between VendorInvoice.invoiceDate and Payment.processedAt for completed payments
    const poWithPayments = await prisma.purchaseOrder.findMany({
      where: { payment: { isNot: null } },
      select: {
        vendorInvoice: { select: { invoiceDate: true } },
        payment: { select: { status: true, processedAt: true } },
      }
    });
    const paymentReleaseDelays = poWithPayments
      .filter(p => p.payment?.status === 'COMPLETED' && p.payment.processedAt && p.vendorInvoice?.invoiceDate)
      .map(p => ((p.payment!.processedAt!.getTime() - p.vendorInvoice!.invoiceDate!.getTime()) / (1000 * 60 * 60 * 24)))
      .filter(d => isFinite(d) && d >= 0);
    const paymentReleaseCount = paymentReleaseDelays.length;
    const paymentReleaseAvg = paymentReleaseCount > 0
      ? Number((paymentReleaseDelays.reduce((s, d) => s + d, 0) / paymentReleaseCount).toFixed(1))
      : 0;

    // 3) Delivery Confirmation: time between GoodsReceiptNote.receivedAt and verifiedAt
    const grns = await prisma.goodsReceiptNote.findMany({
      where: { verifiedAt: { not: null } },
      select: { receivedAt: true, verifiedAt: true }
    });
    const deliveryConfirmationDelays = grns
      .filter(g => g.receivedAt && g.verifiedAt)
      .map(g => ((g.verifiedAt!.getTime() - g.receivedAt.getTime()) / (1000 * 60 * 60 * 24)))
      .filter(d => isFinite(d) && d >= 0);
    const deliveryConfirmationCount = deliveryConfirmationDelays.length;
    const deliveryConfirmationAvg = deliveryConfirmationCount > 0
      ? Number((deliveryConfirmationDelays.reduce((s, d) => s + d, 0) / deliveryConfirmationCount).toFixed(1))
      : 0;

    // 4) Vendor Response Time: time between AssignedOrderItem.assignedAt and vendorActionAt
    const assignedItems = await prisma.assignedOrderItem.findMany({
      where: { vendorActionAt: { not: null } },
      select: { assignedAt: true, vendorActionAt: true }
    });
    const vendorResponseDelays = assignedItems
      .filter(a => a.assignedAt && a.vendorActionAt)
      .map(a => ((a.vendorActionAt!.getTime() - a.assignedAt.getTime()) / (1000 * 60 * 60 * 24)))
      .filter(d => isFinite(d) && d >= 0);
    const vendorResponseCount = vendorResponseDelays.length;
    const vendorResponseAvg = vendorResponseCount > 0
      ? Number((vendorResponseDelays.reduce((s, d) => s + d, 0) / vendorResponseCount).toFixed(1))
      : 0;

    const items = [
      { slaType: 'Invoice Validation', breachCount: invoiceValidationCount, avgDelayDays: invoiceValidationAvg },
      { slaType: 'Payment Release', breachCount: paymentReleaseCount, avgDelayDays: paymentReleaseAvg },
      { slaType: 'Delivery Confirmation', breachCount: deliveryConfirmationCount, avgDelayDays: deliveryConfirmationAvg },
      { slaType: 'Vendor Response Time', breachCount: vendorResponseCount, avgDelayDays: vendorResponseAvg },
    ];

    const totalBreaches = items.reduce((s, i) => s + i.breachCount, 0);
    const avgDelayAcrossAll = items.length > 0
      ? Number((items.reduce((s, i) => s + (i.avgDelayDays || 0), 0) / items.length).toFixed(1))
      : 0;

    return { items, totalBreaches, avgDelayAcrossAll };
  }

  static async getPaymentTrends(granularity: 'weekly' | 'monthly' | 'yearly' = 'weekly', periods = 4) {
    const now = new Date();

    type Period = { key: string; start: Date; end: Date; label: string };
    const periodsList: Period[] = [];

    const clone = (d: Date) => new Date(d.getTime());
    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

    if (granularity === 'weekly') {
      // Get start of current week (Mon)
      const cur = startOfDay(now);
      const day = cur.getDay();
      const diffToMon = (day + 6) % 7; // 0 for Mon
      cur.setDate(cur.getDate() - diffToMon);
      for (let i = periods - 1; i >= 0; i--) {
        const start = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() - i * 7);
        const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7);
        const weekNum = Math.ceil((((start.getTime() - new Date(start.getFullYear(), 0, 1).getTime()) / 86400000) + new Date(start.getFullYear(), 0, 1).getDay() + 1) / 7);
        periodsList.push({ key: `${start.getFullYear()}-W${weekNum}`, start, end, label: `W${weekNum}` });
      }
    } else if (granularity === 'monthly') {
      const cur = new Date(now.getFullYear(), now.getMonth(), 1);
      for (let i = periods - 1; i >= 0; i--) {
        const monthStart = new Date(cur.getFullYear(), cur.getMonth() - i, 1);
        const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
        const label = monthStart.toLocaleString('en-US', { month: 'short' });
        periodsList.push({ key: `${monthStart.getFullYear()}-${monthStart.getMonth() + 1}`, start: monthStart, end: monthEnd, label });
      }
    } else {
      const curYear = now.getFullYear();
      for (let i = periods - 1; i >= 0; i--) {
        const year = curYear - i;
        const start = new Date(year, 0, 1);
        const end = new Date(year + 1, 0, 1);
        periodsList.push({ key: `${year}`, start, end, label: `${year}` });
      }
    }

    // Fetch payments for released totals
    const payments = await prisma.payment.findMany({
      where: { status: 'COMPLETED', processedAt: { not: null, lte: periodsList[periodsList.length - 1].end } },
      select: { amount: true, processedAt: true }
    });

    // Fetch POs for pending totals (no or not-completed payment), created in any of the periods
    const earliestStart = periodsList[0].start;
    const pos = await prisma.purchaseOrder.findMany({
      where: {
        createdAt: { gte: earliestStart, lte: periodsList[periodsList.length - 1].end },
      },
      include: {
        payment: true,
        vendorInvoice: true,
        items: {
          include: {
            assignedOrderItem: {
              include: {
                dispatchItems: {
                  include: { dispatch: { include: { goodsReceiptNote: true } } }
                }
              }
            }
          }
        }
      }
    });

    const results = periodsList.map(p => ({ period: p.label, released: 0, pending: 0 }));

    const findIndexForDate = (d: Date | null | undefined) => {
      if (!d) return -1;
      const t = d.getTime();
      return periodsList.findIndex(pr => t >= pr.start.getTime() && t < pr.end.getTime());
    };

    // Released: sum of payments by processedAt
    for (const pay of payments) {
      const idx = findIndexForDate(pay.processedAt || null);
      if (idx >= 0) {
        results[idx].released += Number(pay.amount || 0);
      }
    }

    // Pending: sum of PO amount (using delivery logic) by PO.createdAt where payment not completed AND delivery fully verified
    for (const po of pos) {
      const isPaid = po.payment?.status === 'COMPLETED';
      if (isPaid) continue;
      const idx = findIndexForDate(po.createdAt);
      if (idx < 0) continue;

      // Determine delivery status from GRNs
      let delivery: DeliveryVerified = 'No';
      const anyGRNStatuses: Array<string | undefined> = [];
      for (const item of po.items) {
        for (const di of (item.assignedOrderItem?.dispatchItems || [])) {
          anyGRNStatuses.push(di.dispatch?.goodsReceiptNote?.status);
        }
      }
      if (anyGRNStatuses.some((s) => s === 'VERIFIED_OK')) delivery = 'Yes';
      else if (anyGRNStatuses.some((s) => s === 'VERIFIED_MISMATCH' || s === 'PARTIALLY_VERIFIED')) delivery = 'Partial';

      // Only count pending when fully verified
      if (delivery !== 'Yes') continue;

      const poItemsTotal = po.items.reduce(
        (sum: number, it: { totalPrice?: unknown }) => sum + Number((it.totalPrice as number | string | undefined) ?? 0),
        0
      );
      const vendorInvoiceAmount = Number(po.vendorInvoice?.invoiceAmount || 0);
      const amount = vendorInvoiceAmount > 0 ? vendorInvoiceAmount : poItemsTotal;

      results[idx].pending += amount;
    }

    return results;
  }

  static async getPaymentSummary(granularity: 'weekly' | 'monthly' | 'yearly' = 'weekly') {
    const now = new Date();
    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

    let start: Date;
    let end: Date;

    if (granularity === 'weekly') {
      const cur = startOfDay(now);
      const day = cur.getDay();
      const diffToMon = (day + 6) % 7;
      cur.setDate(cur.getDate() - diffToMon);
      start = cur;
      end = new Date(cur.getFullYear(), cur.getMonth(), cur.getDate() + 7);
    } else if (granularity === 'monthly') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    } else {
      start = new Date(now.getFullYear(), 0, 1);
      end = new Date(now.getFullYear() + 1, 0, 1);
    }

    const [payments, pos] = await Promise.all([
      prisma.payment.findMany({
        where: { status: 'COMPLETED', processedAt: { gte: start, lt: end } },
        select: { amount: true }
      }),
      prisma.purchaseOrder.findMany({
        where: { createdAt: { gte: start, lt: end } },
        include: {
          payment: true,
          vendorInvoice: true,
          items: {
            include: {
              assignedOrderItem: {
                include: {
                  dispatchItems: { include: { dispatch: { include: { goodsReceiptNote: true } } } }
                }
              }
            }
          }
        }
      })
    ]);

    const released = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    let pending = 0;
    for (const po of pos) {
      const isPaid = po.payment?.status === 'COMPLETED';
      if (isPaid) continue;
      let delivery: DeliveryVerified = 'No';
      const anyGRNStatuses: Array<string | undefined> = [];
      for (const item of po.items) {
        for (const di of (item.assignedOrderItem?.dispatchItems || [])) {
          anyGRNStatuses.push(di.dispatch?.goodsReceiptNote?.status);
        }
      }
      if (anyGRNStatuses.some((s) => s === 'VERIFIED_OK')) delivery = 'Yes';
      else if (anyGRNStatuses.some((s) => s === 'VERIFIED_MISMATCH' || s === 'PARTIALLY_VERIFIED')) delivery = 'Partial';

      // Only count pending when fully verified
      if (delivery !== 'Yes') continue;

      const poItemsTotal = po.items.reduce(
        (sum: number, it: { totalPrice?: unknown }) => sum + Number((it.totalPrice as number | string | undefined) ?? 0),
        0
      );
      const vendorInvoiceAmount = Number(po.vendorInvoice?.invoiceAmount || 0);
      const amount = vendorInvoiceAmount > 0 ? vendorInvoiceAmount : poItemsTotal;
      pending += amount;
    }

    return { released, pending };
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
    const po = await prisma.purchaseOrder.findUnique({ 
      where: { id: purchaseOrderId },
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
        },
        items: {
          select: { totalPrice: true }
        }
      }
    });
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
        amount: (po.items || []).reduce(
          (sum: number, it: { totalPrice?: unknown }) => sum + Number((it.totalPrice as number | string | undefined) ?? 0),
          0
        ) as any,
        status: 'COMPLETED',
        transactionId: referenceId,
        processedById,
        processedAt,
      },
    });

    // Send notification about payment release
    try {
      await notificationService.sendNotificationToUser(
        po.vendor.user.id,
        {
          title: 'Payment Released',
          body: `Payment for PO #${po.poNumber} has been released. Reference: ${referenceId}`,
          priority: NotificationPriority.URGENT,
          data: {
            purchaseOrderId,
            poNumber: po.poNumber,
            amount: 'released',
            referenceId,
            paymentId: payment.id
          }
        }
      );

      logger.info('Payment release notification sent successfully', {
        purchaseOrderId,
        vendorId: po.vendor.id,
        amount: payment.amount,
        referenceId
      });

    } catch (notificationError) {
      // Don't fail the payment release if notification fails
      logger.warn('Failed to send payment release notification', {
        purchaseOrderId,
        vendorId: po.vendor.id,
        error: notificationError instanceof Error ? notificationError.message : 'Unknown error'
      });
    }

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


