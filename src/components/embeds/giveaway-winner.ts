import { EmbedBuilder } from "discord.js";

interface CreateWinnerEmbedParams {
  userId: string;
  userAvatar: string | null;
  giveawayName: string;
}

export default function createWinnerEmbed({ userId, userAvatar, giveawayName }: CreateWinnerEmbedParams): EmbedBuilder {
  return new EmbedBuilder()
    .setColor('#00FF00')
    .setTitle('🎊 Giveaway Winner!')
    .setThumbnail(userAvatar)
    .setDescription(
      `**${giveawayName}**\n\n` +
      `Congratulations to <@${userId}>! 🎉`
    );
}