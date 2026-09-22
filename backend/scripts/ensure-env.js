// Creates backend/.env from .env.example on first install, with a random JWT secret.
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const root = path.join(__dirname, '..');
const target = path.join(root, '.env');
const example = path.join(root, '.env.example');

try {
  if (!fs.existsSync(target) && fs.existsSync(example)) {
    const secret = crypto.randomBytes(32).toString('hex');
    const content = fs.readFileSync(example, 'utf8').replace('JWT_SECRET=change-me', `JWT_SECRET=${secret}`);
    fs.writeFileSync(target, content);
    console.log('[pawnest] Created backend/.env (edit it to add your OPENAI_API_KEY / MongoDB URI).');
  }
} catch (err) {
  console.warn('[pawnest] Could not create backend/.env automatically:', err.message);
}
