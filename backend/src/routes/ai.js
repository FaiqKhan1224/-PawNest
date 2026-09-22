const express = require('express');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const Pet = require('../models/Pet');
const Product = require('../models/Product');
const Setting = require('../models/Setting');
const HttpError = require('../utils/httpError');
const asyncHandler = require('../utils/asyncHandler');
const { optionalAuth } = require('../middleware/auth');
const { chat } = require('../services/aiService');

const router = express.Router();
const limiter = rateLimit({ windowMs: 60 * 1000, limit: 20, standardHeaders: true, legacyHeaders: false, message: { message: 'PawAI is getting a lot of questions. Please wait a moment and try again.' } });

router.post('/chat', limiter, optionalAuth, asyncHandler(async (req, res) => {
  const body = req.body || {};
  const message = String(body.message || '').trim();
  if (!message) throw new HttpError(400, 'Please type a message for PawAI.');
  if (message.length > 800) throw new HttpError(400, 'Please keep your message under 800 characters.');

  const settings = await Setting.get();
  if (!settings.aiEnabled) throw new HttpError(503, 'PawAI is taking a break right now. Please try again later.');

  let pet = null;
  if (req.user && mongoose.isValidObjectId(body.petId)) pet = await Pet.findOne({ _id: body.petId, user: req.user._id }).lean();

  let focusProduct = null;
  if (mongoose.isValidObjectId(body.productId)) focusProduct = await Product.findOne({ _id: body.productId, isActive: true }).lean();

  const result = await chat({
    message,
    history: Array.isArray(body.history) ? body.history : [],
    pet,
    focusProduct,
    user: req.user,
  });
  res.json(result);
}));

module.exports = router;
