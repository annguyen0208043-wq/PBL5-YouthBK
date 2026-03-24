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
}, {
  tableName: 'users',
  timestamps: true,
});

module.exports = User;