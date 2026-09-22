const express = require('express');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const HttpError = require('../utils/httpError');
const asyncHandler = require('../utils/asyncHandler');
const { signToken, protect } = require('../middleware/auth');

const router = express.Router();
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 40, standardHeaders: true, legacyHeaders: false, message: { message: 'Too many attempts. Please try again in a few minutes.' } });

const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

router.post('/register', authLimiter, asyncHandler(async (req, res) => {
  const { name = '', email = '', password = '', phone = '' } = req.body || {};
  if (name.trim().length < 2) throw new HttpError(400, 'Please enter your full name.');
  if (!emailRe.test(email)) throw new HttpError(400, 'Please enter a valid email address.');
  if (password.length < 6) throw new HttpError(400, 'Password must be at least 6 characters.');
  if (await User.exists({ email: email.toLowerCase().trim() })) throw new HttpError(409, 'An account with this email already exists. Try signing in.');
  const user = await User.create({ name: name.trim(), email, password, phone: String(phone).trim(), role: 'customer' });
  res.status(201).json({ token: signToken(user), user: user.toSafeJSON() });
}));

router.post('/login', authLimiter, asyncHandler(async (req, res) => {
  const { email = '', password = '' } = req.body || {};
  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');
  if (!user || !(await user.comparePassword(password))) throw new HttpError(401, 'Incorrect email or password.');
  if (!user.isActive) throw new HttpError(403, 'This account has been disabled. Please contact support.');
  res.json({ token: signToken(user), user: user.toSafeJSON() });
}));

router.get('/me', protect, (req, res) => res.json({ user: req.user.toSafeJSON() }));

router.put('/me', protect, asyncHandler(async (req, res) => {
  const { name, phone, address } = req.body || {};
  if (name !== undefined) {
    if (String(name).trim().length < 2) throw new HttpError(400, 'Please enter your full name.');
    req.user.name = String(name).trim();
  }
  if (phone !== undefined) req.user.phone = String(phone).trim();
  if (address && typeof address === 'object') {
    req.user.address = {
      line1: String(address.line1 || '').trim(),
      city: String(address.city || '').trim(),
      postalCode: String(address.postalCode || '').trim(),
    };
  }
  await req.user.save();
  res.json({ user: req.user.toSafeJSON() });
}));

router.put('/me/password', protect, asyncHandler(async (req, res) => {
  const { currentPassword = '', newPassword = '' } = req.body || {};
  if (newPassword.length < 6) throw new HttpError(400, 'New password must be at least 6 characters.');
  const user = await User.findById(req.user._id).select('+password');
  if (!(await user.comparePassword(currentPassword))) throw new HttpError(400, 'Your current password is incorrect.');
  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password updated.' });
}));

module.exports = router;
