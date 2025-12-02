import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { createGiveawayEmbed } from '../utils/embeds';
import { config, db } from '../singletons';

export const data = new SlashCommandBuilder()
  .setName('giveaway')
  .setDescription('Memulai giveaway baru')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
  if (interaction.channelId !== config.channelId) {
    await interaction.reply({
      content: `❌ Giveaway hanya bisa dimulai di channel <#${config.channelId}>`,
      ephemeral: true,
    });
    return;
  }

  await db.clearParticipants();

  const embed = createGiveawayEmbed();

  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('join_giveaway')
        .setLabel('Join Giveaway')
        .setStyle(ButtonStyle.Success)
        .setEmoji('🎉'),
      new ButtonBuilder()
        .setCustomId('check_probability')
        .setLabel('Probability')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('📊')
    );

  const response = await interaction.reply({
    embeds: [embed],
    components: [row],
    withResponse: true,
  });

  const hasGiveaway = await db.isHasAGiveaway();

  if (response.resource?.message?.id && !hasGiveaway) {
    await db.saveGiveaway(response.resource?.message?.id);
  }

  console.log(`Giveaway started: ${config.giveawayName}`);
}