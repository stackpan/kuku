export const env = {
  OWNER_ID: process.env.OWNER_ID!,
  CLIENT_ID: process.env.CLIENT_ID!,
  GUILD_ID: process.env.GUILD_ID!,
  BOT_TOKEN: process.env.BOT_TOKEN!,
  DB_HOST: process.env.DB_HOST!,
  DB_PORT: parseInt(process.env.DB_PORT || '5432'),
  DB_USER: process.env.DB_USER!,
  DB_PASSWORD: process.env.DB_PASSWORD!,
  DB_NAME: process.env.DB_NAME!,
  DB_SSL: process.env.DB_SSL === 'true',
};
