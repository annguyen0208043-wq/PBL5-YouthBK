import sequelize from './src/config/database';
import User from './src/models/User';
import { hashPassword } from './src/utils/passwordHelper';

async function reset() {
  try {
    await sequelize.authenticate();
    const user = await User.findOne({ where: { email: 'user1@gmail.com' } });
    if (user) {
      const hashed = await hashPassword('123456789Aa');
      await user.update({ password: hashed });
      console.log('✓ Successfully reset password for user1@gmail.com to 123456789Aa');
    } else {
      console.log('✗ User user1@gmail.com not found');
    }
  } catch (e) {
    console.error(e);
  } finally {
    await sequelize.close();
  }
}

reset();
