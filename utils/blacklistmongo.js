const mongoose = require('mongoose');

const blacklistSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    unique: true
  },
  reason: {
    type: String,
    default: 'No reason provided'
  },
  appealStatus: {
    type: String,
    default: 'NO APPEAL'
  },
  timestamp: {
    type: Date,
    default: () => new Date()
  },
  // Optional: track who blacklisted the user
  blacklistedBy: {
    type: String
  },
  // Optional: track if the blacklist is still active
  active: {
    type: Boolean,
    default: true
  },
  // Optional: when the blacklist was lifted
  unblacklistedAt: {
    type: Date
  }
});

module.exports = mongoose.model('Blacklist', blacklistSchema);
