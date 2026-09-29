const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const env = require('./config/env');
const { notFound, errorHandler } = require('./middleware/error');
const { productReviews, publicReviews } = require('./routes/reviews');

const app = express();
app.set('trust proxy', 1);

app.use(helmet({ contentSecurityPolicy: false, crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({ origin: env.isProd ? true : [env.clientUrl, 'http://localhost:5173', 'http://127.0.0.1:5173'], credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.get('/', (req, res) => {
  res.json({
    ok: true,
    name: 'PawNest API',
    message: 'PawNest backend is running',
    health: '/api/health'
  });
});
app.use('/uploads', express.static(env.paths.uploads, { maxAge: '7d' }));
app.use('/assets', express.static(env.paths.publicDir, { maxAge: '7d' }));

app.get('/api/health', (req, res) => res.json({ ok: true, name: 'PawNest API' }));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/products/:productId/reviews', productReviews);
app.use('/api/products', require('./routes/products'));
app.use('/api/reviews', publicReviews);
app.use('/api/cart', require('./routes/cart'));
app.use('/api/orders', require('./routes/orders'));
app.use('/api/pets', require('./routes/pets'));
app.use('/api/wishlist', require('./routes/wishlist'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/newsletter', require('./routes/newsletter'));
app.use('/api/ai', require('./routes/ai'));
app.use('/api/admin', require('./routes/admin'));
app.use('/api', notFound);

// Serve the built React app (npm run build) from the same server in production.
if (fs.existsSync(path.join(env.paths.frontendDist, 'index.html'))) {
  app.use(express.static(env.paths.frontendDist, { maxAge: '1h', index: false }));
  app.get('*', (req, res) => res.sendFile(path.join(env.paths.frontendDist, 'index.html')));
}

app.use(errorHandler);

module.exports = app;
