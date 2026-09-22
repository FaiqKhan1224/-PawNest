const env = require('./src/config/env');
const { connectDb } = require('./src/config/db');
const app = require('./src/app');
const Product = require('./src/models/Product');
const { runSeed } = require('./src/seed');

async function start() {
  await connectDb();

  if (env.autoSeed && (await Product.estimatedDocumentCount()) === 0) {
    console.log('[seed] Database is empty - loading PawNest demo data (products, brands, reviews, orders, users)...');
    await runSeed({ reset: false });
  }

  app.listen(env.port, () => {
    console.log('');
    console.log('  PawNest API running on http://localhost:' + env.port);
    console.log(env.openaiKey ? `  PawAI: OpenAI enabled (${env.openaiModel})` : '  PawAI: basic mode (add OPENAI_API_KEY to backend/.env for full AI)');
    console.log('  Admin login:    admin@pawnest.com / Admin@123');
    console.log('  Customer login: ali@gmail.com / User@1234');
    console.log('  (Change these passwords before going live.)');
    console.log('');
  });
}

start().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
