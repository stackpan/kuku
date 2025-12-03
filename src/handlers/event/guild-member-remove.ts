import { GuildMember, PartialGuildMember } from "discord.js";
import { participantRepository } from "../../singletons";

export default async function handleGuildMemberRemove(member: GuildMember | PartialGuildMember) {
  const deleted = await participantRepository.deleteByUserIdAndGuild(member.id, member.guild.id);

  if (deleted) {
    console.log(`${member.id} left the server ${member.guild.id}. Deleted their participants.`);
  }
}