import createJoinGiveawayEmbed from '../../components/embeds/join-giveaway';
import { ButtonInteraction, GuildMember } from 'discord.js';
import { calculateProbability } from '../../utils/probability';
import { connection, giveawayRepository, participantRepository } from '../../singletons';
import { WeightedRolesGiveaway } from '../../types';
import joinGiveawayModal from '../../components/modals/join-giveaway';

export default async function handleJoinGiveaway(interaction: ButtonInteraction) {
  const member = interaction.member as GuildMember;
  const exists = await participantRepository.isExists(interaction.message.id, interaction.user.id);

  if (exists) {
    await interaction.reply({
      content: '✅ You are already registered in the giveaway!',
      flags: 'Ephemeral',
    });
    return;
  }

  const giveaway = await giveawayRepository.get(interaction.message.id) as WeightedRolesGiveaway;

  if (!giveaway) {
    await interaction.reply({
      content: '❌ Giveaway not found!',
      flags: 'Ephemeral',
    });
    return;
  }

  const now = new Date();

  if (giveaway.endsAt < now) {
    await interaction.reply({
      content: '❌ This giveaway has ended!',
      flags: 'Ephemeral',
    });
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

  await interaction.showModal(joinGiveawayModal);

  let modalSubmit;
  try {
    modalSubmit = await interaction.awaitModalSubmit({
      filter: (i) => i.customId === 'joinGiveawayModal',
      time: 60000,
    });
  } catch (error) {
    await interaction.followUp({
      content: '❌ You took too long to fill the form!',
      flags: 'Ephemeral',
    });
    return;
  }

  await modalSubmit.deferReply({ flags: 'Ephemeral' });
  await connection.beginTransaction();

  const highestWeightRole = member.roles.cache
    .filter(role => giveaway.weightedRoles.some(wr => wr.roleId === role.id))
    .sort((a, b) => (giveaway.weightedRoles.find(wr => wr.roleId === b.id)?.weight || 0) - (giveaway.weightedRoles.find(wr => wr.roleId === a.id)?.weight || 0))
    .first();

  const roleId = highestWeightRole?.id!;

  const requests = [
    {
      winAtPosition: 1,
      content: modalSubmit.fields.getTextInputValue('winnerRequestInput1'),
    },
    {
      winAtPosition: 2,
      content: modalSubmit.fields.getTextInputValue('winnerRequestInput2'),
    },
    {
      winAtPosition: 3,
      content: modalSubmit.fields.getTextInputValue('winnerRequestInput3'),
    },
    {
      winAtPosition: 4,
      content: modalSubmit.fields.getTextInputValue('winnerRequestInput4'),
    },
  ];

  await participantRepository.save({
    giveawayMessageId: giveaway.messageId,
    userId: interaction.user.id,
    roleId: roleId,
    requests,
  });

  const participantRoles = await participantRepository.getCountsGroupByRole(giveaway.messageId);
  const { probability, weight, totalWeight } = calculateProbability(roleId, giveaway.weightedRoles, participantRoles);

  const embed = createJoinGiveawayEmbed({
    probability,
    roleId,
    weight,
    totalParticipants: Object.values(participantRoles).reduce((a, b) => a + b, 0),
    totalWeights: totalWeight,
    requests,
  });

  await modalSubmit.editReply({
    embeds: [embed],
  });

  await connection.commitTransaction();
}