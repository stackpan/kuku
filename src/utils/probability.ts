import { GuildGiveawayWeightedRole, Participant } from '../types';

export function calculateProbability(roleId: string, weightedRoles: GuildGiveawayWeightedRole[], participantCountByRole: Record<string, number>): { probability: number; weight: number; totalWeight: number } {
  const weights = weightedRoles.reduce((acc, wr) => {
    acc[wr.roleId] = wr.weightNormalized;
    return acc;
  }, {} as Record<string, number>);

  const weight = weights[roleId] || 0;
  
  let totalWeight = 0;
  
  Object.entries(participantCountByRole).forEach(([role, count]) => {
    totalWeight += (weights[role] || 0) * count;
  });
  
  return { probability: weight / totalWeight, weight, totalWeight };
}

export function selectWinner(weightedRoles: GuildGiveawayWeightedRole[], participants: Participant[]): Participant | null {
  if (participants.length === 0) return null;

  const weights = weightedRoles.reduce((acc, wr) => {
    acc[wr.roleId] = wr.weightNormalized;
    return acc;
  }, {} as Record<string, number>);
  
  const totalWeight = participants.reduce((sum, p) => {
    return sum + (weights[p.roleId] || 0);
  }, 0);

  let random = Math.random() * totalWeight;
  let cumulativeWeight = 0;

  for (const participant of participants) {
    const weight = weights[participant.roleId] || 0;
    cumulativeWeight += weight;
    if (random <= cumulativeWeight) {
      return participant;
    }
  }

  return participants[participants.length - 1];
}

export function normalizeWeights(roleWeights: Record<string, number>): Record<string, number> {
  let maxDecimalPlaces = 0;

  Object.values(roleWeights).forEach(weight => {
    const decimalPlaces = (weight.toString().split('.')[1] || '').length;
    maxDecimalPlaces = Math.max(maxDecimalPlaces, decimalPlaces);
  });

  const multiplier = Math.pow(10, maxDecimalPlaces);

  const normalizedWeights: Record<string, number> = {};
  Object.entries(roleWeights).forEach(([roleId, weight]) => {
    normalizedWeights[roleId] = Math.round(weight * multiplier);
  });

  return normalizedWeights;
}
