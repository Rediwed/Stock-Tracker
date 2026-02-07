const router = require('express').Router();
const { getDb } = require('../db');
const { v4: uuid } = require('uuid');

// Get liquid inventory summary (liters remaining in rations)
router.get('/inventory', (req, res) => {
  const db = getDb();
  const items = db.prepare(`
    SELECT i.*, c.name as category_name, c.color as category_color
    FROM inventory_items i
    LEFT JOIN categories c ON i.category_id = c.id
    WHERE i.is_liquid = 1
    ORDER BY i.expiry_date ASC, i.name ASC
  `).all();

  const totalMl = items.reduce((s, i) => s + (i.volume_ml || 0), 0);
  const totalCalories = items.reduce((s, i) => s + (i.calories_per_unit || 0), 0);

  res.json({ items, totalMl, totalLiters: Math.round(totalMl / 10) / 100, totalCalories });
});

// Get liquid consumption logs
router.get('/', (req, res) => {
  const db = getDb();
  const { date, member_id } = req.query;
  let sql = `
    SELECT ll.*, hm.name as member_name
    FROM liquid_log ll
    LEFT JOIN household_members hm ON ll.member_id = hm.id
    WHERE 1=1
  `;
  const params = [];
  if (date) { sql += ' AND date(ll.logged_at) = ?'; params.push(date); }
  if (member_id) { sql += ' AND ll.member_id = ?'; params.push(member_id); }
  sql += ' ORDER BY ll.logged_at DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

// Get daily summary per member
router.get('/summary', (req, res) => {
  const db = getDb();
  const date = req.query.date || new Date().toISOString().slice(0, 10);
  const rows = db.prepare(`
    SELECT hm.id as member_id, hm.name as member_name,
      COALESCE(SUM(CASE WHEN ll.type = 'water' THEN ll.amount_ml ELSE 0 END), 0) as water_ml,
      COALESCE(SUM(CASE WHEN ll.type = 'tea' THEN ll.amount_ml ELSE 0 END), 0) as tea_ml,
      COALESCE(SUM(CASE WHEN ll.type = 'coffee' THEN ll.amount_ml ELSE 0 END), 0) as coffee_ml,
      COALESCE(SUM(ll.amount_ml), 0) as total_ml
    FROM household_members hm
    LEFT JOIN liquid_log ll ON hm.id = ll.member_id AND date(ll.logged_at) = ?
    GROUP BY hm.id
    ORDER BY hm.name
  `).all(date);
  res.json(rows);
});

// Log liquid consumption
router.post('/', (req, res) => {
  const db = getDb();
  const id = uuid();
  const { member_id, type = 'water', amount_ml = 250 } = req.body;
  db.prepare('INSERT INTO liquid_log (id, member_id, type, amount_ml) VALUES (?, ?, ?, ?)')
    .run(id, member_id, type, amount_ml);
  const row = db.prepare(`
    SELECT ll.*, hm.name as member_name
    FROM liquid_log ll
    LEFT JOIN household_members hm ON ll.member_id = hm.id
    WHERE ll.id = ?
  `).get(id);
  res.status(201).json(row);
});

// Delete liquid log
router.delete('/:id', (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM liquid_log WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

module.exports = router;
