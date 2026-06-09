import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import Conversation from './Conversation';

export class ChatInvitation extends Model {
  declare id: number;
  declare conversationId: number;
  declare invitedBy: number;
  declare invitedUserId: number;
  declare status: 'pending' | 'accepted' | 'declined';
  declare message: string | null;
  declare respondedAt: Date | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ChatInvitation.init(
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
    invitedBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id'
      }
    },
    invitedUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id'
      }
    },
    status: {
      type: DataTypes.ENUM('pending', 'accepted', 'declined'),
      allowNull: false,
      defaultValue: 'pending'
    },
    message: {
      type: DataTypes.STRING,
      allowNull: true
    },
    respondedAt: {
      type: DataTypes.DATE,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'chat_invitations',
    timestamps: true,
    charset: 'utf8mb4',
    indexes: [
      { fields: ['invitedUserId', 'status'] },
      { fields: ['conversationId'] }
    ]
  }
);

ChatInvitation.belongsTo(Conversation, { as: 'conversation', foreignKey: 'conversationId' });
ChatInvitation.belongsTo(User, { as: 'inviter', foreignKey: 'invitedBy' });
ChatInvitation.belongsTo(User, { as: 'invitee', foreignKey: 'invitedUserId' });
Conversation.hasMany(ChatInvitation, { as: 'invitations', foreignKey: 'conversationId' });

export default ChatInvitation;
