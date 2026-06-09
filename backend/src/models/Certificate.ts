import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import Event from './Event';
import EventRegistration from './EventRegistration';

export class Certificate extends Model {
  declare id: number;
  declare userId: number;
  declare eventId: number | null;
  declare registrationId: number | null;
  declare activityTitle: string;
  declare status: 'pending' | 'approved' | 'rejected';
  declare approvedBy: number | null;
  declare approvedAt: Date | null;
  declare approverName: string | null;
  declare stampCode: string | null;
  declare note: string | null;
  declare certificateUrl: string | null;
  declare isBulk: boolean;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Certificate.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id'
      }
    },
    eventId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: Event,
        key: 'id'
      }
    },
    registrationId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: EventRegistration,
        key: 'id'
      }
    },
    activityTitle: {
      type: DataTypes.STRING,
      allowNull: false
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'pending'
    },
    approvedBy: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: User,
        key: 'id'
      }
    },
    approvedAt: {
      type: DataTypes.DATE,
      allowNull: true
    },
    approverName: {
      type: DataTypes.STRING,
      allowNull: true
    },
    stampCode: {
      type: DataTypes.STRING(100),
      allowNull: true,
      unique: true
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    certificateUrl: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    isBulk: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  },
  {
    sequelize,
    tableName: 'certificates',
    timestamps: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  }
);

Certificate.belongsTo(User, { as: 'student', foreignKey: 'userId' });
Certificate.belongsTo(User, { as: 'approver', foreignKey: 'approvedBy' });
Certificate.belongsTo(Event, { foreignKey: 'eventId' });
Certificate.belongsTo(EventRegistration, { foreignKey: 'registrationId' });

export default Certificate;
