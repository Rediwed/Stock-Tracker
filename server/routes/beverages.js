const router = require('express').Router();
const { getDb } = require('../db');
const { v4: uuid } = require('uuid');

// Get beverage log (coffee capsules / tea sachets consumed)
router.get('/', (req, res) => {
  const db = getDb();
  const { date, member_id } = req.query;
  let sql = `
    SELECT bl.*, hm.name as member_name
    FROM beverage_log bl
    LEFT JOIN household_members hm ON bl.member_id = hm.id
    WHERE 1=1
  `;
  const params = [];
  if (date) { sql += ' AND date(bl.logged_at) = ?'; params.push(date); }
  if (member_id) { sql += ' AND bl.member_id = ?'; params.push(member_id); }
  sql += ' ORDER BY bl.logged_at DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

// Get daily beverage summary per member
router.get('/summary', (req, res) => {
  const db = getDb();
  const date = req.query.date || new Date().toISOString().slice(0, 10);
  const rows = db.prepare(`
    SELECT hm.id as member_id, hm.name as member_name,
      COALESCE(SUM(CASE WHEN bl.type = 'coffee' THEN bl.capsules_or_sachets ELSE 0 END), 0) as coffee_capsules,
      COALESCE(SUM(CASE WHEN bl.type = 'coffee' THEN bl.water_ml ELSE 0 END), 0) as coffee_water_ml,
      COALESCE(SUM(CASE WHEN bl.type = 'tea' THEN bl.capsules_or_sachets ELSE 0 END), 0) as tea_sachets,
      COALESCE(SUM(CASE WHEN bl.type = 'tea' THEN bl.water_ml ELSE 0 END), 0) as tea_water_ml,
      COALESCE(SUM(bl.water_ml), 0) as total_water_ml
    FROM household_members hm
    LEFT JOIN beverage_log bl ON hm.id = bl.member_id AND date(bl.logged_at) = ?
    GROUP BY hm.id
    ORDER BY hm.name
  `).all(date);
  res.json(rows);
});

// Log a beverage (coffee capsule or tea sachet)
router.post('/', (req, res) => {
  const db = getDb();
  const id = uuid();
  const { member_id, type = 'coffee', capsules_or_sachets = 1, water_ml = 0 } = req.body;
  db.prepare('INSERT INTO beverage_log (id, member_id, type, capsules_or_sachets, water_ml) VALUES (?, ?, ?, ?, ?)')
    .run(id, member_id, type, capsules_or_sachets, water_ml);
  const row = db.prepare(`
    SELECT bl.*, hm.name as member_name
    FROM beverage_log bl
    LEFT JOIN household_members hm ON bl.member_id = hm.id
    WHERE bl.id = ?
  `).get(id);
  res.status(201).json(row);
});

// Delete beverage log
router.delete('/:id', (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM beverage_log WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

module.exports = router;
