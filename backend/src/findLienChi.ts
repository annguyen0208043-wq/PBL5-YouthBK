import sequelize from './config/database';
import User from './models/User';

const findLienChi = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database');

    const lienChiUsers = await User.findAll({
      where: { role: 'lienchi' },
      attributes: ['id', 'name', 'email', 'role', 'faculty'],
      raw: true
    });
    console.log('\n--- LIEN CHI USERS ---');
    console.log(lienChiUsers);

    process.exit(0);
  } catch (err) {
    console.error('Error querying DB:', err);
    process.exit(1);
  }
};

findLienChi();
