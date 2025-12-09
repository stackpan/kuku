import { EmbedBuilder } from "discord.js";
import { ParticipantRequest } from "../../types";

interface CreateCheckProbabilityEmbedParams {
  probability: number;
  roleId: string | null;
  weight: number;
  totalParticipants: number;
  totalWeights: number;
  requests: Pick<ParticipantRequest, 'winAtPosition' | 'content'>[];
}

export default function createCheckProbabilityEmbed({ probability, roleId, weight, totalParticipants, totalWeights, requests }: CreateCheckProbabilityEmbedParams): EmbedBuilder {
  return new EmbedBuilder()
    .setColor('#00FFFF')
    .setTitle('📊 Probability Check')
    .setDescription(`
    1️⃣ **Your winning probability in position #1:** \`${(probability * 100).toFixed(2)}%\`

    Your Role: ${roleId ? `<@&${roleId}>` : 'Regular Member'}
    Your Weight: ${weight}
    Total Weights: ${totalWeights}
    Total Participants: ${totalParticipants}
    `)
    .addFields([
      {
        name: 'Your Wishes',
        value: requests.map(request => `**#${request.winAtPosition}:** ${request.content}`).join('\n'),
        inline: false,
      }
    ])
}