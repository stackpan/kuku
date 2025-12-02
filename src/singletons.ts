import { loadConfig } from "./config";
import { Database } from "./database";

export const config = loadConfig();

export const db = new Database();