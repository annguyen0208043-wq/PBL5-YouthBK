import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

export class Conversation extends Model {
  declare id: number;
  declare name: string;
  declare createdBy: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

Conversation.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false
    },
    createdBy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: User,
        key: 'id'
      }
    }
  },
  {
    sequelize,
    tableName: 'conversations',
    timestamps: true,
    charset: 'utf8mb4'
  }
);

Conversation.belongsTo(User, { as: 'creator', foreignKey: 'createdBy' });

export default Conversation;
