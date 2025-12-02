import { ButtonInteraction, GuildMember } from 'discord.js';
import { calculateProbability } from '../utils/probability';
import { createProbabilityEmbed } from '../utils/embeds';
import { config, db } from '../singletons';

export async function handleJoinGiveaway(interaction: ButtonInteraction) {
  await db.beginTransaction();
  const member = interaction.member as GuildMember;

  const hasAllowedRole = member.roles.cache.some(role => 
    config.allowedRoles.includes(role.id)
  );

  if (!hasAllowedRole) {
    await interaction.reply({
      content: '❌ Anda tidak memiliki role yang diperlukan untuk ikut giveaway ini!',
      ephemeral: true,
    });
    return;
  }

  const existingParticipant = await db.getParticipant(interaction.user.id);
  if (existingParticipant) {
    await interaction.reply({
      content: '✅ Anda sudah terdaftar dalam giveaway!',
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
      content: '❌ Giveaway tidak ditemukan!',
      ephemeral: true,
    });
    return;
  }

  await db.clearParticipantProbabilityCache(giveaway.id);
  await db.addParticipant(giveaway.id, interaction.user.id, roleId);

  const allParticipants = await db.getAllParticipants();
  const probability = calculateProbability(roleId, allParticipants);

  await db.updateParticipantProbabilityCache(giveaway.id, roleId, probability);

  await interaction.reply({
    content: `✅ Anda berhasil bergabung dalam giveaway!\n📊 Peluang Anda: ${probability.toFixed(4)}%`,
    ephemeral: true,
  });

  await db.commitTransaction();
}

export async function handleCheckProbability(interaction: ButtonInteraction) {
  await db.beginTransaction();
  const participant = await db.getParticipant(interaction.user.id);

  if (!participant) {
    await interaction.reply({
      content: '❌ Anda belum terdaftar dalam giveaway! Klik "Join Giveaway" terlebih dahulu.',
      ephemeral: true,
    });
    return;
  }

  let probability = participant.probabilityCached;

  if (!probability) {
    const allParticipants = await db.getAllParticipants();
    probability = calculateProbability(participant.roleId, allParticipants);
    await db.updateParticipantProbabilityCache(participant.giveawayId, participant.roleId, probability);
  }

  const embed = createProbabilityEmbed(probability);

  await interaction.reply({
    embeds: [embed],
    ephemeral: true,
  });

  await db.commitTransaction();
}