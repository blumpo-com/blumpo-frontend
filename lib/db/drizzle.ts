import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

dotenv.config();

// Support both DATABASE_URL and POSTGRES_URL for compatibility
const databaseUrl = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!databaseUrl) {
  throw new Error('DATABASE_URL or POSTGRES_URL environment variable is not set');
}

// Longer connect_timeout for serverless (e.g. Vercel cron) where first connection
// can be slow due to cold start or DB in another region/sleeping (e.g. Neon).
export const client = postgres(databaseUrl, {
  connect_timeout: 60,
});
export const db = drizzle(client, { schema });
