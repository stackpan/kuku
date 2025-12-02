export interface Config {
  channelId: string;
  giveawayName: string;
  giveawayDescription: string;
  endDate: string;
  allowedRoles: string[];
  roleWeights: Record<string, number>;
  roleWeightsNormalized?: Record<string, number>;
}

export interface Participant {
  giveawayId: string;
  userId: string;
  roleId: string;
  createdAt: Date;
}

export interface GiveawayData {
  id: string;
  messageId: string;
  isActive: boolean;
  createdAt: Date;
}