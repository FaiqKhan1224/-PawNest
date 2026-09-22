const mongoose = require('mongoose');

const petSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 60 },
    animal: { type: String, required: true, trim: true, lowercase: true }, // category slug, e.g. dogs
    breed: { type: String, default: '', trim: true, maxlength: 80 },
    ageYears: { type: Number, default: 0, min: 0, max: 40 },
    gender: { type: String, enum: ['Male', 'Female', 'Unknown'], default: 'Unknown' },
    weightKg: { type: Number, default: 0, min: 0, max: 200 },
    diet: { type: String, default: '', trim: true, maxlength: 200 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Pet', petSchema);
