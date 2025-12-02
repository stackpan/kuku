import { Participant } from '../types';
import { config } from '../singletons';

export function calculateProbability(roleId: string, participantCountByRole: Record<string, number> | Participant[]): number {
  const weight = config.roleWeights[roleId] || 1;
  
  let totalWeight = 0;
  
  Object.entries(participantCountByRole).forEach(([role, count]) => {
    totalWeight += (config.roleWeights[role] || 1) * count;
  });
  
  return (weight / totalWeight);
}

export function selectWinner(participants: Participant[]): Participant | null {
  if (participants.length === 0) return null;

  const totalWeight = participants.reduce((sum, p) => {
    return sum + (config.roleWeights[p.roleId] || 1);
  }, 0);

  let random = Math.random() * totalWeight;

  for (const participant of participants) {
    const weight = config.roleWeights[participant.roleId] || 1;
    random -= weight;
    if (random <= 0) {
      return participant;
    }
  }

  return participants[participants.length - 1];
}