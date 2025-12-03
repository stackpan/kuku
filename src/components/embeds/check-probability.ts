import { EmbedBuilder } from "discord.js";

interface CreateCheckProbabilityEmbedParams {
  probability: number;
  roleId: string;
  roleWeight: number;
  totalParticipants: number;
}

export default function createCheckProbabilityEmbed({ probability, roleId, roleWeight, totalParticipants }: CreateCheckProbabilityEmbedParams): EmbedBuilder {
  return new EmbedBuilder()
    .setColor('#00FFFF')
    .setTitle('📊 Probability Check')
    .setDescription(`
    📊 **Your winning probability in position #1:** \`${(probability * 100).toFixed(2)}%\`

    Role: <@&${roleId}>
    Weight (chance): ${roleWeight}×
    Total Participants: ${totalParticipants}
    `);
}