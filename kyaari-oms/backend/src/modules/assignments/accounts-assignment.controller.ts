import { Request, Response } from 'express'
import { accountsAssignmentService } from './accounts-assignment.service'
import { 
  accountsVendorOrderQuerySchema,
  validateSchema 
} from './accounts-assignment.validators'
import { ResponseHelper } from '../../utils/response'
import { logger } from '../../utils/logger'

export class AccountsAssignmentController {

  /**
   * Get all confirmed vendor orders for accounts team (GET /assignments/accounts/vendor-orders)
   */
  async getConfirmedVendorOrders(req: Request, res: Response): Promise<void> {
    try {
      // Validate query parameters
      const validation = validateSchema(accountsVendorOrderQuerySchema, req.query)
      if (!validation.success) {
        ResponseHelper.validationError(res, validation.errors)
        return
      }

      // Get confirmed vendor orders
      const result = await accountsAssignmentService.getConfirmedVendorOrders(validation.data)

      ResponseHelper.success(res, result)
    } catch (error) {
      logger.error('Get confirmed vendor orders controller error', { 
        error, 
        userId: (req as any).user?.userId,
        query: req.query 
      })
      ResponseHelper.error(res, error instanceof Error ? error.message : 'Failed to retrieve vendor orders')
    }
  }

  /**
   * Get single vendor order details for accounts team (GET /assignments/accounts/vendor-orders/:id)
   */
  async getVendorOrderById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params

      if (!id) {
        ResponseHelper.error(res, 'Vendor order ID is required', 400)
        return
      }

      // Get vendor order details
      const vendorOrder = await accountsAssignmentService.getVendorOrderById(id)

      if (!vendorOrder) {
        ResponseHelper.notFound(res, 'Vendor order not found')
        return
      }

      ResponseHelper.success(res, vendorOrder)
    } catch (error) {
      logger.error('Get vendor order details controller error', { 
        error, 
        userId: (req as any).user?.userId,
        vendorOrderId: req.params.id 
      })
      ResponseHelper.error(res, error instanceof Error ? error.message : 'Failed to retrieve vendor order details')
    }
  }
}

export const accountsAssignmentController = new AccountsAssignmentController()

