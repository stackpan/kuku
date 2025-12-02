import { Pool } from 'pg';
import { env } from '../config';
import { GiveawayData, Participant } from '../types';
import * as fs from 'fs/promises';
import * as path from 'path';
import { randomUUID } from 'crypto';

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
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf-8');
    await this.pool.query(schema);
  }

  async addParticipant(giveawayId: string, userId: string, roleId: string): Promise<void> {
    const query = `
      INSERT INTO participants (giveaway_id, user_id, role_id)
      VALUES ($1, $2, $3)
    `;
    await this.pool.query(query, [giveawayId, userId, roleId]);
  }

  async getParticipant(userId: string): Promise<Participant | null> {
    const query = 'SELECT * FROM participants WHERE user_id = $1';
    const result = await this.pool.query(query, [userId]);
    if (result.rows.length === 0) return null;
    return {
      giveawayId: result.rows[0].giveaway_id,
      userId: result.rows[0].user_id,
      roleId: result.rows[0].role_id,
      probabilityCached: result.rows[0].probability_cache,
      createdAt: new Date(result.rows[0].created_at),
    };
  }

  async getAllParticipants(): Promise<Participant[]> {
    const query = 'SELECT * FROM participants';
    const result = await this.pool.query(query);
    return result.rows.map(row => ({
      giveawayId: row.giveaway_id,
      userId: row.user_id,
      roleId: row.role_id,
      probabilityCached: row.probability_cache,
      createdAt: new Date(row.created_at),
    }));
  }

  async clearParticipants(): Promise<void> {
    await this.pool.query('DELETE FROM participants');
  }

  async updateParticipantProbabilityCache(giveawayId: string, roleId: string, probabilityCached: number): Promise<void> {
    const query = `
      UPDATE participants
      SET probability_cache = $3
      WHERE giveaway_id = $1 AND role_id = $2
    `;
    await this.pool.query(query, [giveawayId, roleId, probabilityCached]);
  }

  async saveGiveaway(messageId: string): Promise<void> {
    const query = 'INSERT INTO giveaways (id, message_id) VALUES ($1, $2)';
    const uuid = randomUUID();
    await this.pool.query(query, [uuid, messageId]);
  }

  async isHasAGiveaway(): Promise<boolean> {
    const query = 'SELECT COUNT(*) FROM giveaways;';
    const result = await this.pool.query(query);
    return parseInt(result.rows[0].count) > 0;
  }

  async getGiveawayByMessageId(messageId: string): Promise<GiveawayData | null> {
    const query = 'SELECT * FROM giveaways WHERE message_id = $1';
    const result = await this.pool.query(query, [messageId]);
    if (result.rows.length === 0) return null;
    return {
      id: result.rows[0].id,
      messageId: result.rows[0].message_id,
      isActive: result.rows[0].is_active,
      createdAt: new Date(result.rows[0].created_at),
    }
  }

  async close(): Promise<void> {
    await this.pool.end();
  }
}