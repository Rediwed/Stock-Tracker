const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/categories', require('./routes/categories'));
app.use('/api/inventory', require('./routes/inventory'));
app.use('/api/members', require('./routes/members'));
app.use('/api/consumption', require('./routes/consumption'));
app.use('/api/liquids', require('./routes/liquids'));
app.use('/api/beverages', require('./routes/beverages'));
app.use('/api/medicines', require('./routes/medicines'));
app.use('/api/dashboard', require('./routes/dashboard'));

// Serve built client in production
const clientBuild = path.join(__dirname, '..', 'client', 'dist');
app.use(express.static(clientBuild));
app.get('*', (req, res) => {
  res.sendFile(path.join(clientBuild, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`\n  🚀 Stock Tracker API running at http://localhost:${PORT}\n`);
});
