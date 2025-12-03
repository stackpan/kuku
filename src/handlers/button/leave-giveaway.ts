import { ButtonInteraction } from "discord.js";
import { connection } from "../../singletons";
import { participantRepository } from "../../singletons";

export default async function handleLeaveGiveaway(interaction: ButtonInteraction) {
  await connection.beginTransaction();

  const deleted = await participantRepository.delete(interaction.message.id, interaction.user.id);

  if (!deleted) {
    await interaction.reply({
      content: '❌ You are not registered in the giveaway!',
      flags: 'Ephemeral',
    });
    await connection.rollbackTransaction();
    return;
  }

  await interaction.reply({
    content: '✅ You have left the giveaway!',
    flags: 'Ephemeral',
  });

  await connection.commitTransaction();
}