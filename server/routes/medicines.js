const router = require('express').Router();
const { getDb } = require('../db');
const { v4: uuid } = require('uuid');

// List all medicines
router.get('/', (req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM medicines ORDER BY expiry_date ASC, name ASC').all();
  res.json(rows);
});

// Get single medicine
router.get('/:id', (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT * FROM medicines WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

// Create medicine
router.post('/', (req, res) => {
  const db = getDb();
  const id = uuid();
  const {
    name, type = 'tablet', quantity = 0, unit = 'tablets',
    dosage = '', frequency = '', notes = '',
    purchase_date, expiry_date
  } = req.body;

  db.prepare(`
    INSERT INTO medicines (id, name, type, quantity, unit, dosage, frequency, notes, purchase_date, expiry_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, name, type, quantity, unit, dosage, frequency, notes, purchase_date || null, expiry_date || null);

  const row = db.prepare('SELECT * FROM medicines WHERE id = ?').get(id);
  res.status(201).json(row);
});

// Update medicine
router.put('/:id', (req, res) => {
  const db = getDb();
  const {
    name, type, quantity, unit,
    dosage, frequency, notes,
    purchase_date, expiry_date
  } = req.body;

  db.prepare(`
    UPDATE medicines SET
      name = COALESCE(?, name),
      type = COALESCE(?, type),
      quantity = COALESCE(?, quantity),
      unit = COALESCE(?, unit),
      dosage = COALESCE(?, dosage),
      frequency = COALESCE(?, frequency),
      notes = COALESCE(?, notes),
      purchase_date = COALESCE(?, purchase_date),
      expiry_date = COALESCE(?, expiry_date),
      updated_at = datetime('now')
    WHERE id = ?
  `).run(name, type, quantity, unit, dosage, frequency, notes, purchase_date, expiry_date, req.params.id);

  const row = db.prepare('SELECT * FROM medicines WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json(row);
});

// Delete medicine
router.delete('/:id', (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM medicines WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

// Get medicine consumption log
router.get('/:id/log', (req, res) => {
  const db = getDb();
  const rows = db.prepare(`
    SELECT ml.*, hm.name as member_name
    FROM medicine_log ml
    LEFT JOIN household_members hm ON ml.member_id = hm.id
    WHERE ml.medicine_id = ?
    ORDER BY ml.taken_at DESC
  `).all(req.params.id);
  res.json(rows);
});

// Log medicine intake (reduces quantity)
router.post('/log', (req, res) => {
  const db = getDb();
  const id = uuid();
  const { medicine_id, member_id, quantity = 1, notes = '' } = req.body;

  const med = db.prepare('SELECT * FROM medicines WHERE id = ?').get(medicine_id);
  if (!med) return res.status(404).json({ error: 'Medicine not found' });
  if (quantity > med.quantity) return res.status(400).json({ error: 'Not enough stock' });

  db.prepare(`
    INSERT INTO medicine_log (id, medicine_id, medicine_name, member_id, quantity, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(id, medicine_id, med.name, member_id || null, quantity, notes);

  // Reduce stock
  db.prepare('UPDATE medicines SET quantity = quantity - ?, updated_at = datetime(\'now\') WHERE id = ?')
    .run(quantity, medicine_id);

  const row = db.prepare(`
    SELECT ml.*, hm.name as member_name
    FROM medicine_log ml
    LEFT JOIN household_members hm ON ml.member_id = hm.id
    WHERE ml.id = ?
  `).get(id);
  res.status(201).json(row);
});

// Get all medicine logs (with optional date filter)
router.get('/log/all', (req, res) => {
  const db = getDb();
  const { date, member_id } = req.query;
  let sql = `
    SELECT ml.*, hm.name as member_name
    FROM medicine_log ml
    LEFT JOIN household_members hm ON ml.member_id = hm.id
    WHERE 1=1
  `;
  const params = [];
  if (date) { sql += ' AND date(ml.taken_at) = ?'; params.push(date); }
  if (member_id) { sql += ' AND ml.member_id = ?'; params.push(member_id); }
  sql += ' ORDER BY ml.taken_at DESC';
  const rows = db.prepare(sql).all(...params);
  res.json(rows);
});

// Delete medicine log entry
router.delete('/log/:id', (req, res) => {
  const db = getDb();
  const result = db.prepare('DELETE FROM medicine_log WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Not found' });
  res.json({ success: true });
});

module.exports = router;
