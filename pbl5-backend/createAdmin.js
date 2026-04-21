const bcrypt = require('bcryptjs');
const { User } = require('./models');

const createAdmin = async () => {
  try {
    const email = 'admin1@gmail.com';
    const password = 'admin'; // Mật khẩu mặc định
    const fullName = 'Đoàn trường Đại học Bách khoa';
    const role = 'Đoàn trường';

    const existing = await User.findOne({ where: { email } });
    if (existing) {
      console.log('Tài khoản admin đã tồn tại:', email);
      process.exit(0);
    }

    const hashed = await bcrypt.hash(password, 12);
    const user = await User.create({
      fullName,
      email,
      role,
      password: hashed,
    });

    console.log('Tạo tài khoản admin thành công!');
    console.log(`- Email: ${user.email}`);
    console.log(`- Mật khẩu: ${password}`);
    console.log(`- Vai trò: ${user.role}`);
    process.exit(0);
  } catch (err) {
    console.error('Lỗi khi tạo admin:', err);
    process.exit(1);
  }
};

createAdmin();
