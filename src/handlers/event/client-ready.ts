import { Client } from "discord.js";
import { giveawayScheduler } from "../../singletons";

export default async function handleClientReady(client: Client) {
  await giveawayScheduler.start();
  console.log(`✅ Bot logged in as ${client.user?.tag}`);
}