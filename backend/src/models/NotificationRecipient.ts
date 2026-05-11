import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Notification from './Notification';
import User from './User';

export class NotificationRecipient extends Model {
  declare id: number;
  declare notificationId: number;
  declare userId: number;
  declare isRead: boolean;
  declare readAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

NotificationRecipient.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    notificationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Notification,
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
    isRead: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    readAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'notification_recipients',
    timestamps: true,
    charset: 'utf8mb4'
  }
);

NotificationRecipient.belongsTo(Notification, { foreignKey: 'notificationId' });
NotificationRecipient.belongsTo(User, { as: 'recipient', foreignKey: 'userId' });
Notification.hasMany(NotificationRecipient, { as: 'recipients', foreignKey: 'notificationId' });

export default NotificationRecipient;
