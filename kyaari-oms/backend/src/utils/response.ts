import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

export class ResponseHelper {
  static success<T>(res: Response, data?: T, message?: string, statusCode: number = 200): void {
    const response: ApiResponse<T> = {
      success: true,
      ...(message && { message }),
      ...(data && { data }),
    };
    res.status(statusCode).json(response);
  }

  static error(res: Response, error: string, statusCode: number = 400): void {
    const response: ApiResponse = {
      success: false,
      error,
    };
    res.status(statusCode).json(response);
  }

  static validationError(res: Response, errors: Record<string, string[]>): void {
    const response: ApiResponse = {
      success: false,
      error: 'Validation failed',
      errors,
    };
    res.status(422).json(response);
  }

  static unauthorized(res: Response, message: string = 'Unauthorized'): void {
    this.error(res, message, 401);
  }

  static forbidden(res: Response, message: string = 'Forbidden'): void {
    this.error(res, message, 403);
  }

  static notFound(res: Response, message: string = 'Resource not found'): void {
    this.error(res, message, 404);
  }

  static internalError(res: Response, message: string = 'Internal server error'): void {
    this.error(res, message, 500);
  }
}