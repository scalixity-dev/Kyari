import { Prisma } from '@prisma/client'
import { prisma } from '../../config/database'
import { logger } from '../../utils/logger'
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

        // TODO: Check if PO has been generated for this order/vendor combination
        // For now, defaulting to Pending
        const poStatus: 'Pending' | 'Generated' = 'Pending'
        
        // TODO: Check invoice status from invoices table
        // For now, defaulting to Not Created
        const invoiceStatus: 'Not Created' | 'Awaiting Validation' | 'Approved' = 'Not Created'

        vendorOrders.push({
          id: key,
          vendorId: firstAssignment.vendorId,
          vendorName: firstAssignment.vendor.companyName || 'Unknown Vendor',
          items,
          orderStatus,
          poStatus,
          invoiceStatus,
          orderDate: firstAssignment.orderItem.order.createdAt.toISOString().split('T')[0],
          confirmationDate: firstAssignment.vendorActionAt?.toISOString().split('T')[0] || '',
          orderNumber: firstAssignment.orderItem.order.orderNumber,
          orderId: firstAssignment.orderItem.order.id,
          totalAmount
        })
      })

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

      return {
        id,
        vendorId,
        vendorName: firstAssignment.vendor.companyName || 'Unknown Vendor',
        items,
        orderStatus: 'Confirmed',
        poStatus: 'Pending',
        invoiceStatus: 'Not Created',
        orderDate: firstAssignment.orderItem.order.createdAt.toISOString().split('T')[0],
        confirmationDate: firstAssignment.vendorActionAt?.toISOString().split('T')[0] || '',
        orderNumber: firstAssignment.orderItem.order.orderNumber,
        orderId: firstAssignment.orderItem.order.id,
        totalAmount
      }

    } catch (error) {
      logger.error('Failed to get vendor order by ID for accounts', { error, id })
      throw new Error('Failed to retrieve vendor order details')
    }
  }
}

export const accountsAssignmentService = new AccountsAssignmentService()

