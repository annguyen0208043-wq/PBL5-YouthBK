import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Event from './Event';

export class EventImage extends Model {
  declare id: number;
  declare eventId: number;
  declare imageUrl: string;
  declare caption: string | null;
  declare isCover: number;
  declare sortOrder: number;
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
      type: DataTypes.STRING(500),
      allowNull: false
    },
    caption: {
      type: DataTypes.STRING(255),
      allowNull: true
    },
    isCover: {
      type: DataTypes.TINYINT,
      allowNull: false,
      defaultValue: 0
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  },
  {
    sequelize,
    tableName: 'event_images',
    timestamps: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  }
);

EventImage.belongsTo(Event, { foreignKey: 'eventId' });
Event.hasMany(EventImage, { as: 'images', foreignKey: 'eventId', onDelete: 'CASCADE' });

export default EventImage;
