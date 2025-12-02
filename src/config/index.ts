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

function normalizeWeights(roleWeights: Record<string, number>): Record<string, number> {
  let maxDecimalPlaces = 0;
  Object.values(roleWeights).forEach(weight => {
    const decimalPlaces = (weight.toString().split('.')[1] || '').length;
    maxDecimalPlaces = Math.max(maxDecimalPlaces, decimalPlaces);
  });

  const multiplier = Math.pow(10, maxDecimalPlaces);

  const normalizedWeights: Record<string, number> = {};
  Object.entries(roleWeights).forEach(([roleId, weight]) => {
    normalizedWeights[roleId] = Math.round(weight * multiplier);
  });

  return normalizedWeights;
}

export function loadConfig(): Config {
  const configPath = path.join(process.cwd(), 'config.json');
  const configFile = fs.readFileSync(configPath, 'utf-8');
  const config = JSON.parse(configFile) as Config;
  
  config.roleWeightsNormalized = normalizeWeights(config.roleWeights);
  
  return config;
}