const admin = require('firebase-admin');
const path = require('path');

let firebaseApp = null;

/**
 * Initialize Firebase Admin SDK
 *
 * Setup Instructions:
 * 1. Go to Firebase Console (https://console.firebase.google.com)
 * 2. Create a new project or select existing one
 * 3. Go to Project Settings > Service Accounts
 * 4. Click "Generate new private key"
 * 5. Save the JSON file as 'serviceAccountKey.json' in the configs folder
 */
const initializeFirebase = () => {
  if (firebaseApp) {
    return firebaseApp;
  }

  try {
    // Check if service account key exists
    const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');

    let serviceAccount;
    try {
      serviceAccount = require(serviceAccountPath);
    } catch (err) {
      console.warn('⚠️  Firebase service account key not found.');
      console.warn('   To enable push notifications:');
      console.warn('   1. Go to Firebase Console > Project Settings > Service Accounts');
      console.warn('   2. Generate new private key');
      console.warn('   3. Save as configs/serviceAccountKey.json');
      return null;
    }

    firebaseApp = admin.initializeApp({
      credential: admin.credential.cert(serviceAccount)
    });

    console.log('✅ Firebase Admin SDK initialized successfully');
    return firebaseApp;
  } catch (error) {
    console.error('❌ Failed to initialize Firebase:', error.message);
    return null;
  }
};

/**
 * Get Firebase Messaging instance
 */
const getMessaging = () => {
  if (!firebaseApp) {
    initializeFirebase();
  }

  if (!firebaseApp) {
    return null;
  }

  return admin.messaging();
};

/**
 * Send push notification to a single device
 * @param {string} token - FCM token
 * @param {object} payload - Notification payload
 */
const sendToDevice = async (token, payload) => {
  const messaging = getMessaging();
  if (!messaging) {
    console.warn('Firebase messaging not available');
    return null;
  }

  try {
    const message = {
      token,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
      webpush: {
        notification: {
          icon: payload.icon || '/icon-192x192.png',
          badge: '/badge-72x72.png',
          click_action: payload.clickAction || process.env.FRONTEND_URI
        }
      }
    };

    const response = await messaging.send(message);
    return response;
  } catch (error) {
    console.error('Failed to send notification to device:', error.message);
    throw error;
  }
};

/**
 * Send push notification to multiple devices
 * @param {string[]} tokens - Array of FCM tokens
 * @param {object} payload - Notification payload
 */
const sendToMultipleDevices = async (tokens, payload) => {
  const messaging = getMessaging();
  if (!messaging) {
    console.warn('Firebase messaging not available');
    return null;
  }

  if (!tokens || tokens.length === 0) {
    return { successCount: 0, failureCount: 0 };
  }

  try {
    const message = {
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
      webpush: {
        notification: {
          icon: payload.icon || '/icon-192x192.png',
          badge: '/badge-72x72.png',
          click_action: payload.clickAction || process.env.FRONTEND_URI
        }
      },
      tokens
    };

    const response = await messaging.sendEachForMulticast(message);
    return response;
  } catch (error) {
    console.error('Failed to send notifications to multiple devices:', error.message);
    throw error;
  }
};

/**
 * Send notification to a topic (for broadcasts)
 * @param {string} topic - Topic name
 * @param {object} payload - Notification payload
 */
const sendToTopic = async (topic, payload) => {
  const messaging = getMessaging();
  if (!messaging) {
    console.warn('Firebase messaging not available');
    return null;
  }

  try {
    const message = {
      topic,
      notification: {
        title: payload.title,
        body: payload.body,
      },
      data: payload.data || {},
      webpush: {
        notification: {
          icon: payload.icon || '/icon-192x192.png',
          badge: '/badge-72x72.png',
          click_action: payload.clickAction || process.env.FRONTEND_URI
        }
      }
    };

    const response = await messaging.send(message);
    return response;
  } catch (error) {
    console.error('Failed to send notification to topic:', error.message);
    throw error;
  }
};

/**
 * Subscribe tokens to a topic
 * @param {string[]} tokens - Array of FCM tokens
 * @param {string} topic - Topic name
 */
const subscribeToTopic = async (tokens, topic) => {
  const messaging = getMessaging();
  if (!messaging) return null;

  try {
    const response = await messaging.subscribeToTopic(tokens, topic);
    return response;
  } catch (error) {
    console.error('Failed to subscribe to topic:', error.message);
    throw error;
  }
};

/**
 * Unsubscribe tokens from a topic
 * @param {string[]} tokens - Array of FCM tokens
 * @param {string} topic - Topic name
 */
const unsubscribeFromTopic = async (tokens, topic) => {
  const messaging = getMessaging();
  if (!messaging) return null;

  try {
    const response = await messaging.unsubscribeFromTopic(tokens, topic);
    return response;
  } catch (error) {
    console.error('Failed to unsubscribe from topic:', error.message);
    throw error;
  }
};

module.exports = {
  initializeFirebase,
  getMessaging,
  sendToDevice,
  sendToMultipleDevices,
  sendToTopic,
  subscribeToTopic,
  unsubscribeFromTopic
};
