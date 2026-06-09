import fs from 'fs';
import path from 'path';
import sequelize from './config/database';

async function run() {
  try {
    await sequelize.authenticate();
    console.log('Connection has been established successfully.');

    const sqlPath = path.join(__dirname, '../../db.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split SQL file by semicolons, but ignore semicolons inside comments or quotes if possible.
    // For a standard dump, we can split by semicolon followed by a newline or end of line.
    const statements = sql
      .split(/;\s*$/m)
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0);

    console.log(`Found ${statements.length} SQL statements to execute.`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      // Skip commented-only statements
      if (statement.startsWith('--')) {
        const lines = statement.split('\n');
        const cleanLines = lines.filter(line => !line.trim().startsWith('--'));
        if (cleanLines.join('').trim() === '') {
          continue;
        }
      }
      
      console.log(`Executing statement ${i + 1}/${statements.length}...`);
      await sequelize.query(statement);
    }

    console.log('✅ Database migration successful!');
  } catch (error) {
    console.error('❌ Database migration failed:', error);
  } finally {
    await sequelize.close();
  }
}

run();
