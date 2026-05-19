require('dotenv').config();
const express = require('express');
const cors = require('cors');
const passport = require('./config/passport');

const authRoutes = require('./routes/auth.routes');

const app = express();

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));
app.use(express.json());
app.use(passport.initialize());

app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);

// Manejador de errores global
app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Plantia backend corriendo en http://localhost:${PORT}`);
});

module.exports = app;
