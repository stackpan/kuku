import { Client, GatewayIntentBits, Collection, ChannelType, Events } from 'discord.js';
import * as giveawayCommand from './commands/giveaway';
import { selectWinner } from './utils/probability';
import { env } from 'process';
import handleClientReady from './handlers/event/client-ready';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
  ],
});

const commands = new Collection<string, typeof giveawayCommand>();
commands.set(giveawayCommand.data.name, giveawayCommand);

client.once(Events.ClientReady, handleClientReady);

client.on(Events.InteractionCreate, async interaction => {
  if (interaction.isChatInputCommand()) {
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
  } else if (interaction.isButton()) {
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
  }
});

client.on('guildMemberUpdate', async (oldMember, newMember) => {
  try {
    const oldRoles = oldMember.roles.cache.map(r => r.id);
    const newRoles = newMember.roles.cache.map(r => r.id);
    
    const rolesChanged = oldRoles.length !== newRoles.length || 
                         oldRoles.some(role => !newRoles.includes(role));
    
    if (!rolesChanged) return;

    const participant = await db.getParticipant(newMember.user.id);
    if (!participant) return;

    const allowedRoles = config.allowedRoles;
    let newPrimaryRole: string | null = null;
    let highestWeight = -1;
    
    for (const roleId of allowedRoles) {
      if (newMember.roles.cache.has(roleId)) {
        const roleWeight = config.roleWeights[roleId] || 0;
        if (roleWeight > highestWeight) {
          highestWeight = roleWeight;
          newPrimaryRole = roleId;
        }
      }
    }

    if (!newPrimaryRole) {
      await db.removeParticipant(newMember.user.id);
      console.log(`📝 Participant ${newMember.user.tag} removed - no allowed roles`);
      return;
    }

    if (participant.roleId !== newPrimaryRole) {
      await db.updateParticipantRole(newMember.user.id, newPrimaryRole);
      console.log(`📝 Updated role for ${newMember.user.tag}: ${participant.roleId} -> ${newPrimaryRole}`);
    }
  } catch (error) {
    console.error('Error handling guildMemberUpdate:', error);
  }
});

function scheduleGiveawayEnd() {
  const endDate = new Date(config.endDate);
  const now = new Date();
  const timeUntilEnd = endDate.getTime() - now.getTime();

  if (timeUntilEnd > 0) {
    console.log(`⏰ Giveaway will end in ${Math.floor(timeUntilEnd / 1000 / 60)} minutes`);
    setTimeout(endGiveaway, timeUntilEnd);
  } else {
    console.log('⚠️ Giveaway end date has passed');
  }
}

async function endGiveaway() {
  const participants = await db.getAllParticipants();

  if (participants.length === 0) {
    console.log('❌ No participants in the giveaway');
    return;
  }

  const winner = selectWinner(participants);
  if (!winner) {
    console.log('❌ Failed to select a winner');
    return;
  }

  const giveaway = await db.getLatestGiveaway();
  if (giveaway) {
    await db.deactivateGiveaway(giveaway.id);
    console.log('🔒 All giveaway buttons have been disabled');
  }

  const channel = await client.channels.fetch(config.channelId);
  if (channel && channel.type !== ChannelType.GroupDM && channel.isTextBased()) {
    const embed = createWinnerEmbed(winner.userId, config.giveawayName);
    await channel.send({ embeds: [embed] });
    console.log(`🎉 Winner: ${winner.userId}`);
  }
}

client.login(env.BOT_TOKEN);

process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down...');
  await db.close();
  process.exit(0);
});