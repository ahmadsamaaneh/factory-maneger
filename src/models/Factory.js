const { DataTypes } = require('sequelize');

const SUBSCRIPTION_STATUS = ['trial', 'active', 'expired', 'suspended'];

module.exports = (sequelize) => {
  const Factory = sequelize.define(
    'Factory',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
      },
      name: {
        type: DataTypes.STRING(200),
        allowNull: false,
        unique: true,
      },
      owner_id: {
        type: DataTypes.UUID,
        allowNull: true,
      },
      subscription_status: {
        type: DataTypes.ENUM(...SUBSCRIPTION_STATUS),
        defaultValue: 'trial',
        allowNull: false,
      },
      subscription_end_date: {
        type: DataTypes.DATEONLY,
        allowNull: true,
      },
      email_limit: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10,
        comment: 'Maximum number of users allowed in this factory',
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
    },
    { tableName: 'factories' }
  );

  Factory.SUBSCRIPTION_STATUS = SUBSCRIPTION_STATUS;
  return Factory;
};
