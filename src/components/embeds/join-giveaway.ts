import { EmbedBuilder } from "discord.js";

interface CreateJoinGiveawayEmbedParams {
  probability: number;
  roleId: string | null;
  weight: number;
  totalParticipants: number;
  totalWeights: number;
}

export default function createJoinGiveawayEmbed({ probability, roleId, weight, totalParticipants, totalWeights }: CreateJoinGiveawayEmbedParams): EmbedBuilder {
  return new EmbedBuilder()
    .setColor('#0099FF')
    .setTitle('✅ You have successfully joined the giveaway!')
    .setDescription(`
    1️⃣ **Your winning probability in position #1:** \`${(probability * 100).toFixed(2)}%\`

    Your Role: ${roleId ? `<@&${roleId}>` : 'Regular Member'}
    Your Weight: ${weight}
    Total Weights: ${totalWeights}
    Total Participants: ${totalParticipants}
    `);
}