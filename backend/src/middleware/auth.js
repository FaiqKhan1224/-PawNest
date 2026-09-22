const jwt = require('jsonwebtoken');
const env = require('../config/env');
const User = require('../models/User');

const signToken = (user) => jwt.sign({ id: user._id }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });

async function loadUser(req) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return null;
  try {
    const { id } = jwt.verify(token, env.jwtSecret);
    const user = await User.findById(id);
    return user && user.isActive ? user : null;
  } catch (err) {
    return null;
  }
}

const protect = async (req, res, next) => {
  const user = await loadUser(req);
  if (!user) return res.status(401).json({ message: 'Please sign in to continue.' });
  req.user = user;
  next();
};

const optionalAuth = async (req, res, next) => {
  req.user = await loadUser(req);
  next();
};

const adminOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') return res.status(403).json({ message: 'Admin access only.' });
  next();
};

module.exports = { signToken, protect, optionalAuth, adminOnly };
