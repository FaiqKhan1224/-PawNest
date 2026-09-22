const models = require('../models');
const { slugify } = require('../utils/text');
const { computeTotals } = require('../utils/pricing');
const { recalcProductRating } = require('../services/ratings');
const { ANIMALS, TYPES, PRODUCTS } = require('./catalog');
const { generateReviews, mulberry32, FIRST, LAST } = require('./reviewsGen');

const { User, Category, Product, Review, Order, Coupon, Pet, Setting, Subscriber, Counter } = models;

const ADMIN = { name: 'PawNest Admin', email: 'admin@pawnest.com', password: 'Admin@123', role: 'admin', phone: '+92 300 1111111' };

const CUSTOMERS = [
  { name: 'Ali Khan', email: 'ali@gmail.com', phone: '+92 300 1234567', city: 'Lahore', address: 'House 123, Street 4, Model Town', postalCode: '54000' },
  { name: 'Sara Malik', email: 'sara@gmail.com', phone: '+92 321 4567890', city: 'Karachi', address: 'Flat 8, Block C, Gulshan-e-Iqbal', postalCode: '75300' },
  { name: 'Ahmed Raza', email: 'ahmed@gmail.com', phone: '+92 333 2345678', city: 'Islamabad', address: 'House 21, Street 9, F-8/3', postalCode: '44000' },
  { name: 'Ayesha Malik', email: 'ayesha.malik@gmail.com', phone: '+92 301 9876543', city: 'Lahore', address: '45-B, Johar Town', postalCode: '54782' },
  { name: 'Hamza Sheikh', email: 'hamza.sheikh@gmail.com', phone: '+92 302 3456789', city: 'Faisalabad', address: 'Street 3, Peoples Colony', postalCode: '38000' },
  { name: 'Fatima Qureshi', email: 'fatima.q@gmail.com', phone: '+92 345 7654321', city: 'Rawalpindi', address: 'House 77, Satellite Town', postalCode: '46000' },
  { name: 'Usman Butt', email: 'usman.butt@gmail.com', phone: '+92 311 2223344', city: 'Lahore', address: '12 Canal View Housing', postalCode: '54000' },
  { name: 'Zainab Iqbal', email: 'zainab.iqbal@gmail.com', phone: '+92 322 5556677', city: 'Multan', address: 'Street 5, Gulgasht Colony', postalCode: '60000' },
  { name: 'Bilal Chaudhry', email: 'bilal.c@gmail.com', phone: '+92 334 8889900', city: 'Gujranwala', address: 'House 9, Model Town', postalCode: '52250' },
  { name: 'Hina Siddiqui', email: 'hina.s@gmail.com', phone: '+92 315 1112233', city: 'Karachi', address: 'Apartment 4C, Clifton Block 5', postalCode: '75600' },
  { name: 'Omar Farooq', email: 'omar.farooq@gmail.com', phone: '+92 303 4445566', city: 'Lahore', address: '88 DHA Phase 5', postalCode: '54792' },
  { name: 'Maryam Javed', email: 'maryam.j@gmail.com', phone: '+92 346 7778899', city: 'Islamabad', address: 'Street 14, G-11/2', postalCode: '44000' },
];

const PETS = {
  'ali@gmail.com': [
    { name: 'Milo', animal: 'dogs', breed: 'Golden Retriever', ageYears: 2, gender: 'Male', weightKg: 28, diet: 'Normal Food' },
    { name: 'Max', animal: 'cats', breed: 'Tabby Cat', ageYears: 1, gender: 'Male', weightKg: 4.5, diet: 'Normal Food' },
  ],
  'sara@gmail.com': [{ name: 'Luna', animal: 'cats', breed: 'Persian', ageYears: 2, gender: 'Female', weightKg: 4.5, diet: 'Dry food + wet food twice a week' }],
  'ahmed@gmail.com': [{ name: 'Kiwi', animal: 'birds', breed: 'Budgerigar', ageYears: 1, gender: 'Unknown', weightKg: 0.04, diet: 'Seed mix' }],
};

