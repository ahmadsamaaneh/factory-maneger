const { User, Factory } = require('../models');
const { Op } = require('sequelize');

const USER_INCLUDE = {
  model: Factory,
  as: 'factory',
  attributes: ['id', 'name'],
};

async function listAllUsers({ search, status, factory_id } = {}) {
  const where = {};

  if (search) {
    where[Op.or] = [
      { name:  { [Op.iLike]: `%${search}%` } },
      { email: { [Op.iLike]: `%${search}%` } },
    ];
  }

  if (status === 'active')   where.is_active = true;
  if (status === 'disabled') where.is_active = false;
  if (factory_id)            where.factory_id = factory_id;

  const users = await User.findAll({
    where,
    attributes: { exclude: ['password'] },
    include: [USER_INCLUDE],
    order: [['created_at', 'DESC']],
  });

  return users;
}

async function toggleUserStatus(id) {
  const user = await User.findByPk(id);
  if (!user) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }

  await user.update({ is_active: !user.is_active });
  return user.toSafeObject();
}

async function resetUserPassword(id, newPassword) {
  if (!newPassword || newPassword.length < 8) {
    const err = new Error('New password must be at least 8 characters.');
    err.statusCode = 400;
    throw err;
  }

  const user = await User.findByPk(id);
  if (!user) {
    const err = new Error('User not found.');
    err.statusCode = 404;
    throw err;
  }

  user.password = newPassword;
  await user.save();

  return { message: `Password reset for ${user.email}.` };
}

module.exports = { listAllUsers, toggleUserStatus, resetUserPassword };
