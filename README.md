<div align="center">

# 📈 TrendEdge

### *Smart Stock Analytics. Built for Traders.*

[![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Express](https://img.shields.io/badge/Express_5-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![JWT](https://img.shields.io/badge/JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io)

[![Deployed on Vercel](https://img.shields.io/badge/Client-Vercel-000000?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com)
[![Deployed on Render](https://img.shields.io/badge/Server-Render-46E3B7?style=flat-square&logo=render&logoColor=white)](https://render.com)
[![Alpha Vantage](https://img.shields.io/badge/Data-Alpha_Vantage-1a73e8?style=flat-square)](https://www.alphavantage.co)

> A full-stack stock analytics platform with real-time watchlists, portfolio tracking, price alerts, and 20-DMA buy/sell signals — built for traders who mean business.

</div>

---

## ✨ Features

| 🖥️ Page | 💡 What it does |
|---|---|
| **📊 Dashboard** | Watchlist manager, live stock cards, price vs 20-DMA bar chart with buy/sell signals |
| **🌍 Markets** | Symbol search with autocomplete, 30-day line chart, full market overview table |
| **💼 Portfolio** | BUY/SELL trade logger, real-time P&L calculation, full trade history |
| **🔔 Alerts** | Set price alerts (above/below threshold), toggle on/off, up to 10 active at once |
| **⚙️ Settings** | Update profile info and change password securely |
| **🔐 Auth** | JWT access + refresh token rotation with token-theft detection |

---

## 🛠️ Tech Stack

```
┌─────────────────────────────────────────────────────┐
│                     TrendEdge                       │
├───────────────────────┬─────────────────────────────┤
│      FRONTEND         │         BACKEND             │
│                       │                             │
│  ⚛️  React 18          │  🟢 Node.js + Express 5    │
│  ⚡ Vite              │  🍃 MongoDB + Mongoose      │
│  🗺️  React Router v6   │  🔑 JWT (access + refresh) │
│  📈 Chart.js          │  🛡️  Helmet + Rate Limiting  │
│  🎨 Lucide Icons      │  📡 Alpha Vantage API       │
└───────────────────────┴─────────────────────────────┘
```

---

## 📁 Project Structure

```
trendedge/
├── 📂 client/                  ← React frontend (Vite)
│   ├── 📂 src/
│   │   ├── 📂 api/             ← Axios instance + all API calls
│   │   ├── 📂 components/      ← Layout, StockCard, Toast, Sidebar…
│   │   ├── 📂 context/         ← AuthContext (global user state)
│   │   └── 📂 pages/           ← Dashboard, Markets, Portfolio, Alerts, Settings
│   ├── 📄 vite.config.js       ← Proxies /api → localhost:5000 in dev
│   └── 📄 vercel.json          ← SPA rewrite rules for Vercel
│
├── 📂 server/                  ← Express backend
│   ├── 📂 config/              ← MongoDB connection
│   ├── 📂 controllers/         ← auth, stock, portfolio, alert logic
│   ├── 📂 middleware/          ← JWT guard, rate limiter, error handler
│   ├── 📂 models/              ← User, Portfolio, Trade, Alert schemas
│   ├── 📂 routes/              ← API route definitions
│   ├── 📂 services/            ← Alpha Vantage integration + demo fallback
│   └── 📄 index.js             ← App entry point
│
└── 📄 package.json             ← Root scripts (start, dev, build)
```

---

## 🚀 Getting Started

### Prerequisites

- 🟢 **Node.js** v18+
- 🍃 **MongoDB** URI (local or [MongoDB Atlas](https://www.mongodb.com/cloud/atlas))
- 📡 **Alpha Vantage** API key — free at [alphavantage.co](https://www.alphavantage.co) *(optional — demo data works without it)*

---

### 1️⃣ Clone the repo

```bash
git clone https://github.com/maniishh/trendedge.git
cd trendedge
```

### 2️⃣ Install dependencies

```bash
npm run install:all
```

> This installs both server and client dependencies in one shot.

### 3️⃣ Configure environment variables

Create a **`.env`** file in the project root:

```env
# ── Server ────────────────────────────────────────
NODE_ENV=development
PORT=5000

# ── MongoDB ───────────────────────────────────────
MONGODB_URI=mongodb://localhost:27017/trendedge

# ── JWT Secrets (use long random strings!) ────────
ACCESS_TOKEN_SECRET=your_super_secret_access_key
REFRESH_TOKEN_SECRET=your_super_secret_refresh_key
ACCESS_TOKEN_EXPIRY=15m
REFRESH_TOKEN_EXPIRY=7d

# ── CORS ──────────────────────────────────────────
CLIENT_URL=http://localhost:5173

# ── Stock Data ────────────────────────────────────
ALPHA_API_KEY=your_alpha_vantage_key   # optional — demo mode if omitted
```

Create a **`client/.env`** file:

```env
# Your backend URL — no trailing slash
VITE_API_URL=http://localhost:5000
```

### 4️⃣ Run in development

```bash
# Run frontend + backend together
npm run dev:full

# Or separately:
npm run dev          # backend  →  http://localhost:5000
npm run dev:client   # frontend →  http://localhost:5173
```

### 5️⃣ Open in browser 🎉

```
http://localhost:5173
```

Create an account and start trading! 🚀

---

## ☁️ Deployment

### 🟢 Backend → [Render](https://render.com)

| Variable | Value |
|---|---|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Your Atlas connection string |
| `ACCESS_TOKEN_SECRET` | Long random secret |
| `REFRESH_TOKEN_SECRET` | Different long random secret |
| `CLIENT_URL` | Your Vercel frontend URL |
| `ALPHA_API_KEY` | Your Alpha Vantage key |

**Build command:** `npm install`
**Start command:** `npm start`

---

### ▲ Frontend → [Vercel](https://vercel.com)

| Variable | Value |
|---|---|
| `VITE_API_URL` | Your Render backend URL (no trailing slash) |

**Root directory:** `client`
**Build command:** `npm run build`
**Output directory:** `dist`

> ✅ `vercel.json` is already included — React Router works correctly on page refresh and direct URL access.

---

## 🔌 API Reference

<details>
<summary><b>🔐 Auth</b> — click to expand</summary>

```
POST   /api/auth/register          Create a new account
POST   /api/auth/login             Login and receive tokens
POST   /api/auth/refresh-token     Rotate access token via HttpOnly cookie
POST   /api/auth/logout            Invalidate session
GET    /api/auth/me                Get current user profile
PATCH  /api/auth/me                Update profile (name, avatar)
POST   /api/auth/change-password   Change password — invalidates all sessions
PATCH  /api/auth/watchlist         Update watchlist symbols (max 20)
```
</details>

<details>
<summary><b>📈 Stocks</b> — click to expand</summary>

```
GET    /api/stocks                 Dashboard data for watchlist symbols
GET    /api/stocks/search?q=...    Search symbols with autocomplete
GET    /api/stocks/:symbol         Full detail + 30-day price history
```
</details>

<details>
<summary><b>💼 Portfolio</b> — click to expand</summary>

```
GET    /api/portfolio              Holdings with real-time P&L
POST   /api/portfolio/trade        Log a BUY or SELL trade
GET    /api/portfolio/trades       Trade history with filters
```
</details>

<details>
<summary><b>🔔 Alerts</b> — click to expand</summary>

```
GET    /api/alerts                 List all alerts
POST   /api/alerts                 Create a price alert (above / below)
DELETE /api/alerts/:id             Delete an alert
PATCH  /api/alerts/:id/toggle      Enable or disable an alert
```
</details>

<details>
<summary><b>🏥 Health</b> — click to expand</summary>

```
GET    /api/health                 Server status + environment info
```
</details>

---

## 🎭 Demo Mode

> 🟡 No Alpha Vantage key? No problem.

If `ALPHA_API_KEY` is not set, TrendEdge automatically serves **realistic demo data** with simulated price jitter. A yellow banner appears on the Dashboard and Markets pages to let you know. Everything else — auth, portfolio, alerts — works exactly the same.

---

## 🔒 Security Highlights

- 🔑 **JWT rotation** — short-lived access tokens (15m) + long-lived refresh tokens (7d) in `HttpOnly` cookies
- 🕵️ **Token theft detection** — reusing a rotated token immediately wipes all sessions for that user
- 🛡️ **Helmet.js** — secure HTTP headers out of the box
- 🚦 **Rate limiting** — auth endpoints throttled to block brute-force attacks
- 🔐 **bcrypt** — passwords hashed with 12 salt rounds
- ✅ **Input validation** — every input sanitized with `express-validator` before touching business logic

---

## 🤝 Contributing

Pull requests are welcome! For major changes, please open an issue first to discuss what you'd like to change.

```bash
# 1. Fork the repo
# 2. Create your feature branch
git checkout -b feature/amazing-feature

# 3. Commit your changes
git commit -m 'Add amazing feature'

# 4. Push to the branch
git push origin feature/amazing-feature

# 5. Open a Pull Request 🎉
```

---

<div align="center">

Made with ❤️ and ☕ by a trader, for traders.

⭐ **Star this repo if you found it useful!** ⭐

</div>
