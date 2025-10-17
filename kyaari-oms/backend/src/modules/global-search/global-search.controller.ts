import { Request, Response } from 'express';
import { ResponseHelper } from '../../utils/response';
import { logger } from '../../utils/logger';
import { GlobalSearchService } from './global-search.service';
import { 
  GlobalSearchRequest, 
  GlobalSearchResponseDto, 
  AvailableEntityTypesResponseDto 
} from './global-search.dto';

export class GlobalSearchController {
  /**
   * POST /api/global-search/search
   * Perform global search across all accessible entities
   */
  static async search(req: Request, res: Response): Promise<void> {
    try {
      // Extract user information from authenticated request
      if (!req.user) {
        ResponseHelper.unauthorized(res, 'Authentication required');
        return;
      }

      const { userId, roles } = req.user;
      const searchFilters: GlobalSearchRequest = req.body;

      logger.info('Global search initiated', {
        userId,
        roles,
        query: searchFilters.query,
        entityTypes: searchFilters.entityTypes,
        page: searchFilters.page,
        limit: searchFilters.limit
      });

      // Perform search with role-based filtering
      const searchResults = await GlobalSearchService.search(
        searchFilters,
        roles || [],
        userId
      );

      const response: GlobalSearchResponseDto = {
        success: true,
        data: {
          results: searchResults.results,
          total: searchResults.total,
          page: searchResults.page,
          limit: searchResults.limit,
          entityTypes: searchResults.entityTypes
        },
        message: `Found ${searchResults.total} results for "${searchFilters.query}"`
      };

      logger.info('Global search completed', {
        userId,
        query: searchFilters.query,
        totalResults: searchResults.total,
        searchedEntityTypes: searchResults.entityTypes
      });

      ResponseHelper.success(res, response);
    } catch (error) {
      logger.error('Global search failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId,
        query: req.body?.query
      });
      ResponseHelper.internalError(res, 'Search failed. Please try again.');
    }
  }

  /**
   * GET /api/global-search/search
   * Perform global search using query parameters (alternative to POST)
   */
  static async searchByQuery(req: Request, res: Response): Promise<void> {
    try {
      // Extract user information from authenticated request
      if (!req.user) {
        ResponseHelper.unauthorized(res, 'Authentication required');
        return;
      }

      const { userId, roles } = req.user;
      const { q, types, page, limit } = req.query;

      // Convert query parameters to search filters
      const searchFilters: GlobalSearchRequest = {
        query: q as string,
        entityTypes: Array.isArray(types) ? types as string[] : types ? [types as string] : [],
        page: parseInt(page as string, 10) || 1,
        limit: parseInt(limit as string, 10) || 20
      };

      logger.info('Global search initiated via GET', {
        userId,
        roles,
        query: searchFilters.query,
        entityTypes: searchFilters.entityTypes,
        page: searchFilters.page,
        limit: searchFilters.limit
      });

      // Perform search with role-based filtering
      const searchResults = await GlobalSearchService.search(
        searchFilters,
        roles || [],
        userId
      );

      const response: GlobalSearchResponseDto = {
        success: true,
        data: {
          results: searchResults.results,
          total: searchResults.total,
          page: searchResults.page,
          limit: searchResults.limit,
          entityTypes: searchResults.entityTypes
        },
        message: `Found ${searchResults.total} results for "${searchFilters.query}"`
      };

      logger.info('Global search completed via GET', {
        userId,
        query: searchFilters.query,
        totalResults: searchResults.total,
        searchedEntityTypes: searchResults.entityTypes
      });

      ResponseHelper.success(res, response);
    } catch (error) {
      logger.error('Global search failed via GET', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId,
        query: req.query?.q
      });
      ResponseHelper.internalError(res, 'Search failed. Please try again.');
    }
  }

  /**
   * GET /api/global-search/entity-types
   * Get available entity types for search based on user roles
   */
  static async getAvailableEntityTypes(req: Request, res: Response): Promise<void> {
    try {
      // Extract user information from authenticated request
      if (!req.user) {
        ResponseHelper.unauthorized(res, 'Authentication required');
        return;
      }

      const { userId, roles } = req.user;

      logger.info('Fetching available entity types', {
        userId,
        roles
      });

      // Get available entity types based on user roles
      const availableEntityTypes = GlobalSearchService.getAvailableEntityTypes(roles || []);

      const response: AvailableEntityTypesResponseDto = {
        success: true,
        data: {
          entityTypes: availableEntityTypes
        },
        message: `Available entity types for your role(s): ${availableEntityTypes.join(', ')}`
      };

      logger.info('Available entity types fetched', {
        userId,
        roles,
        availableEntityTypes
      });

      ResponseHelper.success(res, response);
    } catch (error) {
      logger.error('Failed to fetch available entity types', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: req.user?.userId
      });
      ResponseHelper.internalError(res, 'Failed to fetch available entity types.');
    }
  }

  /**
   * GET /api/global-search/health
   * Health check endpoint for global search service
   */
  static async healthCheck(req: Request, res: Response): Promise<void> {
    try {
      const response = {
        success: true,
        data: {
          service: 'Global Search Service',
          status: 'healthy',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        },
        message: 'Global search service is operational'
      };

      ResponseHelper.success(res, response);
    } catch (error) {
      logger.error('Global search health check failed', {
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      ResponseHelper.internalError(res, 'Health check failed');
    }
  }
}
