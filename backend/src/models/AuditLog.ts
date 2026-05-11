import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import User from './User';

export class AuditLog extends Model {
  declare id: number;
  declare userId: number;
  declare action: string;
  declare targetType: string | null;
  declare targetId: number | null;
  declare details: string | null;
  declare ipAddress: string | null;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

AuditLog.init(
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
    action: {
      type: DataTypes.STRING,
      allowNull: false
    },
    targetType: {
      type: DataTypes.STRING,
      allowNull: true
    },
    targetId: {
      type: DataTypes.INTEGER,
      allowNull: true
    },
    details: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    ipAddress: {
      type: DataTypes.STRING,
      allowNull: true
    }
  },
  {
    sequelize,
    tableName: 'audit_logs',
    timestamps: true,
    charset: 'utf8mb4'
  }
);

AuditLog.belongsTo(User, { as: 'actor', foreignKey: 'userId' });

export default AuditLog;
