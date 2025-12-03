import Connection from "./connection";
import { Giveaway, Participant } from "../types";

export default class ParticipantRepository {
  private database: Connection;

  constructor(database: Connection) {
    this.database = database;
  }

  async save(dto: Pick<Participant, 'giveawayMessageId' | 'userId' | 'roleId'>): Promise<Participant> {
    const query = `
      INSERT INTO participants (giveaway_message_id, user_id, role_id)
      VALUES ($1, $2, $3)
      RETURNING *
    `;

    const result = await this.database.pool.query(query, [
      dto.giveawayMessageId, dto.userId, dto.roleId
    ]);

    return {
      giveawayMessageId: result.rows[0].giveaway_message_id,
      roleId: result.rows[0].role_id,
      userId: result.rows[0].user_id,
      createdAt: result.rows[0].created_at
    }
  }

  async getAll(giveawayMessageId: string): Promise<Participant[]> {
    const query = `
      SELECT * FROM participants
      WHERE giveaway_message_id = $1
    `;

    const result = await this.database.pool.query(query, [giveawayMessageId]);

    return result.rows.map(row => ({
      giveawayMessageId: row.giveaway_message_id,
      userId: row.user_id,
      roleId: row.role_id,
      createdAt: new Date(row.created_at),
    }));
  }

  async get(giveawayMessageId: string, userId: string): Promise<Participant | null> {
    const query = `
      SELECT * FROM participants
      WHERE giveaway_message_id = $1 AND user_id = $2
    `;

    const result = await this.database.pool.query(query, [giveawayMessageId, userId]);

    if (result.rows.length === 0) return null;

    return {
      giveawayMessageId: result.rows[0].giveaway_message_id,
      userId: result.rows[0].user_id,
      roleId: result.rows[0].role_id,
      createdAt: new Date(result.rows[0].created_at),
    };
  }

  async getCountsGroupByRole(giveawayMessageId: string): Promise<Record<string, number>> {
    const query = `
      SELECT role_id, COUNT(*) as count
      FROM participants
      WHERE giveaway_message_id = $1
      GROUP BY role_id
    `;
    
    const result = await this.database.pool.query(query, [giveawayMessageId]);
    const counts: Record<string, number> = {};
    
    result.rows.forEach(row => {
      counts[row.role_id] = parseInt(row.count);
    });

    return counts;
  }

  async delete(giveawayMessageId: string, userId: string): Promise<void> {
    const query = `
      DELETE FROM participants
      WHERE giveaway_message_id = $1 AND user_id = $2
    `;

    await this.database.pool.query(query, [giveawayMessageId, userId]);
  }
}