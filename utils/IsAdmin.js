const Admin = require('../utils/Admin');
const config = require('../config');

async function isAdmin(userId) {
  if (userId === config.ownerId) return true;
  try {
    const admin = await Admin.findOne({ userId });
    return !!admin;
  } catch (err) {
    console.error('Error checking admin status:', err);
    return false;
  }
}

module.exports = isAdmin;
