import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import Event from './Event';

export class CommunityPointHistory extends Model {
  declare id: number;
  declare userId: number;
  declare eventId: number | null;
  declare points: number;
  declare reason: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

CommunityPointHistory.init(
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
    points: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    reason: {
      type: DataTypes.STRING,
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'community_point_histories',
    timestamps: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  }
);

User.hasMany(CommunityPointHistory, { foreignKey: 'userId', as: 'pointHistories', onDelete: 'CASCADE' });
CommunityPointHistory.belongsTo(User, { foreignKey: 'userId', as: 'user' });

Event.hasMany(CommunityPointHistory, { foreignKey: 'eventId', as: 'pointHistories', onDelete: 'SET NULL' });
CommunityPointHistory.belongsTo(Event, { foreignKey: 'eventId', as: 'event' });

export default CommunityPointHistory;
