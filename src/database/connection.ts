import { Pool } from 'pg';
import { env } from '../config';
import * as fs from 'fs/promises';
import * as path from 'path';

export default class Connection {
  pool: Pool;

  constructor() {
    this.pool = new Pool({
      host: env.DB_HOST,
      port: env.DB_PORT,
      user: env.DB_USER,
      password: env.DB_PASSWORD,
      database: env.DB_NAME,
    });
  }

  async initialize(): Promise<void> {
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf-8');
    await this.pool.query(schema);
  }

  async beginTransaction(): Promise<void> {
    await this.pool.query('BEGIN');
  }

  async commitTransaction(): Promise<void> {
    await this.pool.query('COMMIT');
  }

  async rollbackTransaction(): Promise<void> {
    await this.pool.query('ROLLBACK');
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}