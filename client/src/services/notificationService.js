import { api } from '../api/client';

const VAPID_PUBLIC_KEY = 'BNDMFGKr0AEDtmA38O76E39s8p4WAivWLYebtjWtpkM3QJxYUgzqtG1UWtsjbcfYqdvnHLyKal3L3zRQG_bVP4w';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const NotificationService = {
  async isSupported() {
    return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
  },

  async getPermissionStatus() {
    if (!this.isSupported()) return 'unsupported';
    return Notification.permission;
  },

  async requestPermission() {
    if (!this.isSupported()) return false;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  async subscribe() {
    try {
      if (!this.isSupported()) throw new Error('Notifications not supported');
      
      const registration = await navigator.serviceWorker.ready;
      
      // Check for existing subscription
      let subscription = await registration.pushManager.getSubscription();
      
      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
        });
      }

      // Send to backend
      const subJSON = subscription.toJSON();
      await api.subscribeToPush({
        endpoint: subJSON.endpoint,
        keys: {
            p256dh: subJSON.keys.p256dh,
            auth: subJSON.keys.auth
        }
      });

      return true;
    } catch (error) {
      console.error('Subscription failed:', error);
      throw error;
    }
  }
};
