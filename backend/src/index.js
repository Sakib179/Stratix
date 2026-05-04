require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');

const env = require('./config/env');
const db = require('./config/db');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler.middleware');
const { globalLimiter } = require('./middleware/rateLimit.middleware');
const logger = require('./utils/logger');
const { startScheduler } = require('./services/scheduler.service');
const passport = require('./config/passport');

const app = express();

['logs', 'uploads/profiles', 'uploads/products', 'backups'].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

app.set('trust proxy', 1);

app.use(
  helmet({
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    contentSecurityPolicy: false,
  })
);

app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

app.use(morgan('combined', { stream: { write: (msg) => logger.http(msg.trim()) } }));

app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use(globalLimiter);
app.use(passport.initialize());

app.use('/api/v1', routes);

app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.path} not found` });
});

app.use(errorHandler);

const PORT = env.PORT;
app.listen(PORT, async () => {
  logger.info(`\n  ⬡  Stratix BMS API  ───────────────────────────────`);
  logger.info(`     Server: http://localhost:${PORT}`);
  logger.info(`     Env:    ${env.NODE_ENV}`);
  logger.info(`  ─────────────────────────────────────────────────────\n`);

  try {
    await db.query('SELECT 1');
    logger.info('  ✓  Database connected');
  } catch (err) {
    logger.error('  ✗  Database connection failed:', err.message);
    process.exit(1);
  }

  startScheduler();
});

module.exports = app;
