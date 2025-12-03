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
    📊 Your probability is: ${(probability * 100).toFixed(3)}%

    Role: <@&${roleId}>
    Weight (chance): ${roleWeight}×
    Total Participants: ${totalParticipants}
    `);
}