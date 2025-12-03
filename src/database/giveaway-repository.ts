import Connection from "./connection";
import { Giveaway, WeightedRolesGiveaway } from "../types";

export default class GiveawayRepository {
  private database: Connection;

  constructor(database: Connection) {
    this.database = database;
  }

  async save(dto: Pick<Giveaway, 'messageId' | 'name' | 'description' | 'guildId' | 'endsAt' | 'activeWeightedRolesConfigId'>): Promise<Giveaway> {
    const query = `
      INSERT INTO giveaways (message_id, name, description, guild_id, ends_at, active_weighted_roles_config_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const result = await this.database.pool.query(query, [
      dto.messageId,
      dto.name,
      dto.description,
      dto.guildId,
      dto.endsAt,
      dto.activeWeightedRolesConfigId,
    ]);

    return {
      messageId: result.rows[0].message_id,
      name: result.rows[0].name,
      description: result.rows[0].description,
      guildId: result.rows[0].guild_id,
      endsAt: result.rows[0].ends_at,
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
      endsAt: first.ends_at,
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
}