import { Interaction } from "discord.js";
import { commands } from "../../command-registry";
import handleJoinGiveaway from "../button/join-giveaway";
import handleCheckProbability from "../button/check-probability";

export default async function handleInteractionCreate(interaction: Interaction) {
  if (interaction.isChatInputCommand()) {
    const command = commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction);
    } catch (error) {
      console.error('Error executing command:', error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: '❌ An error occurred while executing the command!',
          ephemeral: true,
        });
      } else {
        await interaction.reply({
          content: '❌ An error occurred while executing the command!',
          flags: 'Ephemeral',
        });
      }
    }
  } else if (interaction.isButton()) {
    try {
      switch (interaction.customId) {
        case 'joinGiveaway':
          await handleJoinGiveaway(interaction);
          break;
        case 'checkGiveawayProbability':
          await handleCheckProbability(interaction);
          break;
        default:
          return;
      }
    } catch (error) {
      console.error('Error handling button:', error);
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({
          content: '❌ An error occurred while handling the button!',
          flags: 'Ephemeral',
        });
      } else {
        await interaction.reply({
          content: '❌ An error occurred while handling the button!',
          flags: 'Ephemeral',
        });
      }
    }
  }
}