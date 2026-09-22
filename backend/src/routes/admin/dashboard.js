const express = require('express');
const Product = require('../../models/Product');
const Order = require('../../models/Order');
const User = require('../../models/User');
const Review = require('../../models/Review');
const Subscriber = require('../../models/Subscriber');
const asyncHandler = require('../../utils/asyncHandler');
const { toInt } = require('../../utils/text');
const { adminProduct } = require('../../utils/serialize');

const router = express.Router();
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function monthWindow(months) {
  const now = new Date();
  const list = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    list.push({ year: d.getFullYear(), month: d.getMonth() + 1, label: MONTHS[d.getMonth()] });
  }
  const start = new Date(now.getFullYear(), now.getMonth() - (months - 1), 1);
  return { list, start };
}

async function revenueByMonth(months) {
  const { list, start } = monthWindow(months);
  const rows = await Order.aggregate([
    { $match: { createdAt: { $gte: start }, status: { $ne: 'Cancelled' } } },
    { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } }, revenue: { $sum: '$total' }, orders: { $sum: 1 } } },
  ]);
  const map = new Map(rows.map((r) => [`${r._id.y}-${r._id.m}`, r]));
  return list.map((m) => {
    const r = map.get(`${m.year}-${m.month}`);
    return { label: m.label, year: m.year, revenue: r ? r.revenue : 0, orders: r ? r.orders : 0 };
  });
}

router.get('/stats', asyncHandler(async (req, res) => {
  const [totalProducts, totalOrders, totalCustomers, sales, recentOrders, lowStock, pendingOrders, pendingReviews, latestReviews, monthly] = await Promise.all([
    Product.countDocuments({}),
    Order.countDocuments({}),
    User.countDocuments({ role: 'customer' }),
    Order.aggregate([{ $match: { status: { $ne: 'Cancelled' } } }, { $group: { _id: null, total: { $sum: '$total' } } }]),
    Order.find().sort({ createdAt: -1 }).limit(6).lean(),
    Product.find({ isActive: true, $expr: { $lte: ['$stock', '$lowStockThreshold'] } }).sort({ stock: 1 }).limit(5).lean(),
    Order.countDocuments({ status: 'Processing' }),
    Review.countDocuments({ status: 'hidden' }),
    Review.find({ status: 'published' }).sort({ createdAt: -1 }).limit(4).populate('product', 'name').lean(),
    revenueByMonth(6),
  ]);
  res.json({
    totals: { products: totalProducts, orders: totalOrders, customers: totalCustomers, sales: sales[0] ? sales[0].total : 0, pendingOrders, hiddenReviews: pendingReviews },
    salesOverview: monthly,
    recentOrders,
    lowStock: lowStock.map(adminProduct),
    latestReviews,
  });
}));

router.get('/analytics', asyncHandler(async (req, res) => {
  const months = toInt(req.query.months, 6, { min: 3, max: 12 });
  const { start } = monthWindow(months);
  const notCancelled = { status: { $ne: 'Cancelled' } };

  const [monthly, byStatus, topProducts, byAnimal, byBrand, totals, customers, subscribers, ratingRow, customerGrowth] = await Promise.all([
    revenueByMonth(months),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    Order.aggregate([
      { $match: notCancelled }, { $unwind: '$items' },
      { $group: { _id: '$items.product', name: { $first: '$items.name' }, brand: { $first: '$items.brand' }, units: { $sum: '$items.quantity' }, revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } } } },
      { $sort: { revenue: -1 } }, { $limit: 8 },
    ]),
    Order.aggregate([
      { $match: notCancelled }, { $unwind: '$items' },
      { $group: { _id: '$items.animal', revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }, units: { $sum: '$items.quantity' } } },
      { $sort: { revenue: -1 } },
    ]),
    Order.aggregate([
      { $match: notCancelled }, { $unwind: '$items' },
      { $group: { _id: '$items.brand', revenue: { $sum: { $multiply: ['$items.price', '$items.quantity'] } }, units: { $sum: '$items.quantity' } } },
      { $sort: { revenue: -1 } }, { $limit: 8 },
    ]),
    Order.aggregate([{ $match: notCancelled }, { $group: { _id: null, revenue: { $sum: '$total' }, orders: { $sum: 1 } } }]),
    User.countDocuments({ role: 'customer' }),
    Subscriber.countDocuments(),
    Review.aggregate([{ $match: { status: 'published' } }, { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } }]),
    User.aggregate([
      { $match: { role: 'customer', createdAt: { $gte: start } } },
      { $group: { _id: { y: { $year: '$createdAt' }, m: { $month: '$createdAt' } }, count: { $sum: 1 } } },
    ]),
  ]);

  const t = totals[0] || { revenue: 0, orders: 0 };
  const growth = new Map(customerGrowth.map((g) => [`${g._id.y}-${g._id.m}`, g.count]));
  res.json({
    months,
    revenueByMonth: monthly,
    customersByMonth: monthly.map((m, i) => {
      const d = new Date(new Date().getFullYear(), new Date().getMonth() - (months - 1 - i), 1);
      return { label: m.label, count: growth.get(`${d.getFullYear()}-${d.getMonth() + 1}`) || 0 };
    }),
    ordersByStatus: byStatus.map((s) => ({ status: s._id, count: s.count })),
    topProducts: topProducts.map((p) => ({ productId: p._id, name: p.name, brand: p.brand, units: p.units, revenue: p.revenue })),
    salesByAnimal: byAnimal.map((a) => ({ animal: a._id, revenue: a.revenue, units: a.units })),
    topBrands: byBrand.map((b) => ({ brand: b._id, revenue: b.revenue, units: b.units })),
    totals: {
      revenue: t.revenue,
      orders: t.orders,
      averageOrder: t.orders ? Math.round(t.revenue / t.orders) : 0,
      customers,
      subscribers,
      averageRating: ratingRow[0] ? Math.round(ratingRow[0].avg * 10) / 10 : 0,
      reviews: ratingRow[0] ? ratingRow[0].count : 0,
    },
  });
}));

module.exports = router;
