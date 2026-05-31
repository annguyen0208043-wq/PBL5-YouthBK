import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

export class Event extends Model {
  declare id: number;
  declare title: string;
  declare description: string;
  declare location: string;
  declare startDate: Date;
  declare endDate: Date;
  declare startTime: Date;
  declare endTime: Date;
  declare registrationDeadline: Date | null;
  declare createdBy: number;
  declare createdByRole: 'admin' | 'lienchi';
  declare status: 'draft' | 'pending' | 'revision_required' | 'approved' | 'update_requested' | 'cancel_requested' | 'postpone_requested' | 'cancelled' | 'postponed' | 'ongoing' | 'ended' | 'completed' | 'revision_requested' | 'rejected';
  declare image: string | null;
  declare capacity: number | null;
  declare maxParticipants: number | null;
  declare maxSlots: number | null;
  declare currentSlots: number;
  declare category: string | null;
  declare reviewHistory: any[] | null;
  declare rejectionReason: string | null;
  declare revisionMessage: string | null;
  declare pendingChanges: any | null;
  declare pendingChangeType: 'update' | 'cancel' | 'postpone' | null;
  declare pendingChangeReason: string | null;
  declare pendingProposedDate: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Event.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING,
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    location: {
      type: DataTypes.STRING,
      allowNull: false
    },
    startDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true
    },
    registrationDeadline: {
      type: DataTypes.DATE,
      allowNull: true
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id'
      }
    },
    createdByRole: {
      type: DataTypes.ENUM('admin', 'lienchi'),
      defaultValue: 'lienchi'
    },
    status: {
      type: DataTypes.ENUM('draft', 'pending', 'revision_required', 'approved', 'update_requested', 'cancel_requested', 'postpone_requested', 'cancelled', 'postponed', 'ongoing', 'ended', 'completed', 'revision_requested', 'rejected'),
      defaultValue: 'draft'
    },
    image: {
      type: DataTypes.STRING,
      allowNull: true
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    maxParticipants: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    maxSlots: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    currentSlots: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    category: {
      type: DataTypes.STRING,
      allowNull: true
    },
    reviewHistory: {
      type: DataTypes.JSON,
      allowNull: true,
      defaultValue: []
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    revisionMessage: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    pendingChanges: {
      type: DataTypes.JSON,
      allowNull: true
    },
    pendingChangeType: {
      type: DataTypes.ENUM('update', 'cancel', 'postpone'),
      allowNull: true
    },
    pendingChangeReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    pendingProposedDate: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'events',
    timestamps: true,
    charset: 'utf8mb4'
  }
);

Event.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });

export default Event;
