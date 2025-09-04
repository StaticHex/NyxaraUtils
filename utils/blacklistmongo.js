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
  }
});

module.exports = mongoose.model('Blacklist', blacklistSchema);
