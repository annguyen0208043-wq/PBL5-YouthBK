const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const User = sequelize.define('User', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  fullName: { type: DataTypes.STRING, allowNull: false },
  studentId: { type: DataTypes.STRING, allowNull: true, unique: true },
  phone: { type: DataTypes.STRING, allowNull: true },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  role: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Sinh viên' },
  password: { type: DataTypes.STRING, allowNull: false },
  status: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Hoạt động' },
  faculty: { type: DataTypes.STRING, allowNull: true },
}, {
  tableName: 'users',
  timestamps: false,
});

User.associate = (models) => {
  User.hasMany(models.Event, { foreignKey: 'createdBy', as: 'events' });
  User.hasMany(models.Notification, { foreignKey: 'createdBy', as: 'sentNotifications' });
  User.hasMany(models.NotificationRecipient, { foreignKey: 'userId', as: 'receivedNotifications' });
};

module.exports = User;
