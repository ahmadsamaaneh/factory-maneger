/**
 * Attaches req.factoryId from the authenticated user.
 * - admin: req.factoryId = null  (sees all data, no factory filter)
 * - others: req.factoryId = user.factory_id  (scoped to their factory)
 */
function tenantScope(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated.' });
  }

  if (req.user.role === 'admin') {
    req.factoryId = null;
  } else {
    if (!req.user.factory_id) {
      return res.status(403).json({
        success: false,
        message: 'User is not associated with any factory.',
        code: 'NO_FACTORY',
      });
    }
    req.factoryId = req.user.factory_id;
  }

  next();
}

module.exports = tenantScope;
