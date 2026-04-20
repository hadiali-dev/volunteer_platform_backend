const mongoose = require('mongoose');

const getMongoUri = () => process.env.DATABASE_URL || process.env.MONGO_URI;

const getMongoHost = (uri) => {
  try {
    return new URL(uri).host;
  } catch {
    return null;
  }
};

const toConnectionError = (error, uri) => {
  if (!error) {
    return new Error('Unknown MongoDB connection error');
  }

  if (error.code === 'ENOTFOUND') {
    const host = getMongoHost(uri) || 'the configured MongoDB host';
    return new Error(
      `${host} could not be resolved in DNS. Check DATABASE_URL/MONGO_URI in .env and confirm the MongoDB host still exists.`,
    );
  }

  return error;
};

const connectDB = async () => {
  const uri = getMongoUri();

  if (!uri) {
    throw new Error('Missing DATABASE_URL or MONGO_URI in environment variables');
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    throw toConnectionError(error, uri);
  }
};

module.exports = connectDB;
