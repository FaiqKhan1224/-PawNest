const app = require('../src/app');
const { connectDb } = require('../src/config/db');

let dbPromise;

module.exports = async function handler(req, res) {
  try {
    if (!dbPromise) {
      dbPromise = connectDb();
    }

    await dbPromise;

    return app(req, res);
  } catch (error) {
    console.error('[PawNest] API error:', error);

    dbPromise = null;

    return res.status(500).json({
      ok: false,
      message: 'PawNest API server error',
    });
  }
};