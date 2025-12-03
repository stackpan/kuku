import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  InteractionContextType,
} from 'discord.js';
import createGiveawayEmbed from '../components/embeds/create-giveaway';
import { giveawayRepository, guildGiveawayWeightedRoleRepository } from '../singletons';

export const data = new SlashCommandBuilder()
  .setContexts(InteractionContextType.Guild)
  .setName('giveaway')
  .setDescription('Start a new giveaway')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addStringOption((option) => option.setName('name').setDescription('The giveaway name').setRequired(true))
  .addStringOption((option) => option.setName('description').setDescription('The giveaway description').setRequired(true))
  .addStringOption((option) => option.setName('ends_at').setDescription('The giveaway end time (YYYY-MM-DD HH:mm)').setRequired(true));

export async function execute(interaction: ChatInputCommandInteraction) {
  const giveawayDto = {
    name: interaction.options.getString('name', true),
    description: interaction.options.getString('description', true),
    endsAt: new Date(interaction.options.getString('ends_at', true).replace(' ', 'T')),
  }

  const guildId = interaction.guildId!;
  const weightedRolesConfigId = 1; // TODO: Make this dynamic

  const weightedRolesConfigs = await guildGiveawayWeightedRoleRepository.getAll(guildId, weightedRolesConfigId);

  const embed = createGiveawayEmbed({
    ...giveawayDto,
    roles: weightedRolesConfigs,
  });

  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('join_giveaway')
        .setLabel('Join Giveaway')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🎉'),
      new ButtonBuilder()
        .setCustomId('check_probability')
        .setLabel('Probability')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📊')
    );

  const response = await interaction.reply({
    embeds: [embed],
    components: [row],
    withResponse: true,
  });

  if (!response.resource?.message?.id) {
    console.error('Failed to get message ID after sending giveaway message.');
    return;
  }

  const giveaway = await giveawayRepository.save({
    ...giveawayDto,
    messageId: response.resource.message.id,
    guildId: interaction.guildId!,
    activeWeightedRolesConfigId: weightedRolesConfigId,
  });

  console.log(`Giveaway started: ${giveaway.name}`);
}