import { EmbedBuilder } from "discord.js";

interface CreateJoinGiveawayEmbedParams {
  probability: number;
  roleId: string;
  roleWeight: number;
  totalParticipants: number;
}

export default function createJoinGiveawayEmbed({ probability, roleId, roleWeight, totalParticipants }: CreateJoinGiveawayEmbedParams): EmbedBuilder {
  return new EmbedBuilder()
    .setColor('#0099FF')
    .setTitle('✅ You have successfully joined the giveaway!')
    .setDescription(`
    📊 **Your winning probability in position #1:** \`${(probability * 100).toFixed(2)}%\`

    Role: <@&${roleId}>
    Weight (chance): ${roleWeight}×
    Total Participants: ${totalParticipants}
    `);
}