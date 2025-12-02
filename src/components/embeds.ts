import { EmbedBuilder } from 'discord.js';
import { config } from '../singletons';

export function createGiveawayEmbed(): EmbedBuilder {
  const allowedRolesInfo = config.allowedRoles
    .map(roleId => `<@&${roleId}>`)
    .join('\n');

  return new EmbedBuilder()
    .setColor('#FFD700')
    .setTitle(`🎉 ${config.giveawayName}`)
    .setDescription(config.giveawayDescription)
    .addFields(
      {
        name: '✅ Required Roles',
        value: config.allowedRoles
          .map(roleId => `- <@&${roleId}>: (${config.roleWeights[roleId]}× win chance)`)
          .join('\n'),
        inline: false,
      },
      {
        name: '⏰ Ends At',
        value: `<t:${Math.floor(new Date(config.endDate).getTime() / 1000)}:F>`,
        inline: false,
      }
    )
    .setFooter({
      text: 'Press "Join Giveaway" buttons to participate!'
    });
}

export function createProbabilityEmbed(probability: number, roleId: string, totalParticipants: number): EmbedBuilder {
  return new EmbedBuilder()
    .setColor('#00FFFF')
    .setTitle('📊 Your Winning Probability')
    .setDescription(
      `
      **Probability: ${(probability * 100).toFixed(3)}%**\n\n
      Chance: ${config.roleWeights[roleId]} (<@&${roleId}>)×\n
      Total Participants: ${totalParticipants}
      `
    )
    .setTimestamp();
}

export function createWinnerEmbed(winnerId: string, giveawayName: string): EmbedBuilder {
  return new EmbedBuilder()
    .setColor('#00FF00')
    .setTitle('🎊 Giveaway Winner!')
    .setDescription(
      `**${giveawayName}**\n\n` +
      `Congratulations to <@${winnerId}>! 🎉`
    )
    .setTimestamp();
}