const mongoose = require('mongoose');

const banSchema = new mongoose.Schema({
  caseId: { type: Number, required: true, unique: true }, 
  userId: { type: String, required: true },
  guildId: { type: String, required: true },
  moderatorId: { type: String, required: true },
  reason: { type: String, default: 'No reason provided' },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Ban', banSchema);
