import { Participant } from '../types';
import { config } from '../singletons';

export function calculateProbability(roleId: string, participantCountByRole: Record<string, number>): number {
  const weights = config.roleWeightsNormalized || config.roleWeights;
  const weight = weights[roleId] || 1;
  
  let totalWeight = 0;
  
  Object.entries(participantCountByRole).forEach(([role, count]) => {
    totalWeight += (weights[role] || 1) * count;
  });
  
  return (weight / totalWeight) * 100;
}

export function selectWinner(participants: Participant[]): Participant | null {
  if (participants.length === 0) return null;

  const weights = config.roleWeightsNormalized || config.roleWeights;
  const totalWeight = participants.reduce((sum, p) => {
    return sum + (weights[p.roleId] || 1);
  }, 0);

  let random = Math.random() * totalWeight;
  let cumulativeWeight = 0;

  for (const participant of participants) {
    const weight = weights[participant.roleId] || 1;
    cumulativeWeight += weight;
    if (random <= cumulativeWeight) {
      return participant;
    }
  }

  return participants[participants.length - 1];
}