const adminUserService = require('../services/adminUserService');

async function listAllUsers(req, res, next) {
  try {
    const users = await adminUserService.listAllUsers(req.query);
    res.json({ success: true, data: users });
  } catch (err) { next(err); }
}

async function toggleUserStatus(req, res, next) {
  try {
    const user = await adminUserService.toggleUserStatus(req.params.id);
    res.json({ success: true, data: user });
  } catch (err) { next(err); }
}

async function resetUserPassword(req, res, next) {
  try {
    const result = await adminUserService.resetUserPassword(req.params.id, req.body.new_password);
    res.json({ success: true, ...result });
  } catch (err) { next(err); }
}

module.exports = { listAllUsers, toggleUserStatus, resetUserPassword };
