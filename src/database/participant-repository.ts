import Connection from "./connection";
import { Giveaway, Participant, WeightedRolesGiveaway } from "../types";

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

  async getAllByUserIdAndGuild(userId: string, guildId: string): Promise<Participant[]> {
    const query = `
      SELECT p.*
      FROM participants p
      JOIN giveaways g ON p.giveaway_message_id = g.message_id
      WHERE p.user_id = $1 AND g.guild_id = $2
    `;
    const result = await this.database.pool.query(query, [userId, guildId]);
    return result.rows.map(row => ({
      giveawayMessageId: row.giveaway_message_id,
      userId: row.user_id,
      roleId: row.role_id,
      createdAt: new Date(row.created_at),
    }));
  }

  async getAllWithGiveawayByUserIdAndGuild(userId: string, guildId: string): Promise<(Participant & { giveaway: Giveaway | WeightedRolesGiveaway })[]> {
    const query = `
      SELECT 
        p.giveaway_message_id, p.user_id, p.role_id, p.created_at,
        g.message_id AS g_message_id, g.name, g.description, g.guild_id, g.ends_at, g.active_weighted_roles_config_id, g.created_at AS g_created_at,
        wr.guild_id AS wr_guild_id, wr.id AS wr_id, wr.role_id AS wr_role_id, wr.weight AS wr_weight, wr.weight_normalized AS wr_weight_normalized
      FROM participants p
      JOIN giveaways g ON p.giveaway_message_id = g.message_id
      LEFT JOIN guild_giveaway_weighted_roles wr ON wr.guild_id = g.guild_id AND wr.id = g.active_weighted_roles_config_id
      WHERE p.user_id = $1 AND g.guild_id = $2
    `;

    const result = await this.database.pool.query(query, [userId, guildId]);

    const map = new Map<string, Participant & { giveaway: Giveaway | WeightedRolesGiveaway }>();

    for (const row of result.rows) {
      const giveawayId = row.g_message_id;

      if (!map.has(giveawayId)) {
        const giveaway: Giveaway = {
          messageId: row.g_message_id,
          name: row.name,
          description: row.description,
          guildId: row.guild_id,
          endsAt: row.ends_at,
          activeWeightedRolesConfigId: row.active_weighted_roles_config_id,
          createdAt: new Date(row.g_created_at),
        };

        const participant: Participant = {
          giveawayMessageId: row.giveaway_message_id,
          userId: row.user_id,
          roleId: row.role_id,
          createdAt: new Date(row.created_at),
        };

        map.set(giveawayId, { ...participant, giveaway });
      }

      const entry = map.get(giveawayId)!;

      if (row.wr_id !== null) {
        if (!('weightedRoles' in entry.giveaway)) {
          (entry.giveaway as WeightedRolesGiveaway).weightedRoles = [];
        }
        (entry.giveaway as WeightedRolesGiveaway).weightedRoles.push({
          guildId: row.wr_guild_id,
          id: row.wr_id,
          roleId: row.wr_role_id,
          weight: row.wr_weight,
          weightNormalized: row.wr_weight_normalized,
        });
      }
    }

    return Array.from(map.values());
  }

  async update(giveawayMessageId: string, userId: string, roleId: string): Promise<void> {
    const query = `
      UPDATE participants
      SET role_id = $3
      WHERE giveaway_message_id = $1 AND user_id = $2
    `;
    await this.database.pool.query(query, [giveawayMessageId, userId, roleId]);
  }
}