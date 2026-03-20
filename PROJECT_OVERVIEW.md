# 🕸️ BP Peter Parker (BePeterParker) — The Ultimate System Guide

## 🎯 Project Vision & Aim
**BePeterParker** is a specialized **AI-Powered Personal Evolution System**. It's designed for individuals who want to treat their personal growth, technical learning, and hobby discovery like a high-level RPG. By bridging the gap between raw data (7+ APIs) and meaningful training (EDITH AI), it transforms static learning into a dynamic, rewarding "Hero's Journey."

---

## 🏗️ System Architectur### **The Modern Full-Stack Hub**
- **Frontend (The User Core):** A React 19 SPA (Single Page Application) built with **Vite**. It uses **Framer Motion** for a "Spider-Verse" experience (glassmorphism, radial glows, and spring-based transitions) and a custom **Service Worker** for PWA excellence.
- **Backend (The Mainframe):** An **Express.js** server optimized for **Vercel Serverless Functions**. It utilizes a **"Super-Safe" Lazy-Loading Architecture** to prevent cold-start crashes and ensure 99.9% uptime.
- **Database (The Spider-Base):** **Supabase (PostgreSQL)** managing everything from user profiles and stats to quest history and the specialized `push_subscriptions` table.
- **Bridge (The Vercel Layer):** A specialized entry point in `/api/index.js` that handles execution tracing and global error catching, providing detailed diagnostics if the mainframe encounters stability issues.

### **The Hero's Daily Flow**
1.  **Auth & Onboarding:** Secure **Email OTP** login and JWT-based session management.
2.  **Daily Snapshot:** Upon login, the backend checks if quests have been generated for the day. If not, the **Quest Assembly Pipeline** triggers using the **OpenRouter LLM Interface**.
3.  **Active Training:** 6 daily quests (Hard to Easy) are displayed on the **Dashboard**.
4.  **EDITH Interaction:** Users can chat with **EDITH** to get advice, context, or qualitative mission evaluation.
5.  **Skill Discovery:** Completed missions update the **D3 Knowledge Web**, visually expanding the user's expertise nodes.
6.  **Real-Time Alerts:** **Web Push Notifications** alert the user to new missions, streak milestones, and boss battles.

---

## 📂 Detailed Folder Structure

```bash
/
├── api/                        # Vercel Serverless Entry Point (The Bridge)
├── client/                     # Frontend Home
│   ├── public/                 # PWA Manifest, Icons, Service Worker (sw.js)
│   ├── src/
│   │   ├── api/                # client.js (Unified Fetch Wrapper)
│   │   ├── context/            # AuthContext (State & Permissions)
│   │   ├── pages/              # Login, Dashboard, Profile, Skills
│   │   └── services/           # NotificationService (Browser Push logic)
├── server/                     # Backend Mainframe
│   ├── db/                     # Supabase initialization & Lazy-load proxy
│   ├── middleware/             # auth.js (JWT Validation & Security)
│   ├── routes/                 # Express API Endpoints (Quests, Auth, Assistant, Notifications)
│   ├── services/               # Core Logic (edithEngine.js, llmQuestGenerator.js)
│   └── utils/                  # Helper functions (XP math, D3 mapping, Email OTP)
├── supabase/                   # Database Migrations & Schemas
├── vercel.json                 # Routing & SPA Fallback Logic
└── PROJECT_OVERVIEW.md         # You are here!
```

---

## 🤖 Inside E.D.I.T.H. (Even Dead, I'm The Hero)
EDITH isn't just a chatbot; she is the **game master**.

-   **Logic Engine:** She uses the **OpenRouter API** to access state-of-the-art LLMs (DeepSeek/Mistral).
-   **Context Awareness:** Her prompt is dynamically built to include the user's **Current Level**, **Active Tasks**, and **Existing Skills**.
-   **Resiliency:** Optimized for serverless execution; she only initializes when a user starts a dialogue, saving resources.
-   **Voice Input:** Integrated via the **Web Speech API** for seamless interaction.

---

## 🌐 API Ecosystem (Endpoints)

### **Authentication**
- `POST /api/auth/signup-request` & `signup-verify`: Email OTP flow.
- `POST /api/auth/login`: Conventional credential access with lazy security checks.
- `GET /api/auth/me`: Validates JWT and returns current session.

### **Quest Management**
- `GET /api/quests/daily`: Aggregates data from **NASA, Wiki, ArXiv, HN, Reddit, Open Library, and Numbers API**.
- `POST /api/quests/:id/complete`: Marks a mission as done and updates skill XP.
- `POST /api/quests/chaos`: Generates a high-difficulty, unpredictable quest.

### **Gamification & Stats**
- `GET /api/profile`: Returns total XP, Streak data, and Achievements.
- `GET /api/skills`: Returns the domain-mapped skill nodes for the D3 graph.

### **Notifications**
- `POST /api/notifications/subscribe`: Saves the browser's PushSubscription keys to the `push_subscriptions` table.
- `POST /api/notifications/test`: Instantly pings your device with a system notification verify connectivity.

---

## 🔨 Implementation Details & Tools
- **VAPID (Web Push):** A secure protocol for browser-to-server notifications (Requires `VAPID_PUBLIC_KEY` & `VAPID_PRIVATE_KEY`).
- **D3.js:** Used for the interactive, force-directed "Knowledge Web."
- **Framer Motion:** Powering the "Sense of Flow" in the UI.
- **Service Worker:** Manages offline resiliency and handles background push events.
- **Serverless Bridge:** Native Vercel integration for infinite scalability.

---

*“With great power, comes great responsibility—and a lot of XP.”*
de-Cron:** (Backend) Manages the midnight rotation of quests and daily events.

---

*“With great power, comes great responsibility—and a lot of XP.”*
