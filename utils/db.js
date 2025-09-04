const mongoose = require('mongoose');

const serverSettingsSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  modChannelId: { type: String, required: false },
  banCollectionOptIn: { type: Boolean, default: false },
  autoAction: {
    bindRoleId: { type: String, required: false },
    checkRoleId: { type: String, required: false },
    timeAmount: { type: Number, required: false },
    timeUnit: { type: String, required: false },
    action: { type: String, required: false },
    reason: { type: String, required: false },
  }
});

const ServerSettings = mongoose.model('ServerSettings', serverSettingsSchema);

module.exports = { ServerSettings };
