import { Interaction, LabelBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";
import moment from 'moment';

export default function createCreateGiveawayModal(interaction: Interaction) {
  const defaultEndsAt = moment().utc().add(1, 'day').format('YYYY-MM-DD HH:mm');

  return new ModalBuilder()
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
        .setDescription('When does the giveaway end in UTC+0? Format: YYYY-MM-DD hh:mm')
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
}