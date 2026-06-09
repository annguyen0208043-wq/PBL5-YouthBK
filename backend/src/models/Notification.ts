import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

export class Notification extends Model {
  declare id: number;
  declare title: string;
  declare message: string;
  declare content: string;
  declare type: string;
  declare targetType: string | null;
  declare targetValue: string | null;
  declare senderId: number;
  declare isRead: boolean;
  declare recipientCount: number;
  declare readCount: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Notification.init(
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
    message: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    type: {
      type: DataTypes.STRING,
      allowNull: true
    },
    targetType: {
      type: DataTypes.STRING,
      allowNull: true
    },
    targetValue: {
      type: DataTypes.STRING,
      allowNull: true
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: User,
        key: 'id'
      }
    },
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    recipientCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    readCount: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    }
  },
  {
    sequelize,
    tableName: 'notifications',
    timestamps: true,
    charset: 'utf8mb4'
  }
);

Notification.belongsTo(User, { as: 'sender', foreignKey: 'senderId' });

export default Notification;
