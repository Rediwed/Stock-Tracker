# 📦 Stock Tracker

A cross-platform household food, liquid & medicine inventory tracker — delivered as a locally hosted web application with a dark, modern UI.

Built for households that want to track what they have in stock, how long it'll last, and when things expire.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=node.js&logoColor=white)
![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-3-003B57?logo=sqlite&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **📊 Dashboard** | At-a-glance overview: days of rations, expiry alerts, daily consumption, macro breakdown |
| **🥫 Food Inventory** | Track all food items with calories, macros (P/C/F), purchase & expiry dates, totals row |
| **💧 Liquid Rations** | Track water & beverage supplies with days-remaining calculation and daily targets |
| **☕ Beverage Logging** | Log coffee capsules, tea sachets, and water consumption per household member |
| **💊 Medicine Tracker** | Full medicine inventory with intake logging and automatic stock deduction |
| **👨‍👩‍👧 Household Members** | Per-person calorie and liquid consumption targets |
| **⊕ Bulk Operations** | Duplicate, bulk add, bulk edit, and bulk delete inventory items with checkboxes |
| **🔍 Filtering** | Filter by category, status (expiring/expired), or search by name |

---

## 🚀 Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- npm (comes with Node.js)

### Install

```bash
git clone https://github.com/YOUR_USERNAME/stock-tracker.git
cd stock-tracker

# Install all dependencies (server + client)
npm run install:all
```

### Development

```bash
# Start both servers simultaneously
npm run dev
```

Or start them separately:

```bash
# Backend API (port 3001)
npm run server

# Frontend dev server with HMR (port 5173)
npm run client
```

Open **http://localhost:5173** in your browser.

### Production

```bash
# Build the React frontend
npm run build

# Start the server (serves API + built frontend on one port)
npm run server
```

Open **http://localhost:3001** — everything is served from one port.

---

## 🗄 Sample Database

The repo ships without a database. On first run, the schema is created automatically. To populate with demo data:

```bash
node seed-sample.js
```

This creates:
- 👥 3 household members (Alex, Jamie, Sam) with calorie & liquid targets
- 🥫 20 food items across 4 categories
- 💧 24 water bottles (individual entries)
- 📝 8 consumption logs & 11 beverage logs
- 💊 8 medicines with 7 intake logs

> ⚠️ **Warning:** This clears all existing data. Back up `data/stock.db` first if you have real data.

There's also a Dutch food inventory seeder (`seed-data.js`) with 33 real items.

---

## 📁 Project Structure

```
stock-tracker/
├── server/
│   ├── index.js              # Express entry — API + static file serving
│   ├── db.js                 # SQLite schema & initialization (WAL mode)
│   └── routes/
│       ├── dashboard.js      # Aggregated stats & overview data
│       ├── inventory.js      # CRUD + duplicate + bulk operations
│       ├── liquids.js        # Liquid rations & water consumption
│       ├── beverages.js      # Coffee capsule & tea sachet tracking
│       ├── medicines.js      # Medicine CRUD & intake logging
│       ├── members.js        # Household member management
│       ├── consumption.js    # Food consumption logging
│       └── categories.js     # Inventory categories
│
├── client/
│   ├── index.html
│   ├── vite.config.js        # Vite config with API proxy
│   └── src/
│       ├── App.jsx           # Router & sidebar layout
│       ├── api.js            # API client (fetch wrapper)
│       ├── index.css         # Dark theme styles (no frameworks)
│       ├── main.jsx          # React entry point
│       └── pages/
│           ├── Dashboard.jsx
│           ├── Inventory.jsx
│           ├── Household.jsx
│           ├── Consumption.jsx
│           ├── Liquids.jsx
│           └── Medicine.jsx
│
├── seed-data.js              # Dutch food inventory seeder (33 items)
├── seed-sample.js            # Full sample database seeder
├── package.json
└── data/                     # SQLite database (gitignored)
    └── stock.db
```

---

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/dashboard` | Aggregated stats, expiry alerts, consumption |
| `GET/POST` | `/api/inventory` | List / create inventory items |
| `PUT/DELETE` | `/api/inventory/:id` | Update / delete single item |
| `POST` | `/api/inventory/duplicate` | Duplicate items by IDs |
| `PUT` | `/api/inventory/bulk` | Bulk update fields on selected items |
| `POST` | `/api/inventory/bulk-delete` | Bulk delete by IDs |
| `GET/POST` | `/api/members` | List / create household members |
| `PUT/DELETE` | `/api/members/:id` | Update / delete member |
| `GET/POST` | `/api/liquids` | Liquid consumption logs |
| `GET` | `/api/liquids/inventory` | Liquid rations summary |
| `GET/POST` | `/api/beverages` | Coffee/tea beverage logs |
| `GET/POST` | `/api/medicines` | Medicine inventory |
| `POST` | `/api/medicines/:id/intake` | Log medicine intake |
| `GET/POST` | `/api/consumption` | Food consumption logs |
| `GET` | `/api/categories` | Inventory categories |

---

## ⚙️ Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port (set via environment variable) |

The database is stored at `data/stock.db` and is created automatically on first run.

---

## 🛠 Tech Stack

- **Backend:** Node.js, Express 4, better-sqlite3 (WAL mode)
- **Frontend:** React 18, Vite 6, React Router 6
- **Database:** SQLite (zero config, file-based)
- **Styling:** Custom CSS dark theme — Inter + JetBrains Mono fonts, no CSS frameworks

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).
