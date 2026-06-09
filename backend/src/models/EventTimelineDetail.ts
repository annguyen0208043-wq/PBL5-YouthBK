import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import EventTimeline from './EventTimeline';
import Event from './Event';

export class EventTimelineDetail extends Model {
  declare id: number;
  declare timelineId: number;
  declare eventId: number;
  declare dateTime: Date;
  declare title: string;
  declare content: string | null;
  declare sortOrder: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

EventTimelineDetail.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    timelineId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: EventTimeline,
        key: 'id'
      }
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
    title: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    sortOrder: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    }
  },
  {
    sequelize,
    tableName: 'event_timeline_details',
    timestamps: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  }
);

EventTimelineDetail.belongsTo(EventTimeline, { foreignKey: 'timelineId' });
EventTimelineDetail.belongsTo(Event, { foreignKey: 'eventId' });

EventTimeline.hasMany(EventTimelineDetail, { as: 'details', foreignKey: 'timelineId', onDelete: 'CASCADE' });
Event.hasMany(EventTimelineDetail, { as: 'timelineDetails', foreignKey: 'eventId', onDelete: 'CASCADE' });

export default EventTimelineDetail;
