const express = require('express');
const mongoose = require('mongoose');
const Order = require('../models/Order');
const Product = require('../models/Product');
const Coupon = require('../models/Coupon');
const Counter = require('../models/Counter');
const Setting = require('../models/Setting');
const HttpError = require('../utils/httpError');
const asyncHandler = require('../utils/asyncHandler');
const { protect, optionalAuth } = require('../middleware/auth');
const { priceCart } = require('../services/cartService');

const router = express.Router();
const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const orderView = (o) => (o.toObject ? o.toObject() : o);

function validateShipping(s = {}) {
  const shipping = {
    fullName: String(s.fullName || '').trim(),
    phone: String(s.phone || '').trim(),
    email: String(s.email || '').trim().toLowerCase(),
    address: String(s.address || '').trim(),
    city: String(s.city || '').trim(),
    postalCode: String(s.postalCode || '').trim(),
  };
  if (shipping.fullName.length < 2) throw new HttpError(400, 'Please enter your full name.');
  if (shipping.phone.replace(/\D/g, '').length < 10) throw new HttpError(400, 'Please enter a valid phone number.');
  if (!emailRe.test(shipping.email)) throw new HttpError(400, 'Please enter a valid email address.');
  if (shipping.address.length < 6) throw new HttpError(400, 'Please enter your full delivery address.');
  if (shipping.city.length < 2) throw new HttpError(400, 'Please enter your city.');
  return shipping;
}

async function restock(order) {
  await Promise.all(order.items.map((i) => Product.updateOne({ _id: i.product }, { $inc: { stock: i.quantity, soldCount: -i.quantity } })));
}

router.post('/', optionalAuth, asyncHandler(async (req, res) => {
  const body = req.body || {};
  const shipping = validateShipping(body.shipping);
  const paymentMethod = body.paymentMethod === 'online' ? 'online' : 'cod';
  const settings = await Setting.get();

  const priced = await priceCart(body.items, body.coupon, settings);
  if (!priced.lines.length) throw new HttpError(400, 'Your cart is empty.');
  if (priced.hasIssues) {
    const problem = priced.lines.find((l) => l.issue);
    const name = problem.product ? problem.product.name : 'An item';
    throw new HttpError(409, `${name}: ${problem.issue} Please update your cart.`);
  }
  if (body.coupon && priced.coupon && !priced.coupon.valid) throw new HttpError(400, priced.coupon.message);

  // Reserve stock atomically, item by item. Roll back if anything fails.
  const reserved = [];
  try {
    for (const line of priced.lines) {
      const result = await Product.updateOne(
        { _id: line.productId, isActive: true, priceVisible: true, stock: { $gte: line.quantity } },
        { $inc: { stock: -line.quantity, soldCount: line.quantity } }
      );
      if (result.modifiedCount !== 1) throw new HttpError(409, `${line.product.name} just sold out or changed. Please review your cart.`);
      reserved.push(line);
    }
  } catch (err) {
    await Promise.all(reserved.map((l) => Product.updateOne({ _id: l.productId }, { $inc: { stock: l.quantity, soldCount: -l.quantity } })));
    throw err;
  }

  let order;
  try {
    const seq = await Counter.next('order');
    order = await Order.create({
      orderNumber: 1000 + seq,
      user: req.user ? req.user._id : null,
      items: priced.lines.map((l) => ({
        product: l.productId,
        name: l.product.name,
        brand: l.product.brand,
        animal: l.product.animals[0],
        image: l.product.images[0] || '',
        price: l.unitPrice,
        quantity: l.quantity,
      })),
      shipping,
      paymentMethod,
      paymentStatus: 'Pending',
      subtotal: priced.subtotal,
      shippingFee: priced.shipping,
      discount: priced.discount,
      total: priced.total,
      couponCode: priced.couponDoc ? priced.couponDoc.code : '',
      notes: String(body.notes || '').slice(0, 500),
      status: 'Processing',
      statusHistory: [{ status: 'Processing', at: new Date() }],
    });
  } catch (err) {
    await Promise.all(reserved.map((l) => Product.updateOne({ _id: l.productId }, { $inc: { stock: l.quantity, soldCount: -l.quantity } })));
    throw err;
  }
  if (priced.couponDoc) await Coupon.updateOne({ _id: priced.couponDoc._id }, { $inc: { usedCount: 1 } });

  res.status(201).json({ order: orderView(order), paymentInstructions: paymentMethod === 'online' ? settings.onlinePaymentInstructions : '' });
}));

router.get('/mine', protect, asyncHandler(async (req, res) => {
  const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(100).lean();
  res.json({ orders });
}));

// Public order tracking: order number + the email used at checkout.
router.post('/track', asyncHandler(async (req, res) => {
  const orderNumber = Number(String(req.body.orderNumber || '').replace(/\D/g, ''));
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!orderNumber || !email) throw new HttpError(400, 'Enter your order number and the email used at checkout.');
  const order = await Order.findOne({ orderNumber, 'shipping.email': email }).lean();
  if (!order) throw new HttpError(404, 'We could not find an order with those details.');
  const settings = await Setting.get();
  res.json({ order, paymentInstructions: order.paymentMethod === 'online' ? settings.onlinePaymentInstructions : '' });
}));

router.get('/:id', protect, asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(404, 'Order not found.');
  const order = await Order.findById(req.params.id).lean();
  if (!order || (String(order.user) !== String(req.user._id) && req.user.role !== 'admin')) throw new HttpError(404, 'Order not found.');
  const settings = await Setting.get();
  res.json({ order, paymentInstructions: order.paymentMethod === 'online' ? settings.onlinePaymentInstructions : '' });
}));

router.patch('/:id/cancel', protect, asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(404, 'Order not found.');
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
  if (!order) throw new HttpError(404, 'Order not found.');
  if (order.status !== 'Processing') throw new HttpError(400, 'Only orders that are still processing can be cancelled.');
  order.status = 'Cancelled';
  order.statusHistory.push({ status: 'Cancelled', at: new Date() });
  await order.save();
  await restock(order);
  res.json({ order: orderView(order) });
}));

module.exports = router;
module.exports.restock = restock;
