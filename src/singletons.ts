import Connection from "./database/connection";
import GiveawayRepository from "./database/giveaway-repository";
import GuildGiveawayWeightedRoleRepository from "./database/guild-giveaway-weighted-role-repository";
import ParticipantRepository from "./database/participant-repository";
import { Collection } from "discord.js";
import * as giveawayCommand from "./commands/giveaway";
import { Client, GatewayIntentBits } from "discord.js";

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

const commands = new Collection<string, typeof giveawayCommand>();
commands.set(giveawayCommand.data.name, giveawayCommand);

export { client, commands };

export const connection = new Connection();
export const giveawayRepository = new GiveawayRepository(connection);
export const participantRepository = new ParticipantRepository(connection);
export const guildGiveawayWeightedRoleRepository = new GuildGiveawayWeightedRoleRepository(connection);