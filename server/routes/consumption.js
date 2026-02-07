const router = require('express').Router();
const { getDb } = require('../db');
const { v4: uuid } = require('uuid');

// List consumption log (with optional date filter)
router.get('/', (req, res) => {
  const db = getDb();
  const { date, member_id } = req.query;
  let sql = `
    SELECT cl.*, hm.name as member_name
    FROM consumption_log cl
    LEFT JOIN household_members hm ON cl.member_id = hm.id
    WHERE 1=1
  `;
  const params = [];
  if (date) { sql += ' AND date(cl.consumed_at) = ?'; params.push(date); }
  if (member_id) { sql += ' AND cl.member_id = ?'; params.push(member_id); }
  sql += ' ORDER BY cl.consumed_at DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

// Log consumption (consume or discard)
router.post('/', (req, res) => {
  const db = getDb();
  const id = uuid();
  const {
    item_id, member_id, quantity = 1, reason = 'consumed'
  } = req.body;

  // Get item details
  const item = db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(item_id);
  if (!item) return res.status(404).json({ error: 'Item not found' });

  if (quantity > item.quantity) {
    return res.status(400).json({ error: 'Not enough stock' });
  }

  const calories = item.calories_per_unit * quantity;
  const protein_g = item.protein_g * quantity;
  const carbs_g = item.carbs_g * quantity;
  const fiber_g = item.fiber_g * quantity;
  const sugar_g = item.sugar_g * quantity;
  const fat_g = item.fat_g * quantity;

  db.prepare(`
    INSERT INTO consumption_log
    (id, item_id, item_name, member_id, quantity, unit, calories, protein_g, carbs_g, fiber_g, sugar_g, fat_g, reason)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, item_id, item.name, member_id || null, quantity, item.unit, calories, protein_g, carbs_g, fiber_g, sugar_g, fat_g, reason);

  // Reduce inventory
  const newQty = item.quantity - quantity;
  if (newQty <= 0) {
    db.prepare('DELETE FROM inventory_items WHERE id = ?').run(item_id);
  } else {
    db.prepare('UPDATE inventory_items SET quantity = ?, updated_at = datetime(\'now\') WHERE id = ?').run(newQty, item_id);
  }

  const log = db.prepare('SELECT * FROM consumption_log WHERE id = ?').get(id);
  res.status(201).json(log);
});

// Delete log entry (undo)
router.delete('/:id', (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM consumption_log WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

module.exports = router;
