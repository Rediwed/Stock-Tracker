const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'stock.db');

let db;

function getDb() {
  if (!db) {
    const fs = require('fs');
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema(db);
    seedDefaults(db);
  }
  return db;
}

function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS household_members (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      daily_calorie_target INTEGER DEFAULT 2000,
      daily_liquid_target INTEGER DEFAULT 2000,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      color TEXT DEFAULT '#6366f1'
    );

    CREATE TABLE IF NOT EXISTS inventory_items (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category_id TEXT,
      quantity REAL DEFAULT 1,
      unit TEXT DEFAULT 'pcs',
      calories_per_unit REAL DEFAULT 0,
      protein_g REAL DEFAULT 0,
      carbs_g REAL DEFAULT 0,
      fiber_g REAL DEFAULT 0,
      sugar_g REAL DEFAULT 0,
      fat_g REAL DEFAULT 0,
      is_liquid INTEGER DEFAULT 0,
      volume_ml REAL DEFAULT 0,
      purchase_date TEXT,
      expiry_date TEXT,
      notes TEXT DEFAULT '',
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS consumption_log (
      id TEXT PRIMARY KEY,
      item_id TEXT,
      item_name TEXT NOT NULL,
      member_id TEXT,
      quantity REAL DEFAULT 1,
      unit TEXT DEFAULT 'pcs',
      calories REAL DEFAULT 0,
      protein_g REAL DEFAULT 0,
      carbs_g REAL DEFAULT 0,
      fiber_g REAL DEFAULT 0,
      sugar_g REAL DEFAULT 0,
      fat_g REAL DEFAULT 0,
      reason TEXT DEFAULT 'consumed',
      consumed_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (item_id) REFERENCES inventory_items(id) ON DELETE SET NULL,
      FOREIGN KEY (member_id) REFERENCES household_members(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS liquid_log (
      id TEXT PRIMARY KEY,
      member_id TEXT,
      type TEXT DEFAULT 'water',
      amount_ml REAL DEFAULT 250,
      logged_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (member_id) REFERENCES household_members(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS beverage_log (
      id TEXT PRIMARY KEY,
      member_id TEXT,
      type TEXT NOT NULL DEFAULT 'coffee',
      capsules_or_sachets INTEGER DEFAULT 1,
      water_ml REAL DEFAULT 0,
      logged_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (member_id) REFERENCES household_members(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS medicines (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT DEFAULT 'tablet',
      quantity REAL DEFAULT 0,
      unit TEXT DEFAULT 'tablets',
      dosage TEXT DEFAULT '',
      frequency TEXT DEFAULT '',
      notes TEXT DEFAULT '',
      purchase_date TEXT,
      expiry_date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS medicine_log (
      id TEXT PRIMARY KEY,
      medicine_id TEXT,
      medicine_name TEXT NOT NULL,
      member_id TEXT,
      quantity REAL DEFAULT 1,
      notes TEXT DEFAULT '',
      taken_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (medicine_id) REFERENCES medicines(id) ON DELETE SET NULL,
      FOREIGN KEY (member_id) REFERENCES household_members(id) ON DELETE SET NULL
    );
  `);
}

function seedDefaults(db) {
  const count = db.prepare('SELECT COUNT(*) as c FROM categories').get().c;
  if (count === 0) {
    const insert = db.prepare('INSERT INTO categories (id, name, color) VALUES (?, ?, ?)');
    const cats = [
      ['cat-dairy', 'Dairy', '#f59e0b'],
      ['cat-meat', 'Meat & Poultry', '#ef4444'],
      ['cat-fish', 'Fish & Seafood', '#3b82f6'],
      ['cat-veg', 'Vegetables', '#22c55e'],
      ['cat-fruit', 'Fruits', '#a855f7'],
      ['cat-grain', 'Grains & Cereals', '#f97316'],
      ['cat-bakery', 'Bakery', '#d97706'],
      ['cat-canned', 'Canned Goods', '#6b7280'],
      ['cat-frozen', 'Frozen Foods', '#06b6d4'],
      ['cat-snacks', 'Snacks', '#ec4899'],
      ['cat-beverages', 'Beverages', '#14b8a6'],
      ['cat-condiments', 'Condiments & Sauces', '#eab308'],
      ['cat-other', 'Other', '#6366f1'],
    ];
    const tx = db.transaction(() => { cats.forEach(c => insert.run(...c)); });
    tx();
  }
}

module.exports = { getDb };
