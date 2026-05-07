require('dotenv').config();

module.exports = {
  secret: process.env.JWT_SECRET || 'change_this_secret_in_production',
  expiresIn: process.env.JWT_EXPIRES_IN || '7d',
};
