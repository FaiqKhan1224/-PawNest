const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, default: '', trim: true, maxlength: 120 },
    comment: { type: String, required: true, trim: true, maxlength: 1500 },
    status: { type: String, enum: ['published', 'hidden'], default: 'published', index: true },
    verifiedPurchase: { type: Boolean, default: false },
    adminReply: {
      text: { type: String, default: '' },
      at: { type: Date, default: null },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Review', reviewSchema);
