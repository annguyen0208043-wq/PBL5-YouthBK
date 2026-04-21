const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const EventImage = sequelize.define('EventImage', {
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
  imagePath: {
    type: DataTypes.STRING(255),
    field: 'image_path',
    allowNull: false,
  },
  fileName: {
    type: DataTypes.STRING(255),
    field: 'file_name',
    allowNull: true,
  },
}, {
  tableName: 'event_images',
  timestamps: false,
});

EventImage.associate = (models) => {
  EventImage.belongsTo(models.Event, { foreignKey: 'eventId', as: 'event' });
};

module.exports = EventImage;
