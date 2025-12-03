import { ButtonInteraction, ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";
import { participantRepository } from "../../singletons";
import createParticipantsListEmbed from "../../components/embeds/participants-list";

export default async function handleListGiveawayParticipants(interaction: ButtonInteraction) {
  const customIdParts = interaction.customId.split(':');
  let giveawayMessageId = interaction.message.id;
  let page = 1;

  if (customIdParts.length === 3) {
    // listGiveawayParticipants:<giveawayId>:<page>
    giveawayMessageId = customIdParts[1];
    page = parseInt(customIdParts[2]);
  }

  const limit = 15;

  const totalParticipants = await participantRepository.count(giveawayMessageId);
  const maxPages = Math.ceil(totalParticipants / limit);

  // Validate page
  if (page < 1) page = 1;
  if (page > maxPages && maxPages > 0) page = maxPages;

  const participants = await participantRepository.getWithPagination(giveawayMessageId, page, limit);

  const embed = await createParticipantsListEmbed({
    number: (page - 1) * limit,
    page,
    maxPages: maxPages || 1,
    participants,
    totalParticipants
  });

  const row = new ActionRowBuilder<ButtonBuilder>();

  if (page > 1) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`listGiveawayParticipants:${giveawayMessageId}:${page - 1}`)
        .setLabel('Previous')
        .setStyle(ButtonStyle.Primary)
    );
  }

  if (page < maxPages) {
    row.addComponents(
      new ButtonBuilder()
        .setCustomId(`listGiveawayParticipants:${giveawayMessageId}:${page + 1}`)
        .setLabel('Next')
        .setStyle(ButtonStyle.Primary)
    );
  }

  const responseOptions = {
    embeds: [embed],
    components: row.components.length > 0 ? [row] : [],
  };

  if (customIdParts.length === 3) {
    await interaction.update(responseOptions);
  } else {
    await interaction.reply({ ...responseOptions, flags: 'Ephemeral' });
  }
}