const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Notification = sequelize.define('Notification', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  targetType: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  targetValue: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  createdBy: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
}, {
  tableName: 'notifications',
  timestamps: true,
  updatedAt: false,
});

Notification.associate = (models) => {
  Notification.belongsTo(models.User, { foreignKey: 'createdBy', as: 'sender' });
  Notification.hasMany(models.NotificationRecipient, { foreignKey: 'notificationId', as: 'recipients' });
};

module.exports = Notification;
