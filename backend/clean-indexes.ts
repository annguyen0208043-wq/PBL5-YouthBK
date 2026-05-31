import sequelize from './src/config/database';

async function clean() {
  try {
    await sequelize.authenticate();
    const [indexes] = await sequelize.query(`SHOW INDEX FROM users WHERE Key_name != 'PRIMARY'`);
    
    const indexNames = indexes.map((idx: any) => idx.Key_name);
    // remove duplicates
    const uniqueIndexNames = [...new Set(indexNames)];

    for (const name of uniqueIndexNames) {
      console.log(`Dropping index ${name}`);
      await sequelize.query(`ALTER TABLE users DROP INDEX \`${name}\``).catch(e => console.log('Already dropped or failed'));
    }
    
    // Also do for events if needed
    const [eventIndexes] = await sequelize.query(`SHOW INDEX FROM events WHERE Key_name != 'PRIMARY'`);
    const uniqueEventIndexNames = [...new Set(eventIndexes.map((idx: any) => idx.Key_name))];
    for (const name of uniqueEventIndexNames) {
      console.log(`Dropping index ${name}`);
      await sequelize.query(`ALTER TABLE events DROP INDEX \`${name}\``).catch(e => console.log('Already dropped or failed'));
    }

    console.log('Cleanup done!');
    process.exit(0);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

clean();
