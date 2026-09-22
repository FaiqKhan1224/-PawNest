const express = require('express');
const mongoose = require('mongoose');
const Order = require('../../models/Order');
const HttpError = require('../../utils/httpError');
const asyncHandler = require('../../utils/asyncHandler');
const { escapeRegex, toInt } = require('../../utils/text');
const { restock } = require('../orders');

const router = express.Router();
const STATUSES = ['Processing', 'Shipped', 'Delivered', 'Cancelled'];

router.get('/', asyncHandler(async (req, res) => {
  const page = toInt(req.query.page, 1, { min: 1, max: 10000 });
  const limit = toInt(req.query.limit, 10, { min: 1, max: 100 });
  const filter = {};
  if (STATUSES.includes(req.query.status)) filter.status = req.query.status;
  if (req.query.payment === 'Pending' || req.query.payment === 'Paid') filter.paymentStatus = req.query.payment;
  const q = String(req.query.q || '').trim().slice(0, 60);
  if (q) {
    const rx = new RegExp(escapeRegex(q.replace(/^#/, '')), 'i');
    const or = [{ 'shipping.fullName': rx }, { 'shipping.email': rx }, { 'shipping.phone': rx }];
    const num = Number(q.replace(/^#/, ''));
    if (num) or.push({ orderNumber: num });
    filter.$or = or;
  }
  const [orders, total, counts] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    Order.countDocuments(filter),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);
  const statusCounts = Object.fromEntries(STATUSES.map((s) => [s, 0]));
  counts.forEach((c) => { statusCounts[c._id] = c.count; });
  res.json({ orders, total, page, pages: Math.max(1, Math.ceil(total / limit)), statusCounts });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(404, 'Order not found.');
  const order = await Order.findById(req.params.id).populate('user', 'name email phone').lean();
  if (!order) throw new HttpError(404, 'Order not found.');
  res.json({ order });
}));

router.patch('/:id/status', asyncHandler(async (req, res) => {
  const { status } = req.body || {};
  if (!STATUSES.includes(status)) throw new HttpError(400, 'Choose a valid status.');
  const order = await Order.findById(req.params.id);
  if (!order) throw new HttpError(404, 'Order not found.');
  if (order.status === status) return res.json({ order });
  if (order.status === 'Cancelled') throw new HttpError(400, 'A cancelled order cannot be re-opened. Ask the customer to place a new order.');

  if (status === 'Cancelled') await restock(order);
  order.status = status;
  order.statusHistory.push({ status, at: new Date() });
  if (status === 'Delivered' && order.paymentMethod === 'cod') order.paymentStatus = 'Paid';
  await order.save();
  res.json({ order });
}));

router.patch('/:id/payment', asyncHandler(async (req, res) => {
  const { paymentStatus } = req.body || {};
  if (!['Pending', 'Paid'].includes(paymentStatus)) throw new HttpError(400, 'Choose Pending or Paid.');
  const order = await Order.findByIdAndUpdate(req.params.id, { $set: { paymentStatus } }, { new: true });
  if (!order) throw new HttpError(404, 'Order not found.');
  res.json({ order });
}));

module.exports = router;
