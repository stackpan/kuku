import { EmbedBuilder } from "discord.js";

interface CreateProbabilityEmbedParams {
  probability: number;
  roleId: string;
  roleWeight: number;
  totalParticipants: number;
}

export default function createProbabilityEmbed({ probability, roleId, roleWeight, totalParticipants }: CreateProbabilityEmbedParams): EmbedBuilder {
  return new EmbedBuilder()
    .setColor('#00FFFF')
    .setTitle('📊 Your Winning Probability')
    .setDescription(
      `
      **Probability: ${(probability * 100).toFixed(2)}%**

      Role: <@&${roleId}>
      Weight (chance): ${roleWeight}×
      Total Participants: ${totalParticipants}
      `
    );
}