const mongoose = require('mongoose');

const MONGODB_URI_RAW = process.env.MONGODB_URI || 'mongodb://localhost:27017/campuskart';

// Dynamically extract the connection URI if it has quotes or other CLI commands copy-pasted
let MONGODB_URI = MONGODB_URI_RAW;
if (MONGODB_URI_RAW) {
  const match = MONGODB_URI_RAW.match(/(mongodb(?:\+srv)?:\/\/[^\s"]+)/);
  if (match) {
    MONGODB_URI = match[1];
  }
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development and serverless function invocations in production.
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

const connectDB = async () => {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      console.log('MongoDB connection initialized successfully');
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    console.error(`Database Connection Error: ${error.message}`);
    throw error;
  }

  return cached.conn;
};

module.exports = connectDB;
