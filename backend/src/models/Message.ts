import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import Conversation from './Conversation';

export class Message extends Model {
  declare id: number;
  declare conversationId: number;
  declare senderId: number;
  declare content: string;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Message.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    conversationId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Conversation,
        key: 'id'
      }
    },
    senderId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id'
      }
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false
    }
  },
  {
    sequelize,
    tableName: 'messages',
    timestamps: true,
    charset: 'utf8mb4'
  }
);

Message.belongsTo(Conversation, { foreignKey: 'conversationId' });
Message.belongsTo(User, { as: 'sender', foreignKey: 'senderId' });

export default Message;
