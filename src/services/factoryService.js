const { Factory, User, sequelize } = require('../models');
const { Op } = require('sequelize');

const OWNER_INCLUDE = {
  model: User,
  as: 'owner',
  attributes: ['id', 'name', 'email'],
};

async function createFactory(data) {
  const { name, email_limit = 10, subscription_status = 'trial', subscription_end_date, owner_name, owner_email, owner_password } = data;

  return sequelize.transaction(async (t) => {
    const existing = await Factory.findOne({ where: { name }, transaction: t });
    if (existing) {
      const err = new Error('A factory with this name already exists.');
      err.statusCode = 409;
      throw err;
    }

    const existingUser = await User.findOne({ where: { email: owner_email }, transaction: t });
    if (existingUser) {
      const err = new Error('A user with this email already exists.');
      err.statusCode = 409;
      throw err;
    }

    // 1. Create factory (owner_id set after user creation)
    const factory = await Factory.create(
      { name, email_limit, subscription_status, subscription_end_date },
      { transaction: t }
    );

    // 2. Create the owner user linked to this factory
    const owner = await User.create(
      {
        name: owner_name,
        email: owner_email,
        password: owner_password,
        role: 'factory_owner',
        factory_id: factory.id,
        is_active: true,
      },
      { transaction: t }
    );

    // 3. Link owner_id back on the factory record
    await factory.update({ owner_id: owner.id }, { transaction: t });

    return { factory: { ...factory.toJSON(), owner_id: owner.id }, owner: owner.toSafeObject() };
  });
}

async function listFactories({ search, status } = {}) {
  const where = {};
  if (search) where.name = { [Op.iLike]: `%${search}%` };
  if (status) where.subscription_status = status;

  const factories = await Factory.findAll({
    where,
    include: [OWNER_INCLUDE],
    order: [['created_at', 'DESC']],
  });

  // Attach user counts efficiently
  const ids = factories.map((f) => f.id);
  const counts = await User.findAll({
    where: { factory_id: ids },
    attributes: ['factory_id', [sequelize.fn('COUNT', sequelize.col('id')), 'count']],
    group: ['factory_id'],
    raw: true,
  });
  const countMap = Object.fromEntries(counts.map((c) => [c.factory_id, parseInt(c.count, 10)]));

  return factories.map((f) => ({ ...f.toJSON(), user_count: countMap[f.id] || 0 }));
}

async function getFactoryById(id) {
  const factory = await Factory.findByPk(id, { include: [OWNER_INCLUDE] });
  if (!factory) {
    const err = new Error('Factory not found.');
    err.statusCode = 404;
    throw err;
  }

  const userCount = await User.count({ where: { factory_id: id } });

  return { ...factory.toJSON(), user_count: userCount };
}

async function getFactoryUsers(id) {
  const factory = await Factory.findByPk(id);
  if (!factory) {
    const err = new Error('Factory not found.');
    err.statusCode = 404;
    throw err;
  }

  const users = await User.findAll({
    where: { factory_id: id },
    attributes: { exclude: ['password'] },
    order: [['created_at', 'ASC']],
  });

  return users;
}

async function updateSubscription(id, updates) {
  const factory = await Factory.findByPk(id);
  if (!factory) {
    const err = new Error('Factory not found.');
    err.statusCode = 404;
    throw err;
  }

  const allowed = ['subscription_status', 'subscription_end_date', 'is_active', 'name', 'email_limit'];
  const payload = {};
  allowed.forEach((k) => { if (updates[k] !== undefined) payload[k] = updates[k]; });

  await factory.update(payload);
  return factory;
}

async function deleteFactory(id) {
  const factory = await Factory.findByPk(id);
  if (!factory) {
    const err = new Error('Factory not found.');
    err.statusCode = 404;
    throw err;
  }
  await factory.update({ is_active: false });
}

async function getAdminStats() {
  const [total, active, expired, trial, suspended, totalUsers, activeUsers, disabledUsers] = await Promise.all([
    Factory.count(),
    Factory.count({ where: { subscription_status: 'active', is_active: true } }),
    Factory.count({ where: { subscription_status: 'expired' } }),
    Factory.count({ where: { subscription_status: 'trial' } }),
    Factory.count({ where: { subscription_status: 'suspended' } }),
    User.count(),
    User.count({ where: { is_active: true } }),
    User.count({ where: { is_active: false } }),
  ]);
  return {
    total, active, expired, trial, suspended,
    total_users: totalUsers,
    active_users: activeUsers,
    disabled_users: disabledUsers,
  };
}

module.exports = {
  createFactory,
  listFactories,
  getFactoryById,
  getFactoryUsers,
  updateSubscription,
  deleteFactory,
  getAdminStats,
};
