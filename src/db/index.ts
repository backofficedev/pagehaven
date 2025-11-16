import Database from "better-sqlite3";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/better-sqlite3";

import * as schema from "./schema.ts";

config();

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
	throw new Error("DATABASE_URL environment variable is required");
}

const sqlite = new Database(databaseUrl);
export const db = drizzle(sqlite, { schema });
