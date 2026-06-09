import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

export class Event extends Model {
  declare id: number;
  declare title: string;
  declare description: string | null;
  declare category: string | null;
  
  declare plannedStartDate: Date;
  declare plannedEndDate: Date;
  declare actualStartDate: Date | null;
  declare actualEndDate: Date | null;
  declare registrationDeadline: Date | null;
  declare revisionDeadline: Date | null;

  declare locationName: string;
  declare locationLat: number | null;
  declare locationLng: number | null;
  declare attendanceRadius: number | null;

  declare minParticipants: number | null;
  declare maxParticipants: number | null;
  declare currentSlots: number;

  declare status: 'draft' | 'pending' | 'revision_required' | 'open_registration' | 'below_minimum' | 'ongoing' | 'ended' | 'completed' | 'cancelled';
  declare belowMinAction: 'proceed' | 'cancel' | null;
  declare belowMinNote: string | null;

  declare createdBy: number;
  declare createdByRole: 'admin' | 'lienchi';

  declare revisionMessage: string | null;
  declare rejectionReason: string | null;

  declare qrCode: string | null;
  declare qrActive: boolean;

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
    category: {
      type: DataTypes.STRING,
      allowNull: true
    },
    plannedStartDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    plannedEndDate: {
      type: DataTypes.DATE,
      allowNull: false
    },
    actualStartDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    actualEndDate: {
      type: DataTypes.DATE,
      allowNull: true
    },
    registrationDeadline: {
      type: DataTypes.DATE,
      allowNull: true
    },
    revisionDeadline: {
      type: DataTypes.DATE,
      allowNull: true
    },
    locationName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    locationLat: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true
    },
    locationLng: {
      type: DataTypes.DECIMAL(10, 7),
      allowNull: true
    },
    attendanceRadius: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    minParticipants: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    maxParticipants: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    currentSlots: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0
    },
    status: {
      type: DataTypes.ENUM(
        'draft',
        'pending',
        'revision_required',
        'open_registration',
        'below_minimum',
        'ongoing',
        'ended',
        'completed',
        'cancelled'
      ),
      allowNull: false,
      defaultValue: 'draft'
    },
    belowMinAction: {
      type: DataTypes.ENUM('proceed', 'cancel'),
      allowNull: true
    },
    belowMinNote: {
      type: DataTypes.TEXT,
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
      allowNull: false,
      defaultValue: 'lienchi'
    },
    revisionMessage: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    rejectionReason: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    qrCode: {
      type: DataTypes.STRING,
      allowNull: true
    },
    qrActive: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    }
  },
  {
    sequelize,
    tableName: 'events',
    timestamps: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  }
);

Event.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });

export default Event;
