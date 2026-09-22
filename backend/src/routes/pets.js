const express = require('express');
const mongoose = require('mongoose');
const Pet = require('../models/Pet');
const HttpError = require('../utils/httpError');
const asyncHandler = require('../utils/asyncHandler');
const { protect } = require('../middleware/auth');

const router = express.Router();
router.use(protect);

const ANIMALS = ['dogs', 'cats', 'birds', 'rabbits', 'fish', 'small-pets'];

function clean(body = {}) {
  const animal = String(body.animal || '').toLowerCase();
  const name = String(body.name || '').trim();
  if (name.length < 1) throw new HttpError(400, 'Please give your pet a name.');
  if (!ANIMALS.includes(animal)) throw new HttpError(400, 'Please choose the type of animal.');
  return {
    name,
    animal,
    breed: String(body.breed || '').trim(),
    ageYears: Math.max(0, Math.min(40, Number(body.ageYears) || 0)),
    gender: ['Male', 'Female', 'Unknown'].includes(body.gender) ? body.gender : 'Unknown',
    weightKg: Math.max(0, Math.min(200, Number(body.weightKg) || 0)),
    diet: String(body.diet || '').trim().slice(0, 200),
  };
}

router.get('/', asyncHandler(async (req, res) => {
  res.json({ pets: await Pet.find({ user: req.user._id }).sort({ createdAt: 1 }).lean() });
}));

router.post('/', asyncHandler(async (req, res) => {
  if ((await Pet.countDocuments({ user: req.user._id })) >= 12) throw new HttpError(400, 'You can save up to 12 pets.');
  const pet = await Pet.create({ ...clean(req.body), user: req.user._id });
  res.status(201).json({ pet });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(404, 'Pet not found.');
  const pet = await Pet.findOne({ _id: req.params.id, user: req.user._id }).lean();
  if (!pet) throw new HttpError(404, 'Pet not found.');
  res.json({ pet });
}));

router.put('/:id', asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(404, 'Pet not found.');
  const pet = await Pet.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { $set: clean(req.body) }, { new: true, runValidators: true });
  if (!pet) throw new HttpError(404, 'Pet not found.');
  res.json({ pet });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) throw new HttpError(404, 'Pet not found.');
  const result = await Pet.deleteOne({ _id: req.params.id, user: req.user._id });
  if (!result.deletedCount) throw new HttpError(404, 'Pet not found.');
  res.json({ message: 'Pet removed.' });
}));

module.exports = router;
