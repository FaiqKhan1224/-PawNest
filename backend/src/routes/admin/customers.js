const express = require('express');
const mongoose = require('mongoose');
const User = require('../../models/User');
const Order = require('../../models/Order');
const Pet = require('../../models/Pet');
const Subscriber = require('../../models/Subscriber');
const HttpError = require('../../utils/httpError');
const asyncHandler = require('../../utils/asyncHandler');
const { escapeRegex, toInt } = require('../../utils/text');

const router = express.Router();

router.get('/', asyncHandler(async (req, res) => {
  const page = toInt(req.query.page, 1, { min: 1, max: 10000 });
  const limit = toInt(req.query.limit, 10, { min: 1, max: 100 });
  const filter = { role: 'customer' };
  const q = String(req.query.q || '').trim().slice(0, 60);
  if (q) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: rx }, { email: rx }, { phone: rx }];
  }
  if (req.query.status === 'active') filter.isActive = true;
  if (req.query.status === 'disabled') filter.isActive = false;

  const [users, total, activeCount, subscribers] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    User.countDocuments(filter),
    User.countDocuments({ role: 'customer', isActive: true }),
    Subscriber.countDocuments(),
  ]);

  const stats = await Order.aggregate([
    { $match: { user: { $in: users.map((u) => u._id) }, status: { $ne: 'Cancelled' } } },
    { $group: { _id: '$user', orders: { $sum: 1 }, spent: { $sum: '$total' } } },
  ]);
  const byUser = new Map(stats.map((s) => [String(s._id), s]));

  res.json({
    customers: users.map((u) => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      phone: u.phone,
      isActive: u.isActive,
      createdAt: u.createdAt,
      orderCount: (byUser.get(String(u._id)) || {}).orders || 0,
      totalSpent: (byUser.get(String(u._id)) || {}).spent || 0,
    })),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
    summary: { active: activeCount, subscribers },
  });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(404, 'Customer not found.');
  const user = await User.findOne({ _id: req.params.id, role: 'customer' }).lean();
  if (!user) throw new HttpError(404, 'Customer not found.');
  const [orders, pets] = await Promise.all([
    Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(20).lean(),
    Pet.find({ user: user._id }).lean(),
  ]);
  res.json({ customer: { _id: user._id, name: user.name, email: user.email, phone: user.phone, address: user.address, isActive: user.isActive, createdAt: user.createdAt }, orders, pets });
}));

router.patch('/:id/active', asyncHandler(async (req, res) => {
  if (typeof req.body.isActive !== 'boolean') throw new HttpError(400, 'isActive must be true or false.');
  const user = await User.findOneAndUpdate({ _id: req.params.id, role: 'customer' }, { $set: { isActive: req.body.isActive } }, { new: true });
  if (!user) throw new HttpError(404, 'Customer not found.');
  res.json({ customer: { _id: user._id, isActive: user.isActive } });
}));

module.exports = router;
