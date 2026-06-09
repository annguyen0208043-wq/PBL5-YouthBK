import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import Event from './Event';

export class EventRegistration extends Model {
  declare id: number;
  declare eventId: number;
  declare userId: number;
  declare registrationDate: Date;
  declare status: 'registered' | 'attended' | 'confirmed' | 'absent' | 'cancelled';
  declare attendedAt: Date | null;
  declare attendanceLat: number | null;
  declare attendanceLng: number | null;
  declare confirmedBy: number | null;
  declare confirmedAt: Date | null;
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
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    status: {
      type: DataTypes.ENUM('registered', 'attended', 'confirmed', 'absent', 'cancelled'),
      allowNull: false,
      defaultValue: 'registered'
    },
    attendedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    attendanceLat: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true
    },
    attendanceLng: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true
    },
    confirmedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: User,
        key: 'id'
      }
    },
    confirmedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'event_registrations',
    timestamps: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  }
);

EventRegistration.belongsTo(Event, { foreignKey: 'eventId' });
EventRegistration.belongsTo(User, { foreignKey: 'userId' });
EventRegistration.belongsTo(User, { as: 'confirmetor', foreignKey: 'confirmedBy' });

Event.hasMany(EventRegistration, { as: 'registrations', foreignKey: 'eventId', onDelete: 'CASCADE' });
User.hasMany(EventRegistration, { as: 'eventRegistrations', foreignKey: 'userId' });

export default EventRegistration;
