import { ButtonInteraction, GuildMember } from 'discord.js';
import { calculateProbability } from '../utils/probability';
import { createProbabilityEmbed } from '../components/embeds';
import { config, db } from '../singletons';

export async function handleJoinGiveaway(interaction: ButtonInteraction) {
  await db.beginTransaction();
  const member = interaction.member as GuildMember;

  const hasAllowedRole = member.roles.cache.some(role => 
    config.allowedRoles.includes(role.id)
  );

  if (!hasAllowedRole) {
    await interaction.reply({
      content: '❌ You do not have the required roles to join this giveaway.',
      ephemeral: true,
    });
    return;
  }

  const existingParticipant = await db.getParticipant(interaction.user.id);
  if (existingParticipant) {
    await interaction.reply({
      content: '✅ You are already registered in the giveaway!',
      ephemeral: true,
    });
    return;
  }

  const highestWeightRole = member.roles.cache
    .filter(role => config.roleWeights[role.id])
    .sort((a, b) => (config.roleWeights[b.id] || 0) - (config.roleWeights[a.id] || 0))
    .first();

  const roleId = highestWeightRole?.id || config.allowedRoles[0];

  const giveaway = await db.getGiveawayByMessageId(interaction.message.id);

  if (!giveaway) {
    await interaction.reply({
      content: '❌ Giveaway not found!',
      ephemeral: true,
    });
    return;
  }

  await db.addParticipant(giveaway.id, interaction.user.id, roleId);
  
  const participantRoles = await db.getParticipantCountByRole(giveaway.id);
  const probability = calculateProbability(roleId, participantRoles);

  await interaction.reply({
    content: `✅ You have successfully joined the giveaway!\n📊 Your probability is: ${(probability * 100).toFixed(3)}%`,
    ephemeral: true,
  });

  await db.commitTransaction();
}

export async function handleCheckProbability(interaction: ButtonInteraction) {
  await db.beginTransaction();
  const participant = await db.getParticipant(interaction.user.id);

  if (!participant) {
    await interaction.reply({
      content: '❌ You are not registered in the giveaway! Click "Join Giveaway" first.',
      ephemeral: true,
    });
    return;
  }

  const participantRoles = await db.getParticipantCountByRole(participant.giveawayId);
  const probability = calculateProbability(participant.roleId, participantRoles);

  const embed = createProbabilityEmbed(probability, participant.roleId, Object.values(participantRoles).reduce((a, b) => a + b, 0));

  await interaction.reply({
    embeds: [embed],
    ephemeral: true,
  });

  await db.commitTransaction();
}