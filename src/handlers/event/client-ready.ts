import { Client } from "discord.js";

export default async function handleClientReady(client: Client) {
  console.log(`✅ Bot logged in as ${client.user?.tag}`);
}