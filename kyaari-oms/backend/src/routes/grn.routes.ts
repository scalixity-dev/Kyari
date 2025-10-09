import { Router } from 'express';
import grnController from '../controllers/grn.controller';
import { GRNTicketingController } from '../modules/grn/grn-ticketing.controller';
import { authenticate, requireRole } from '../middlewares/auth.middleware';
import { APP_CONSTANTS } from '../config/constants';

const router = Router();

// All GRN routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/grn
 * @desc    Create a new GRN (Goods Receipt Note)
 * @access  Operations team only
 */
router.post(
  '/',
  requireRole([APP_CONSTANTS.ROLES.OPS, APP_CONSTANTS.ROLES.ADMIN]),
  grnController.createGRN.bind(grnController)
);

/**
 * @route   GET /api/grn/:id
 * @desc    Get GRN details
 * @access  Authenticated users
 */
router.get('/:id', grnController.getGRNDetails.bind(grnController));

/**
 * @route   GET /api/grn
 * @desc    Get all GRNs with filters
 * @access  Authenticated users
 */
router.get('/', grnController.getGRNs.bind(grnController));

/**
 * @route POST /api/grn/verify
 * @desc Process GRN verification and auto-create tickets for mismatches
 * @access Operations team only
 */
router.post('/verify', 
  requireRole([APP_CONSTANTS.ROLES.OPS, APP_CONSTANTS.ROLES.ADMIN]),
  GRNTicketingController.processGRNVerification
);

/**
 * @route GET /api/grn/pending
 * @desc Get all pending GRNs for verification
 * @access Operations team only
 */
router.get('/pending', 
  requireRole([APP_CONSTANTS.ROLES.OPS, APP_CONSTANTS.ROLES.ADMIN]),
  GRNTicketingController.getPendingGRNs
);

/**
 * @route GET /api/grn/:grnId/ticket
 * @desc Get ticket by GRN ID
 * @access Operations team only
 */
router.get('/:grnId/ticket', 
  requireRole([APP_CONSTANTS.ROLES.OPS, APP_CONSTANTS.ROLES.ADMIN]),
  GRNTicketingController.getTicketByGRN
);

/**
 * @route PATCH /api/grn/tickets/:ticketId/status
 * @desc Update ticket status
 * @access Operations team only
 */
router.patch('/tickets/:ticketId/status', 
  requireRole([APP_CONSTANTS.ROLES.OPS, APP_CONSTANTS.ROLES.ADMIN]),
  GRNTicketingController.updateTicketStatus
);

export default router;
