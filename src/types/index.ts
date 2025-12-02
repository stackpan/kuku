export interface Config {
  channelId: string;
  giveawayName: string;
  endDate: string;
  allowedRoles: string[];
  roleWeights: Record<string, number>;
}

export interface Participant {
  userId: string;
  roleId: string;
  probability: number;
}

export interface GiveawayData {
  messageId: string;
  participants: Participant[];
}