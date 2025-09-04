const mongoose = require('mongoose');

const AliasSchema = new mongoose.Schema({
  guildId: String,
  mainUserId: String,
  aliasUserId: String,
});

module.exports = mongoose.model('Alias', AliasSchema);
