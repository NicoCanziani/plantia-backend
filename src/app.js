require('dotenv').config();
const express = require('express');
const cors = require('cors');
const passport = require('./config/passport');

const authRoutes = require('./routes/auth.routes');
const plantsRoutes = require('./routes/plants.routes');
const aiRoutes = require('./routes/ai.routes');
const calendarRoutes = require('./routes/calendar.routes');
const notificationsRoutes = require('./routes/notifications.routes');

const { startScheduler } = require('./services/scheduler.service');

const app = express();

const ALLOWED_ORIGINS = [
  process.env.CLIENT_URL,
  'http://localhost:5173',
  'http://localhost:5174',
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin)) cb(null, true);
    else cb(new Error(`CORS: origen no permitido — ${origin}`));
  },
  credentials: true,
}));
app.use(express.json());
app.use(passport.initialize());

app.get('/healthz', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/plants', plantsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/notifications', notificationsRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  const status = err.status || 500;
  res.status(status).json({ error: err.message || 'Error interno del servidor' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Plantia backend corriendo en http://localhost:${PORT}`);
  startScheduler();
});

module.exports = app;
