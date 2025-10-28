// Firebase Cloud Messaging service for frontend
// Handles FCM token registration and real-time notifications

import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, type Messaging } from 'firebase/messaging';

// Firebase configuration - these should come from environment variables
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// VAPID key for FCM (should come from environment)
const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

let app: any = null;
let messaging: Messaging | null = null;

/**
 * Initialize Firebase client SDK
 */
export function initializeFirebaseClient() {
  try {
    // Check if Firebase config is available
    if (!firebaseConfig.projectId) {
      console.warn('Firebase configuration not found, notifications will be disabled');
      return false;
    }

    if (app) {
      console.log('Firebase already initialized');
      return true;
    }

    // Initialize Firebase
    app = initializeApp(firebaseConfig);
    
    // Initialize messaging for web push notifications
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window) {
      messaging = getMessaging(app);
      console.log('Firebase client initialized successfully');
      return true;
    } else {
      console.warn('Push notifications not supported in this browser');
      return false;
    }
  } catch (error) {
    console.error('Firebase client initialization failed:', error);
    return false;
  }
}

/**
 * Request notification permission and get FCM token
 */
export async function getFCMToken(): Promise<string | null> {
  try {
    if (!messaging) {
      console.warn('Firebase messaging not initialized');
      return null;
    }

    // Check current permission status
    let permission = Notification.permission;
    
    // If permission is not yet determined, request it
    if (permission === 'default') {
      console.log('Requesting notification permission...');
      permission = await Notification.requestPermission();
    }

    if (permission === 'denied') {
      console.warn('❌ Notification permission denied by user. To enable notifications:');
      console.warn('1. Click the 🔒 lock icon in the address bar');
      console.warn('2. Set Notifications to "Allow"');
      console.warn('3. Refresh the page and try again');
      return null;
    }

    if (permission !== 'granted') {
      console.warn('Notification permission not granted:', permission);
      return null;
    }

    console.log('✅ Notification permission granted, getting FCM token...');

    // Get FCM token with better error handling
    const token = await getToken(messaging, {
      vapidKey: VAPID_KEY
    });

    if (token) {
      if (import.meta.env.DEV) {
        const masked = `${token.slice(0, 6)}…${token.slice(-4)}`;
        console.log('✅ FCM token obtained successfully:', masked);
      } else {
        console.log('✅ FCM token obtained successfully');
      }
      return token;
    } else {
      console.warn('⚠️ No FCM token available');
      console.warn('This could be due to:');
      console.warn('1. Service worker not registered properly');
      console.warn('2. Invalid Firebase configuration');
      console.warn('3. VAPID key mismatch');
      console.warn('4. Browser blocking push notifications');
      return null;
    }
  } catch (error) {
    console.error('❌ Error getting FCM token:', error);
    // Provide more specific error information
    if (error instanceof Error) {
      console.error('Error details:', error.message);
      
      // Provide helpful guidance based on error type
      if (error.message.includes('push service')) {
        console.error('💡 Push service error - This usually means:');
        console.error('  1. Check if firebase-messaging-sw.js has correct Firebase config');
        console.error('  2. Clear browser cache and reload');
        console.error('  3. Check browser console for service worker errors');
        console.error('  4. For development, FCM may not work in some browsers');
        console.error('  ℹ️  The app will continue to work, but push notifications will be disabled');
      }
    }
    return null;
  }
}

/**
 * Listen for foreground messages
 */
export function onForegroundMessage(callback: (payload: any) => void) {
  if (!messaging) {
    console.warn('Firebase messaging not initialized');
    return () => {};
  }

  return onMessage(messaging, (payload: any) => {
    console.log('Foreground message received:', payload);
    callback(payload);
  });
}

/**
 * Register service worker for background messages
 */
export async function registerServiceWorker() {
  try {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
      console.log('Service Worker registered:', registration);
      return registration;
    }
  } catch (error) {
    console.error('Service Worker registration failed:', error);
  }
  return null;
}

/**
 * Check if notifications are supported
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 
         'serviceWorker' in navigator && 
         'PushManager' in window &&
         'Notification' in window;
}

/**
 * Get current notification permission status
 */
export function getNotificationPermission(): NotificationPermission {
  if (!('Notification' in window)) {
    return 'default';
  }
  return Notification.permission;
}