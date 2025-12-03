import { REST, Routes } from 'discord.js';
import { env } from './config';
import path from 'path';
import fs from 'fs';

const commands = [];

const folderPath = path.join(__dirname, 'commands');
const commandFolders = fs.readdirSync(folderPath);

const rest = new REST().setToken(env.BOT_TOKEN!);

(async () => {
  try {
    console.log('🔄 Registering slash commands...');

    for (const folder of commandFolders) {
      const commandPath = path.join(folderPath, folder);
      const commandFiles = fs.readdirSync(commandPath).filter(file => file.endsWith('.ts') || file.endsWith('.js'));

      for (const file of commandFiles) {
        const filePath = path.join(commandPath, file);
        const command = await import(filePath);
        if ('data' in command && 'execute' in command) {
          commands.push(command.data.toJSON());
        } else {
          console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
        }
      }
    }

    await rest.put(
      Routes.applicationGuildCommands(env.CLIENT_ID!, env.GUILD_ID!),
      { body: commands }
    );
    
    console.log('✅ Slash commands registered');
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
})();