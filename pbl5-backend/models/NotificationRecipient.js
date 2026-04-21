const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const NotificationRecipient = sequelize.define('NotificationRecipient', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  notificationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  userId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  readAt: {
    type: DataTypes.DATE,
    allowNull: true,
  },
}, {
  tableName: 'notification_recipients',
  timestamps: true,
  createdAt: false,
  updatedAt: false,
  indexes: [
    {
      unique: true,
      fields: ['notificationId', 'userId'],
    },
  ],
});

NotificationRecipient.associate = (models) => {
  NotificationRecipient.belongsTo(models.Notification, { foreignKey: 'notificationId', as: 'notification' });
  NotificationRecipient.belongsTo(models.User, { foreignKey: 'userId', as: 'recipient' });
};

module.exports = NotificationRecipient;
