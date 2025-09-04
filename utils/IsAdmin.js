const Admin = require('../utils/Admin');
const config = require('../config');

async function isAdmin(userId) {
  if (userId === config.ownerId) return true;
  const admin = await Admin.findOne({ userId });
  return !!admin;
}

module.exports = isAdmin;
