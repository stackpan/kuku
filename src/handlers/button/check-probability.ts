import createCheckProbabilityEmbed from '../../components/embeds/check-probability';
import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle } from 'discord.js';
import { calculateProbability } from '../../utils/probability';
import { connection, giveawayRepository, participantRepository } from '../../singletons';
import { WeightedRolesGiveaway } from '../../types';

export default async function handleCheckProbability(interaction: ButtonInteraction) {
  await interaction.deferReply({ flags: 'Ephemeral' });

  const participant = await participantRepository.get(interaction.message.id, interaction.user.id);
  const giveaway = await giveawayRepository.get(interaction.message.id) as WeightedRolesGiveaway;

  if (!participant) {
    await interaction.editReply({
      content: '❌ You are not registered in the giveaway! Click "Join Giveaway" first.',
    });
    return;
  }

  const now = new Date();

  if (!giveaway || giveaway.endsAt < now) {
    await interaction.editReply({
      content: '❌ This giveaway has ended!',
    });
    return;
  }

  const participantRoles = await participantRepository.getCountsGroupByRole(giveaway.messageId);
  const { probability, weight, totalWeight } = calculateProbability(participant.roleId, giveaway.weightedRoles, participantRoles);

  const embed = createCheckProbabilityEmbed({
    probability,
    roleId: participant.roleId,
    weight,
    totalParticipants: Object.values(participantRoles).reduce((a, b) => a + b, 0),
    totalWeights: totalWeight,
    requests: participant.requests,
  });

  await interaction.editReply({
    embeds: [embed],
    components: [
      new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`leaveGiveaway:${giveaway.messageId}`)
            .setLabel('Leave Giveaway')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('🏃')
        ),
    ]
  });
}