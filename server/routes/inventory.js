const router = require('express').Router();
const { getDb } = require('../db');
const { v4: uuid } = require('uuid');

// List all inventory items
router.get('/', (req, res) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT i.*, c.name as category_name, c.color as category_color
    FROM inventory_items i
    LEFT JOIN categories c ON i.category_id = c.id
    ORDER BY i.expiry_date ASC, i.name ASC
  `).all();
  res.json(rows);
});

// Get single item
router.get('/:id', (req, res) => {
  const db = getDb();
  const row = db.prepare(`
    SELECT i.*, c.name as category_name, c.color as category_color
    FROM inventory_items i
    LEFT JOIN categories c ON i.category_id = c.id
    WHERE i.id = ?
  `).get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

// Create item
router.post('/', (req, res) => {
  const db = getDb();
  const id = uuid();
  const {
    name, category_id, quantity = 1, unit = 'pcs',
    calories_per_unit = 0, protein_g = 0, carbs_g = 0,
    fiber_g = 0, sugar_g = 0, fat_g = 0,
    is_liquid = 0, volume_ml = 0,
    purchase_date, expiry_date, notes = ''
  } = req.body;

  db.prepare(`
    INSERT INTO inventory_items
    (id, name, category_id, quantity, unit, calories_per_unit, protein_g, carbs_g, fiber_g, sugar_g, fat_g, is_liquid, volume_ml, purchase_date, expiry_date, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, category_id, quantity, unit, calories_per_unit, protein_g, carbs_g, fiber_g, sugar_g, fat_g, is_liquid ? 1 : 0, volume_ml, purchase_date || null, expiry_date || null, notes);

  const row = db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(id);
  res.status(201).json(row);
});

// Update item
router.put('/:id', (req, res) => {
  const db = getDb();
  const {
    name, category_id, quantity, unit,
    calories_per_unit, protein_g, carbs_g,
    fiber_g, sugar_g, fat_g,
    is_liquid, volume_ml,
    purchase_date, expiry_date, notes
  } = req.body;

  db.prepare(`
    UPDATE inventory_items SET
      name = COALESCE(?, name),
      category_id = COALESCE(?, category_id),
      quantity = COALESCE(?, quantity),
      unit = COALESCE(?, unit),
      calories_per_unit = COALESCE(?, calories_per_unit),
      protein_g = COALESCE(?, protein_g),
      carbs_g = COALESCE(?, carbs_g),
      fiber_g = COALESCE(?, fiber_g),
      sugar_g = COALESCE(?, sugar_g),
      fat_g = COALESCE(?, fat_g),
      is_liquid = COALESCE(?, is_liquid),
      volume_ml = COALESCE(?, volume_ml),
      purchase_date = COALESCE(?, purchase_date),
      expiry_date = COALESCE(?, expiry_date),
      notes = COALESCE(?, notes),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(
    name, category_id, quantity, unit,
    calories_per_unit, protein_g, carbs_g,
    fiber_g, sugar_g, fat_g,
    is_liquid !== undefined ? (is_liquid ? 1 : 0) : undefined,
    volume_ml, purchase_date, expiry_date, notes,
    req.params.id
  );

  const row = db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

// Duplicate items
router.post('/duplicate', (req, res) => {
  const db = getDb();
  const { ids } = req.body;
  if (!ids || !ids.length) return res.status(400).json({ error: 'No IDs provided' });

  const select = db.prepare('SELECT * FROM inventory_items WHERE id = ?');
  const insert = db.prepare(`
    INSERT INTO inventory_items
    (id, name, category_id, quantity, unit, calories_per_unit, protein_g, carbs_g, fiber_g, sugar_g, fat_g, is_liquid, volume_ml, purchase_date, expiry_date, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const newItems = [];
  const tx = db.transaction(() => {
    for (const id of ids) {
      const orig = select.get(id);
      if (!orig) continue;
      const newId = uuid();
      insert.run(newId, orig.name, orig.category_id, orig.quantity, orig.unit, orig.calories_per_unit, orig.protein_g, orig.carbs_g, orig.fiber_g, orig.sugar_g, orig.fat_g, orig.is_liquid, orig.volume_ml, orig.purchase_date, orig.expiry_date, orig.notes);
      newItems.push(db.prepare('SELECT * FROM inventory_items WHERE id = ?').get(newId));
    }
  });
  tx();
  res.status(201).json(newItems);
});

// Bulk update items
router.put('/bulk', (req, res) => {
  const db = getDb();
  const { ids, updates } = req.body;
  if (!ids || !ids.length) return res.status(400).json({ error: 'No IDs provided' });

  const fields = [];
  const values = [];
  for (const [key, val] of Object.entries(updates)) {
    if (val === undefined || val === null || val === '') continue;
    if (key === 'is_liquid') {
      fields.push('is_liquid = ?');
      values.push(val ? 1 : 0);
    } else {
      fields.push(`${key} = ?`);
      values.push(val);
    }
  }
  if (fields.length === 0) return res.status(400).json({ error: 'No fields to update' });
  fields.push("updated_at = datetime('now')");

  const placeholders = ids.map(() => '?').join(',');
  const sql = `UPDATE inventory_items SET ${fields.join(', ')} WHERE id IN (${placeholders})`;
  db.prepare(sql).run(...values, ...ids);

  const updated = db.prepare(`SELECT i.*, c.name as category_name, c.color as category_color FROM inventory_items i LEFT JOIN categories c ON i.category_id = c.id WHERE i.id IN (${placeholders})`).all(...ids);
  res.json(updated);
});

// Bulk delete items (POST because DELETE with body is unreliable in browsers)
router.post('/bulk-delete', (req, res) => {
  const db = getDb();
  const { ids } = req.body;
  if (!ids || !ids.length) return res.status(400).json({ error: 'No IDs provided' });
  const placeholders = ids.map(() => '?').join(',');
  const result = db.prepare(`DELETE FROM inventory_items WHERE id IN (${placeholders})`).run(...ids);
  res.json({ success: true, deleted: result.changes });
});

// Bulk delete items (legacy DELETE route)
router.delete('/bulk', (req, res) => {
  const db = getDb();
  const { ids } = req.body;
  if (!ids || !ids.length) return res.status(400).json({ error: 'No IDs provided' });
  const placeholders = ids.map(() => '?').join(',');
  const result = db.prepare(`DELETE FROM inventory_items WHERE id IN (${placeholders})`).run(...ids);
  res.json({ success: true, deleted: result.changes });
});

// Delete item
router.delete('/:id', (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM inventory_items WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

module.exports = router;
