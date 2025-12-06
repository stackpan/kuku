export interface Giveaway {
  messageId: string;
  name: string;
  description: string;
  guildId: string;
  channelId: string;
  endsAt: Date;
  winnerCount: number;
  hostedBy: string;
  activeWeightedRolesConfigId: number | null;
  createdAt: Date;
}

export interface GuildGiveawayWeightedRole {
  guildId: string;
  id: number;
  roleId: string;
  weight: number;
  weightNormalized: number;
}

export interface Participant {
  giveawayMessageId: string;
  userId: string;
  roleId: string | null;
  createdAt: Date;
}

export interface WeightedRolesGiveaway extends Giveaway {
  weightedRoles: GuildGiveawayWeightedRole[];
}