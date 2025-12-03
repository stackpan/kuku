import { GuildGiveawayWeightedRole } from "../types";
import Connection from "./connection";

export default class GuildGiveawayWeightedRoleRepository {
  private database: Connection;

  constructor(database: Connection) {
    this.database = database;
  }

  async getAll(guildId: string, id: number): Promise<GuildGiveawayWeightedRole[]> {
    const query = `
      SELECT * FROM guild_giveaway_weighted_roles
      WHERE guild_id = $1 AND id = $2
    `;

    const result = await this.database.pool.query(query, [guildId, id]);

    return result.rows.map(row => ({
      guildId: row.guild_id,
      id: row.id,
      roleId: row.role_id,
      weight: row.weight,
      weightNormalized: row.weight_normalized,
    }));
  }
}