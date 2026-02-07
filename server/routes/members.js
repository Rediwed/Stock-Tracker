const router = require('express').Router();
const { getDb } = require('../db');
const { v4: uuid } = require('uuid');

// List members
router.get('/', (req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM household_members ORDER BY name').all();
  res.json(rows);
});

// Create member
router.post('/', (req, res) => {
  const db = getDb();
  const id = uuid();
  const { name, daily_calorie_target = 2000, daily_liquid_target = 2000 } = req.body;
  db.prepare('INSERT INTO household_members (id, name, daily_calorie_target, daily_liquid_target) VALUES (?, ?, ?, ?)')
    .run(id, name, daily_calorie_target, daily_liquid_target);
  const row = db.prepare('SELECT * FROM household_members WHERE id = ?').get(id);
  res.status(201).json(row);
});

// Update member
router.put('/:id', (req, res) => {
  const db = getDb();
  const { name, daily_calorie_target, daily_liquid_target } = req.body;
  db.prepare(`
    UPDATE household_members SET
      name = COALESCE(?, name),
      daily_calorie_target = COALESCE(?, daily_calorie_target),
      daily_liquid_target = COALESCE(?, daily_liquid_target),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(name, daily_calorie_target, daily_liquid_target, req.params.id);
  const row = db.prepare('SELECT * FROM household_members WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

// Delete member
router.delete('/:id', (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM household_members WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

// Get consumption for a member today
router.get('/:id/today', (req, res) => {
  const db = getDb();
  const member = db.prepare('SELECT * FROM household_members WHERE id = ?').get(req.params.id);
  if (!member) return res.status(404).json({ error: 'Not found' });

  const today = new Date().toISOString().slice(0, 10);
  const consumed = db.prepare(`
    SELECT COALESCE(SUM(calories), 0) as total_calories,
           COALESCE(SUM(protein_g), 0) as total_protein,
           COALESCE(SUM(carbs_g), 0) as total_carbs,
           COALESCE(SUM(fiber_g), 0) as total_fiber,
           COALESCE(SUM(sugar_g), 0) as total_sugar,
           COALESCE(SUM(fat_g), 0) as total_fat
    FROM consumption_log
    WHERE member_id = ? AND date(consumed_at) = ?
  `).get(req.params.id, today);

  const liquids = db.prepare(`
    SELECT type, COALESCE(SUM(amount_ml), 0) as total_ml
    FROM liquid_log
    WHERE member_id = ? AND date(logged_at) = ?
    GROUP BY type
  `).all(req.params.id, today);

  res.json({ member, consumed, liquids });
});

module.exports = router;
