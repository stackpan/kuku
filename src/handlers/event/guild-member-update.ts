import { GuildMember, PartialGuildMember } from "discord.js";
import { connection, participantRepository } from "../../singletons";
import { WeightedRolesGiveaway } from "../../types";

export default async function handleGuildMemberUpdate(oldMember: GuildMember | PartialGuildMember, newMember: GuildMember) {
  await connection.beginTransaction();
  const userId = newMember.id;
  const guildId = newMember.guild.id;

  const participants = await participantRepository.getAllWithGiveawayByUserIdAndGuild(userId, guildId);

  for (const participant of participants) {
    const giveaway = participant.giveaway;

    if (!giveaway) continue;

    if ('weightedRoles' in giveaway && (giveaway as WeightedRolesGiveaway).weightedRoles) {
      const weightedGiveaway = giveaway as WeightedRolesGiveaway;

      const highestWeightRole = newMember.roles.cache
        .filter(role => weightedGiveaway.weightedRoles.some(wr => wr.roleId === role.id))
        .sort((a, b) => {
          const weightA = weightedGiveaway.weightedRoles.find(wr => wr.roleId === a.id)?.weight || 0;
          const weightB = weightedGiveaway.weightedRoles.find(wr => wr.roleId === b.id)?.weight || 0;
          return weightB - weightA;
        })
        .first();

      if (highestWeightRole && highestWeightRole.id !== participant.roleId) {
        await participantRepository.update(participant.giveawayMessageId, userId, highestWeightRole.id);
      }
    }
  }

  await connection.commitTransaction();
}