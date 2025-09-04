const mongoose = require('mongoose');

const serverBlacklistSchema = new mongoose.Schema({
  serverId: { type: String, required: true, unique: true },
  reason: { type: String, default: 'No reason provided' },
  blacklistedBy: { type: String },
  appealable: { type: Boolean, default: false },
  appealDate: { type: String }, 
  timestamp: { type: Date, default: () => new Date() }
});

module.exports = mongoose.model('ServerBlacklist', serverBlacklistSchema);
