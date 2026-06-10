import sequelize from './src/config/database';
import User from './src/models/User';
import { hashPassword } from './src/utils/passwordHelper';

async function clearUsers() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    // Turn off foreign key constraints during truncate to avoid restrictions
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');

    // Truncate users table
    await sequelize.query('TRUNCATE TABLE users');
    console.log('🗑️ Wiped all data in the `users` table successfully.');

    // Turn foreign key constraints back on
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

    // Re-create the requested admin account so the system remains accessible
    const hashedPassword = await hashPassword('admin123');
    await User.create({
      name: 'Đoàn trường ĐH Bách Khoa',
      email: 'admin@dut.udn',
      password: hashedPassword,
      role: 'admin',
      phone: '0901234567',
      faculty: 'Đoàn trường',
      status: 'Hoạt động',
      isActive: true
    });
    console.log('✨ Created admin@dut.udn account (Password: admin123)');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error clearing users:', error);
    await sequelize.close();
    process.exit(1);
  }
}

clearUsers();
