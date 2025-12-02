import { Config } from '../types';
import * as fs from 'fs';
import * as path from 'path';

export const env = {
  BOT_TOKEN: process.env.BOT_TOKEN!,
  DB_HOST: process.env.DB_HOST!,
  DB_PORT: parseInt(process.env.DB_PORT || '5432'),
  DB_USER: process.env.DB_USER!,
  DB_PASSWORD: process.env.DB_PASSWORD!,
  DB_NAME: process.env.DB_NAME!,
};

export function loadConfig(): Config {
  const configPath = path.join(process.cwd(), 'config.json');
  const configFile = fs.readFileSync(configPath, 'utf-8');
  return JSON.parse(configFile) as Config;
}