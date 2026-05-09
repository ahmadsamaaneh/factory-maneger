const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Op } = require('sequelize');
const jwtConfig = require('../config/jwt');
const { ADMIN_EMAIL, ADMIN_PASSWORD, SYSTEM_ADMIN_ID } = require('../config/admin');
const { User, Factory } = require('../models');

async function buildUserWithFactory(userRecord) {
  if (!userRecord) return null;
  const factory = userRecord.factory_id ? await Factory.findByPk(userRecord.factory_id) : null;
  const factoryInfo = factory
    ? {
        id: factory.id,
        name: factory.name,
        email_limit: factory.email_limit,
        subscription_status: factory.subscription_status,
        subscription_end_date: factory.subscription_end_date,
        is_active: factory.is_active,
      }
    : null;
  return { ...userRecord.toSafeObject(), factory: factoryInfo };
}

async function login(email, password) {
  const normalizedEmail = (email || '').trim().toLowerCase();

  // ── System-level admin authentication (env vars, no DB lookup) ──
  if (normalizedEmail === ADMIN_EMAIL.trim().toLowerCase()) {
    if (password !== ADMIN_PASSWORD) {
      const err = new Error('Invalid email or password.');
      err.statusCode = 401;
      throw err;
    }

    const token = jwt.sign(
      { id: SYSTEM_ADMIN_ID, role: 'admin', factory_id: null },
      jwtConfig.secret,
      { expiresIn: jwtConfig.expiresIn }
    );

    return {
      token,
      user: { id: SYSTEM_ADMIN_ID, name: 'System Admin', email: ADMIN_EMAIL, role: 'admin', factory: null },
    };
  }

  // ── Factory user authentication (DB lookup) ──
  const user = await User.findOne({ where: { email: normalizedEmail, is_active: true } });
  if (!user) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    const err = new Error('Invalid email or password.');
    err.statusCode = 401;
    throw err;
  }

  const isPlatformAdminWithoutFactory = user.role === 'admin' && !user.factory_id;
  const factory = user.factory_id ? await Factory.findByPk(user.factory_id) : null;

  if (!isPlatformAdminWithoutFactory && (!factory || !factory.is_active)) {
    const err = new Error('Your factory account has been deactivated. Please contact support.');
    err.statusCode = 403;
    err.code = 'FACTORY_INACTIVE';
    throw err;
  }

  // Date-only comparison to avoid timezone issues
  const today = new Date().toISOString().slice(0, 10);

  // Auto-expire if subscription_end_date has passed
  if (
    factory &&
    factory.subscription_end_date &&
    factory.subscription_end_date < today &&
    factory.subscription_status !== 'expired'
  ) {
    await factory.update({ subscription_status: 'expired' });
    factory.subscription_status = 'expired';
  }

  // Auto-restore if wrongly marked expired but end_date is still in the future
  if (
    factory &&
    factory.subscription_status === 'expired' &&
    factory.subscription_end_date &&
    factory.subscription_end_date >= today
  ) {
    await factory.update({ subscription_status: 'active' });
    factory.subscription_status = 'active';
  }

  const factoryInfo = factory
    ? {
        id: factory.id,
        name: factory.name,
        email_limit: factory.email_limit,
        subscription_status: factory.subscription_status,
        subscription_end_date: factory.subscription_end_date,
        is_active: factory.is_active,
      }
    : null;

  await user.update({ last_login: new Date() });

  const token = jwt.sign(
    { id: user.id, role: user.role, factory_id: user.factory_id },
    jwtConfig.secret,
    { expiresIn: jwtConfig.expiresIn }
  );

  return { token, user: { ...user.toSafeObject(), factory: factoryInfo } };
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await User.findByPk(userId);
  if (!user) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }

  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    const err = new Error('Current password is incorrect.');
    err.statusCode = 400;
    throw err;
  }

  user.password = newPassword;
  await user.save();
}

async function updateProfileEmail(userId, email) {
  const normalizedEmail = (email || '').trim().toLowerCase();
  const user = await User.findByPk(userId);
  if (!user) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }

  if (user.email === normalizedEmail) {
    return buildUserWithFactory(user);
  }

  const taken = await User.findOne({
    where: { email: normalizedEmail, id: { [Op.ne]: userId } },
  });
  if (taken) {
    const err = new Error('This email is already in use.');
    err.statusCode = 409;
    err.code = 'EMAIL_TAKEN';
    throw err;
  }

  await user.update({ email: normalizedEmail });
  return buildUserWithFactory(await User.findByPk(userId));
}

async function updateMyFactoryName(userId, name) {
  const user = await User.findByPk(userId);
  if (!user) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }
  if (user.role !== 'factory_owner') {
    const err = new Error('Only the factory owner can change the factory name.');
    err.statusCode = 403;
    throw err;
  }

  const trimmed = (name || '').trim();
  if (!trimmed) {
    const err = new Error('Factory name is required.');
    err.statusCode = 400;
    throw err;
  }

  const factory = await Factory.findByPk(user.factory_id);
  if (!factory) {
    const err = new Error('Factory not found.');
    err.statusCode = 404;
    throw err;
  }

  if (factory.name !== trimmed) {
    const duplicate = await Factory.findOne({
      where: {
        name: trimmed,
        id: { [Op.ne]: factory.id },
      },
    });
    if (duplicate) {
      const err = new Error('A factory with this name already exists.');
      err.statusCode = 409;
      err.code = 'FACTORY_NAME_TAKEN';
      throw err;
    }
    await factory.update({ name: trimmed });
  }

  return buildUserWithFactory(await User.findByPk(userId));
}

module.exports = { login, changePassword, updateProfileEmail, updateMyFactoryName };
