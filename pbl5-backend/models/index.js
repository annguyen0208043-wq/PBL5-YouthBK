const { sequelize } = require('../config/db');
const User = require('./User');

const db = { sequelize, User };

Object.keys(db).forEach((key) => {
  if (db[key].associate) {
    db[key].associate(db);
  }
});

module.exports = db;