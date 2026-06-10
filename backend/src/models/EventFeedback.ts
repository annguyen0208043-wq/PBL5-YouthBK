import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import Event from './Event';

export class EventFeedback extends Model {
  declare id: number;
  declare eventId: number;
  declare userId: number;
  declare rating: number;
  declare comment: string | null;
  declare isAnonymous: boolean;
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
    comment: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    isAnonymous: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  },
  {
    sequelize,
    tableName: 'event_feedbacks',
    timestamps: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  }
);

Event.hasMany(EventFeedback, { foreignKey: 'eventId', as: 'feedbacks', onDelete: 'CASCADE' });
EventFeedback.belongsTo(Event, { foreignKey: 'eventId', as: 'event' });

User.hasMany(EventFeedback, { foreignKey: 'userId', as: 'feedbacks' });
EventFeedback.belongsTo(User, { foreignKey: 'userId', as: 'user' });

export default EventFeedback;
