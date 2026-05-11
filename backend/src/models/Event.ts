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
  declare createdBy: number;
  declare status: 'pending' | 'approved' | 'ongoing' | 'completed' | 'cancelled' | 'revision_requested' | 'rejected';
  declare image: string | null;
  declare capacity: number | null;
  declare maxParticipants: number | null;
  declare category: string | null;
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
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'ongoing', 'completed', 'cancelled', 'revision_requested', 'rejected'),
      defaultValue: 'pending'
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
    category: {
      type: DataTypes.STRING,
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
