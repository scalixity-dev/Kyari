// Firebase Messaging Service Worker for handling background notifications

// Import Firebase scripts
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize Firebase in service worker
// Note: These values are from your .env file
const firebaseConfig = {
  apiKey: "AIzaSyDRsI9DDQ19B3p9qkSVORi1CzGQ3P0NawM",
  authDomain: "kyaari-oms.firebaseapp.com",
  projectId: "kyaari-oms",
  storageBucket: "kyaari-oms.firebasestorage.app",
  messagingSenderId: "305377911723",
  appId: "1:305377911723:web:e894780fc3dd45564aa8ee",
  measurementId: "G-XMPE9BE0HH"
};

firebase.initializeApp(firebaseConfig);

// Get messaging instance
const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('Background message received:', payload);

  const notificationTitle = payload.notification?.title || payload.data?.title || 'Kyari Notification';
  const notificationOptions = {
    body: payload.notification?.body || payload.data?.body || 'You have a new notification',
    icon: '/kyariLogoFavicon.jpg',
    badge: '/kyariLogoFavicon.jpg',
    tag: payload.data?.notificationId || 'default',
    data: payload.data,
    actions: [
      {
        action: 'view',
        title: 'View'
      },
      {
        action: 'dismiss',
        title: 'Dismiss'
      }
    ],
    requireInteraction: payload.data?.priority === 'URGENT',
    vibrate: payload.data?.priority === 'URGENT' ? [200, 100, 200] : [100]
  };

  // Show notification
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event);

  event.notification.close();

  if (event.action === 'dismiss') {
    return;
  }

  // Handle notification click - navigate to relevant page
  const data = event.notification.data;
  let urlToOpen = '/';

  if (data) {
    // Route to appropriate dashboard based on notification type
    switch (data.type) {
      case 'DISPATCH_CREATED':
        urlToOpen = '/operations/dispatch';
        break;
      case 'PAYMENT_RELEASED':
        urlToOpen = '/vendors/invoices';
        break;
      case 'ORDER_ASSIGNED':
        urlToOpen = '/vendors/orders';
        break;
      case 'INVOICE_CREATED':
        urlToOpen = '/vendors/invoices';
        break;
      case 'BROADCAST':
        urlToOpen = '/admin/notifications';
        break;
      default:
        urlToOpen = '/';
    }
  }

  // Open the app and navigate to the appropriate page
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Check if app is already open
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          client.postMessage({
            type: 'NOTIFICATION_CLICK',
            url: urlToOpen,
            data: data
          });
          return;
        }
      }
      
      // If app is not open, open it
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});

// Handle notification close
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification.tag);
});