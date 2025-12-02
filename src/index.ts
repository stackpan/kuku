import { Client, GatewayIntentBits, Collection, REST, Routes, ChannelType } from 'discord.js';
import { env, loadConfig } from './config/index';
import { Database } from './database/index';
import * as giveawayCommand from './commands/giveaway';
import { handleJoinGiveaway, handleCheckProbability } from './handlers/button-handler';
import { selectWinner } from './utils/probability';
import { createWinnerEmbed } from './utils/embeds';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
  ],
});

const commands = new Collection<string, typeof giveawayCommand>();
commands.set(giveawayCommand.data.name, giveawayCommand);

const db = new Database();

client.once('clientReady', async () => {
  console.log(`✅ Bot logged in as ${client.user?.tag}`);
  await db.initialize();
  console.log('✅ Database initialized');

  const rest = new REST().setToken(env.BOT_TOKEN);
  try {
    console.log('🔄 Registering slash commands...');
    await rest.put(
      Routes.applicationCommands(client.user!.id),
      { body: [giveawayCommand.data.toJSON()] }
    );
    console.log('✅ Slash commands registered');
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }

  scheduleGiveawayEnd();
});

client.on('interactionCreate', async interaction => {
  if (interaction.isChatInputCommand()) {
    const command = commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, db);
    } catch (error) {
      console.error('Error executing command:', error);
      await interaction.reply({
        content: '❌ Terjadi error saat menjalankan command!',
        ephemeral: true,
      });
    }
  } else if (interaction.isButton()) {
    try {
      if (interaction.customId === 'join_giveaway') {
        await handleJoinGiveaway(interaction, db);
      } else if (interaction.customId === 'check_probability') {
        await handleCheckProbability(interaction, db);
      }
    } catch (error) {
      console.error('Error handling button:', error);
      await interaction.reply({
        content: '❌ Terjadi error!',
        ephemeral: true,
      });
    }
  }
});

function scheduleGiveawayEnd() {
  const config = loadConfig();
  const endDate = new Date(config.endDate);
  const now = new Date();
  const timeUntilEnd = endDate.getTime() - now.getTime();

  if (timeUntilEnd > 0) {
    console.log(`⏰ Giveaway akan berakhir dalam ${Math.floor(timeUntilEnd / 1000 / 60)} menit`);
    setTimeout(endGiveaway, timeUntilEnd);
  } else {
    console.log('⚠️ Tanggal giveaway sudah lewat');
  }
}

async function endGiveaway() {
  const config = loadConfig();
  const participants = await db.getAllParticipants();

  if (participants.length === 0) {
    console.log('❌ Tidak ada peserta dalam giveaway');
    return;
  }

  const winner = selectWinner(participants, config);
  if (!winner) {
    console.log('❌ Gagal memilih pemenang');
    return;
  }

  const channel = await client.channels.fetch(config.channelId);
  if (channel && channel.type !== ChannelType.GroupDM && channel.isTextBased()) {
    const embed = createWinnerEmbed(winner.userId, config.giveawayName);
    await channel.send({ embeds: [embed] });
    console.log(`🎉 Pemenang: ${winner.userId}`);
  }
}

client.login(env.BOT_TOKEN);

process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down...');
  await db.close();
  process.exit(0);
});