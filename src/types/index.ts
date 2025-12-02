export interface Config {
  channelId: string;
  giveawayName: string;
  endDate: string;
  allowedRoles: string[];
  roleWeights: Record<string, number>;
}

export interface Participant {
  giveawayId: string;
  userId: string;
  roleId: string;
  probabilityCached: number | null;
  createdAt: Date;
}

export interface GiveawayData {
  id: string;
  messageId: string;
  isActive: boolean;
  createdAt: Date;
}