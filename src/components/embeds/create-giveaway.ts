import { EmbedBuilder } from "discord.js";
import { GuildGiveawayWeightedRole } from "../../types";

interface CreateGiveawayEmbedParams {
  name: string;
  description: string;
  endsAt: Date;
  winnerCount: number;
  roles: GuildGiveawayWeightedRole[];
}

export default function createGiveawayEmbed({ name, description, endsAt, winnerCount, roles }: CreateGiveawayEmbedParams): EmbedBuilder {
  return new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle(`🎉 ${name}`)
    .setDescription(description)
    .addFields(
      {
        name: '✅ Required Roles',
        value: roles
          .map(role => `- <@&${role.roleId}> (${role.weight}× win chance)`)
          .join('\n'),
        inline: false,
      },
      {
        name: '🏆 Winners',
        value: `${winnerCount}`,
        inline: false,
      },
      {
        name: '⏰ Ends At',
        value: `<t:${Math.floor(new Date(endsAt).getTime() / 1000)}:F>`,
        inline: false,
      }
    )
    .setFooter({
      text: 'Press "Join Giveaway" buttons to participate!'
    });
}