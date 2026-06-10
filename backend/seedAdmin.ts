import sequelize from './src/config/database';
import User from './src/models/User';
import { hashPassword } from './src/utils/passwordHelper';

async function seedAdmin() {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');

    await sequelize.sync();

    const email = 'admin@dut.udn.vn';
    const rawPassword = '123456';
    const hashedPassword = await hashPassword(rawPassword);

    const existingUser = await User.findOne({ where: { email } });

    if (existingUser) {
      console.log(`⚠️ Account ${email} already exists. Resetting its password...`);
      await existingUser.update({
        password: hashedPassword,
        role: 'admin',
        isActive: true,
        status: 'Hoạt động'
      });
      console.log(`✅ Updated password to ${rawPassword} for ${email}`);
    } else {
      console.log(`✨ Creating account ${email}...`);
      await User.create({
        name: 'Nguyễn Văn Admin',
        email: email,
        password: hashedPassword,
        role: 'admin',
        phone: '0905123456',
        isActive: true,
        status: 'Hoạt động'
      });
      console.log(`✅ Successfully created account ${email} with password ${rawPassword}`);
    }

    await sequelize.close();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error);
    await sequelize.close();
    process.exit(1);
  }
}

seedAdmin();
