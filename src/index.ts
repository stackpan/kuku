import { Events } from 'discord.js';
import { env } from './config';
import { createServer } from 'http';
import handleClientReady from './handlers/event/client-ready';
import handleInteractionCreate from './handlers/event/interaction-create';
import handleGuildMemberUpdate from './handlers/event/guild-member-update';
import handleGuildMemberRemove from './handlers/event/guild-member-remove';
import { client, connection } from './singletons';

client.once(Events.ClientReady, handleClientReady);
client.on(Events.InteractionCreate, handleInteractionCreate);
client.on(Events.GuildMemberUpdate, handleGuildMemberUpdate);
client.on(Events.GuildMemberRemove, handleGuildMemberRemove);

createServer((req, res) => {
  if (req.url === '/kaithhealthcheck' && req.method === 'GET') {
    res.writeHead(200);
    res.end();
  } else {
    res.writeHead(404);
    res.end();
  }
}).listen(env.PORT);

client.login(env.BOT_TOKEN);

process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down...');
  await connection.close();
  process.exit(0);
});