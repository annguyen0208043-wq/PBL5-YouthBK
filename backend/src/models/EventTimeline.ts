import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Event from './Event';

export class EventTimeline extends Model {
  declare id: number;
  declare eventId: number;
  declare dateTime: Date;
  declare description: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

EventTimeline.init(
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
    dateTime: {
      type: DataTypes.DATE,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'event_timelines',
    timestamps: true,
    charset: 'utf8mb4'
  }
);

EventTimeline.belongsTo(Event, { foreignKey: 'eventId' });
Event.hasMany(EventTimeline, { as: 'timelines', foreignKey: 'eventId' });

export default EventTimeline;
