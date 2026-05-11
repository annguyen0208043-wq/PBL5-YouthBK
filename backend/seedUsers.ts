import sequelize from './src/config/database';
import User from './src/models/User';
import { hashPassword } from './src/utils/passwordHelper';

async function seedUsers() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    // Sync models
    await sequelize.sync();
    console.log('Database models synchronized');

    // Create admin user (Đoàn trường)
    const adminUser = await User.create({
      name: 'Nguyễn Văn Admin',
      email: 'admin@dut.udn.vn',
      password: await hashPassword('Admin@123'),
      role: 'admin',
      phone: '0905123456',
      isActive: true
    });
    console.log('✓ Admin (Đoàn trường) created:', {
      email: adminUser.email,
      name: adminUser.name,
      role: adminUser.role
    });

    // Create lienchi user (Liên chi đoàn)
    const lienChiUser = await User.create({
      name: 'Trần Thị LienChi',
      email: 'lienchi@dut.udn.vn',
      password: await hashPassword('LienChi@123'),
      role: 'lienchi',
      phone: '0915234567',
      isActive: true
    });
    console.log('✓ LienChi (Liên chi đoàn) created:', {
      email: lienChiUser.email,
      name: lienChiUser.name,
      role: lienChiUser.role
    });

    // Create student user (Sinh viên)
    const studentUser = await User.create({
      name: 'Lê Văn Student',
      email: 'student@dut.udn.vn',
      password: await hashPassword('Student@123'),
      role: 'student',
      studentId: '102230001',
      phone: '0925345678',
      isActive: true
    });
    console.log('✓ Student (Sinh viên) created:', {
      email: studentUser.email,
      name: studentUser.name,
      role: studentUser.role,
      studentId: studentUser.studentId
    });

    console.log('\n📋 Login Credentials:\n');
    console.log('1. ADMIN (Đoàn trường):');
    console.log('   Email: admin@dut.udn.vn');
    console.log('   Password: Admin@123\n');

    console.log('2. LIENCHI (Liên chi đoàn):');
    console.log('   Email: lienchi@dut.udn.vn');
    console.log('   Password: LienChi@123\n');

    console.log('3. STUDENT (Sinh viên):');
    console.log('   Email: student@dut.udn.vn');
    console.log('   Password: Student@123\n');

    console.log('✅ All users created successfully!');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    await sequelize.close();
    process.exit(1);
  }
}

seedUsers();
