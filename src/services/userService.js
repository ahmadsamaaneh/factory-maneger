const { User } = require('../models');

// Only staff roles can be created via /users endpoint
// factory_owner is only created via /admin/factories (factory creation flow)
const STAFF_ROLES = ['inventory_manager', 'production_manager', 'sales_manager'];

async function createUser(creatorRole, creatorId, creatorFactoryId, userData) {
  const { role } = userData;

  if (!STAFF_ROLES.includes(role)) {
    const err = new Error(
      `Cannot create role "${role}" here. Factory owners are created via the admin factory creation flow.`
    );
    err.statusCode = 403;
    throw err;
  }

  if (creatorRole !== 'admin' && creatorRole !== 'factory_owner') {
    const err = new Error('You do not have permission to create users.');
    err.statusCode = 403;
    throw err;
  }

  const existing = await User.findOne({ where: { email: userData.email } });
  if (existing) {
    const err = new Error('Email already in use.');
    err.statusCode = 409;
    throw err;
  }

  // Employees always inherit the creator's factory_id
  const factory_id = creatorFactoryId;

  const user = await User.create({ ...userData, factory_id, created_by: creatorId });
  return user.toSafeObject();
}

async function listUsers(requestingUser) {
  // Owner sees only their factory users
  const where = { factory_id: requestingUser.factory_id };

  const users = await User.findAll({
    where,
    attributes: { exclude: ['password'] },
    order: [['created_at', 'DESC']],
  });

  return users;
}

async function getUserById(id, requestingUser) {
  const user = await User.findByPk(id, { attributes: { exclude: ['password'] } });
  if (!user) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }

  if (user.factory_id !== requestingUser.factory_id) {
    const err = new Error('Access denied.');
    err.statusCode = 403;
    throw err;
  }

  return user;
}

async function updateUser(id, updates, requestingUser) {
  const user = await User.findByPk(id);
  if (!user) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }

  if (user.factory_id !== requestingUser.factory_id) {
    const err = new Error('Access denied.');
    err.statusCode = 403;
    throw err;
  }

  const allowedFields = ['name', 'is_active'];
  allowedFields.forEach((field) => {
    if (updates[field] !== undefined) user[field] = updates[field];
  });

  await user.save();
  return user.toSafeObject();
}

async function deleteUser(id, requestingUser) {
  const user = await User.findByPk(id);
  if (!user) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }

  if (user.factory_id !== requestingUser.factory_id) {
    const err = new Error('Access denied.');
    err.statusCode = 403;
    throw err;
  }

  await user.destroy();
}

module.exports = { createUser, listUsers, getUserById, updateUser, deleteUser };
