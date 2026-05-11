import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import Event from './Event';

export class EventRegistration extends Model {
  declare id: number;
  declare eventId: number;
  declare userId: number;
  declare registrationDate: Date;
  declare status: 'registered' | 'attended' | 'cancelled';
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

EventRegistration.init(
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
    registrationDate: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    },
    status: {
      type: DataTypes.ENUM('registered', 'attended', 'cancelled'),
      defaultValue: 'registered'
    }
  },
  {
    sequelize,
    tableName: 'event_registrations',
    timestamps: true,
    charset: 'utf8mb4'
  }
);

EventRegistration.belongsTo(Event, { foreignKey: 'eventId' });
EventRegistration.belongsTo(User, { foreignKey: 'userId' });

export default EventRegistration;
