const mongoose = require('mongoose');

const AliasSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  mainUserId: { type: String, required: true },
  aliasUserId: { type: String, required: true },
});

// Prevent duplicate aliases for the same user in a guild
AliasSchema.index({ guildId: 1, aliasUserId: 1 }, { unique: true });

module.exports = mongoose.model('Alias', AliasSchema);
