import { Prisma } from '@prisma/client'
import { prisma } from '../../config/database'
import { logger } from '../../utils/logger'
import s3Service from '../../services/s3.service'
import type {
  AccountsVendorOrderDto,
  AccountsVendorOrderListResponseDto,
  AccountsAssignmentQueryDto,
  AccountsVendorOrderItemDto
} from './accounts-assignment.dto'

export class AccountsAssignmentService {

  /**
   * Get all confirmed vendor orders for accounts team
   * Groups assignments by order number and vendor
   */
  async getConfirmedVendorOrders(
    query: AccountsAssignmentQueryDto
  ): Promise<AccountsVendorOrderListResponseDto> {
    try {
      const {
        page = 1,
        limit = 10,
        vendorId,
        vendorName,
        startDate,
        endDate,
        orderNumber
      } = query

      const offset = (page - 1) * limit

      // Build where clause for confirmed assignments
      const where: Prisma.AssignedOrderItemWhereInput = {
        status: {
          in: ['VENDOR_CONFIRMED_FULL', 'VENDOR_CONFIRMED_PARTIAL']
        }
      }

      if (vendorId) {
        where.vendorId = vendorId
      }

      if (orderNumber) {
        where.orderItem = {
          order: {
            orderNumber: {
              contains: orderNumber,
              mode: 'insensitive'
            }
          }
        }
      }

      if (startDate || endDate) {
        where.vendorActionAt = {}
        if (startDate) {
          where.vendorActionAt.gte = startDate
        }
        if (endDate) {
          where.vendorActionAt.lte = endDate
        }
      }

      // Get all confirmed assignments
      const assignments = await prisma.assignedOrderItem.findMany({
        where,
        include: {
          vendor: {
            select: {
              id: true,
              companyName: true,
              contactPersonName: true
            }
          },
          orderItem: {
            include: {
              order: {
                select: {
                  id: true,
                  clientOrderId: true,
                  orderNumber: true,
                  status: true,
                  createdAt: true
                }
              }
            }
          }
        },
        orderBy: [
          { vendorActionAt: 'desc' }
        ]
      })

      // Filter by vendor name if provided
      const filteredAssignments = vendorName
        ? assignments.filter(a => 
            a.vendor.companyName?.toLowerCase().includes(vendorName.toLowerCase())
          )
        : assignments

      // Group assignments by order number + vendor
      const orderMap = new Map<string, typeof filteredAssignments>()
      
      filteredAssignments.forEach(assignment => {
        const key = `${assignment.orderItem.order.orderNumber}-${assignment.vendorId}`
        const existing = orderMap.get(key) || []
        orderMap.set(key, [...existing, assignment])
      })

      // Transform to vendor orders
      const vendorOrders: AccountsVendorOrderDto[] = []
      
      orderMap.forEach((assignmentGroup, key) => {
        const firstAssignment = assignmentGroup[0]
        
        // Map items and calculate total amount
        const items: AccountsVendorOrderItemDto[] = assignmentGroup.map(assignment => ({
          sku: assignment.orderItem.sku || 'N/A',
          product: assignment.orderItem.productName,
          qty: assignment.assignedQuantity,
          confirmedQty: assignment.confirmedQuantity || 0
        }))

        // Calculate total amount based on confirmed quantities and prices
        const totalAmount = assignmentGroup.reduce((sum, assignment) => {
          const confirmedQty = assignment.confirmedQuantity || assignment.assignedQuantity
          const pricePerUnit = assignment.orderItem.pricePerUnit ? Number(assignment.orderItem.pricePerUnit) : 0
          return sum + (confirmedQty * pricePerUnit)
        }, 0)

        // Determine order status based on assignment statuses
        const allFullyConfirmed = assignmentGroup.every(a => a.status === 'VENDOR_CONFIRMED_FULL')
        const hasPartialConfirmed = assignmentGroup.some(a => a.status === 'VENDOR_CONFIRMED_PARTIAL')
        
        let orderStatus: AccountsVendorOrderDto['orderStatus'] = 'Confirmed'
        if (hasPartialConfirmed) {
          orderStatus = 'Confirmed' // Still confirmed, just partial
        } else if (allFullyConfirmed) {
          orderStatus = 'Confirmed'
        }

        vendorOrders.push({
          id: key,
          vendorId: firstAssignment.vendorId,
          vendorName: firstAssignment.vendor.companyName || 'Unknown Vendor',
          items,
          orderStatus,
          poStatus: 'Pending', // Will be set later after batch check
          invoiceStatus: 'Not Created', // Will be set later after batch check
          orderDate: firstAssignment.orderItem.order.createdAt.toISOString().split('T')[0],
          confirmationDate: firstAssignment.vendorActionAt?.toISOString().split('T')[0] || '',
          orderNumber: firstAssignment.orderItem.order.orderNumber,
          orderId: firstAssignment.orderItem.order.clientOrderId,
          totalAmount,
          poNumber: null, // Will be set later after batch check
          accountInvoiceUrl: null,
          vendorInvoiceUrl: null
        })
      })

      // Batch check for PO and Invoice status
      const uniqueVendorIds = vendorOrders.map(vo => vo.vendorId)

      // Get all purchase orders for these orders and vendors
      const purchaseOrders = await prisma.purchaseOrder.findMany({
        where: {
          vendorId: { in: uniqueVendorIds }
        },
        include: {
          vendorInvoice: {
            include: {
              accountsAttachment: true,
              vendorAttachment: true
            }
          }
        }
      })

      // Update each vendor order with actual PO and invoice status
      // Using Promise.all to handle async presigned URL generation
      await Promise.all(vendorOrders.map(async (vo) => {
        const matchingPO = purchaseOrders.find(po => 
          po.vendorId === vo.vendorId && po.poNumber.includes(vo.orderNumber)
        )

        if (matchingPO) {
          vo.poStatus = 'Generated'
          vo.poNumber = matchingPO.poNumber
          
          if (matchingPO.vendorInvoice) {
            // Set invoice ID for fetching JSON data
            vo.invoiceId = matchingPO.vendorInvoice.id
            
            // Set invoice file URLs from separate attachment fields - use presigned URLs
            if (matchingPO.vendorInvoice.accountsAttachment?.s3Key) {
              try {
                vo.accountInvoiceUrl = await s3Service.getPresignedUrl(
                  matchingPO.vendorInvoice.accountsAttachment.s3Key
                )
              } catch (error) {
                logger.error('Failed to generate presigned URL for accounts attachment', { 
                  error, 
                  s3Key: matchingPO.vendorInvoice.accountsAttachment.s3Key 
                })
                vo.accountInvoiceUrl = null
              }
            }
            
            if (matchingPO.vendorInvoice.vendorAttachment?.s3Key) {
              try {
                vo.vendorInvoiceUrl = await s3Service.getPresignedUrl(
                  matchingPO.vendorInvoice.vendorAttachment.s3Key
                )
              } catch (error) {
                logger.error('Failed to generate presigned URL for vendor attachment', { 
                  error, 
                  s3Key: matchingPO.vendorInvoice.vendorAttachment.s3Key 
                })
                vo.vendorInvoiceUrl = null
              }
            }
            
            // Check invoice status based on attachments
            if (matchingPO.vendorInvoice.status === 'APPROVED') {
              vo.invoiceStatus = 'Approved'
            } else if (matchingPO.vendorInvoice.accountsAttachmentId || matchingPO.vendorInvoice.vendorAttachmentId) {
              vo.invoiceStatus = 'Awaiting Validation'
            } else {
              vo.invoiceStatus = 'Not Created'
            }
          }
        }
      }))

      // Apply additional filters
      let filteredOrders = vendorOrders

      if (query.orderStatus) {
        filteredOrders = filteredOrders.filter(o => o.orderStatus === query.orderStatus)
      }

      if (query.poStatus) {
        filteredOrders = filteredOrders.filter(o => o.poStatus === query.poStatus)
      }

      if (query.invoiceStatus) {
        filteredOrders = filteredOrders.filter(o => o.invoiceStatus === query.invoiceStatus)
      }

      // Sort by confirmation date (most recent first)
      filteredOrders.sort((a, b) => {
        const dateA = new Date(a.confirmationDate)
        const dateB = new Date(b.confirmationDate)
        return dateB.getTime() - dateA.getTime()
      })

      // Paginate
      const total = filteredOrders.length
      const paginatedOrders = filteredOrders.slice(offset, offset + limit)

      return {
        orders: paginatedOrders,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      }

    } catch (error) {
      logger.error('Failed to get confirmed vendor orders for accounts', { error, query })
      throw new Error('Failed to retrieve vendor orders')
    }
  }

