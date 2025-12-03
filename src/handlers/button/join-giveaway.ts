import createJoinGiveawayEmbed from '../../components/embeds/join-giveaway';
import { ButtonInteraction, GuildMember } from 'discord.js';
import { calculateProbability } from '../../utils/probability';
import { connection, giveawayRepository, participantRepository } from '../../singletons';
import { WeightedRolesGiveaway } from '../../types';

export default async function handleJoinGiveaway(interaction: ButtonInteraction) {
  await connection.beginTransaction();
  
  const member = interaction.member as GuildMember;
  const giveaway = await giveawayRepository.get(interaction.message.id) as WeightedRolesGiveaway;

  if (!giveaway) {
    await interaction.reply({
      content: '❌ Giveaway not found!',
      flags: 'Ephemeral',
    });
    await connection.rollbackTransaction();
    return;
  }

  const hasAllowedRole = member.roles.cache.some(role => 
    giveaway.weightedRoles.some(wr => wr.roleId === role.id)
  );

  if (!hasAllowedRole) {
    await interaction.reply({
      content: '❌ You do not have the required roles to join this giveaway.',
      flags: 'Ephemeral',
    });
    await connection.rollbackTransaction();
    return;
  }

  const participant = await participantRepository.get(interaction.message.id, interaction.user.id);
  
  if (participant) {
    await interaction.reply({
      content: '✅ You are already registered in the giveaway!',
      flags: 'Ephemeral',
    });
    await connection.rollbackTransaction();
    return;
  }

  const highestWeightRole = member.roles.cache
    .filter(role => giveaway.weightedRoles.some(wr => wr.roleId === role.id))
    .sort((a, b) => (giveaway.weightedRoles.find(wr => wr.roleId === b.id)?.weight || 0) - (giveaway.weightedRoles.find(wr => wr.roleId === a.id)?.weight || 0))
    .first();

  const roleId = highestWeightRole?.id || giveaway.weightedRoles[0].roleId;

  const now = new Date();

  if (giveaway.endsAt < now) {
    await interaction.reply({
      content: '❌ This giveaway has ended!',
      flags: 'Ephemeral',
    });
    await connection.rollbackTransaction();
    return;
  }

  await participantRepository.save({
    giveawayMessageId: giveaway.messageId,
    userId: interaction.user.id,
    roleId: roleId,
  });
  
  const participantRoles = await participantRepository.getCountsGroupByRole(giveaway.messageId);
  const { probability, weight, totalWeight } = calculateProbability(roleId, giveaway.weightedRoles, participantRoles);

  const embed = createJoinGiveawayEmbed({
    probability,
    roleId,
    weight,
    totalParticipants: Object.values(participantRoles).reduce((a, b) => a + b, 0),
    totalWeights: totalWeight,
  });

  await interaction.reply({
    embeds: [embed],
    flags: 'Ephemeral',
  });

  await connection.commitTransaction();
}