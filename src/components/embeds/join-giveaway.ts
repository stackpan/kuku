import { EmbedBuilder } from "discord.js";
import { ParticipantRequest } from "../../types";

interface CreateJoinGiveawayEmbedParams {
  probability: number;
  roleId: string;
  weight: number;
  totalParticipants: number;
  totalWeights: number;
  requests: Pick<ParticipantRequest, 'winAtPosition' | 'content'>[];
}

export default function createJoinGiveawayEmbed({ probability, roleId, weight, totalParticipants, totalWeights, requests }: CreateJoinGiveawayEmbedParams): EmbedBuilder {
  return new EmbedBuilder()
    .setColor('#0099FF')
    .setTitle('✅ You have successfully joined the giveaway!')
    .setDescription(`
    1️⃣ **Your winning probability in position #1:** \`${(probability * 100).toFixed(2)}%\`

    Your Role: <@&${roleId}>
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