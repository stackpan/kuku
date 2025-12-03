import {
  SlashCommandBuilder,
  ChatInputCommandInteraction,
  PermissionFlagsBits,
  InteractionContextType,
  ModalBuilder,
  LabelBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import { connection, giveawayRepository, giveawayScheduler, guildGiveawayWeightedRoleRepository } from '../singletons';
import createGiveawayEmbed from '../components/embeds/create-giveaway';

export const data = new SlashCommandBuilder()
  .setContexts(InteractionContextType.Guild)
  .setName('giveaway')
  .setDescription('Start a new giveaway')
  .setDefaultMemberPermissions(PermissionFlagsBits.Administrator);

export async function execute(interaction: ChatInputCommandInteraction) {
  const now = new Date();
  now.setDate(now.getDate() + 1);
  const pad = (n: number) => n.toString().padStart(2, '0');
  const defaultEndsAt = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`;

  const modal = new ModalBuilder()
    .setCustomId('createGiveawayModal')
    .setTitle('Create Giveaway')
    .addLabelComponents(
      new LabelBuilder()
        .setLabel('Name')
        .setDescription('What you are giving away')
        .setTextInputComponent(
          new TextInputBuilder()
            .setCustomId('giveawayNameInput')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder(`${interaction.guild?.name}'s Prize`)
            .setRequired(true)
            .setMinLength(1)
            .setMaxLength(100)
        ),
      new LabelBuilder()
        .setLabel('Description')
        .setDescription('What is the giveaway about?')
        .setTextInputComponent(
          new TextInputBuilder()
            .setCustomId('giveawayDescriptionInput')
            .setStyle(TextInputStyle.Paragraph)
            .setPlaceholder('Lorem ipsum dolor sit amet, consectetur adipiscing elit.')
            .setRequired(true)
            .setMinLength(1)
            .setMaxLength(255)
        ),
      new LabelBuilder()
        .setLabel('Ends At')
        .setDescription('When does the giveaway end? Format: YYYY-MM-DD hh:mm')
        .setTextInputComponent(
          new TextInputBuilder()
            .setCustomId('giveawayEndsAtInput')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setPlaceholder(defaultEndsAt)
            .setValue(defaultEndsAt)
            .setMinLength(16)
            .setMaxLength(16)
        ),
      new LabelBuilder()
        .setLabel('Winner Count')
        .setDescription('How many winners? (1-10)')
        .setTextInputComponent(
          new TextInputBuilder()
            .setCustomId('giveawayWinnerCountInput')
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('1')
            .setValue('1')
            .setRequired(true)
            .setMinLength(1)
            .setMaxLength(2)
        ),
      new LabelBuilder()
        .setLabel('Hosted By')
        .setDescription('Who hosted the giveaway?')
        .setTextInputComponent(
          new TextInputBuilder()
            .setCustomId('giveawayHostedByInput')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setPlaceholder('John Doe')
            .setValue(interaction.user.displayName)
            .setMinLength(1)
            .setMaxLength(20)
        ),
    );

  await interaction.showModal(modal);
  const modalSubmit = await interaction.awaitModalSubmit({
    filter: (i) => i.customId === 'createGiveawayModal',
    time: 60000,
  });

  await modalSubmit.deferReply();
  await connection.beginTransaction();

  const giveawayDto = {
    name: modalSubmit.fields.getTextInputValue('giveawayNameInput'),
    description: modalSubmit.fields.getTextInputValue('giveawayDescriptionInput'),
    endsAt: new Date(modalSubmit.fields.getTextInputValue('giveawayEndsAtInput').replace(' ', 'T')),
    winnerCount: parseInt(modalSubmit.fields.getTextInputValue('giveawayWinnerCountInput')),
    hostedBy: modalSubmit.fields.getTextInputValue('giveawayHostedByInput'),
  }

  if (isNaN(giveawayDto.endsAt.getTime())) {
    await modalSubmit.editReply({ content: '❌ Invalid date format. Please use YYYY-MM-DD hh:mm.' });
    await connection.rollbackTransaction();
    return;
  }

  if (giveawayDto.endsAt <= new Date()) {
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

  const embed = createGiveawayEmbed({
    ...giveawayDto,
    roles: weightedRolesConfigs,
    hostedBy: interaction.user.username,
  });

  const row = new ActionRowBuilder<ButtonBuilder>()
    .addComponents(
      new ButtonBuilder()
        .setCustomId('joinGiveaway')
        .setLabel('Join Giveaway')
        .setStyle(ButtonStyle.Primary)
        .setEmoji('🎉'),
      new ButtonBuilder()
        .setCustomId('checkGiveawayProbability')
        .setLabel('Probability')
        .setStyle(ButtonStyle.Secondary)
        .setEmoji('📊')
    );

  const message = await modalSubmit.editReply({
    content: '# 🎉 Giveaway Started!',
    embeds: [embed],
    components: [row],
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