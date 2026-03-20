# 🕸️ BP Peter Parker (BePeterParker) — The Ultimate System Guide

## 🎯 Project Vision & Aim
**BePeterParker** is a specialized **AI-Powered Personal Evolution System**. It's designed for individuals who want to treat their personal growth, technical learning, and hobby discovery like a high-level RPG. By bridging the gap between raw data (7+ APIs) and meaningful training (EDITH AI), it transforms static learning into a dynamic, rewarding "Hero's Journey."

---

## 🏗️ System Architecture & Workflow

### **The Modern Full-Stack Hub**
- **Frontend (The User Core):** A React 19 SPA (Single Page Application) built with **Vite**. It uses **Framer Motion** for a "Spider-Verse" felt experience (glassmorphism, radial glows, and spring-based transitions).
- **Backend (The Mainframe):** An **Express.js** server using **ES Modules**. This handles the heavy lifting of LLM prompt engineering, daily quest aggregation, and security.
- **Database (The Spider-Base):** **Supabase (PostgreSQL)** manage everything from user profiles and stats to quest history and push notification subscriptions.
- **PWA (Progressive Web App):** A custom **Service Worker** handles offline caching and background push notifications, making the app feel native on iOS/Android.

### **The Hero's Daily Flow**
1.  **Auth & Onboarding:** Secure **Email OTP** login.
2.  **Daily Snapshot:** Upon login, the backend checks if quests have been generated for the day. If not, the **Quest Assembly Pipeline** triggers.
3.  **Active Training:** 6 daily quests (Hard to Easy) are displayed on the **Dashboard**.
4.  **EDITH Interaction:** Users can chat with **EDITH** to get advice or context.
5.  **Qualitative Evaluation:** Mission responses are sent to EDITH, who evaluates them and awards XP based on effort.
6.  **Skill Discovery:** Completed missions update the **D3 Knowledge Web**, visually expanding the user's expertise nodes.

---

## 📂 Detailed Folder Structure

```bash
/
├── client/                     # Frontend Home
│   ├── public/                 # PWA Manifest, Icons, Service Worker (sw.js)
│   ├── src/
│   │   ├── api/                # client.js (Unified Fetch Wrapper)
│   │   ├── components/         # UI Elements (EdithAssistant, QuestGrid, SkillMap)
│   │   ├── context/            # AuthContext (State & Permissions)
│   │   ├── pages/              # Login, Dashboard, Profile, Skills
│   │   └── services/           # NotificationService (Browser Push logic)
├── server/                     # Backend Mainframe
│   ├── db/                     # Migrations & Supabase initialization
│   ├── middleware/             # auth.js (JWT Validation)
│   ├── routes/                 # Express API Endpoints (Quests, Auth, Assistant, Notifications)
│   ├── services/               # Core Logic (edithEngine.js, llmQuestGenerator.js)
│   └── utils/                  # Helper functions (XP math, D3 mapping)
└── PROJECT_OVERVIEW.md         # You are here!
```

---

## 🤖 Inside E.D.I.T.H. (Even Dead, I'm The Hero)
EDITH isn't just a chatbot; she is the **game master**.

-   **Logic Engine:** She uses the **OpenRouter API** to access state-of-the-art LLMs (DeepSeek/Mistral).
-   **Context Awareness:** Her prompt is dynamically built to include the user's **Current Level**, **Active Tasks**, and **Existing Skills**.
-   **Voice Input:** Integrated via the **Web Speech API** for seamless interaction.
-   **Humorous Personality:** She alternates between a helpful, JARVIS-like assistant and a witty mentor, especially when handling free-tier limitations or "mainframe stability" issues.

---

## 🌐 API Ecosystem (Endpoints)

### **Authentication**
- `POST /api/auth/signup-request` & `signup-verify`: Email OTP flow.
- `POST /api/auth/login`: Conventional credential access.
- `GET /api/auth/me`: Validates JWT and returns current session.

### **Quest Management**
- `GET /api/quests/daily`: Aggregates data from **NASA, Wiki, ArXiv, HN, Reddit, Open Library, and Numbers API**.
- `POST /api/quests/:id/complete`: Marks a mission as done.
- `POST /api/quests/evaluate`: Sends a response to EDITH for high-fidelity XP awarding.

### **Gamification & Stats**
- `GET /api/profile`: Returns total XP, Streak data, and Achievements.
- `GET /api/skills`: Returns the domain-mapped skill nodes for the D3 graph.

### **Notifications**
- `POST /api/notifications/subscribe`: Saves the browser's PushSubscription keys.
- `POST /api/notifications/test`: Instantly pings your device with a system notification.

---

## 🔨 Implementation Details & Tools
- **VAPID (Web Push):** A secure, free protocol for browser-to-server notifications.
- **D3.js:** Used for the interactive, force-directed "Knowledge Web."
- **Framer Motion:** Powering the "Sense of Flow" in the UI.
- **Node-Cron:** (Backend) Manages the midnight rotation of quests and daily events.

---

*“With great power, comes great responsibility—and a lot of XP.”*
