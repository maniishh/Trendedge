# TrendEdge — Stock Analytics Dashboard

A full-stack stock analytics platform with real-time watchlists, portfolio tracking, price alerts, and 20-DMA buy/sell signals.

---

## Tech Stack

| Layer    | Tech |
|----------|------|
| Frontend | React 18 + Vite, React Router v6, Chart.js, Lucide Icons |
| Backend  | Node.js, Express 5, MongoDB (Mongoose) |
| Auth     | JWT (access + refresh tokens), HttpOnly cookies |
| Data     | Alpha Vantage API (falls back to demo data if key missing) |

---

## Project Structure

```
trendedge/
├── client/               ← React frontend (Vite)
│   ├── src/
│   │   ├── api/          ← Axios instance + all API calls
│   │   ├── components/   ← Layout, StockCard, Toast, etc.
│   │   ├── context/      ← AuthContext (global user state)
│   │   └── pages/        ← Dashboard, Markets, Portfolio, Alerts, Settings
│   ├── index.html
│   ├── vite.config.js    ← Proxies /api → localhost:5000
│   └── package.json
├── server/               ← Express backend
│   ├── config/db.js
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── services/stock.service.js
│   ├── utils/
│   └── index.js
├── .env                  ← Environment variables (edit before running)
└── package.json
```

---

## Setup & Running

### 1 — Install dependencies

```bash
# Install backend deps
npm install

# Install frontend deps
npm install --prefix client
```

Or use the convenience script:
```bash
npm run install:all
```

### 2 — Configure environment

Edit `.env` in the project root. The file already has working values for MongoDB and JWT secrets. Just add your Alpha Vantage key for live prices (optional — demo data works without it).

```env
ALPHA_API_KEY=<get free key at alphavantage.co>
```

### 3 — Run both servers

**Backend** (port 5000):
```bash
npm run dev
```

**Frontend** (port 5173) — in a second terminal:
```bash
npm run dev:client
```

**Or run both together:**
```bash
npm run dev:full
```

### 4 — Open browser

Navigate to **http://localhost:5173** and create an account.

---

## Features

- **Dashboard** — Watchlist manager, stock cards, price vs 20-DMA bar chart
- **Markets** — Symbol search with autocomplete, detail view with 30-day line chart, market overview table
- **Portfolio** — BUY/SELL trade logger, real-time P&L calculation, trade history
- **Alerts** — Price alerts (above/below), toggle on/off, max 10 active
- **Settings** — Profile update, change password
- **Auth** — Secure JWT with refresh-token rotation and token-theft detection

---

## Demo Mode

If `ALPHA_API_KEY` is not set, the app serves realistic **demo data** with simulated price jitter. A yellow banner appears on Dashboard and Markets pages.

---

## API Endpoints

```
POST   /api/auth/register
POST   /api/auth/login
POST   /api/auth/refresh-token
POST   /api/auth/logout
GET    /api/auth/me
PATCH  /api/auth/me
POST   /api/auth/change-password
PATCH  /api/auth/watchlist

GET    /api/stocks
GET    /api/stocks/search?q=...
GET    /api/stocks/:symbol

GET    /api/portfolio
POST   /api/portfolio/trade
GET    /api/portfolio/trades

GET    /api/alerts
POST   /api/alerts
DELETE /api/alerts/:id
PATCH  /api/alerts/:id/toggle

GET    /api/health
```
