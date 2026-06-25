require('express-async-errors');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const {warden} =require('@hadi_ali/warden')
const errorHandler = require('./middlewares/errorHandler');
const AppError = require('./utils/AppError');
const allRoutes = require('./routes/allRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
app.disable('etag');
app.set('trust proxy', 1);
app.use(warden({
  scorethreshold: 30,
  knownSubdomains: ['api', 'www']
}))
const strictHelmet = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      baseUri: ["'self'"],
      objectSrc: ["'none'"],
      frameAncestors: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'],
    },
  },
});

const adminHelmet = helmet({
  contentSecurityPolicy: false,
});

// Keep API/routes strict while letting AdminJS use its own CSP from setup.mjs.
app.use((req, res, next) => {
  if (req.path.startsWith('/admin')) {
    return adminHelmet(req, res, next);
  }
  return strictHelmet(req, res, next);
});
app.use(cookieParser());
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
const rateLimit = require('express-rate-limit');

app.use('/api/auth/login', rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'محاولات كثيرة الرجاء المحاولة لاحقا'
}));
app.use(express.json());
app.use(morgan('dev'));

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/v1', allRoutes);

const attachFallbackHandlers = (targetApp) => {
  targetApp.all('*', (req, res, next) => {
    next(new AppError(`Route ${req.originalUrl} not found`, 404));
  });

  targetApp.use(errorHandler);
};

module.exports = {
  app,
  attachFallbackHandlers,
};
