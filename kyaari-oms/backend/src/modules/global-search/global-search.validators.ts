import { Request, Response, NextFunction } from 'express';
import { ResponseHelper } from '../../utils/response';
import { VALID_ENTITY_TYPES } from './global-search.dto';

/**
 * Validate global search request
 */
export const validateGlobalSearch = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { query, entityTypes, page, limit } = req.body;

    // Validate query
    if (!query || typeof query !== 'string') {
      ResponseHelper.error(res, 'Search query is required and must be a string', 400);
      return;
    }

    if (query.trim().length < 2) {
      ResponseHelper.error(res, 'Search query must be at least 2 characters long', 400);
      return;
    }

    if (query.trim().length > 100) {
      ResponseHelper.error(res, 'Search query must not exceed 100 characters', 400);
      return;
    }

    // Validate entity types if provided
    if (entityTypes) {
      if (!Array.isArray(entityTypes)) {
        ResponseHelper.error(res, 'Entity types must be an array', 400);
        return;
      }

      const invalidTypes = entityTypes.filter(type => !VALID_ENTITY_TYPES.includes(type as any));
      if (invalidTypes.length > 0) {
        ResponseHelper.error(res, `Invalid entity types: ${invalidTypes.join(', ')}. Valid types are: ${VALID_ENTITY_TYPES.join(', ')}`, 400);
        return;
      }
    }

    // Validate pagination
    if (page !== undefined) {
      if (!Number.isInteger(page) || page < 1) {
        ResponseHelper.error(res, 'Page must be a positive integer', 400);
        return;
      }
    }

    if (limit !== undefined) {
      if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
        ResponseHelper.error(res, 'Limit must be a positive integer between 1 and 100', 400);
        return;
      }
    }

    // Sanitize and normalize the request
    req.body = {
      query: query.trim(),
      entityTypes: entityTypes || [],
      page: page || 1,
      limit: limit || 20
    };

    next();
  } catch (error) {
    ResponseHelper.internalError(res, 'Request validation failed');
  }
};

/**
 * Validate query parameter for GET requests
 */
export const validateSearchQuery = (req: Request, res: Response, next: NextFunction): void => {
  try {
    const { q, types, page, limit } = req.query;

    // Validate query parameter
    if (!q || typeof q !== 'string') {
      ResponseHelper.error(res, 'Query parameter "q" is required', 400);
      return;
    }

    if (q.trim().length < 2) {
      ResponseHelper.error(res, 'Query parameter "q" must be at least 2 characters long', 400);
      return;
    }

    if (q.trim().length > 100) {
      ResponseHelper.error(res, 'Query parameter "q" must not exceed 100 characters', 400);
      return;
    }

    // Validate entity types if provided
    if (types) {
      const entityTypes = Array.isArray(types) ? types : [types];
      const invalidTypes = entityTypes.filter((type: any) => !VALID_ENTITY_TYPES.includes(type));
      if (invalidTypes.length > 0) {
        ResponseHelper.error(res, `Invalid entity types: ${invalidTypes.join(', ')}. Valid types are: ${VALID_ENTITY_TYPES.join(', ')}`, 400);
        return;
      }
    }

    // Validate pagination
    if (page) {
      const pageNum = parseInt(page as string, 10);
      if (isNaN(pageNum) || pageNum < 1) {
        ResponseHelper.error(res, 'Page must be a positive integer', 400);
        return;
      }
    }

    if (limit) {
      const limitNum = parseInt(limit as string, 10);
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        ResponseHelper.error(res, 'Limit must be a positive integer between 1 and 100', 400);
        return;
      }
    }

    // Normalize query parameters
    req.query = {
      q: q.trim(),
      types: types || [],
      page: page || '1',
      limit: limit || '20'
    };

    next();
  } catch (error) {
    ResponseHelper.internalError(res, 'Query parameter validation failed');
  }
};
