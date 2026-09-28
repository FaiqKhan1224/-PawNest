const app = require('../src/app');
const { connectDb } = require('../src/config/db');
const env = require('../src/config/env');

let dbConnected = false;

async function handler(req, res) {
  try {
    if (!dbConnected) {
      await connectDb();
      dbConnected = true;
      console.log('[PawNest] MongoDB connected');
    }

    return app(req, res);
  } catch (error) {
    console.error('[PawNest] Serverless error:', error);

    return res.status(500).json({
      ok: false,
      message: 'PawNest API server error',
    });
  }
}

module.exports = handler;