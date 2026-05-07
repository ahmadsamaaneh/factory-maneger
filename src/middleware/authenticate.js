const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');
const { SYSTEM_ADMIN_ID, ADMIN_EMAIL } = require('../config/admin');
const { User } = require('../models');

async function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Access token required.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, jwtConfig.secret);

    // System-level admin: no DB lookup needed
    if (decoded.id === SYSTEM_ADMIN_ID && decoded.role === 'admin') {
      req.user = {
        id: SYSTEM_ADMIN_ID,
        name: 'System Admin',
        email: ADMIN_EMAIL,
        role: 'admin',
        factory_id: null,
        is_active: true,
      };
      return next();
    }

    // Factory user: validate against DB
    const user = await User.findByPk(decoded.id);

    if (!user || !user.is_active) {
      return res.status(401).json({ success: false, message: 'User not found or inactive.' });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
}

module.exports = authenticate;
