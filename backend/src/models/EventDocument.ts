import { DataTypes, Model } from 'sequelize';
import sequelize from '../config/database';
import Event from './Event';
import User from './User';

export class EventDocument extends Model {
  declare id: number;
  declare eventId: number;
  declare fileName: string;
  declare fileUrl: string;
  declare fileType: string | null;
  declare fileSize: number | null;
  declare uploadedBy: number;
  declare readonly createdAt: Date;
  declare readonly updatedAt: Date;
}

EventDocument.init(
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    eventId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: Event,
        key: 'id'
      }
    },
    fileName: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    fileUrl: {
      type: DataTypes.STRING(500),
      allowNull: false
    },
    fileType: {
      type: DataTypes.STRING(50),
      allowNull: true
    },
    fileSize: {
      type: DataTypes.BIGINT,
      allowNull: true
    },
    uploadedBy: {
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
    tableName: 'event_documents',
    timestamps: true,
    charset: 'utf8mb4',
    collate: 'utf8mb4_unicode_ci'
  }
);

EventDocument.belongsTo(Event, { foreignKey: 'eventId' });
EventDocument.belongsTo(User, { as: 'uploader', foreignKey: 'uploadedBy' });

Event.hasMany(EventDocument, { as: 'documents', foreignKey: 'eventId', onDelete: 'CASCADE' });

export default EventDocument;
