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

client.login(env.BOT_TOKEN);

const server = createServer((req, res) => {
  if (req.url === '/health' && req.method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok' }));
  }
});

server.listen(env.PORT, () => {
  console.log(`✅ Server started on port ${env.PORT}`);
});

process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down...');
  await connection.close();
  process.exit(0);
});