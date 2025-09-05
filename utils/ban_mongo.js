const mongoose = require('mongoose');

const banSchema = new mongoose.Schema({
  caseId: { type: Number, required: true }, // Not unique globally if using per-guild
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  moderatorId: { type: String, required: true },
  reason: { type: String, default: 'No reason provided' },
  timestamp: { type: Date, default: Date.now },
  expiresAt: { type: Date }, // Optional: for temporary bans
  unbanned: { type: Boolean, default: false } // Optional: track unban status
});

// Compound unique index for per-guild case numbers
banSchema.index({ guildId: 1, caseId: 1 }, { unique: true });

module.exports = mongoose.model('Ban', banSchema);
