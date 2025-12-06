import { EmbedBuilder } from "discord.js";
import { Participant } from "../../types";

interface ParticipantsListEmbedParams {
  number: number;
  page: number;
  maxPages: number;
  participants: Pick<Participant, 'id' | 'userId'>[];
  totalParticipants: number;
}

export default async function createParticipantsListEmbed({ number, page, maxPages, participants, totalParticipants }: ParticipantsListEmbedParams) {
  return new EmbedBuilder()
    .setTitle('👥 Participants')
    .setDescription(participants.length > 0 ? participants.map((participant, index) => `${number + index + 1}. <@${participant.userId}>`).join('\n') : 'No participants yet.')
    .setFooter({ text: `Page ${page} of ${maxPages} | Total participants: ${totalParticipants}` })
}