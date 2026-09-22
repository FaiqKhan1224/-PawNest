const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    brand: String,
    animal: String,
    image: String,
    price: Number,
    quantity: Number,
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: Number, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    items: [orderItemSchema],
    shipping: {
      fullName: String,
      phone: String,
      email: String,
      address: String,
      city: String,
      postalCode: String,
    },
    paymentMethod: { type: String, enum: ['cod', 'online'], default: 'cod' },
    paymentStatus: { type: String, enum: ['Pending', 'Paid'], default: 'Pending' },
    subtotal: Number,
    shippingFee: Number,
    discount: { type: Number, default: 0 },
    total: Number,
    couponCode: { type: String, default: '' },
    notes: { type: String, default: '' },
    status: {
      type: String,
      enum: ['Processing', 'Shipped', 'Delivered', 'Cancelled'],
      default: 'Processing',
      index: true,
    },
    statusHistory: [{ status: String, at: Date, _id: false }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Order', orderSchema);
