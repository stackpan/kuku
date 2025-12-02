import { Config, Participant } from '../types';

export function calculateProbability(roleId: string, config: Config, allParticipants: Participant[]): number {
  const weight = config.roleWeights[roleId] || 1;
  const totalWeight = allParticipants.reduce((sum, p) => {
    return sum + (config.roleWeights[p.roleId] || 1);
  }, weight);
  
  return (weight / totalWeight) * 100;
}

export function selectWinner(participants: Participant[], config: Config): Participant | null {
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