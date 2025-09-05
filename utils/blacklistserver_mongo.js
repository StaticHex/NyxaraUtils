const mongoose = require('mongoose');

const serverBlacklistSchema = new mongoose.Schema({
  serverId: { type: String, required: true, unique: true },
  reason: { type: String, default: 'No reason provided' },
  blacklistedBy: { type: String },
  appealable: { type: Boolean, default: false },
  appealDate: { type: Date }, // Use Date type for consistency
  timestamp: { type: Date, default: () => new Date() },
  // Optional: track if the blacklist is still active
  active: { type: Boolean, default: true },
  // Optional: when the blacklist was lifted
  unblacklistedAt: { type: Date }
});

module.exports = mongoose.model('ServerBlacklist', serverBlacklistSchema);
