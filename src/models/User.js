const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

// 'admin' intentionally excluded — admin is a system-level role authenticated via env vars, not stored in DB
const ROLES = ['factory_owner', 'inventory_manager', 'production_manager', 'sales_manager'];

module.exports = (sequelize) => {
  const User = sequelize.define(
    'User',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        validate: { isEmail: true },
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.ENUM(...ROLES),
        allowNull: false,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      factory_id: {
        type: DataTypes.UUID,
        allowNull: false,
        comment: 'All users must belong to a factory',
      },
      last_login: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      created_by: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      tableName: 'users',
      hooks: {
        beforeCreate: async (user) => {
          const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
          user.password = await bcrypt.hash(user.password, rounds);
        },
        beforeUpdate: async (user) => {
          if (user.changed('password')) {
            const rounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
            user.password = await bcrypt.hash(user.password, rounds);
          }
        },
      },
    }
  );

  User.prototype.comparePassword = async function (plainPassword) {
    return bcrypt.compare(plainPassword, this.password);
  };

  User.prototype.toSafeObject = function () {
    const { password, ...safe } = this.toJSON();
    return safe;
  };

  User.ROLES = ROLES;

  return User;
};
