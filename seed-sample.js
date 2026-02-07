/**
 * Sample Database Seeder
 * Creates a demo database with sample people, foods, liquids, consumption, medicine.
 * 
 * Usage:
 *   node seed-sample.js
 * 
 * This will create a fresh sample database. Back up your existing data/ folder first
 * if you have real data you want to keep.
 */

const { getDb } = require('./server/db');
const { v4: uuid } = require('uuid');

const db = getDb();

// ─── Clear existing data ────────────────────────────────────────────
console.log('Clearing existing data...');
db.prepare('DELETE FROM medicine_log').run();
db.prepare('DELETE FROM medicines').run();
db.prepare('DELETE FROM beverage_log').run();
db.prepare('DELETE FROM liquid_log').run();
db.prepare('DELETE FROM consumption_log').run();
db.prepare('DELETE FROM inventory_items').run();
db.prepare('DELETE FROM household_members').run();
// Keep default categories, add sample ones
console.log('✔ Cleared');

// ─── Categories ─────────────────────────────────────────────────────
const catInsert = db.prepare('INSERT OR IGNORE INTO categories (id, name, color) VALUES (?, ?, ?)');
const sampleCats = [
  ['cat-koolhydraten', 'Koolhydraten', '#f97316'],
  ['cat-eiwitten',     'Eiwitten',     '#3b82f6'],
  ['cat-vezels',       'Vezels',       '#22c55e'],
  ['cat-zoetstoffen',  'Zoetstoffen',  '#eab308'],
];
sampleCats.forEach(c => catInsert.run(...c));
console.log('✔ Categories');

// ─── Household Members ─────────────────────────────────────────────
const memberInsert = db.prepare('INSERT INTO household_members (id, name, daily_calorie_target, daily_liquid_target) VALUES (?, ?, ?, ?)');
const members = [
  { id: uuid(), name: 'Alex',  cal: 2200, liq: 2500 },
  { id: uuid(), name: 'Jamie', cal: 2000, liq: 2000 },
  { id: uuid(), name: 'Sam',   cal: 1800, liq: 1500 },
];
members.forEach(m => memberInsert.run(m.id, m.name, m.cal, m.liq));
console.log('✔ Household members: ' + members.map(m => m.name).join(', '));

