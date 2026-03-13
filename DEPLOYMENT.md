# 🕷️ Spider-Verse Quest Engine — Free Deployment Guide

This guide covers deploying for **free** as a website AND converting to a mobile app.

---

## Option A: Deploy as Website (100% Free)

### Architecture: Single Server on Render

Your app is set up so the **Express server serves both the API and the React frontend** in production. This means you only need ONE free service.

### Step-by-Step: Deploy to Render (Free Tier)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "deployment ready"
   git push origin main
   ```

2. **Go to [render.com](https://render.com)** and sign up (free, use GitHub login)

3. **Create a New Web Service**
   - Click **"New" → "Web Service"**
   - Connect your GitHub repo
   - Configure:

   | Setting | Value |
   |---------|-------|
   | **Name** | `spider-verse-quest-engine` |
   | **Region** | Pick closest to you |
   | **Branch** | `main` |
   | **Runtime** | `Node` |
   | **Build Command** | `npm run install:all && npm run build` |
   | **Start Command** | `npm start` |
   | **Instance Type** | **Free** |

4. **Add Environment Variables** (in Render dashboard → Environment):

   | Variable | Value |
   |----------|-------|
   | `JWT_SECRET` | Any random long string (e.g. `myspiderverseSecret!`) |
   | `CORS_ORIGINS` | `*` |
   | `NODE_ENV` | `production` |
   | `SUPABASE_URL` | Your Supabase Project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase Service Role Key |
   | `GMAIL_USER` | Your Gmail address |
   | `GMAIL_APP_PASSWORD` | The 16-character App Password |

5. **Click "Create Web Service"** — Render will build and deploy automatically.

6. **Your app will be live at** `https://spider-verse-quest-engine.onrender.com` (or whatever name you chose)

> ⚠️ **Note**: Render free tier spins down after 15 min of inactivity. First visit after that takes ~30 seconds to wake up. This is normal for free tier.

---

### Alternative: Split Deployment (Frontend on Vercel, Backend on Render)

If you want the frontend to be **always-fast** (no cold starts):

#### Backend → Render (same as above, but skip the build step)
- Build Command: `cd server && npm install`
- Start Command: `cd server && node server.js`
- Add all the env vars above, plus `CORS_ORIGINS=https://your-frontend.vercel.app`

#### Frontend → Vercel (free, instant)
1. Go to [vercel.com](https://vercel.com), sign up with GitHub
2. Import your repo
3. Set **Root Directory** to `client`
4. Set **Build Command** to `npm run build`
5. Set **Output Directory** to `dist`
6. Add environment variable:
   - `VITE_API_URL` = `https://your-backend.onrender.com/api`
7. Deploy!

---

## Option B: Convert to Mobile App (Free with Capacitor)

[Capacitor](https://capacitorjs.com) wraps your web app into a native Android/iOS shell. **It's free and open-source.**

### Step 1: Install Capacitor

```bash
cd client
npm install @capacitor/core @capacitor/cli
npx cap init "Spider-Verse Quest" "com.spiderverse.quest" --web-dir dist
```

### Step 2: Set API URL for Mobile

Create `client/.env.production` (or `.env` for all builds):
```
VITE_API_URL=https://your-backend.onrender.com/api
```

This tells the mobile app where your backend API lives (since mobile apps can't use relative URLs — they're not served from the same domain).

### Step 3: Build the Web App

```bash
npm run build
```

### Step 4: Add Android Platform

```bash
npm install @capacitor/android
npx cap add android
npx cap sync
```

### Step 5: Open in Android Studio

```bash
npx cap open android
```

This opens your project in Android Studio. From there you can:
- Run on an emulator
- Build an APK for sideloading
- Publish to Google Play

### Step 6 (Optional): Add iOS Platform

```bash
npm install @capacitor/ios
npx cap add ios
npx cap sync
npx cap open ios
```

> ⚠️ iOS requires a Mac with Xcode installed.

### Step 7 (Optional): Add Native Features

Capacitor has plugins for native mobile features:

```bash
# Status bar customization
npm install @capacitor/status-bar

# Haptic feedback
npm install @capacitor/haptics

# Secure storage (replace localStorage for tokens)
npm install @capacitor/preferences

# Push notifications 
npm install @capacitor/push-notifications

# Splash screen
npm install @capacitor/splash-screen
```

After installing plugins:
```bash
npx cap sync
```

---

## Option C: Progressive Web App (PWA) — Simplest Mobile Solution

Your app already has the PWA manifest set up! Users can **"Add to Home Screen"** on their phone and it'll look and feel like a native app.

### How users install it:
1. Visit your deployed website on their phone (Chrome/Safari)
2. **Chrome**: Tap the 3-dot menu → "Add to Home Screen"
3. **Safari (iOS)**: Tap the Share button → "Add to Home Screen"
4. App icon appears on home screen, opens full-screen without browser UI

### To enhance PWA experience, add a service worker:

Create `client/public/sw.js`:
```javascript
const CACHE_NAME = 'spiderverse-v1';
const STATIC_ASSETS = ['/', '/index.html'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
});

self.addEventListener('fetch', (event) => {
  // Only cache GET requests
  if (event.request.method !== 'GET') return;
  
  // Don't cache API calls
  if (event.request.url.includes('/api/')) return;
  
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request);
    })
  );
});
```

Register it in `client/src/main.jsx`:
```javascript
// At the bottom of main.jsx
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {});
  });
}
```

---

## Quick Reference: Environment Variables

### Server (`server/.env`)
| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (Render sets this automatically) |
| `JWT_SECRET` | **Yes** | Secret for signing JWT tokens |
| `SUPABASE_URL` | **Yes** | URL of your Supabase database |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Service role key for admin access |
| `GMAIL_USER` | **Yes** | Email used to send OTPs |
| `GMAIL_APP_PASSWORD` | **Yes** | 16-character App Password from Google |
| `CORS_ORIGINS` | No | Comma-separated allowed origins, or `*` for all |

### Client (`client/.env`)
| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | No | Full API URL. Leave empty when server serves client |

---

## Recommended Path

| Goal | Best Option |
|------|------------|
| **Just want a website** | Option A (Render, single service) |
| **Website + users can install on phone** | Option A + Option C (PWA) |
| **Need a real app on Play Store** | Deploy backend (Option A) + Capacitor (Option B) |
| **iOS App Store** | Same as above, but need a Mac + Apple Developer account ($99/yr) |

---

## Troubleshooting

### "Database Connection Errors"
Ensure that your `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are exact matches from your Supabase dashboard (Project Settings -> API). Do NOT use the `anon` key, as the backend needs service-level access to bypass Row Level Security.

### "OTP Emails are not sending"
Ensure `GMAIL_USER` is correct and `GMAIL_APP_PASSWORD` is precisely the 16-character string generated by Google without spaces. Make sure 2-Step Verification is turned on for your Google account.

### "CORS errors in browser"
Make sure `CORS_ORIGINS` env var on the server includes your frontend URL, e.g.:
```
CORS_ORIGINS=https://spider-verse-quest-engine.onrender.com,http://localhost:5173
```
Or use `*` to allow all origins.

### "API calls fail on mobile app"
Make sure `VITE_API_URL` is set to the full backend URL before building:
```
VITE_API_URL=https://spider-verse-quest-engine.onrender.com/api
```

### "App is slow to load on Render free tier"
Free tier instances sleep after 15 min of inactivity. Consider:
- Using [UptimeRobot](https://uptimerobot.com/) (free) to ping your app every 14 min
- Or upgrading to Render's $7/month tier
