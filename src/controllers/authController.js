const authService = require('../services/authService');

async function login(req, res, next) {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
}

async function me(req, res) {
  res.json({ success: true, data: req.user.toSafeObject() });
}

async function changePassword(req, res, next) {
  try {
    const { current_password, new_password } = req.body;
    await authService.changePassword(req.user.id, current_password, new_password);
    res.json({ success: true, message: 'Password updated successfully.' });
  } catch (err) {
    next(err);
  }
}

async function updateProfile(req, res, next) {
  try {
    if (req.user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Profile email cannot be changed for the system administrator.',
      });
    }
    const { email } = req.body;
    const userPayload = await authService.updateProfileEmail(req.user.id, email);
    res.json({ success: true, data: userPayload });
  } catch (err) {
    next(err);
  }
}

async function updateMyFactory(req, res, next) {
  try {
    const { name } = req.body;
    const userPayload = await authService.updateMyFactoryName(req.user.id, name);
    res.json({ success: true, data: userPayload });
  } catch (err) {
    next(err);
  }
}

module.exports = { login, me, changePassword, updateProfile, updateMyFactory };
