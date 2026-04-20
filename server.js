const dotenv = require('dotenv');

dotenv.config();

const { app, attachFallbackHandlers } = require('./src/app');
const connectDB = require('./src/config/db');

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  const { mountAdminPanel } = await import('./src/adminjs/setup.mjs');
  const { rootPath } = await mountAdminPanel(app);
  attachFallbackHandlers(app);

  app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
    console.log(`Admin panel is available at ${rootPath}`);
  });
};

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});
