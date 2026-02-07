const router = require('express').Router();
const { getDb } = require('../db');

router.get('/', (req, res) => {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM categories ORDER BY name').all();
  res.json(rows);
});

module.exports = router;
