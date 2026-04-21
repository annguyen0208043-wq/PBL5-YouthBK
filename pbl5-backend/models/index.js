const { sequelize } = require('../config/db');
const User = require('./User');
const Event = require('./Event');
const EventTimeline = require('./EventTimeline');
const EventImage = require('./EventImage');
const EventApproval = require('./EventApproval');
const Notification = require('./Notification');
const NotificationRecipient = require('./NotificationRecipient');

const db = {
  sequelize,
  User,
  Event,
  EventTimeline,
  EventImage,
  EventApproval,
  Notification,
  NotificationRecipient,
};

Object.keys(db).forEach((key) => {
  if (db[key].associate) {
    db[key].associate(db);
  }
});

module.exports = db;
