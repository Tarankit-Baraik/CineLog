const express = require('express');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Render/Railway terminate the connection in front of the app - without this,
// req.ip is the proxy's address for every request, and /search's per-IP rate
// limit would be one shared bucket for all users.
app.set('trust proxy', 1);

app.use(express.json());

// No frontend origin is fixed yet (static host, not decided) - wildcard is fine for a
// portfolio project with no cookie-based auth (JWT is header-only, not a CSRF vector here).
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

app.use('/api', routes);

app.use(errorHandler);

module.exports = app;