// ─── Food Inventory ─────────────────────────────────────────────────
const itemInsert = db.prepare(`
  INSERT INTO inventory_items
  (id, name, category_id, quantity, unit, calories_per_unit, protein_g, carbs_g, fiber_g, sugar_g, fat_g, is_liquid, volume_ml, purchase_date, expiry_date, notes)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const foodItems = [
  // Carbs / Koolhydraten
  { name: 'Basmati Rice',          cat: 'cat-koolhydraten', qty: 1000, unit: 'gr', cal: 3520, p: 70, c: 770, fi: 6,  su: 0,  fa: 10, expiry: '2027-06-15', purchase: '2025-12-10' },
  { name: 'Spaghetti',             cat: 'cat-koolhydraten', qty: 500,  unit: 'gr', cal: 1755, p: 62, c: 355, fi: 15, su: 15, fa: 9,  expiry: '2027-09-01', purchase: '2025-11-20' },
  { name: 'Instant Mashed Potato', cat: 'cat-koolhydraten', qty: 800,  unit: 'gr', cal: 2816, p: 56, c: 536, fi: 32, su: 16, fa: 8,  expiry: '2026-08-10', purchase: '2025-12-01' },
  { name: 'Rolled Oats',           cat: 'cat-koolhydraten', qty: 500,  unit: 'gr', cal: 1895, p: 65, c: 335, fi: 50, su: 5,  fa: 35, expiry: '2027-03-20', purchase: '2025-11-15' },
  { name: 'Couscous',              cat: 'cat-koolhydraten', qty: 500,  unit: 'gr', cal: 1810, p: 62, c: 360, fi: 15, su: 0,  fa: 5,  expiry: '2027-11-01', purchase: '2026-01-05' },

  // Protein / Eiwitten
  { name: 'Canned Tuna',         cat: 'cat-eiwitten', qty: 185, unit: 'gr', cal: 203,  p: 46, c: 0,  fi: 0,  su: 0,  fa: 2,  expiry: '2028-04-01', purchase: '2026-01-10' },
  { name: 'Canned Tuna',         cat: 'cat-eiwitten', qty: 185, unit: 'gr', cal: 203,  p: 46, c: 0,  fi: 0,  su: 0,  fa: 2,  expiry: '2028-04-01', purchase: '2026-01-10' },
  { name: 'Peanut Butter',       cat: 'cat-eiwitten', qty: 400, unit: 'gr', cal: 2556, p: 100, c: 80, fi: 24, su: 40, fa: 200, expiry: '2027-08-15', purchase: '2025-12-20' },
  { name: 'Split Pea Soup',      cat: 'cat-eiwitten', qty: 800, unit: 'ml', cal: 712,  p: 40, c: 88, fi: 16, su: 8,  fa: 8,  expiry: '2027-06-01', purchase: '2026-01-15' },
  { name: 'Brown Beans',         cat: 'cat-eiwitten', qty: 465, unit: 'gr', cal: 484,  p: 32, c: 62, fi: 20, su: 4,  fa: 2,  expiry: '2029-01-01', purchase: '2025-12-28' },
  { name: 'Corned Beef',         cat: 'cat-eiwitten', qty: 340, unit: 'gr', cal: 816,  p: 88, c: 0,  fi: 0,  su: 0,  fa: 51, expiry: '2027-10-01', purchase: '2026-02-01' },

  // Vegetables / Vezels
  { name: 'Red Cabbage with Apple', cat: 'cat-vezels', qty: 680, unit: 'gr', cal: 354,  p: 5,  c: 68, fi: 14, su: 48, fa: 1,  expiry: '2026-10-01', purchase: '2025-12-15' },
  { name: 'Green Beans Canned',    cat: 'cat-vezels', qty: 440, unit: 'gr', cal: 101,  p: 6,  c: 18, fi: 10, su: 4,  fa: 0,  expiry: '2027-09-30', purchase: '2026-02-03' },
  { name: 'Green Beans Canned',    cat: 'cat-vezels', qty: 440, unit: 'gr', cal: 101,  p: 6,  c: 18, fi: 10, su: 4,  fa: 0,  expiry: '2027-09-30', purchase: '2026-02-03' },
  { name: 'Tomato Cream Soup',     cat: 'cat-vezels', qty: 800, unit: 'ml', cal: 408,  p: 8,  c: 56, fi: 8,  su: 32, fa: 16, expiry: '2027-12-01', purchase: '2026-01-20' },
  { name: 'Tomato Paste',          cat: 'cat-vezels', qty: 140, unit: 'gr', cal: 133,  p: 6,  c: 25, fi: 5,  su: 15, fa: 1,  expiry: '2026-11-05', purchase: '2025-12-28' },
  { name: 'Tomato Paste',          cat: 'cat-vezels', qty: 140, unit: 'gr', cal: 133,  p: 6,  c: 25, fi: 5,  su: 15, fa: 1,  expiry: '2026-11-05', purchase: '2025-12-28' },

  // Sweeteners / Zoetstoffen
  { name: 'Honey',          cat: 'cat-zoetstoffen', qty: 500, unit: 'gr', cal: 1600, p: 2,  c: 400, fi: 0, su: 395, fa: 0, expiry: '2099-01-01', purchase: '2026-01-15' },
  { name: 'Apple Syrup',    cat: 'cat-zoetstoffen', qty: 450, unit: 'gr', cal: 1247, p: 1,  c: 306, fi: 0, su: 290, fa: 0, expiry: '2028-01-09', purchase: '2026-01-15' },
  { name: 'Canned Peaches', cat: 'cat-koolhydraten', qty: 480, unit: 'gr', cal: 326,  p: 4,  c: 77,  fi: 6, su: 70,  fa: 0, expiry: '2027-07-20', purchase: '2026-02-03' },
];

const tx = db.transaction(() => {
  for (const item of foodItems) {
    const id = uuid();
    itemInsert.run(
      id, item.name, item.cat, item.qty, item.unit, item.cal,
      item.p, item.c, item.fi, item.su, item.fa,
      0, 0,
      item.purchase, item.expiry,
      `${item.qty}${item.unit} — sample data`
    );
  }
});
tx();
console.log(`✔ ${foodItems.length} food items`);

// ─── Liquid Inventory ───────────────────────────────────────────────
// Each bottle gets its own row (quantity=1, volume_ml=bottle size)
const liquidPacks = [
  { name: 'Still Water 1.5L',     count: 6,  vol: 1500, purchase: '2026-01-20', expiry: '2027-06-01' },
  { name: 'Still Water 1.5L',     count: 6,  vol: 1500, purchase: '2026-02-01', expiry: '2027-06-01' },
  { name: 'Sparkling Water 500ml', count: 12, vol: 500,  purchase: '2026-01-25', expiry: '2027-03-15' },
];

let liquidCount = 0;
for (const pack of liquidPacks) {
  for (let i = 0; i < pack.count; i++) {
    const id = uuid();
    itemInsert.run(
      id, pack.name, 'cat-beverages', 1, 'ml', 0,
      0, 0, 0, 0, 0,
      1, pack.vol,
      pack.purchase, pack.expiry,
      `${pack.vol}ml — sample data`
    );
    liquidCount++;
  }
}
console.log(`✔ ${liquidCount} liquid items (individual bottles)`);

// ─── Consumption Logs ───────────────────────────────────────────────
const consumptionInsert = db.prepare(`
  INSERT INTO consumption_log (id, item_id, item_name, member_id, quantity, unit, calories, protein_g, carbs_g, fiber_g, sugar_g, fat_g, reason, consumed_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

const today = new Date().toISOString().slice(0, 10);
const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

const consumptionLogs = [
  { name: 'Rolled Oats',     member: 0, qty: 80,  unit: 'gr', cal: 303,  p: 10.4, c: 53.6, fi: 8, su: 0.8, fa: 5.6, reason: 'breakfast', date: today },
  { name: 'Peanut Butter',   member: 0, qty: 30,  unit: 'gr', cal: 192,  p: 7.5,  c: 6,    fi: 1.8, su: 3, fa: 15,  reason: 'breakfast', date: today },
  { name: 'Basmati Rice',    member: 1, qty: 200, unit: 'gr', cal: 704,  p: 14,   c: 154,  fi: 1.2, su: 0, fa: 2,   reason: 'lunch',     date: today },
  { name: 'Canned Tuna',     member: 1, qty: 92,  unit: 'gr', cal: 101,  p: 23,   c: 0,    fi: 0,   su: 0, fa: 1,   reason: 'lunch',     date: today },
  { name: 'Spaghetti',       member: 2, qty: 150, unit: 'gr', cal: 527,  p: 18.6, c: 106.5, fi: 4.5, su: 4.5, fa: 2.7, reason: 'dinner', date: today },
  { name: 'Tomato Paste',    member: 2, qty: 30,  unit: 'gr', cal: 28.5, p: 1.3,  c: 5.4,  fi: 1.1, su: 3.2, fa: 0.2, reason: 'dinner', date: today },
  { name: 'Honey',           member: 0, qty: 20,  unit: 'gr', cal: 64,   p: 0,    c: 16,   fi: 0,   su: 15.8, fa: 0, reason: 'snack',   date: yesterday },
  { name: 'Split Pea Soup',  member: 1, qty: 400, unit: 'ml', cal: 356,  p: 20,   c: 44,   fi: 8,   su: 4,   fa: 4, reason: 'dinner',  date: yesterday },
];

const txCons = db.transaction(() => {
  for (const log of consumptionLogs) {
    consumptionInsert.run(
      uuid(), null, log.name, members[log.member].id,
      log.qty, log.unit, log.cal, log.p, log.c, log.fi, log.su, log.fa,
      log.reason, `${log.date}T12:00:00.000Z`
    );
  }
});
txCons();
console.log(`✔ ${consumptionLogs.length} consumption logs`);

// ─── Liquid Consumption Logs ────────────────────────────────────────
const liquidLogInsert = db.prepare('INSERT INTO liquid_log (id, member_id, type, amount_ml, logged_at) VALUES (?, ?, ?, ?, ?)');
const bevLogInsert = db.prepare('INSERT INTO beverage_log (id, member_id, type, capsules_or_sachets, water_ml, logged_at) VALUES (?, ?, ?, ?, ?, ?)');

const liquidConsumption = [
  // Today's water
  { member: 0, type: 'water',  ml: 500, time: `${today}T08:00:00.000Z` },
  { member: 0, type: 'water',  ml: 250, time: `${today}T12:00:00.000Z` },
  { member: 1, type: 'water',  ml: 500, time: `${today}T09:00:00.000Z` },
  { member: 2, type: 'water',  ml: 250, time: `${today}T10:00:00.000Z` },
  // Coffee
  { member: 0, type: 'coffee', ml: 40,  time: `${today}T07:30:00.000Z`, capsules: 1 },
  { member: 0, type: 'coffee', ml: 110, time: `${today}T14:00:00.000Z`, capsules: 1 },
  { member: 1, type: 'coffee', ml: 40,  time: `${today}T08:00:00.000Z`, capsules: 1 },
  // Tea
  { member: 2, type: 'tea',    ml: 250, time: `${today}T11:00:00.000Z`, sachets: 1 },
  { member: 2, type: 'tea',    ml: 250, time: `${today}T16:00:00.000Z`, sachets: 1 },
  // Yesterday
  { member: 0, type: 'water',  ml: 1000, time: `${yesterday}T10:00:00.000Z` },
  { member: 1, type: 'water',  ml: 750,  time: `${yesterday}T11:00:00.000Z` },
];

const txLiq = db.transaction(() => {
  for (const l of liquidConsumption) {
    liquidLogInsert.run(uuid(), members[l.member].id, l.type, l.ml, l.time);

    // Also log beverage entries for coffee/tea
    if (l.type === 'coffee' && l.capsules) {
      bevLogInsert.run(uuid(), members[l.member].id, 'coffee', l.capsules, l.ml, l.time);
    }
    if (l.type === 'tea' && l.sachets) {
      bevLogInsert.run(uuid(), members[l.member].id, 'tea', l.sachets, l.ml, l.time);
    }
  }
});
txLiq();
console.log(`✔ ${liquidConsumption.length} liquid consumption logs`);

// ─── Medicines ──────────────────────────────────────────────────────
const medInsert = db.prepare(`
  INSERT INTO medicines (id, name, type, quantity, unit, dosage, frequency, notes, purchase_date, expiry_date)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);
const medLogInsert = db.prepare(`
  INSERT INTO medicine_log (id, medicine_id, medicine_name, member_id, quantity, notes, taken_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const medicines = [
  { id: uuid(), name: 'Ibuprofen 400mg',      type: 'tablet',  qty: 30, unit: 'tablets',  dosage: '1 tablet',  freq: 'As needed',    notes: 'Anti-inflammatory / pain relief', purchase: '2026-01-10', expiry: '2028-06-01' },
  { id: uuid(), name: 'Paracetamol 500mg',     type: 'tablet',  qty: 50, unit: 'tablets',  dosage: '1-2 tablets', freq: 'Every 4-6 hours', notes: 'Pain relief / fever reducer', purchase: '2026-01-10', expiry: '2028-03-15' },
  { id: uuid(), name: 'Vitamin D3 1000IU',     type: 'capsule', qty: 90, unit: 'capsules', dosage: '1 capsule', freq: 'Daily',         notes: 'Vitamin D supplement',           purchase: '2025-12-20', expiry: '2027-12-01' },
  { id: uuid(), name: 'Multivitamin',          type: 'tablet',  qty: 60, unit: 'tablets',  dosage: '1 tablet',  freq: 'Daily',         notes: 'Daily multivitamin',             purchase: '2026-01-05', expiry: '2027-09-01' },
  { id: uuid(), name: 'Antihistamine (Loratadine)', type: 'tablet', qty: 20, unit: 'tablets', dosage: '1 tablet', freq: 'As needed', notes: 'Allergy relief',                purchase: '2026-02-01', expiry: '2028-01-01' },
  { id: uuid(), name: 'Bandages (Assorted)',    type: 'other',   qty: 15, unit: 'pieces',   dosage: 'N/A',       freq: 'As needed',    notes: 'First aid kit bandages',         purchase: '2026-01-15', expiry: '2029-01-01' },
  { id: uuid(), name: 'Antiseptic Wipes',       type: 'other',   qty: 25, unit: 'pieces',   dosage: 'N/A',       freq: 'As needed',    notes: 'Wound cleaning',                 purchase: '2026-01-15', expiry: '2028-06-01' },
  { id: uuid(), name: 'Electrolyte Sachets',    type: 'sachet',  qty: 10, unit: 'sachets',  dosage: '1 sachet in 500ml water', freq: 'As needed', notes: 'Rehydration', purchase: '2026-01-20', expiry: '2027-10-01' },
];

const txMed = db.transaction(() => {
  for (const med of medicines) {
    medInsert.run(med.id, med.name, med.type, med.qty, med.unit, med.dosage, med.freq, med.notes, med.purchase, med.expiry);
  }
});
txMed();
console.log(`✔ ${medicines.length} medicines`);

// Medicine intake logs
const medLogs = [
  { medIdx: 2, member: 0, qty: 1, notes: 'Morning dose', date: today },
  { medIdx: 2, member: 1, qty: 1, notes: 'Morning dose', date: today },
  { medIdx: 3, member: 0, qty: 1, notes: '',              date: today },
  { medIdx: 3, member: 1, qty: 1, notes: '',              date: today },
  { medIdx: 3, member: 2, qty: 1, notes: '',              date: today },
  { medIdx: 0, member: 2, qty: 1, notes: 'Headache',      date: yesterday },
  { medIdx: 1, member: 0, qty: 2, notes: 'Fever',         date: yesterday },
];

const txMedLog = db.transaction(() => {
  for (const log of medLogs) {
    const med = medicines[log.medIdx];
    medLogInsert.run(uuid(), med.id, med.name, members[log.member].id, log.qty, log.notes, `${log.date}T10:00:00.000Z`);
    // Deduct from stock
    db.prepare('UPDATE medicines SET quantity = quantity - ? WHERE id = ?').run(log.qty, med.id);
  }
});
txMedLog();
console.log(`✔ ${medLogs.length} medicine intake logs`);

// ─── Summary ────────────────────────────────────────────────────────
console.log('\n📊 Sample database summary:');
console.log(`  Members:      ${db.prepare('SELECT COUNT(*) as c FROM household_members').get().c}`);
console.log(`  Food items:   ${db.prepare('SELECT COUNT(*) as c FROM inventory_items WHERE is_liquid = 0').get().c}`);
console.log(`  Liquid items: ${db.prepare('SELECT COUNT(*) as c FROM inventory_items WHERE is_liquid = 1').get().c}`);
console.log(`  Consumption:  ${db.prepare('SELECT COUNT(*) as c FROM consumption_log').get().c} logs`);
console.log(`  Liquid logs:  ${db.prepare('SELECT COUNT(*) as c FROM liquid_log').get().c} logs`);
console.log(`  Beverages:    ${db.prepare('SELECT COUNT(*) as c FROM beverage_log').get().c} logs`);
console.log(`  Medicines:    ${db.prepare('SELECT COUNT(*) as c FROM medicines').get().c}`);
console.log(`  Med logs:     ${db.prepare('SELECT COUNT(*) as c FROM medicine_log').get().c} logs`);
console.log('\n✅ Sample database ready!');
