export interface Config {
  channelId: string;
  giveawayName: string;
  endDate: string;
  allowedRoles: string[];
  roleWeights: Record<string, number>;
}

export interface Participant {
  giveawayId: number;
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