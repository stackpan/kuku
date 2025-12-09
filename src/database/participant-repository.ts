import Connection from "./connection";
import { Giveaway, Participant, ParticipantRequest, ParticipantWithRequest, WeightedRolesGiveaway } from "../types";
import { randomUUID } from "crypto";

interface SaveParticipantDto {
  giveawayMessageId: string;
  userId: string;
  roleId: string | null;
  requests: Pick<ParticipantRequest, 'winAtPosition' | 'content'>[];
}

export default class ParticipantRepository {
  private database: Connection;

  constructor(database: Connection) {
    this.database = database;
  }

  async save(dto: SaveParticipantDto): Promise<Participant> {
    const query = `
      INSERT INTO participants (id, giveaway_message_id, user_id, role_id)
      VALUES ($1, $2, $3, $4)
      RETURNING *
    `;

    const result = await this.database.pool.query(query, [
      randomUUID(), dto.giveawayMessageId, dto.userId, dto.roleId
    ]);

    if (dto.requests.length > 0) {
      const participantId = result.rows[0].id;
      const values: any[] = [];
      const placeholders: string[] = [];

      dto.requests.forEach((request, index) => {
        const i = index * 3;
        placeholders.push(`($${i + 1}, $${i + 2}, $${i + 3})`);
        values.push(participantId, request.winAtPosition, request.content);
      });

      const participantRequestQuery = `
        INSERT INTO participant_requests (participant_id, win_at_position, content)
        VALUES ${placeholders.join(', ')}
      `;

      await this.database.pool.query(participantRequestQuery, values);
    }

    const participant = {
      id: result.rows[0].id,
      giveawayMessageId: result.rows[0].giveaway_message_id,
      roleId: result.rows[0].role_id,
      userId: result.rows[0].user_id,
      createdAt: result.rows[0].created_at,
    }

    return participant;
  }

  async getAll(giveawayMessageId: string): Promise<ParticipantWithRequest[]> {
    const query = `
      SELECT p.*, pr.win_at_position, pr.content
      FROM participants p
      JOIN participant_requests pr ON p.id = pr.participant_id
      WHERE p.giveaway_message_id = $1
    `;

    const result = await this.database.pool.query(query, [giveawayMessageId]);

    return result.rows.map(row => ({
      id: row.id,
      giveawayMessageId: row.giveaway_message_id,
      userId: row.user_id,
      roleId: row.role_id,
      createdAt: new Date(row.created_at),
      requests: result.rows.map(row => ({
        participantId: row.id,
        winAtPosition: row.win_at_position,
        content: row.content,
      })),
    }));
  }

  async get(giveawayMessageId: string, userId: string): Promise<ParticipantWithRequest | null> {
    const query = `
      SELECT p.*, pr.win_at_position, pr.content
      FROM participants p
      JOIN participant_requests pr ON p.id = pr.participant_id
      WHERE p.giveaway_message_id = $1 AND p.user_id = $2
    `;

    const result = await this.database.pool.query(query, [giveawayMessageId, userId]);

    if (result.rows.length === 0) return null;

    return {
      id: result.rows[0].id,
      giveawayMessageId: result.rows[0].giveaway_message_id,
      userId: result.rows[0].user_id,
      roleId: result.rows[0].role_id,
      createdAt: new Date(result.rows[0].created_at),
      requests: result.rows.map(row => ({
        participantId: row.id,
        winAtPosition: row.win_at_position,
        content: row.content,
      })),
    };
  }

  async isExists(giveawayMessageId: string, userId: string): Promise<boolean> {
    const query = `
      SELECT 1 FROM participants
      WHERE giveaway_message_id = $1 AND user_id = $2
    `;

    const result = await this.database.pool.query(query, [giveawayMessageId, userId]);

    return result.rows.length > 0;
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

  async delete(giveawayMessageId: string, userId: string): Promise<boolean> {
    const query = `
      DELETE FROM participants
      WHERE giveaway_message_id = $1 AND user_id = $2
    `;

    const result = await this.database.pool.query(query, [giveawayMessageId, userId]);

    return (result.rowCount ?? 0) > 0;
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
      id: row.id,
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
        g.message_id AS g_message_id, g.name, g.description, g.guild_id, g.channel_id, g.ends_at, g.winner_count, g.active_weighted_roles_config_id, g.created_at AS g_created_at,
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
          channelId: row.channel_id,
          endsAt: row.ends_at,
          hostedBy: row.hosted_by,
          winnerCount: row.winner_count,
          activeWeightedRolesConfigId: row.active_weighted_roles_config_id,
          createdAt: new Date(row.g_created_at),
        };

        const participant: Participant = {
          id: row.id,
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

  async deleteByUserIdAndGuild(userId: string, guildId: string): Promise<boolean> {
    const query = `
      DELETE FROM participants p
      USING giveaways g
      WHERE p.giveaway_message_id = g.message_id
      AND p.user_id = $1
      AND g.guild_id = $2
    `;

    const result = await this.database.pool.query(query, [userId, guildId]);
    return (result.rowCount ?? 0) > 0;
  }

  async count(giveawayMessageId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM participants
      WHERE giveaway_message_id = $1
      `;

    const result = await this.database.pool.query(query, [giveawayMessageId]);
    return parseInt(result.rows[0].count);
  }

  async getWithPagination(giveawayMessageId: string, page: number, limit: number): Promise<Pick<Participant, 'id' | 'userId'>[]> {
    const offset = (page - 1) * limit;
    const query = `
      SELECT id, user_id FROM participants
      WHERE giveaway_message_id = $1
      ORDER BY created_at ASC
      LIMIT $2 OFFSET $3
      `;

    const result = await this.database.pool.query(query, [giveawayMessageId, limit, offset]);

    return result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
    }));
  }
}