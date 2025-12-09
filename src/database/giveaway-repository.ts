import Connection from "./connection";
import { Giveaway, WeightedRolesGiveaway } from "../types";
import moment from 'moment';

export default class GiveawayRepository {
  private database: Connection;

  constructor(database: Connection) {
    this.database = database;
  }

  async save(dto: Pick<Giveaway, 'messageId' | 'name' | 'description' | 'guildId' | 'channelId' | 'endsAt' | 'hostedBy' | 'winnerCount' | 'activeWeightedRolesConfigId'>): Promise<Giveaway> {
    const query = `
      INSERT INTO giveaways (message_id, name, description, guild_id, channel_id, ends_at, hosted_by, winner_count, active_weighted_roles_config_id)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await this.database.pool.query(query, [
      dto.messageId,
      dto.name,
      dto.description,
      dto.guildId,
      dto.channelId,
      dto.endsAt.toISOString(),
      dto.hostedBy,
      dto.winnerCount,
      dto.activeWeightedRolesConfigId,
    ]);

    return {
      messageId: result.rows[0].message_id,
      name: result.rows[0].name,
      description: result.rows[0].description,
      guildId: result.rows[0].guild_id,
      channelId: result.rows[0].channel_id,
      endsAt: moment.utc(moment(result.rows[0].ends_at).format('YYYY-MM-DD HH:mm:ss')).toDate(),
      hostedBy: result.rows[0].hosted_by,
      winnerCount: result.rows[0].winner_count,
      activeWeightedRolesConfigId: result.rows[0].active_weighted_roles_config_id,
      createdAt: new Date(result.rows[0].created_at),
    }
  }

  async get(messageId: string): Promise<Giveaway | WeightedRolesGiveaway | null> {
    const query = `
      SELECT 
        g.*,
        wr.guild_id AS wr_guild_id,
        wr.id AS wr_id,
        wr.role_id AS wr_role_id,
        wr.weight AS wr_weight,
        wr.weight_normalized AS wr_weight_normalized
      FROM giveaways g
      LEFT JOIN guild_giveaway_weighted_roles wr
        ON wr.guild_id = g.guild_id
        AND wr.id = g.active_weighted_roles_config_id
      WHERE g.message_id = $1
    `;

    const result = await this.database.pool.query(query, [messageId]);

    if (result.rows.length === 0) return null;

    const first = result.rows[0];

    const giveaway: Giveaway = {
      messageId: first.message_id,
      name: first.name,
      description: first.description,
      guildId: first.guild_id,
      channelId: first.channel_id,
      endsAt: moment.utc(moment(first.ends_at).format('YYYY-MM-DD HH:mm:ss')).toDate(),
      hostedBy: first.hosted_by,
      winnerCount: first.winner_count,
      activeWeightedRolesConfigId: first.active_weighted_roles_config_id,
      createdAt: new Date(first.created_at),
    };

    if (giveaway.activeWeightedRolesConfigId) {
      (giveaway as WeightedRolesGiveaway).weightedRoles = result.rows
        .filter(row => row.wr_id !== null)
        .map(row => ({
          guildId: row.wr_guild_id,
          id: row.wr_id,
          roleId: row.wr_role_id,
          weight: row.wr_weight,
          weightNormalized: row.wr_weight_normalized,
        }));
    }

    return giveaway;
  }

  async getAll(): Promise<(Giveaway | WeightedRolesGiveaway)[]> {
    const query = `
      SELECT 
        g.*,
        wr.guild_id AS wr_guild_id,
        wr.id AS wr_id,
        wr.role_id AS wr_role_id,
        wr.weight AS wr_weight,
        wr.weight_normalized AS wr_weight_normalized
      FROM giveaways g
      LEFT JOIN guild_giveaway_weighted_roles wr
        ON wr.guild_id = g.guild_id
        AND wr.id = g.active_weighted_roles_config_id
    `;

    const result = await this.database.pool.query(query);
    const map = new Map<string, Giveaway | WeightedRolesGiveaway>();

    for (const row of result.rows) {
      if (!map.has(row.message_id)) {
        const giveaway: Giveaway = {
          messageId: row.message_id,
          name: row.name,
          description: row.description,
          guildId: row.guild_id,
          channelId: row.channel_id,
          hostedBy: row.hosted_by,
          endsAt: moment.utc(moment(row.ends_at).format('YYYY-MM-DD HH:mm:ss')).toDate(),
          winnerCount: row.winner_count,
          activeWeightedRolesConfigId: row.active_weighted_roles_config_id,
          createdAt: new Date(row.created_at),
        };
        map.set(row.message_id, giveaway);
      }

      const giveaway = map.get(row.message_id)!;
      if (row.wr_id !== null) {
        if (!('weightedRoles' in giveaway)) {
          (giveaway as WeightedRolesGiveaway).weightedRoles = [];
        }
        (giveaway as WeightedRolesGiveaway).weightedRoles.push({
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

  async delete(messageId: string): Promise<void> {
    const query = `DELETE FROM giveaways WHERE message_id = $1`;
    await this.database.pool.query(query, [messageId]);
  }
}