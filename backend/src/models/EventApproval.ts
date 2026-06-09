import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Event from './Event';
import User from './User';

export class EventApproval extends Model {
  declare id: number;
  declare eventId: number;
  declare approvedBy: number;
  declare status: 'approved' | 'rejected' | 'revision_requested';
  declare note: string | null;
  declare revisionDeadline: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

EventApproval.init(
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
    approvedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('approved', 'rejected', 'revision_requested'),
      allowNull: false
    },
    note: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    revisionDeadline: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'event_approvals',
    timestamps: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  }
);

EventApproval.belongsTo(Event, { foreignKey: 'eventId' });
EventApproval.belongsTo(User, { as: 'approver', foreignKey: 'approvedBy' });
Event.hasMany(EventApproval, { as: 'approvals', foreignKey: 'eventId', onDelete: 'CASCADE' });

export default EventApproval;
