import * as admin from 'firebase-admin';
import { env } from './env';
import { logger } from '../utils/logger';
import path from 'path';

/**
 * Firebase Admin SDK Configuration
 * 
 * Initializes Firebase Admin SDK for server-side operations
 * including push notifications via FCM
 */

let firebaseApp: admin.app.App | null = null;
let fcmInstance: admin.messaging.Messaging | null = null;

/**
 * Initialize Firebase Admin SDK
 */
export function initializeFirebase(): boolean {
  try {
    // Skip initialization if notifications are disabled
    if (!env.NOTIFICATION_ENABLED) {
      logger.info('Firebase notifications are disabled via environment configuration');
      return false;
    }

    // Validate required environment variables
    if (!env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH || !env.FIREBASE_PROJECT_ID) {
      logger.warn('Firebase configuration incomplete - notifications will be disabled', {
        hasKeyPath: !!env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH,
        hasProjectId: !!env.FIREBASE_PROJECT_ID
      });
      return false;
    }

    // Resolve service account key path
    const serviceAccountPath = path.resolve(env.FIREBASE_SERVICE_ACCOUNT_KEY_PATH);
    
    // Check if already initialized
    if (firebaseApp) {
      logger.info('Firebase Admin SDK already initialized');
      return true;
    }

    // Load service account credentials
    let serviceAccount: admin.ServiceAccount;
    try {
      serviceAccount = require(serviceAccountPath);
    } catch (error) {
      logger.error('Failed to load Firebase service account key', {
        path: serviceAccountPath,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }

    // Validate service account structure
    if (!serviceAccount.projectId || !serviceAccount.clientEmail || !serviceAccount.privateKey) {
      logger.error('Invalid Firebase service account key structure');
      return false;
    }

    // Check for mock credentials (development safety)
    if (serviceAccount.privateKey.includes('MOCK_PRIVATE_KEY_FOR_DEVELOPMENT_ONLY')) {
      logger.warn('Using mock Firebase credentials - notifications will be simulated only');
      
      // In development with mock credentials, create a mock app
      if (env.NODE_ENV === 'development') {
        logger.info('Firebase initialized in mock mode for development');
        return true;
      } else {
        logger.error('Mock Firebase credentials detected in non-development environment');
        return false;
      }
    }

    // Initialize Firebase Admin SDK
    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
      projectId: env.FIREBASE_PROJECT_ID,
    });

    // Initialize FCM
    fcmInstance = admin.messaging();

    logger.info('Firebase Admin SDK initialized successfully', {
      projectId: env.FIREBASE_PROJECT_ID,
      serviceAccount: serviceAccount.clientEmail
    });

    return true;

  } catch (error) {
    logger.error('Firebase Admin SDK initialization failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return false;
  }
}

/**
 * Get Firebase Cloud Messaging instance
 */
export function getFCM(): admin.messaging.Messaging | null {
  if (!env.NOTIFICATION_ENABLED) {
    return null;
  }

  if (!fcmInstance && firebaseApp) {
    fcmInstance = admin.messaging();
  }

  return fcmInstance;
}

/**
 * Check if Firebase is available and properly configured
 */
export function isFirebaseAvailable(): boolean {
  return env.NOTIFICATION_ENABLED && (!!firebaseApp || env.NODE_ENV === 'development');
}

/**
 * Get Firebase app instance
 */
export function getFirebaseApp(): admin.app.App | null {
  return firebaseApp;
}

/**
 * Graceful shutdown of Firebase
 */
export async function shutdownFirebase(): Promise<void> {
  try {
    if (firebaseApp) {
      await firebaseApp.delete();
      firebaseApp = null;
      fcmInstance = null;
      logger.info('Firebase Admin SDK shut down gracefully');
    }
  } catch (error) {
    logger.error('Error during Firebase shutdown', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

/**
 * Firebase configuration constants
 */
export const FIREBASE_CONFIG = {
  BATCH_SIZE: env.NOTIFICATION_BATCH_SIZE,
  RETRY_ATTEMPTS: env.NOTIFICATION_RETRY_ATTEMPTS,
  TOKEN_EXPIRY_DAYS: env.NOTIFICATION_TOKEN_EXPIRY_DAYS,
  PROJECT_ID: env.FIREBASE_PROJECT_ID,
} as const;

// Auto-initialize on module load
initializeFirebase();