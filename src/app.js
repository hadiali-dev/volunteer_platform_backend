require('express-async-errors');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const errorHandler = require('./middlewares/errorHandler');
const AppError = require('./utils/AppError');
const allRoutes = require('./routes/allRoutes');
const authRoutes = require('./routes/authRoutes');

const app = express();
app.disable('etag');

app.use(
  helmet({
    // AdminJS bootstraps its frontend with inline scripts on the login/app pages.
    contentSecurityPolicy: false,
  }),
);
app.use(cookieParser());
app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json());
app.use(morgan('dev'));

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
