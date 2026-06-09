import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import User from './User';
import Conversation from './Conversation';

export class ConversationMember extends Model {
  declare id: number;
  declare conversationId: number;
  declare userId: number;
  declare role: 'owner' | 'member';
  declare joinedAt: Date;
  declare lastReadMessageId: number | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

ConversationMember.init(
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
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id'
      }
    },
    role: {
      type: DataTypes.ENUM('owner', 'member'),
      allowNull: false,
      defaultValue: 'member'
    },
    joinedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    lastReadMessageId: {
      type: DataTypes.INTEGER,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'conversation_members',
    timestamps: true,
    charset: 'utf8mb4',
    indexes: [
      { unique: true, fields: ['conversationId', 'userId'] },
      { fields: ['userId'] }
    ]
  }
);

ConversationMember.belongsTo(Conversation, { as: 'conversation', foreignKey: 'conversationId' });
ConversationMember.belongsTo(User, { as: 'user', foreignKey: 'userId' });
Conversation.hasMany(ConversationMember, { as: 'memberships', foreignKey: 'conversationId' });
User.hasMany(ConversationMember, { as: 'conversationMemberships', foreignKey: 'userId' });

export default ConversationMember;
