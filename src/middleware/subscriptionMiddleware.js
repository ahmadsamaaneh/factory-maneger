const { Factory } = require('../models');

/**
 * Checks that the user's factory has an active subscription.
 * Admin bypasses this check entirely.
 */
async function checkSubscription(req, res, next) {
  if (req.user.role === 'admin') return next();
  if (!req.user.factory_id) return next();

  try {
    const factory = await Factory.findByPk(req.user.factory_id);

    if (!factory || !factory.is_active) {
      return res.status(403).json({
        success: false,
        message: 'Your factory account has been deactivated. Please contact support.',
        code: 'FACTORY_INACTIVE',
      });
    }

    // Date-only comparison to avoid timezone issues
    const today = new Date().toISOString().slice(0, 10);

    // Auto-expire if end_date has passed
    if (
      factory.subscription_end_date &&
      factory.subscription_end_date < today &&
      factory.subscription_status !== 'expired'
    ) {
      await factory.update({ subscription_status: 'expired' });
      factory.subscription_status = 'expired';
    }

    // Auto-restore if status is 'expired' but end_date is still in the future
    // (heals factories incorrectly expired by the previous timezone bug)
    if (
      factory.subscription_status === 'expired' &&
      factory.subscription_end_date &&
      factory.subscription_end_date >= today
    ) {
      await factory.update({ subscription_status: 'active' });
      factory.subscription_status = 'active';
    }

    if (['expired', 'suspended'].includes(factory.subscription_status)) {
      return res.status(403).json({
        success: false,
        message: 'Your subscription has expired. Please contact your administrator to renew.',
        code: 'SUBSCRIPTION_EXPIRED',
        subscription_end_date: factory.subscription_end_date,
      });
    }

    req.factory = factory;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = checkSubscription;
