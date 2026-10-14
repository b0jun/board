import { mkdirSync } from "node:fs";
import path from "node:path";
import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";

const DB_FILE = path.join(process.cwd(), "data", "board.db");
const MIGRATIONS_DIR = path.join(process.cwd(), "drizzle");

// Opens the SQLite file and applies pending migrations, so a fresh checkout
// works without a separate migrate step.
export function connect() {
  mkdirSync(path.dirname(DB_FILE), { recursive: true });
  const sqlite = new Database(DB_FILE);
  sqlite.pragma("journal_mode = WAL");
  const db = drizzle(sqlite, { schema });
  migrate(db, { migrationsFolder: MIGRATIONS_DIR });
  return db;
}
