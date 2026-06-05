import sequelize from './config/database';
import User from './models/User';
import { hashPassword } from './utils/passwordHelper';
import dotenv from 'dotenv';

dotenv.config();

const seedAdmin = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    await sequelize.sync();

    const existingAdmin = await User.findOne({ where: { email: 'admin@pbl5.edu.vn' } });
    if (existingAdmin) {
      console.log('⚠️  Admin account already exists. Updating its role to admin and resetting password...');
      const hashedPassword = await hashPassword('admin123');
      await existingAdmin.update({
        name: 'Đoàn trường ĐH Bách Khoa',
        role: 'admin',
        password: hashedPassword,
        status: 'Hoạt động',
        isActive: true
      });
      console.log('✅ Updated existing account to Admin (Đoàn trường) successfully!');
      console.log('──────────────────────────────────');
      console.log(`   Họ tên:    Đoàn trường ĐH Bách Khoa`);
      console.log(`   Email:     admin@pbl5.edu.vn`);
      console.log(`   Mật khẩu: admin123`);
      console.log(`   Role:      admin (Đoàn trường)`);
      console.log('──────────────────────────────────');
      process.exit(0);
    }

    const hashedPassword = await hashPassword('admin123');

    const admin = await User.create({
      name: 'Đoàn trường ĐH Bách Khoa',
      email: 'admin@pbl5.edu.vn',
      password: hashedPassword,
      role: 'admin',
      phone: '0901234567',
      faculty: 'Đoàn trường',
      status: 'Hoạt động',
      isActive: true
    });

    console.log('');
    console.log('✅ Tạo tài khoản Admin thành công!');
    console.log('──────────────────────────────────');
    console.log(`   Họ tên:    ${admin.name}`);
    console.log(`   Email:     admin@pbl5.edu.vn`);
    console.log(`   Mật khẩu: admin123`);
    console.log(`   Role:      admin (Đoàn trường)`);
    console.log('──────────────────────────────────');
    console.log('');

    process.exit(0);
  } catch (error) {
    console.error('❌ Lỗi:', error);
    process.exit(1);
  }
};

seedAdmin();
