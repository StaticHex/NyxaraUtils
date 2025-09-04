const mongoose = require('mongoose');

const timerRoleSchema = new mongoose.Schema({
  guildId: { type: String, required: true },
  userId: { type: String, required: true },
  roleId: { type: String, required: true },
  expiresAt: { type: Date, required: true },
  reason: { type: String, default: 'No reason provided' },
  assignerId: { type: String, required: true },
  createdAt: { type: Date, default: () => new Date(), immutable: true }, 
  removedAt: { type: Date, default: null }, 
  active: { type: Boolean, default: true },
});

timerRoleSchema.index({ expiresAt: 1 });
timerRoleSchema.index({ guildId: 1, userId: 1, roleId: 1 });

module.exports = mongoose.model('TimerRole', timerRoleSchema);
