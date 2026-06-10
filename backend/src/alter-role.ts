import sequelize from './config/database';

async function alter() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database successfully.');
    
    console.log('Running ALTER TABLE to modify users.role enum...');
    await sequelize.query(`
      ALTER TABLE users MODIFY COLUMN role ENUM('admin', 'lienchi', 'student', 'monitor') NOT NULL DEFAULT 'student';
    `);
    console.log('✅ Successfully modified users.role column enum to include monitor!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to alter database schema:', error);
    process.exit(1);
  }
}

alter();
