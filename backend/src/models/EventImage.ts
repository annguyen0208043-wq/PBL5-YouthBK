import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Event from './Event';

export class EventImage extends Model {
  declare id: number;
  declare eventId: number;
  declare imageUrl: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

EventImage.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    eventId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Event,
        key: 'id'
      }
    },
    imageUrl: {
      type: DataTypes.STRING,
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'event_images',
    timestamps: true,
    charset: 'utf8mb4'
  }
);

EventImage.belongsTo(Event, { foreignKey: 'eventId' });
Event.hasMany(EventImage, { as: 'images', foreignKey: 'eventId' });

export default EventImage;
