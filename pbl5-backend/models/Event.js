const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const Event = sequelize.define('Event', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  location: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  startTime: {
    type: DataTypes.DATE,
    field: 'start_time',
    allowNull: false,
  },
  endTime: {
    type: DataTypes.DATE,
    field: 'end_time',
    allowNull: false,
  },
  maxParticipants: {
    type: DataTypes.INTEGER,
    field: 'max_participants',
    allowNull: true, 
  },
  category: {
    type: DataTypes.STRING(100),
    allowNull: true,
  },
  createdBy: {
    type: DataTypes.INTEGER,
    field: 'created_by',
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'Pending', // Pending, Approved, Rejected, ...
  },
}, {
  tableName: 'events',
  timestamps: false,
});

Event.associate = (models) => {
  Event.belongsTo(models.User, { foreignKey: 'createdBy', as: 'creator' });
  Event.hasMany(models.EventTimeline, { foreignKey: 'eventId', as: 'timelines' });
  Event.hasMany(models.EventImage, { foreignKey: 'eventId', as: 'images' });
  Event.hasMany(models.EventApproval, { foreignKey: 'eventId', as: 'approvals' });
};

module.exports = Event;
