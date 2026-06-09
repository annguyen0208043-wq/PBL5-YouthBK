import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import Event from './Event';

export class EventFeedback extends Model {
  declare id: number;
  declare eventId: number;
  declare userId: number;
  declare rating: number;
  declare content: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

EventFeedback.init(
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
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id'
      }
    },
    rating: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 1,
        max: 5
      }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'event_feedbacks',
    timestamps: true
  }
);

Event.hasMany(EventFeedback, { foreignKey: 'eventId', as: 'feedbacks' });
EventFeedback.belongsTo(Event, { foreignKey: 'eventId', as: 'event' });

User.hasMany(EventFeedback, { foreignKey: 'userId', as: 'feedbacks' });
EventFeedback.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default EventFeedback;
