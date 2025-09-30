// Type augmentation for Express Request
declare namespace Express {
  interface Request {
    user?: {
      userId: string;
      email?: string;
      roles: string[];
      type: 'access' | 'refresh';
      iat?: number;
      exp?: number;
      iss?: string;
      aud?: string | string[];
    };
  }
}