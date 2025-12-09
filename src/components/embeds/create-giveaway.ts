import { EmbedBuilder } from "discord.js";
import moment from 'moment';
import { GuildGiveawayWeightedRole } from "../../types";

interface CreateGiveawayEmbedParams {
  name: string;
  description: string;
  hostedBy: string;
  endsAt: Date;
  winnerCount: number;
  roles: GuildGiveawayWeightedRole[];
}

export default function createGiveawayEmbed({ name, description, hostedBy, endsAt, winnerCount, roles }: CreateGiveawayEmbedParams): EmbedBuilder {
  return new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle(name)
    .setDescription(description)
    .addFields(
      {
        name: '👑 Hosted By',
        value: hostedBy,
        inline: true,
      },
      {
        name: '🏆 Winner Count',
        value: `${winnerCount}`,
        inline: true,
      },
      {
        name: '⏰ Ends At',
        value: `<t:${moment(endsAt).unix()}:F>`,
        inline: false,
      },
      {
        name: '✅ Required Roles',
        value: roles
          .map(role => `- <@&${role.roleId}> (${role.weight}× win chance)`)
          .join('\n'),
        inline: false,
      },
    )
    .setFooter({
      text: 'Press "Join Giveaway" buttons to participate!'
    });
}