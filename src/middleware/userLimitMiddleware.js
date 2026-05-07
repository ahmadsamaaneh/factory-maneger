const { User, Factory } = require('../models');

async function checkUserLimit(req, res, next) {
  try {
    // Admin bypasses limit
    if (req.user.role === 'admin') return next();

    const factoryId = req.factoryId || req.user.factory_id;
    if (!factoryId) return next();

    const factory = await Factory.findByPk(factoryId, {
      attributes: ['id', 'email_limit'],
    });

    if (!factory) return next();

    const currentCount = await User.count({ where: { factory_id: factoryId } });

    if (currentCount >= factory.email_limit) {
      return res.status(403).json({
        success: false,
        code: 'USER_LIMIT_REACHED',
        message: `User limit reached (${currentCount}/${factory.email_limit}). Please upgrade your plan or contact the administrator.`,
      });
    }

    next();
  } catch (err) {
    next(err);
  }
}

module.exports = checkUserLimit;
