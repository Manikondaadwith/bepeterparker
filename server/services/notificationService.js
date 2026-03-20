import webpush from 'web-push';
import 'dotenv/config';

const publicKey = process.env.VAPID_PUBLIC_KEY;
const privateKey = process.env.VAPID_PRIVATE_KEY;
const subject = process.env.VAPID_SUBJECT || 'mailto:example@example.com';

if (publicKey && privateKey) {
  webpush.setVapidDetails(subject, publicKey, privateKey);
}

export const sendPushNotification = async (subscription, payload) => {
  if (!publicKey || !privateKey) {
    console.error('VAPID keys not configured. Push notification skipped.');
    return;
  }

  try {
    const pushSubscription = {
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.p256dh,
        auth: subscription.auth
      }
    };

    await webpush.sendNotification(pushSubscription, JSON.stringify(payload));
    return { success: true };
  } catch (error) {
    if (error.statusCode === 404 || error.statusCode === 410) {
      // Subscription has expired or is no longer valid
      return { success: false, expired: true };
    }
    console.error('Error sending push notification:', error);
    throw error;
  }
};
