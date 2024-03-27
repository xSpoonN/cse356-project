import { Pool } from 'pg';

/**
 *
 * @returns postgres client
 * @description Connect to the postgres database (required to call client.release() after using the client)
 */
export async function connect_db() {
  const pool = new Pool({
    host:
      process.env.BUILD_ENVIRONMENT === 'docker' ? 'tile-server' : 'localhost',
    user: 'renderer',
    password: 'renderer',
    database: 'gis',
    port: 5432,
  });
  const client = await pool.connect();
  return client;
}
