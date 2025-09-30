import { SignJWT, jwtVerify, JWTPayload } from 'jose';
import { env } from '../../config/env';
import { logger } from '../../utils/logger';

export interface TokenPayload extends JWTPayload {
  userId: string;
  email?: string;
  roles: string[];
  type: 'access' | 'refresh';
}

export interface RefreshTokenPayload extends JWTPayload {
  userId: string;
  family: string;
  type: 'refresh';
}

class JwtService {
  private secret: Uint8Array;

  constructor() {
    this.secret = new TextEncoder().encode(env.JWT_SECRET);
  }

  async generateAccessToken(payload: Omit<TokenPayload, 'type'>): Promise<string> {
    try {
      const token = await new SignJWT({ ...payload, type: 'access' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(env.ACCESS_TOKEN_TTL)
        .setIssuer('kyaari-oms')
        .setAudience('kyaari-oms-client')
        .sign(this.secret);

      return token;
    } catch (error) {
      logger.error('Failed to generate access token', { error, userId: payload.userId });
      throw new Error('Token generation failed');
    }
  }

  async generateRefreshToken(payload: Omit<RefreshTokenPayload, 'type'>): Promise<string> {
    try {
      const token = await new SignJWT({ ...payload, type: 'refresh' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime(env.REFRESH_TOKEN_TTL)
        .setIssuer('kyaari-oms')
        .setAudience('kyaari-oms-client')
        .sign(this.secret);

      return token;
    } catch (error) {
      logger.error('Failed to generate refresh token', { error, userId: payload.userId });
      throw new Error('Token generation failed');
    }
  }

  async verifyAccessToken(token: string): Promise<TokenPayload> {
    try {
      const { payload } = await jwtVerify(token, this.secret, {
        issuer: 'kyaari-oms',
        audience: 'kyaari-oms-client',
      });

      if (payload.type !== 'access') {
        throw new Error('Invalid token type');
      }

      return payload as TokenPayload;
    } catch (error) {
      logger.warn('Access token verification failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw new Error('Invalid or expired token');
    }
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload> {
    try {
      const { payload } = await jwtVerify(token, this.secret, {
        issuer: 'kyaari-oms',
        audience: 'kyaari-oms-client',
      });

      if (payload.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      return payload as RefreshTokenPayload;
    } catch (error) {
      logger.warn('Refresh token verification failed', { error: error instanceof Error ? error.message : 'Unknown error' });
      throw new Error('Invalid or expired refresh token');
    }
  }

  async getTokenPayload(token: string): Promise<TokenPayload | RefreshTokenPayload | null> {
    try {
      const { payload } = await jwtVerify(token, this.secret, {
        issuer: 'kyaari-oms',
        audience: 'kyaari-oms-client',
      });

      return payload as TokenPayload | RefreshTokenPayload;
    } catch (error) {
      return null;
    }
  }
}

export const jwtService = new JwtService();