async function runSeed({ reset = false } = {}) {
  if (reset) {
    await Promise.all(Object.values(models).map((m) => m.deleteMany({})));
  }

  const now = new Date();
  const rng = mulberry32(20260919);

  // Settings
  await Setting.get();

  // Categories
  await Category.insertMany([
    ...ANIMALS.map((a, i) => ({ ...a, kind: 'animal', sortOrder: i })),
    ...TYPES.map((t, i) => ({ ...t, kind: 'type', sortOrder: i })),
  ]);

  // Users (created one by one so passwords are hashed)
  await User.create(ADMIN);
  const users = [];
  for (const c of CUSTOMERS) {
    // eslint-disable-next-line no-await-in-loop
    const user = await User.create({
      name: c.name, email: c.email, password: 'User@1234', phone: c.phone, role: 'customer',
      address: { line1: c.address, city: c.city, postalCode: c.postalCode },
    });
    const joined = new Date(now.getTime() - Math.floor(rng() * 200 + 10) * 86400000);
    // eslint-disable-next-line no-await-in-loop
    await User.updateOne({ _id: user._id }, { $set: { createdAt: joined } }, { timestamps: false });
    users.push({ doc: user, seed: c });
  }

  // Pets
  for (const u of users) {
    const list = PETS[u.seed.email] || [];
    // eslint-disable-next-line no-await-in-loop
    if (list.length) await Pet.insertMany(list.map((p) => ({ ...p, user: u.doc._id })));
  }

  // Coupons
  await Coupon.insertMany([
    { code: 'WELCOME500', description: 'Rs. 500 off your order of Rs. 3,000 or more', type: 'flat', value: 500, minOrder: 3000, maxUses: 0, isActive: true },
    { code: 'PAWS10', description: '10% off (up to Rs. 1,000) on orders above Rs. 2,000', type: 'percent', value: 10, maxDiscount: 1000, minOrder: 2000, maxUses: 500, isActive: true },
    { code: 'EIDSALE', description: 'Seasonal sale - currently switched off', type: 'percent', value: 15, maxDiscount: 1500, minOrder: 4000, isActive: false },
  ]);

  // Products
  const productDocs = [];
  for (const p of PRODUCTS) {
    const slug = slugify(p.name);
    productDocs.push({
      name: p.name,
      slug,
      brand: p.brand,
      animals: p.animals,
      category: p.category,
      subCategory: p.sub,
      description: p.desc,
      ingredients: p.ing,
      benefits: p.ben,
      usage: p.use,
      price: p.price,
      discountPercent: p.disc || 0,
      priceVisible: !p.hidden,
      stock: p.stock,
      lowStockThreshold: 10,
      images: [`/assets/products/${slug}.svg`, `/assets/products/${slug}-2.svg`, `/assets/products/${slug}-3.svg`],
      weight: p.weight,
      ageGroup: p.age,
      breedSize: p.breed,
      featured: !!p.featured,
      soldCount: p.sold || 0,
      isActive: true,
      createdAt: new Date(now.getTime() - Math.floor(rng() * 300 + 5) * 86400000),
    });
  }
  const products = await Product.insertMany(productDocs);
  const bySlug = new Map(products.map((p) => [p.slug, p]));

  // Reviews
  const reviewDocs = [];
  PRODUCTS.forEach((p) => {
    const product = bySlug.get(slugify(p.name));
    generateReviews(p, now).forEach((r) => reviewDocs.push({ ...r, product: product._id, status: 'published' }));
  });
  await Review.insertMany(reviewDocs, { timestamps: false });
  for (const p of products) {
    // eslint-disable-next-line no-await-in-loop
    await recalcProductRating(p._id);
  }

  // Orders spread across the last ~6 months
  const settings = await Setting.get();
  const buyable = products.filter((p) => p.priceVisible && p.stock > 0);
  const welcome = await Coupon.findOne({ code: 'WELCOME500' });
  const planned = [];
  for (let i = 0; i < 48; i += 1) {
    const user = users[Math.floor(rng() * users.length)];
    const daysAgo = Math.floor(Math.pow(rng(), 1.25) * 175);
    const createdAt = new Date(now.getTime() - daysAgo * 86400000 - Math.floor(rng() * 40000000));
    const count = 1 + Math.floor(rng() * 3);
    const chosen = new Set();
    while (chosen.size < count) chosen.add(buyable[Math.floor(rng() * buyable.length)]);
    const items = [...chosen].map((p) => ({
      product: p._id, name: p.name, brand: p.brand, animal: p.animals[0], image: p.images[0], price: p.price, quantity: 1 + Math.floor(rng() * 2 * rng()),
    }));
    const subtotal = items.reduce((s, it) => s + it.price * it.quantity, 0);
    const useCoupon = subtotal >= 3000 && rng() < 0.25;
    const totals = computeTotals(subtotal, useCoupon ? welcome : null, settings);
    planned.push({ user, createdAt, daysAgo, items, totals, coupon: useCoupon ? welcome.code : '' });
  }
  planned.sort((a, b) => a.createdAt - b.createdAt);

  const orderDocs = planned.map((o, idx) => {
    const roll = rng();
    let status;
    if (o.daysAgo > 12) status = roll < 0.06 ? 'Cancelled' : 'Delivered';
    else if (o.daysAgo > 4) status = roll < 0.5 ? 'Shipped' : 'Delivered';
    else status = roll < 0.6 ? 'Processing' : 'Shipped';
    const paymentMethod = rng() < 0.25 ? 'online' : 'cod';
    const history = [{ status: 'Processing', at: o.createdAt }];
    if (['Shipped', 'Delivered'].includes(status)) history.push({ status: 'Shipped', at: new Date(o.createdAt.getTime() + 86400000) });
    if (status === 'Delivered') history.push({ status: 'Delivered', at: new Date(o.createdAt.getTime() + 3 * 86400000) });
    if (status === 'Cancelled') history.push({ status: 'Cancelled', at: new Date(o.createdAt.getTime() + 3600000 * 5) });
    const s = o.user.seed;
    return {
      orderNumber: 1001 + idx,
      user: o.user.doc._id,
      items: o.items,
      shipping: { fullName: s.name, phone: s.phone, email: s.email, address: s.address, city: s.city, postalCode: s.postalCode },
      paymentMethod,
      paymentStatus: status === 'Delivered' || (paymentMethod === 'online' && status !== 'Processing' && status !== 'Cancelled') ? 'Paid' : 'Pending',
      subtotal: o.totals.subtotal,
      shippingFee: o.totals.shipping,
      discount: o.totals.discount,
      total: o.totals.total,
      couponCode: o.coupon,
      status,
      statusHistory: history,
      createdAt: o.createdAt,
      updatedAt: history[history.length - 1].at,
    };
  });
  await Order.insertMany(orderDocs, { timestamps: false });
  await Counter.updateOne({ _id: 'order' }, { $set: { seq: orderDocs.length } }, { upsert: true });
  await Coupon.updateOne({ _id: welcome._id }, { $set: { usedCount: orderDocs.filter((o) => o.couponCode).length } });

  // A few newsletter subscribers
  await Subscriber.insertMany(users.slice(0, 5).map((u) => ({ email: u.seed.email })));

  const summary = { products: products.length, reviews: reviewDocs.length, orders: orderDocs.length, customers: users.length };
  console.log(`[seed] Done: ${summary.products} products, ${summary.reviews} reviews, ${summary.orders} orders, ${summary.customers} customers.`);
  return summary;
}

module.exports = { runSeed, FIRST, LAST };
