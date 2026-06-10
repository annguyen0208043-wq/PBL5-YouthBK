import sequelize from './config/database';

async function clearDb() {
  try {
    await sequelize.authenticate();
    console.log('✅ Connected to database successfully.');
    
    // Disable foreign key checks to allow truncating tables with foreign keys
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 0;');
    console.log('⚙️ Foreign key checks disabled.');
    
    // Get all table names
    const [tables] = await sequelize.query('SHOW TABLES;') as [any[], any];
    
    if (tables.length === 0) {
      console.log('ℹ️ No tables found in the database.');
    } else {
      for (const tableObj of tables) {
        const tableName = Object.values(tableObj)[0] as string;
        console.log(`🧹 Truncating table: ${tableName}`);
        await sequelize.query(`TRUNCATE TABLE \`${tableName}\`;`);
      }
    }
    
    // Re-enable foreign key checks
    await sequelize.query('SET FOREIGN_KEY_CHECKS = 1;');
    console.log('⚙️ Foreign key checks re-enabled.');
    
    console.log('✅ Successfully cleared all data from database tables (kept the table schemas)!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to clear database tables:', error);
    process.exit(1);
  }
}

clearDb();
