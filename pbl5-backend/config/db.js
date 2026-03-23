const { Sequelize } = require('sequelize');
require('dotenv').config();

// Khởi tạo Sequelize
const sequelize = new Sequelize(
  process.env.DB_NAME, 
  process.env.DB_USER, 
  process.env.DB_PASSWORD, 
  {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    dialect: 'mysql', // Ghi thẳng chữ 'mysql' vào đây để tránh lỗi file .env
    logging: false,    // Tắt log SQL để terminal sạch hơn
  }
);

const testConnect = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Kết nối Database thành công!');
  } catch (error) {
    console.error('❌ Không thể kết nối Database:', error);
  }
};

module.exports = { sequelize, testConnect };