import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { supabase } from '../db/supabase.js';
import { sendPushNotification } from '../services/notificationService.js';

const router = express.Router();

// Subscribe to push notifications
router.post('/subscribe', authenticateToken, async (req, res) => {
  const { subscription } = req.body;
  if (!subscription || !subscription.endpoint || !subscription.keys) {
    return res.status(400).json({ error: 'Invalid subscription object' });
  }

  try {
    const { data, error } = await supabase
      .from('push_subscriptions')
      .upsert({
        user_id: req.user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth
      }, {
        onConflict: 'user_id, endpoint'
      });

    if (error) throw error;
    res.json({ message: 'Subscription saved successfully' });
  } catch (error) {
    console.error('Error saving push subscription:', error);
    res.status(500).json({ error: 'Failed to save subscription' });
  }
});

// Send a test notification to the current user
router.post('/test', authenticateToken, async (req, res) => {
  try {
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')
      .eq('user_id', req.user.id);

    if (error) throw error;
    if (!subscriptions || subscriptions.length === 0) {
      return res.status(404).json({ error: 'No active subscriptions found for this user' });
    }

    const payload = {
      title: 'Spider-Verse Test!',
      body: 'Your notification system is fully operational. Go get \'em, tiger!',
      icon: '/icons/icon-192x192.png',
      data: { url: '/dashboard' }
    };

    const results = await Promise.all(
      subscriptions.map(sub => sendPushNotification(sub, payload))
    );

    res.json({ message: 'Test notifications sent', results });
  } catch (error) {
    console.error('Error sending test push:', error);
    res.status(500).json({ error: 'Failed to send test notification' });
  }
});

export default router;
