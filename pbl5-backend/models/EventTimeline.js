const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const EventTimeline = sequelize.define('EventTimeline', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  eventId: {
    type: DataTypes.INTEGER,
    field: 'event_id',
    allowNull: false,
  },
  dateTime: {
    type: DataTypes.DATE,
    field: 'timeline_time',
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
}, {
  tableName: 'event_timeline',
  timestamps: false,
});

EventTimeline.associate = (models) => {
  EventTimeline.belongsTo(models.Event, { foreignKey: 'eventId', as: 'event' });
};

module.exports = EventTimeline;
