const mongoose = require('mongoose');

const warnSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  moderatorId: { type: String, required: true },
  reason: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
  // Optional: for future extensibility
  // active: { type: Boolean, default: true },
  // expiresAt: { type: Date }
});

// Index for efficient querying of warnings per user per guild
warnSchema.index({ guildId: 1, userId: 1 });

module.exports = mongoose.model('WarnRecord', warnSchema);
