import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.middleware';
import { GlobalSearchController } from './global-search.controller';
import { 
  validateGlobalSearch, 
  validateSearchQuery 
} from './global-search.validators';

const router = Router();

/**
 * @route POST /api/global-search/search
 * @desc Perform global search across all accessible entities
 * @access Private (requires authentication)
 * @body { query: string, entityTypes?: string[], page?: number, limit?: number }
 */
router.post(
  '/search',
  authenticate,
  validateGlobalSearch,
  GlobalSearchController.search
);

/**
 * @route GET /api/global-search/search
 * @desc Perform global search using query parameters (alternative to POST)
 * @access Private (requires authentication)
 * @query { q: string, types?: string[], page?: number, limit?: number }
 */
router.get(
  '/search',
  authenticate,
  validateSearchQuery,
  GlobalSearchController.searchByQuery
);

/**
 * @route GET /api/global-search/entity-types
 * @desc Get available entity types for search based on user roles
 * @access Private (requires authentication)
 */
router.get(
  '/entity-types',
  authenticate,
  GlobalSearchController.getAvailableEntityTypes
);

/**
 * @route GET /api/global-search/health
 * @desc Health check endpoint for global search service
 * @access Public
 */
router.get(
  '/health',
  GlobalSearchController.healthCheck
);

export default router;
