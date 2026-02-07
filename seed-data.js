const { getDb } = require('./server/db');
const { v4: uuid } = require('uuid');

const db = getDb();

// Create Dutch nutritional categories
const catInsert = db.prepare(`INSERT OR IGNORE INTO categories (id, name, color) VALUES (?, ?, ?)`);
const newCats = [
  ['cat-koolhydraten', 'Koolhydraten', '#f97316'],
  ['cat-eiwitten',     'Eiwitten',     '#3b82f6'],
  ['cat-vezels',       'Vezels',       '#22c55e'],
  ['cat-zoetstoffen',  'Zoetstoffen',  '#eab308'],
];
newCats.forEach(c => catInsert.run(...c));
console.log('✔ Categories created');

// Helper: convert M/D/YYYY → YYYY-MM-DD
function toISO(dateStr) {
  if (!dateStr) return null;
  const [m, d, y] = dateStr.split('/');
  return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
}

// All items from the spreadsheet — each row = 1 physical unit
const items = [
  // ID, Name, Category, Weight, Unit, Cal/100, CalTotal, ExpiryDate, PurchaseDate
  [3,  'Aardappel puree a la minute',        'cat-koolhydraten', 1000, 'gr', 352, 3520,   '3/10/2026',  null],
  [4,  'Aardappel puree a la minute',        'cat-koolhydraten', 1000, 'gr', 352, 3520,   '3/10/2026',  null],
  [5,  'Aardappel puree a la minute',        'cat-koolhydraten', 1000, 'gr', 352, 3520,   '3/10/2026',  null],
  [1,  'Basmatirijst',                       'cat-koolhydraten', 1000, 'gr', 352, 3520,   '12/19/2026', '1/29/2025'],
  [2,  'Basmatirijst',                       'cat-koolhydraten', 1000, 'gr', 352, 3520,   '12/19/2026', '1/29/2025'],
  [9,  'Spaghetti',                          'cat-koolhydraten', 1000, 'gr', 351, 3510,   '9/1/2027',   null],
  [10, 'Spaghetti',                          'cat-koolhydraten', 1000, 'gr', 351, 3510,   '9/1/2027',   null],
  [17, 'Erwtensoep met rookworst',           'cat-eiwitten',     800,  'ml', 89,  712,    '11/1/2027',  null],
  [18, 'Erwtensoep met rookworst',           'cat-eiwitten',     800,  'ml', 89,  712,    '11/1/2027',  '1/29/2025'],
  [6,  'Witte bonen in tomatensaus',         'cat-eiwitten',     700,  'gr', 85,  595,    '7/1/2028',   null],
  [7,  'Witte bonen in tomatensaus',         'cat-eiwitten',     700,  'gr', 85,  595,    '7/1/2028',   null],
  [8,  'Witte bonen in tomatensaus',         'cat-eiwitten',     700,  'gr', 85,  595,    '7/1/2028',   null],
  [19, 'Bonensoep met rookworst',            'cat-eiwitten',     800,  'ml', 67,  536,    '7/1/2027',   '1/29/2025'],
  [20, 'Bonensoep met rookworst',            'cat-eiwitten',     800,  'ml', 67,  536,    '7/1/2027',   '1/29/2025'],
  [15, 'Hollandse bruine bonen',             'cat-eiwitten',     465,  'gr', 104, 483.6,  '1/1/2029',   '1/29/2025'],
  [16, 'Hollandse bruine bonen',             'cat-eiwitten',     465,  'gr', 104, 483.6,  '1/1/2029',   '1/29/2025'],
  [11, 'Tomaten creme soep',                 'cat-vezels',       800,  'ml', 51,  408,    '12/1/2027',  null],
  [12, 'Tomaten creme soep',                 'cat-vezels',       800,  'ml', 51,  408,    '12/1/2027',  null],
  [13, 'Rode kool met appel',                'cat-vezels',       680,  'gr', 52,  353.6,  '10/1/2026',  '1/29/2025'],
  [14, 'Rode kool met appel',                'cat-vezels',       680,  'gr', 52,  353.6,  '10/1/2026',  '1/29/2025'],
  [21, 'Tomatenpuree dubbelgeconcentreerd',  'cat-vezels',       140,  'gr', 95,  133,    '11/5/2026',  '1/29/2025'],
  [22, 'Tomatenpuree dubbelgeconcentreerd',  'cat-vezels',       140,  'gr', 95,  133,    '11/5/2026',  '1/29/2025'],
  [23, 'Tomatenpuree dubbelgeconcentreerd',  'cat-vezels',       140,  'gr', 95,  133,    '11/5/2026',  '1/29/2025'],
  [24, 'Tomatenpuree dubbelgeconcentreerd',  'cat-vezels',       140,  'gr', 95,  133,    '11/5/2026',  '1/29/2025'],
  [25, '100% Pindakaas Puur',                'cat-eiwitten',     600,  'gr', 639, 3834,   '11/1/2027',  '1/31/2025'],
  [26, 'Bloemenhoning',                      'cat-zoetstoffen',  500,  'gr', 320, 1600,   '11/1/2099',  '1/31/2025'],
  [27, 'Appelstroop',                        'cat-zoetstoffen',  450,  'gr', 277, 1246.5, '1/9/2028',   '1/31/2025'],
  [28, 'Champignonragout',                   'cat-koolhydraten', 400,  'gr', 60,  240,    '10/1/2027',  '2/3/2025'],
  [29, 'Champignonragout',                   'cat-koolhydraten', 400,  'gr', 60,  240,    '10/1/2027',  '2/3/2025'],
  [30, 'Perzikken op siroop',                'cat-koolhydraten', 480,  'gr', 68,  326.4,  '7/20/2027',  '2/3/2025'],
  [31, 'Perzikken op siroop',                'cat-koolhydraten', 480,  'gr', 68,  326.4,  '7/20/2027',  '2/3/2025'],
  [32, 'Sperziebonen op blik',               'cat-vezels',       440,  'gr', 23,  101.2,  '9/30/2027',  '2/3/2025'],
  [33, 'Sperziebonen op blik',               'cat-vezels',       440,  'gr', 23,  101.2,  '9/30/2027',  '2/3/2025'],
];

const insert = db.prepare(`
  INSERT INTO inventory_items
  (id, name, category_id, quantity, unit, calories_per_unit, protein_g, carbs_g, fiber_g, sugar_g, fat_g, is_liquid, volume_ml, purchase_date, expiry_date, notes)
  VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, 0, 0, 0, 0, ?, ?, ?)
`);

const tx = db.transaction(() => {
  for (const [origId, name, catId, weight, unit, calPer100, calTotal, expiry, purchase] of items) {
    const id = uuid();
    const notes = `${weight}${unit} — ${calPer100} kcal/100${unit}`;

    insert.run(
      id,
      name,
      catId,
      weight,          // quantity = actual weight in grams or ml
      unit === 'ml' ? 'ml' : 'gr',
      calTotal,        // calories_per_unit = total for this package
      toISO(purchase),
      toISO(expiry),
      notes
    );
  }
});

tx();
console.log(`✔ Inserted ${items.length} inventory items`);

// Verify
const count = db.prepare('SELECT COUNT(*) as c FROM inventory_items').get().c;
console.log(`  Total items in database: ${count}`);