  /**
   * Get single vendor order details for accounts team
   */
  async getVendorOrderById(
    id: string
  ): Promise<AccountsVendorOrderDto | null> {
    try {
      // id format: "orderNumber-vendorId"
      const [orderNumber, vendorId] = id.split('-')

      if (!orderNumber || !vendorId) {
        return null
      }

      const assignments = await prisma.assignedOrderItem.findMany({
        where: {
          vendorId,
          status: {
            in: ['VENDOR_CONFIRMED_FULL', 'VENDOR_CONFIRMED_PARTIAL']
          },
          orderItem: {
            order: {
              orderNumber
            }
          }
        },
        include: {
          vendor: {
            select: {
              id: true,
              companyName: true
            }
          },
          orderItem: {
            include: {
              order: {
                select: {
                  id: true,
                  clientOrderId: true,
                  orderNumber: true,
                  status: true,
                  createdAt: true
                }
              }
            }
          }
        }
      })

      if (assignments.length === 0) {
        return null
      }

      const firstAssignment = assignments[0]

      const items: AccountsVendorOrderItemDto[] = assignments.map(assignment => ({
        sku: assignment.orderItem.sku || 'N/A',
        product: assignment.orderItem.productName,
        qty: assignment.assignedQuantity,
        confirmedQty: assignment.confirmedQuantity || 0
      }))

      // Calculate total amount based on confirmed quantities and prices
      const totalAmount = assignments.reduce((sum, assignment) => {
        const confirmedQty = assignment.confirmedQuantity || assignment.assignedQuantity
        const pricePerUnit = assignment.orderItem.pricePerUnit ? Number(assignment.orderItem.pricePerUnit) : 0
        return sum + (confirmedQty * pricePerUnit)
      }, 0)

      // Check for actual PO and invoice status
      const actualOrderNumber = firstAssignment.orderItem.order.orderNumber
      const matchingPO = await prisma.purchaseOrder.findFirst({
        where: {
          vendorId,
          poNumber: {
            contains: actualOrderNumber
          }
        },
        include: {
          vendorInvoice: {
            include: {
              accountsAttachment: true,
              vendorAttachment: true
            }
          }
        }
      })

      let poStatus: 'Pending' | 'Generated' = 'Pending'
      let invoiceStatus: 'Not Created' | 'Awaiting Validation' | 'Approved' = 'Not Created'
      let accountInvoiceUrl: string | null = null
      let vendorInvoiceUrl: string | null = null
      let invoiceId: string | null = null
      let poNumber: string | null = null

      if (matchingPO) {
        poStatus = 'Generated'
        poNumber = matchingPO.poNumber
        
        if (matchingPO.vendorInvoice) {
          // Set invoice ID for fetching JSON data
          invoiceId = matchingPO.vendorInvoice.id
          
          // Set invoice file URLs from separate attachment fields - use presigned URLs
          if (matchingPO.vendorInvoice.accountsAttachment?.s3Key) {
            try {
              accountInvoiceUrl = await s3Service.getPresignedUrl(
                matchingPO.vendorInvoice.accountsAttachment.s3Key
              )
            } catch (error) {
              logger.error('Failed to generate presigned URL for accounts attachment', { 
                error, 
                s3Key: matchingPO.vendorInvoice.accountsAttachment.s3Key 
              })
            }
          }
          
          if (matchingPO.vendorInvoice.vendorAttachment?.s3Key) {
            try {
              vendorInvoiceUrl = await s3Service.getPresignedUrl(
                matchingPO.vendorInvoice.vendorAttachment.s3Key
              )
            } catch (error) {
              logger.error('Failed to generate presigned URL for vendor attachment', { 
                error, 
                s3Key: matchingPO.vendorInvoice.vendorAttachment.s3Key 
              })
            }
          }
          
          if (matchingPO.vendorInvoice.status === 'APPROVED') {
            invoiceStatus = 'Approved'
          } else if (matchingPO.vendorInvoice.accountsAttachmentId || matchingPO.vendorInvoice.vendorAttachmentId) {
            invoiceStatus = 'Awaiting Validation'
          } else {
            invoiceStatus = 'Not Created'
          }
        }
      }

      return {
        id,
        vendorId,
        vendorName: firstAssignment.vendor.companyName || 'Unknown Vendor',
        items,
        orderStatus: 'Confirmed',
        poStatus,
        invoiceStatus,
        orderDate: firstAssignment.orderItem.order.createdAt.toISOString().split('T')[0],
        confirmationDate: firstAssignment.vendorActionAt?.toISOString().split('T')[0] || '',
        orderNumber: firstAssignment.orderItem.order.orderNumber,
        orderId: firstAssignment.orderItem.order.clientOrderId,
        totalAmount,
        poNumber,
        accountInvoiceUrl,
        vendorInvoiceUrl,
        invoiceId
      }

    } catch (error) {
      logger.error('Failed to get vendor order by ID for accounts', { error, id })
      throw new Error('Failed to retrieve vendor order details')
    }
  }
}

export const accountsAssignmentService = new AccountsAssignmentService()

