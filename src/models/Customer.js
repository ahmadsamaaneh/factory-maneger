const { DataTypes } = require('sequelize');
const validator = require('validator');

module.exports = (sequelize) => {
  const Customer = sequelize.define(
    'Customer',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(200),
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          isEmailIfPresent(value) {
            if (value == null || String(value).trim() === '') return;
            if (!validator.isEmail(String(value))) {
              throw new Error('Must be a valid email address');
            }
          },
        },
      },
      phone: {
        type: DataTypes.STRING(30),
        allowNull: true,
      },
      address: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      factory_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
    },
    {
      tableName: 'customers',
    }
  );

  return Customer;
};
