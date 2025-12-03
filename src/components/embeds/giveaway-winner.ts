import { EmbedBuilder } from "discord.js";

interface CreateWinnerEmbedParams {
  winnerIds: string[];
  giveawayName: string;
}

export default function createWinnerEmbed({ winnerIds, giveawayName }: CreateWinnerEmbedParams): EmbedBuilder {
  const winnersList = winnerIds.map(id => `<@${id}>`).join(', ');

  return new EmbedBuilder()
    .setColor('#00FF00')
    .setTitle('🎊 Giveaway Winner!')
    .setDescription(
      `**${giveawayName}**\n\n` +
      `Congratulations to ${winnersList}! 🎉`
    );
}