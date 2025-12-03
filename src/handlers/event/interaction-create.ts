import { Interaction } from "discord.js";
import { commands } from "../../singletons";
import handleJoinGiveaway from "../button/join-giveaway";
import handleCheckProbability from "../button/check-probability";

export default async function handleInteractionCreate(interaction: Interaction) {
  switch (true) {
    case interaction.isChatInputCommand(): {
      const command = commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (error) {
        console.error('Error executing command:', error);
        await interaction.reply({
          content: '❌ An error occurred while executing the command!',
          flags: 'Ephemeral',
        });
      } 
      break;
    }
    case interaction.isButton(): {
      try {
        switch (interaction.customId) {
          case 'join_giveaway':
            await handleJoinGiveaway(interaction);
            break;
          case 'check_probability':
            await handleCheckProbability(interaction);
            break;
          default:
            return;
        }
      } catch (error) {
        console.error('Error handling button:', error);
        await interaction.reply({
          content: '❌ An error occurred while handling the button!',
          flags: 'Ephemeral',
        });
      }
      break;
    }
    default: {
      return;
    }
  }
}