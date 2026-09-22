const express = require('express');
const rateLimit = require('express-rate-limit');
const Subscriber = require('../models/Subscriber');
const HttpError = require('../utils/httpError');
const asyncHandler = require('../utils/asyncHandler');

const router = express.Router();
const limiter = rateLimit({ windowMs: 60 * 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false });

router.post('/', limiter, asyncHandler(async (req, res) => {
  const email = String((req.body && req.body.email) || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new HttpError(400, 'Please enter a valid email address.');
  await Subscriber.updateOne({ email }, { $setOnInsert: { email } }, { upsert: true });
  res.status(201).json({ message: 'You are subscribed. Welcome to the PawNest family!' });
}));

module.exports = router;
