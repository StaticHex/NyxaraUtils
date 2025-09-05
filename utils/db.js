const mongoose = require('mongoose');

const serverSettingsSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  modChannelId: { type: String },
  banCollectionOptIn: { type: Boolean, default: false },
  autoAction: {
    bindRoleId: { type: String },
    checkRoleId: { type: String },
    timeAmount: { type: Number },
    timeUnit: { type: String },
    action: { type: String },
    reason: { type: String }
    // Add default values here if needed
  }
});

const ServerSettings = mongoose.model('ServerSettings', serverSettingsSchema);

module.exports = { ServerSettings };
