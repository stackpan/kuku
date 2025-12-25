import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  InteractionContextType,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  TextChannel,
} from 'discord.js';
import { connection, giveawayRepository, giveawayScheduler, guildGiveawayWeightedRoleRepository, participantRepository } from '../singletons';
import moment from 'moment';
import createGiveawayEmbed from '../components/embeds/create-giveaway';
import createCreateGiveawayModal from '../components/modals/create-giveaway';
import { WeightedRolesGiveaway, ParticipantWithRequest } from '../types';
import { selectWinner } from '../utils/probability';
import createWinnerEmbed from '../components/embeds/giveaway-winner';

export const data = new SlashCommandBuilder()
  .setContexts(InteractionContextType.Guild)
  .setName('giveaway')
  .setDescription('Giveaway commands')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
  .addSubcommand(subcommand =>
    subcommand
      .setName('create')
      .setDescription('Start a new giveaway')
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('update-message')
      .setDescription('Update the giveaway message embed')
      .addStringOption(option =>
        option
          .setName('message_id')
          .setDescription('The message ID of the giveaway to update')
          .setRequired(true)
      )
  )
  .addSubcommand(subcommand =>
    subcommand
      .setName('reroll')
      .setDescription('Reroll a giveaway winner')
      .addStringOption(option =>
        option
          .setName('message_id')
          .setDescription('The message ID of the giveaway')
          .setRequired(true)
      )
      .addNumberOption(option =>
        option
          .setName('position')
          .setDescription('The position of the winner to reroll')
          .setRequired(true)
      )
  );

export async function execute(interaction: ChatInputCommandInteraction) {
  const subcommand = interaction.options.getSubcommand();

  if (subcommand === 'create') {
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
  } else if (subcommand === 'update-message') {
    const messageId = interaction.options.getString('message_id', true);

    await interaction.deferReply({ flags: 'Ephemeral' });

    const giveaway = await giveawayRepository.get(messageId);

    if (!giveaway) {
      await interaction.editReply({ content: `❌ Giveaway with message ID ${messageId} not found.` });
      return;
    }

    try {
      const channel = await interaction.client.channels.fetch(giveaway.channelId) as TextChannel;
      if (!channel) {
        await interaction.editReply({ content: `❌ Channel ${giveaway.channelId} not found.` });
        return;
      }

      const message = await channel.messages.fetch(giveaway.messageId);
      if (!message) {
        await interaction.editReply({ content: `❌ Message ${giveaway.messageId} not found.` });
        return;
      }

      const roles = (giveaway as WeightedRolesGiveaway).weightedRoles || [];

      const embed = createGiveawayEmbed({
        name: giveaway.name,
        description: giveaway.description,
        hostedBy: giveaway.hostedBy,
        endsAt: giveaway.endsAt,
        winnerCount: giveaway.winnerCount,
        roles: roles,
      });

      await message.edit({ embeds: [embed] });

      await interaction.editReply({ content: `✅ Giveaway message updated!` });

    } catch (error) {
      console.error(error);
      await interaction.editReply({ content: `❌ Failed to update giveaway message: ${error instanceof Error ? error.message : 'Unknown error'}` });
    }
  } else if (subcommand === 'reroll') {
    const messageId = interaction.options.getString('message_id', true);
    const position = interaction.options.getNumber('position', true);

    await interaction.deferReply();

    const giveaway = await giveawayRepository.get(messageId);
    if (!giveaway) {
      await interaction.editReply({ content: `❌ Giveaway with message ID ${messageId} not found.` });
      return;
    }

    // Check if giveaway has ended
    if (moment().isBefore(moment(giveaway.endsAt))) {
      await interaction.editReply({ content: `❌ Giveaway has not ended yet.` });
      return;
    }

    const currentWinners = await giveawayRepository.getWinners(messageId);
    if (currentWinners.length === 0) {
      await interaction.editReply({ content: `❌ No winners found for this giveaway. It might have ended before winners were tracked.` });
      return;
    }

    if (position < 1 || position > currentWinners.length) {
      await interaction.editReply({ content: `❌ Invalid position. There are ${currentWinners.length} winners.` });
      return;
    }

    const oldWinnerId = currentWinners[position - 1];

    // Get all participants
    const participants = await participantRepository.getAll(messageId);

    // Filter out current winners from candidates
    const currentWinnerSet = new Set(currentWinners);
    const candidates = participants.filter(p => !currentWinnerSet.has(p.userId));

    if (candidates.length === 0) {
      await interaction.editReply({ content: `❌ No eligible participants left to reroll.` });
      return;
    }

    const weightedRoles = (giveaway as WeightedRolesGiveaway).weightedRoles || [];
    const winner = selectWinner(weightedRoles, candidates);

    if (!winner) {
      await interaction.editReply({ content: `❌ Failed to select a new winner.` });
      return;
    }

    const newWinnerId = winner.userId;

    // Update DB
    await giveawayRepository.updateWinner(messageId, position, newWinnerId);

    // Announce
    const channel = await interaction.client.channels.fetch(giveaway.channelId) as TextChannel;
    if (channel) {
      const winnerMember = await channel.guild.members.fetch(newWinnerId);
      const winnerRequest = (winner as ParticipantWithRequest).requests?.find((r) => r.winAtPosition === position)?.content || '';

      await channel.send({
        content: `🎉 **Giveaway Reroll!**\n\nThe new winner for position #${position} is <@${newWinnerId}>! (User <@${oldWinnerId}> was rerolled)`,
        reply: {
          messageReference: giveaway.messageId,
        },
        embeds: [
          createWinnerEmbed({
            number: position,
            winnerId: newWinnerId,
            winnerUsername: winnerMember.user.username,
            winnerRoleId: winner.roleId,
            winnerGuildAvatarUrl: winnerMember.user.avatarURL(),
            color: winnerMember.displayHexColor,
            winnerRequest: winnerRequest,
          })
        ]
      });
    }

    await interaction.editReply({ content: `✅ Rerolled winner at position ${position}. New winner: <@${newWinnerId}>` });
  }
}