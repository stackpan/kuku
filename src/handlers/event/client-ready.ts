import { Client } from "discord.js";
import { giveawayScheduler } from "../../singletons";
import { env } from "../../config";

export default async function handleClientReady(client: Client) {
  await giveawayScheduler.start();
  console.log(`✅ Bot logged in as ${client.user?.tag}`);
  client.users.send(env.OWNER_ID, 'I am ready!');
}