# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] — 2026-02-07

### Added
- **Dashboard** with days of rations, expiry alerts, daily consumption stats, macro overview
- **Food inventory** with full CRUD, calories, macros (protein/carbs/fat/fiber/sugar), purchase & expiry dates
- **Bulk operations** — duplicate, bulk add, bulk edit, and bulk delete with checkbox selection
- **Totals row** in inventory table showing summed calories and macros
- **Liquid rations tracker** with days-remaining calculation and daily consumption targets
- **Beverage logging** — coffee capsules, tea sachets, water consumption per member
- **Medicine tracker** with inventory management and intake logging with stock deduction
- **Household members** with per-person calorie and liquid targets
- **Food consumption logging** per household member
- **Category management** for organizing inventory items
- **Dark theme UI** with custom CSS, Inter + JetBrains Mono fonts
- **Sidebar navigation** with 6 pages
- **Sample database seeder** (`seed-sample.js`) with demo data
- **Dutch food inventory seeder** (`seed-data.js`) with 33 real items
- **Production build** — single-port deployment with Express serving built React app
- **SQLite database** with WAL mode, auto-created on first run
