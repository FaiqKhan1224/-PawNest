const env = require('../config/env');
const { connectDb, disconnectDb } = require('../config/db');
const { runSeed } = require('./index');

(async () => {
  try {
    await connectDb();
    const reset = process.argv.includes('--reset');
    if (!reset) {
      const Product = require('../models/Product');
      if ((await Product.estimatedDocumentCount()) > 0) {
        console.log('[seed] The database already has products. Run "npm run seed:reset" to wipe and reseed.');
        await disconnectDb();
        return;
      }
    }
    await runSeed({ reset });
    await disconnectDb();
  } catch (err) {
    console.error(err.message || err);
    process.exit(1);
  }
})();
