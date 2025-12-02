import { Pool } from 'pg';
import { env } from '../config';
import { Participant } from '../types';

export class Database {
  private pool: Pool;

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
    const query = `
      CREATE TABLE IF NOT EXISTS participants (
        user_id VARCHAR(20) PRIMARY KEY,
        role_id VARCHAR(20) NOT NULL,
        probability DECIMAL(10, 6) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE TABLE IF NOT EXISTS giveaways (
        id SERIAL PRIMARY KEY,
        message_id VARCHAR(20) UNIQUE NOT NULL,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await this.pool.query(query);
  }

  async addParticipant(userId: string, roleId: string, probability: number): Promise<void> {
    const query = `
      INSERT INTO participants (user_id, role_id, probability)
      VALUES ($1, $2, $3)
      ON CONFLICT (user_id) DO UPDATE
      SET role_id = $2, probability = $3;
    `;
    await this.pool.query(query, [userId, roleId, probability]);
  }

  async getParticipant(userId: string): Promise<Participant | null> {
    const query = 'SELECT user_id, role_id, probability FROM participants WHERE user_id = $1';
    const result = await this.pool.query(query, [userId]);
    if (result.rows.length === 0) return null;
    return {
      userId: result.rows[0].user_id,
      roleId: result.rows[0].role_id,
      probability: parseFloat(result.rows[0].probability),
    };
  }

  async getAllParticipants(): Promise<Participant[]> {
    const query = 'SELECT user_id, role_id, probability FROM participants';
    const result = await this.pool.query(query);
    return result.rows.map(row => ({
      userId: row.user_id,
      roleId: row.role_id,
      probability: parseFloat(row.probability),
    }));
  }

  async clearParticipants(): Promise<void> {
    await this.pool.query('DELETE FROM participants');
  }

  async saveGiveaway(messageId: string): Promise<void> {
    const query = 'INSERT INTO giveaways (message_id) VALUES ($1) ON CONFLICT (message_id) DO NOTHING';
    await this.pool.query(query, [messageId]);
  }

  async isHasAGiveaway(): Promise<boolean> {
    const query = 'SELECT COUNT(*) FROM giveaways;';
    const result = await this.pool.query(query);
    return parseInt(result.rows[0].count) > 0;
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}