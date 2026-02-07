# Contributing to Stock Tracker

Thanks for your interest in contributing! Here's how to get started.

## 🛠 Development Setup

1. Fork and clone the repo
2. Install dependencies:
   ```bash
   npm run install:all
   ```
3. Start in dev mode:
   ```bash
   npm run dev
   ```
4. Open http://localhost:5173

## 📐 Code Style

- **No CSS frameworks** — we use custom CSS with CSS variables for theming
- **No TypeScript** — plain JavaScript / JSX
- **Functional React** — hooks only, no class components
- **SQLite** — all database operations use better-sqlite3 (synchronous API)

## 🔀 Pull Requests

1. Create a feature branch from `main`
2. Make your changes
3. Test that both `npm run dev` and `npm run build` work
4. Submit a PR with a clear description of what changed and why

## 🐛 Bug Reports

Open an issue with:
- Steps to reproduce
- Expected vs actual behavior
- Browser and Node.js version

## 📁 Project Layout

- `server/routes/` — Each API resource has its own route file
- `client/src/pages/` — Each page is a single self-contained component
- `client/src/api.js` — All API calls go through the `api` object
- `client/src/index.css` — All styles in one file using CSS variables

## 💡 Ideas Welcome

Feature suggestions are welcome! Open an issue tagged `enhancement`.
