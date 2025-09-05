const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  // Optional: who promoted this admin
  promotedBy: { type: String },
  // Optional: when they were promoted
  promotedAt: { type: Date, default: Date.now },
  // Optional: admin level (for tiered permissions)
  level: { type: Number, default: 1 }
});

module.exports = mongoose.model('Admin', adminSchema);
