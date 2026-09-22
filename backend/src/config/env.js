const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const nodeEnv = process.env.NODE_ENV || 'development';

const env = {
  nodeEnv,
  isProd: nodeEnv === 'production',
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/pawnest',
  useMemoryDb: String(process.env.USE_MEMORY_DB || '').toLowerCase() === 'true',
  jwtSecret: process.env.JWT_SECRET || 'pawnest-dev-secret-change-me',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  openaiKey: (process.env.OPENAI_API_KEY || '').trim(),
  openaiModel: process.env.OPENAI_MODEL || 'gpt-4o-mini',
  autoSeed: String(process.env.AUTO_SEED || 'true').toLowerCase() !== 'false',
  paths: {
    root: path.join(__dirname, '../..'),
    uploads: path.join(__dirname, '../../uploads'),
    publicDir: path.join(__dirname, '../../public'),
    frontendDist: path.join(__dirname, '../../../frontend/dist'),
    memoryDb: path.join(__dirname, '../../.mongo-data'),
  },
};

if (env.isProd && (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'change-me')) {
  throw new Error('JWT_SECRET must be set to a long random value when NODE_ENV=production.');
}

module.exports = env;
