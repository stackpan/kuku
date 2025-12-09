import { ColorResolvable, EmbedBuilder } from "discord.js";

interface CreateWinnerEmbedParams {
  number: number;
  winnerId: string;
  winnerUsername: string;
  winnerRoleId: string;
  winnerGuildAvatarUrl: string | null;
  color: ColorResolvable;
  winnerRequest: string;
}

export default function createWinnerEmbed({ number, winnerId, winnerUsername, winnerRoleId, winnerGuildAvatarUrl, color, winnerRequest }: CreateWinnerEmbedParams): EmbedBuilder {
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
        value: `<@&${winnerRoleId}>`,
        inline: false
      },
      {
        name: 'Wish',
        value: winnerRequest,
        inline: false
      }
    ]);
}