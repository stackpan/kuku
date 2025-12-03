import createCheckProbabilityEmbed from '../../components/embeds/check-probability';
import { ButtonInteraction } from 'discord.js';
import { calculateProbability } from '../../utils/probability';
import { connection, giveawayRepository, participantRepository } from '../../singletons';
import { WeightedRolesGiveaway } from '../../types';

export default async function handleCheckProbability(interaction: ButtonInteraction) {
  const participant = await participantRepository.get(interaction.message.id, interaction.user.id);
  const giveaway = await giveawayRepository.get(interaction.message.id) as WeightedRolesGiveaway;

  if (!participant) {
    await interaction.reply({
      content: '❌ You are not registered in the giveaway! Click "Join Giveaway" first.',
      flags: 'Ephemeral',
    });
    await connection.rollbackTransaction();
    return;
  }

  const now = new Date();

  if (!giveaway || giveaway.endsAt < now) {
    await interaction.reply({
      content: '❌ This giveaway has ended!',
      flags: 'Ephemeral',
    });
    await connection.rollbackTransaction();
    return;
  }

  const participantRoles = await participantRepository.getCountsGroupByRole(giveaway.messageId);
  const probability = calculateProbability(participant.roleId, giveaway.weightedRoles, participantRoles);

  const embed = createCheckProbabilityEmbed({
    probability,
    roleId: participant.roleId,
    roleWeight: giveaway.weightedRoles.find(wr => wr.roleId === participant.roleId)?.weight || 0,
    totalParticipants: Object.values(participantRoles).reduce((a, b) => a + b, 0),
  });

  await interaction.reply({
    embeds: [embed],
    flags: 'Ephemeral',
  });
}