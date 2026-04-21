const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const EventApproval = sequelize.define('EventApproval', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  eventId: {
    type: DataTypes.INTEGER,
    field: 'event_id',
    allowNull: false,
  },
  approvedBy: {
    type: DataTypes.INTEGER,
    field: 'approved_by',
    allowNull: false,
  },
  status: {
    type: DataTypes.STRING(50),
    allowNull: false,
    // Possible values: Duyệt, Từ chối, Yêu cầu chỉnh sửa
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  createdAt: {
    type: DataTypes.DATE,
    field: 'created_at',
    defaultValue: DataTypes.NOW,
  }
}, {
  tableName: 'event_approval',
  timestamps: false,
});

EventApproval.associate = (models) => {
  EventApproval.belongsTo(models.Event, { foreignKey: 'eventId', as: 'event' });
  EventApproval.belongsTo(models.User, { foreignKey: 'approvedBy', as: 'approver' });
};

module.exports = EventApproval;
