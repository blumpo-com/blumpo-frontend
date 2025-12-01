import postgres from 'postgres';
import dotenv from 'dotenv';

dotenv.config();

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) {
  console.error('ERROR: DATABASE_URL or POSTGRES_URL not set');
  process.exit(1);
}

const match = url.match(/\/([^\/\?]+)(?:\?|$)/);
if (!match) {
  console.error('ERROR: Could not parse database name');
  process.exit(1);
}

const dbName = match[1];
const baseUrl = url.replace(/\/[^\/\?]+(?:\?|$)/, '');
const queryString = url.includes('?') ? '?' + url.split('?')[1] : '';

// If database name is 'postgres', we can't drop it - just drop all tables instead
if (dbName === 'postgres') {
  console.log('Database name is "postgres" - dropping all tables instead of dropping database');
  
  async function resetTables() {
    const sql = postgres(url!);
    try {
      // Drop all tables with CASCADE
      console.log('Dropping all tables...');
      await sql.unsafe(`DROP SCHEMA public CASCADE; CREATE SCHEMA public;`);
      console.log('All tables dropped');
    } catch (error) {
      console.error('Error resetting tables:', error);
      process.exit(1);
    } finally {
      await sql.end();
    }
  }
  
  resetTables();
} else {
  // Connect to 'postgres' database to drop/create the target database
  const adminUrl = baseUrl + queryString + '/postgres';

  async function resetDatabase() {
    // Connect to postgres database (not the target database)
    const adminSql = postgres(adminUrl);
    
    try {
      // Terminate all connections to the target database first
      console.log('Terminating connections to database:', dbName);
      await adminSql.unsafe(`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = '${dbName}' AND pid <> pg_backend_pid();
      `);
      
      console.log('Dropping database:', dbName);
      await adminSql.unsafe(`DROP DATABASE IF EXISTS "${dbName}";`);
      
      console.log('Creating database:', dbName);
      await adminSql.unsafe(`CREATE DATABASE "${dbName}";`);
      
      console.log('Database reset complete');
    } catch (error) {
      console.error('Error resetting database:', error);
      process.exit(1);
    } finally {
      await adminSql.end();
    }
  }
  
  resetDatabase();
}
