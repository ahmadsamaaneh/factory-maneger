const { User, Employee } = require('../models');

// Only staff roles can be created via /users endpoint
// factory_owner is only created via /admin/factories (factory creation flow)
const STAFF_ROLES = ['hr_manager', 'inventory_manager', 'production_manager', 'sales_manager'];
const SINGLE_PER_FACTORY_ROLES = ['hr_manager', 'production_manager'];

async function createUser(creatorRole, creatorId, creatorFactoryId, userData) {
  const { role, employee_id, ...rest } = userData;

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

  const existing = await User.findOne({ where: { email: rest.email } });
  if (existing) {
    const err = new Error('Email already in use.');
    err.statusCode = 409;
    throw err;
  }

  // Employees always inherit the creator's factory_id
  const factory_id = creatorFactoryId;

  if (SINGLE_PER_FACTORY_ROLES.includes(role)) {
    const cnt = await User.count({ where: { factory_id, role } });
    if (cnt > 0) {
      const err = new Error(`Only one ${role} is allowed per factory.`);
      err.statusCode = 409;
      throw err;
    }
  }

  let employeeToLink = null;
  if (employee_id) {
    employeeToLink = await Employee.findOne({ where: { id: employee_id, factory_id } });
    if (!employeeToLink) {
      const err = new Error('Employee not found in this factory.');
      err.statusCode = 400;
      throw err;
    }
    if (employeeToLink.user_id) {
      const err = new Error('Employee is already linked to a user.');
      err.statusCode = 409;
      throw err;
    }
  }

  const user = await User.create({ ...rest, role, factory_id, created_by: creatorId });
  if (employeeToLink) {
    await employeeToLink.update({ user_id: user.id });
  }
  return user.toSafeObject();
}

async function listUsers(requestingUser) {
  // Owner sees only their factory users
  const where = { factory_id: requestingUser.factory_id };

  const users = await User.findAll({
    where,
    attributes: { exclude: ['password'] },
    include: [{ association: 'employeeProfile', attributes: ['id', 'full_name', 'employee_code'] }],
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
