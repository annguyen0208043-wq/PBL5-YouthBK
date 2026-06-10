import sequelize from './config/database';

async function run() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database successfully.');
    
    // Check if column exists
    const [results] = await sequelize.query(`
      SHOW COLUMNS FROM users LIKE 'communityPoints';
    `);
    
    if (Array.isArray(results) && results.length === 0) {
      console.log("Column 'communityPoints' does not exist in 'users' table. Adding it...");
      await sequelize.query(`
        ALTER TABLE users ADD COLUMN communityPoints INT DEFAULT 0;
      `);
      console.log("✅ Successfully added column 'communityPoints' to 'users' table!");
    } else {
      console.log("ℹ️ Column 'communityPoints' already exists in 'users' table.");
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to run migration:', error);
    process.exit(1);
  }
}

run();
