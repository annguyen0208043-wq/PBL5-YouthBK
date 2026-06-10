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

    const adminPassword = await hashPassword('123456');
    const lienChiPassword = await hashPassword('LienChi@123');
    const studentPassword = await hashPassword('Student@123');

    // Create admin user (admin@dut.udn)
    const [adminUser1, created1] = await User.findOrCreate({
      where: { email: 'admin@dut.udn' },
      defaults: {
        name: 'Nguyễn Văn Admin',
        password: adminPassword,
        role: 'admin',
        phone: '0905123456',
        isActive: true,
        status: 'Hoạt động'
      }
    });
    if (!created1) {
      await adminUser1.update({ password: adminPassword, role: 'admin' });
      console.log('✓ Admin admin@dut.udn updated successfully');
    } else {
      console.log('✓ Admin admin@dut.udn created successfully');
    }

    // Create admin user (admin@dut.udn.vn)
    const [adminUser2, created2] = await User.findOrCreate({
      where: { email: 'admin@dut.udn.vn' },
      defaults: {
        name: 'Nguyễn Văn Admin',
        password: adminPassword,
        role: 'admin',
        phone: '0905123456',
        isActive: true,
        status: 'Hoạt động'
      }
    });
    if (!created2) {
      await adminUser2.update({ password: adminPassword, role: 'admin' });
      console.log('✓ Admin admin@dut.udn.vn updated successfully');
    } else {
      console.log('✓ Admin admin@dut.udn.vn created successfully');
    }

    // Create lienchi user (Liên chi đoàn)
    const [lienChiUser, createdLienChi] = await User.findOrCreate({
      where: { email: 'lienchi@dut.udn.vn' },
      defaults: {
        name: 'Trần Thị LienChi',
        password: lienChiPassword,
        role: 'lienchi',
        phone: '0915234567',
        isActive: true,
        status: 'Hoạt động'
      }
    });
    if (!createdLienChi) {
      await lienChiUser.update({ role: 'lienchi' });
      console.log('✓ LienChi lienchi@dut.udn.vn updated successfully');
    } else {
      console.log('✓ LienChi lienchi@dut.udn.vn created successfully');
    }

    // Create student user (Sinh viên)
    const [studentUser, createdStudent] = await User.findOrCreate({
      where: { email: 'student@dut.udn.vn' },
      defaults: {
        name: 'Lê Văn Student',
        password: studentPassword,
        role: 'student',
        studentId: '102230001',
        phone: '0925345678',
        isActive: true,
        status: 'Hoạt động'
      }
    });
    if (!createdStudent) {
      await studentUser.update({ role: 'student' });
      console.log('✓ Student student@dut.udn.vn updated successfully');
    } else {
      console.log('✓ Student student@dut.udn.vn created successfully');
    }

    console.log('\n📋 Login Credentials:\n');
    console.log('1. ADMIN (Đoàn trường):');
    console.log('   Email: admin@dut.udn');
    console.log('   Password: 123456\n');
    console.log('   Alternative Email: admin@dut.udn.vn');
    console.log('   Password: 123456\n');

    console.log('2. LIENCHI (Liên chi đoàn):');
    console.log('   Email: lienchi@dut.udn.vn');
    console.log('   Password: LienChi@123\n');

    console.log('3. STUDENT (Sinh viên):');
    console.log('   Email: student@dut.udn.vn');
    console.log('   Password: Student@123\n');

    console.log('✅ All users created/updated successfully!');

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding users:', error);
    await sequelize.close();
    process.exit(1);
  }
}

seedUsers();
