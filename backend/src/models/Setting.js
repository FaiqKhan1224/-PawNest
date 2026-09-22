const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema(
  {
    key: { type: String, default: 'main', unique: true },
    storeName: { type: String, default: 'PawNest' },
    tagline: { type: String, default: 'Better Care. Happier Pets.' },
    contactEmail: { type: String, default: 'support@pawnest.pk' },
    contactPhone: { type: String, default: '+92 300 0000000' },
    whatsapp: { type: String, default: '' },
    address: { type: String, default: 'Lahore, Pakistan' },
    shippingFee: { type: Number, default: 300, min: 0 },
    freeShippingThreshold: { type: Number, default: 7000, min: 0 }, // 0 = never free
    onlinePaymentInstructions: {
      type: String,
      default: 'Send the order total via JazzCash or Easypaisa to 0300-0000000 (PawNest) and share the screenshot on WhatsApp with your order number. We dispatch as soon as the payment is confirmed.',
    },
    heroImage: { type: String, default: '' },
    social: {
      facebook: { type: String, default: 'https://www.facebook.com/' },
      instagram: { type: String, default: 'https://www.instagram.com/' },
      twitter: { type: String, default: '' },
      youtube: { type: String, default: 'https://www.youtube.com/' },
    },
    aiEnabled: { type: Boolean, default: true },
  },
  { timestamps: true }
);

settingSchema.statics.get = async function get() {
  let doc = await this.findOne({ key: 'main' });
  if (!doc) doc = await this.create({ key: 'main' });
  return doc;
};

module.exports = mongoose.model('Setting', settingSchema);
