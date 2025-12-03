import Connection from "./database/connection";
import GiveawayRepository from "./database/giveaway-repository";
import GuildGiveawayWeightedRoleRepository from "./database/guild-giveaway-weighted-role-repository";
import ParticipantRepository from "./database/participant-repository";

export const connection = new Connection();
export const giveawayRepository = new GiveawayRepository(connection);
export const participantRepository = new ParticipantRepository(connection);
export const guildGiveawayWeightedRoleRepository = new GuildGiveawayWeightedRoleRepository(connection);