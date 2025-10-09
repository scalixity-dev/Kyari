import { Router } from 'express';
import { GRNTicketingController } from './grn-ticketing.controller';
import { authenticate, requireRole } from '../../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route POST /api/grn/verify
 * @desc Process GRN verification and auto-create tickets for mismatches
 * @access Operations team only
 */
router.post('/verify', 
  requireRole(['OPS']),
  GRNTicketingController.processGRNVerification
);

/**
 * @route GET /api/grn/pending
 * @desc Get all pending GRNs for verification
 * @access Operations team only
 */
router.get('/pending', 
  requireRole(['OPS']),
  GRNTicketingController.getPendingGRNs
);

/**
 * @route GET /api/grn/:grnId
 * @desc Get GRN details with verification status
 * @access Operations team only
 */
router.get('/:grnId', 
  requireRole(['OPS']),
  GRNTicketingController.getGRNDetails
);

/**
 * @route GET /api/grn/:grnId/ticket
 * @desc Get ticket by GRN ID
 * @access Operations team only
 */
router.get('/:grnId/ticket', 
  requireRole(['OPS']),
  GRNTicketingController.getTicketByGRN
);

/**
 * @route PATCH /api/tickets/:ticketId/status
 * @desc Update ticket status
 * @access Operations team only
 */
router.patch('/tickets/:ticketId/status', 
  requireRole(['OPS']),
  GRNTicketingController.updateTicketStatus
);

export default router;