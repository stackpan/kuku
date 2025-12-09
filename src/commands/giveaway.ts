import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  InteractionContextType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { connection, giveawayRepository, giveawayScheduler, guildGiveawayWeightedRoleRepository } from '../singletons';
import moment from 'moment';
import createGiveawayEmbed from '../components/embeds/create-giveaway';
import createCreateGiveawayModal from '../components/modals/create-giveaway';

export const data = new SlashCommandBuilder()
  .setContexts(InteractionContextType.Guild)
  .setName('giveaway')
  .setDescription('Start a new giveaway')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
  const modal = createCreateGiveawayModal(interaction);

  await interaction.showModal(modal);
  const modalSubmit = await interaction.awaitModalSubmit({
    filter: (i) => i.customId === 'createGiveawayModal',
    time: 60000,
  });

  await modalSubmit.deferReply();
  await connection.beginTransaction();

  const endsAtInput = modalSubmit.fields.getTextInputValue('giveawayEndsAtInput');
  const endsAtMoment = moment.utc(endsAtInput, 'YYYY-MM-DD HH:mm', true);

  const giveawayDto = {
    name: modalSubmit.fields.getTextInputValue('giveawayNameInput'),
    description: modalSubmit.fields.getTextInputValue('giveawayDescriptionInput'),
    endsAt: endsAtMoment.toDate(),
    winnerCount: parseInt(modalSubmit.fields.getTextInputValue('giveawayWinnerCountInput')),
    hostedBy: modalSubmit.fields.getTextInputValue('giveawayHostedByInput'),
  }

  if (!endsAtMoment.isValid()) {
    await modalSubmit.editReply({ content: '❌ Invalid date format. Please use YYYY-MM-DD hh:mm.' });
    await connection.rollbackTransaction();
    return;
  }

  if (endsAtMoment.isBefore(moment())) {
    await modalSubmit.editReply({ content: '❌ The giveaway must end in the future.' });
    await connection.rollbackTransaction();
    return;
  }

  if (isNaN(giveawayDto.winnerCount) || giveawayDto.winnerCount < 1 || giveawayDto.winnerCount > 10) {
    await modalSubmit.editReply({ content: '❌ Winner count must be an integer between 1 and 10.' });
    await connection.rollbackTransaction();
    return;
  }

  const guildId = interaction.guildId!;
  const weightedRolesConfigId = 1; // TODO: Make this dynamic

  const weightedRolesConfigs = await guildGiveawayWeightedRoleRepository.getAll(guildId, weightedRolesConfigId);

  const message = await modalSubmit.editReply({
    content: '# 🎉 Giveaway Started!',
    embeds: [
      createGiveawayEmbed({
        ...giveawayDto,
        roles: weightedRolesConfigs,
        hostedBy: interaction.user.username,
      })
    ],
    components: [
      new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('joinGiveaway')
            .setLabel('Join Giveaway')
            .setStyle(ButtonStyle.Primary)
            .setEmoji('🎉'),
          new ButtonBuilder()
            .setCustomId('checkGiveawayProbability')
            .setLabel('Probability')
            .setStyle(ButtonStyle.Success)
            .setEmoji('📊'),
          new ButtonBuilder()
            .setCustomId('listGiveawayParticipants')
            .setLabel('Participants')
            .setStyle(ButtonStyle.Secondary)
            .setEmoji('👥'),
        ),
    ],
  });

  const giveaway = await giveawayRepository.save({
    ...giveawayDto,
    messageId: message.id,
    guildId: interaction.guildId!,
    channelId: interaction.channelId!,
    activeWeightedRolesConfigId: weightedRolesConfigId,
    hostedBy: interaction.user.username,
  });

  giveawayScheduler.schedule(giveaway);

  console.log(`Giveaway ${giveaway.messageId} started.`);
  await connection.commitTransaction();
}