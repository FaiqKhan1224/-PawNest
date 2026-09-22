const fs = require('fs');
const mongoose = require('mongoose');
const env = require('./env');

let memoryServer = null;

async function startMemoryServer() {
  let MongoMemoryServer;
  try {
    ({ MongoMemoryServer } = require('mongodb-memory-server'));
  } catch (err) {
    return null;
  }
  fs.mkdirSync(env.paths.memoryDb, { recursive: true });
  memoryServer = await MongoMemoryServer.create({
    instance: { dbPath: env.paths.memoryDb, storageEngine: 'wiredTiger' },
  });
  return memoryServer.getUri('pawnest');
}

function helpMessage(originalError) {
  return [
    '',
    '  Could not connect to MongoDB.',
    `  Tried: ${env.mongoUri}`,
    `  Reason: ${originalError && originalError.message}`,
    '',
    '  Fix it with ONE of these options:',
    '   1) Install and start MongoDB Community Server (https://www.mongodb.com/try/download/community)',
    '   2) Create a free MongoDB Atlas cluster and put its connection string in backend/.env (MONGODB_URI)',
    '   3) Run "npm run install:memory-db" inside /backend, then start again - PawNest will use an embedded MongoDB',
    '',
  ].join('\n');
}

async function connectDb() {
  mongoose.set('strictQuery', true);

  if (env.useMemoryDb) {
    const uri = await startMemoryServer();
    if (!uri) {
      throw new Error('USE_MEMORY_DB=true but mongodb-memory-server is not installed. Run "npm run install:memory-db" inside /backend.');
    }
    await mongoose.connect(uri);
    console.log('[db] Connected to embedded MongoDB (data stored in backend/.mongo-data)');
    return;
  }

  try {
    await mongoose.connect(env.mongoUri, { serverSelectionTimeoutMS: 5000 });
    console.log(`[db] Connected to MongoDB: ${mongoose.connection.host}/${mongoose.connection.name}`);
  } catch (err) {
    if (!env.isProd) {
      const uri = await startMemoryServer();
      if (uri) {
        await mongoose.connect(uri);
        console.warn('[db] MongoDB was not reachable - using the embedded MongoDB instead (data stored in backend/.mongo-data).');
        return;
      }
    }
    throw new Error(helpMessage(err));
  }
}

async function disconnectDb() {
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}

module.exports = { connectDb, disconnectDb };
