import { Collection } from "discord.js";
import * as giveawayCommand from "./giveaway";

const commands = new Collection<string, typeof giveawayCommand>();
commands.set(giveawayCommand.data.name, giveawayCommand);

export { commands };
