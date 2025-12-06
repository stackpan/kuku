import { ColorResolvable, EmbedBuilder } from "discord.js";

interface CreateWinnerEmbedParams {
  number: number;
  winnerId: string;
  winnerUsername: string;
  winnerRoleId: string | null;
  winnerGuildAvatarUrl: string | null;
  color: ColorResolvable;
}

export default function createWinnerEmbed({ number, winnerId, winnerUsername, winnerRoleId, winnerGuildAvatarUrl, color }: CreateWinnerEmbedParams): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(`#${number} Giveaway Winner!`)
    .setDescription(`<@${winnerId}>`)
    .setThumbnail(winnerGuildAvatarUrl)
    .setFields([
      {
        name: 'Username',
        value: winnerUsername,
        inline: false
      },
      {
        name: 'Role',
        value: winnerRoleId ? `<@&${winnerRoleId}>` : 'Regular Member',
        inline: false
      }
    ]);
}