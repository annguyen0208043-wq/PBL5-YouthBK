import sequelize from './src/config/database';
import User from './src/models/User';

async function check() {
  try {
    await sequelize.authenticate();
    const user = await User.findOne({ where: { email: 'user1@gmail.com' } });
    if (user) {
      console.log('✓ Found user:', user.toJSON());
    } else {
      console.log('✗ User user1@gmail.com NOT found!');
    }
    const all = await User.findAll({ attributes: ['email', 'role'] });
    console.log('All users in DB:', all.map(u => u.toJSON()));
  } catch (e) {
    console.error(e);
  } finally {
    await sequelize.close();
  }
}

check();
